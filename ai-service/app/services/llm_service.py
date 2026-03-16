import json
import logging
import re
from time import monotonic

import httpx

from app.config import settings
from app.models.schemas import ClauseImprovement, ClauseModel, NegotiationStrategy


logger = logging.getLogger("contractsense.llm")


class LLMService:
    def __init__(self) -> None:
        self._gemini_unavailable_until = 0.0

    def analyze_contract_payload(
        self,
        contract_text: str,
        mime_type: str,
        base64_document: str = "",
        contract_type_hint: str = "",
    ) -> dict | None:
        schema_hint = {
            "contractType": "string",
            "overallRiskScore": "number",
            "summary": "string",
            "executiveLegalSummary": "string",
            "fairnessScore": "number",
            "priorityActions": ["string"],
            "reportFindings": ["string"],
            "clauses": [
                {
                    "id": "string",
                    "title": "string",
                    "sectionReference": "string",
                    "originalText": "string",
                    "simplifiedText": "string",
                    "riskLevel": "safe|warning|critical",
                    "riskScore": "number",
                    "explanation": "string",
                    "suggestedRevision": "string",
                    "negotiationStrategy": "string",
                    "legalSimulation": "string",
                    "judgeView": "string",
                    "claimantArguments": ["string"],
                    "defenseArguments": ["string"],
                    "likelyRuling": "string",
                    "enforceabilityConcerns": ["string"],
                    "businessImpact": "string",
                    "recommendations": ["string"],
                    "loopholes": ["string"],
                    "illegalSignals": ["string"],
                }
            ],
        }
        prompt = (
            "You are an expert legal AI system for contract intelligence and risk analysis. "
            "Analyze the provided contract and return strict JSON only. "
            "Tasks: identify contract type, segment into meaningful clauses, simplify each clause, "
            "score each clause for risk, explain each risk, suggest a safer revision, give a negotiation strategy, "
            "and simulate a likely legal/commercial consequence. For each clause, act like a courtroom-trained legal analyst: "
            "explain how a judge may read the clause, what the claimant would argue, what the defense would argue, "
            "what ruling is most likely on the present wording, what enforceability weaknesses exist, and the business impact. "
            "Write like an informed contract lawyer, not a generic assistant. "
            "Use the actual document text only. Do not invent missing clauses. "
            f"Contract type hint: {contract_type_hint or 'none'}. "
            f"If the extracted text is partial, rely on the file content when available. "
            f"JSON schema: {json.dumps(schema_hint)} "
            f"Extracted text follows:\n{contract_text[:120000]}"
        )
        if base64_document:
            return self._generate_json_from_file(prompt, base64_document, mime_type)
        return self._generate_json(prompt)

    def simplify_clause(self, clause_text: str) -> str:
        prompt = (
            "Rewrite this legal clause in plain English for a business user. Preserve legal meaning, "
            f"be concise, and return only the explanation.\nClause: {clause_text}"
        )
        generated = self._generate(prompt)
        if generated:
            return generated

        text = " ".join(clause_text.strip().split())
        if not text:
            return "No clause text provided."

        actor = "Both sides"
        if "company" in text.lower() or "client" in text.lower():
            actor = "The company"
        if "contractor" in text.lower() or "vendor" in text.lower():
            actor = "The contractor"

        obligation = "sets a contract rule"
        lowered = text.lower()
        if "shall" in lowered or "must" in lowered:
            obligation = "is required to do something"
        elif "may" in lowered:
            obligation = "has discretion to act"
        elif "terminate" in lowered:
            obligation = "can end the agreement"

        time_phrase = ""
        time_match = re.search(r"\b(\d{1,3}\s+(days?|months?|years?))\b", text, re.IGNORECASE)
        if time_match:
            time_phrase = f" within {time_match.group(1)}"

        return f"{actor} {obligation}{time_phrase}. In plain terms, {text[0].lower() + text[1:]}"

    def generate_counter_clause(self, clause_text: str, goal: str, tone: str = "professional") -> tuple[str, list[str]]:
        revised = self.improve_clause(clause_text, goal).revisedClause
        notes = [
            f"Optimized for the goal: {goal}.",
            "Narrows ambiguous language and reduces one-sided exposure.",
            f"Tone calibration: {tone}.",
        ]
        return revised, notes

    def improve_clause(self, clause_text: str, goal: str) -> ClauseImprovement:
        prompt = (
            "You are a contract redlining assistant. Rewrite the clause to reduce legal risk while preserving "
            f"commercial intent. Goal: {goal}. Return only the revised clause.\nClause: {clause_text}"
        )
        generated = self._generate(prompt)
        revised = clause_text
        replacements = [
            ("unlimited liability", "liability capped at fees paid under the agreement during the previous 12 months"),
            ("for any reason", "for material breach, insolvency, or repeated service failure"),
            ("sole discretion", "reasonable discretion exercised in good faith"),
            ("immediately", "on 30 days written notice unless immediate termination is required by law"),
        ]
        for source, target in replacements:
            revised = re.sub(source, target, revised, flags=re.IGNORECASE)

        if generated:
            revised = generated
        elif revised == clause_text:
            revised = (
                f"{clause_text.rstrip('.')} provided that the obligation is proportionate, clearly defined, "
                f"and limited to the legitimate objective of {goal}."
            )

        return ClauseImprovement(
            originalClause=clause_text,
            revisedClause=revised,
            justification=(
                "The revision constrains open-ended drafting, aligns obligations with commercial reasonableness, "
                "and makes the clause easier to negotiate or enforce."
            ),
        )

    def negotiation_strategy(self, clause_text: str, tone: str, reasons: list[str]) -> NegotiationStrategy:
        stance_map = {
            "gentle": "Collaborative and low-friction.",
            "professional": "Balanced and commercially grounded.",
            "assertive": "Firm on risk allocation and enforceability.",
            "aggressive": "High-pressure demand for risk rebalancing.",
            "legal formal": "Counsel-style legal drafting position.",
        }
        opening_map = {
            "gentle": "We would appreciate refining this clause so it works fairly for both parties.",
            "professional": "We propose revising this clause to better align risk allocation with market practice.",
            "assertive": "This clause creates unacceptable exposure and needs a narrower drafting position.",
            "aggressive": "We cannot proceed with this language in its current form because the downside is disproportionate.",
            "legal formal": "We request that the clause be amended to satisfy proportionality, certainty, and enforceability standards.",
        }
        prompt = (
            "Draft a short negotiation response for a risky contract clause. "
            f"Tone: {tone}. Reasons: {'; '.join(reasons[:3])}. Clause: {clause_text}"
        )
        drafted = self._generate(prompt) or (
            f"{opening_map[tone]} Specifically, the current wording '{clause_text[:160]}' "
            "should be replaced with a version that limits ambiguous or unilateral obligations."
        )
        return NegotiationStrategy(
            tone=tone,  # type: ignore[arg-type]
            stance=stance_map[tone],
            talkingPoints=reasons[:3] or ["Clarify scope, limits, and remedies."],
            draftedResponse=drafted,
        )

    def summarize_party(self, party_name: str, score: float | None = None) -> str:
        prompt = f"Summarize counterparty credibility for {party_name} with score {score}. Keep it under 30 words."
        generated = self._generate(prompt)
        if generated:
            return generated
        if score is None:
            return f"{party_name} has an incomplete diligence profile and should be reviewed before signature."
        descriptor = "strong" if score >= 75 else "mixed" if score >= 50 else "fragile"
        return f"{party_name} shows a {descriptor} credibility profile based on the currently available signals."

    def simulate_outcome(self, latest_message: str) -> str:
        prompt = f"Simulate the likely commercial or legal outcome of this contract scenario in 2 sentences: {latest_message}"
        return self._generate(prompt) or f"Likely legal or commercial outcome: {latest_message}"

    def simulate_outcome_with_context(self, contract_context: str, latest_message: str) -> str:
        prompt = (
            "You are simulating a contract dispute from the perspective of a courtroom lawyer and judge. "
            "Use the contract context below to answer the user's scenario in 3-6 precise sentences. "
            "Explain the strongest arguments, how a judge is likely to interpret the clause, likely remedies, "
            "and the practical business consequence. Avoid generic filler.\n"
            f"Contract context: {contract_context[:20000]}\n"
            f"Scenario: {latest_message}"
        )
        return self._generate(prompt) or f"Likely legal or commercial outcome: {latest_message}"

    def build_clause(self, text: str, risk_flag: str) -> ClauseModel:
        suggestion, _ = self.generate_counter_clause(text, "rebalance risk")
        return ClauseModel(
            text=text,
            simplifiedText=self.simplify_clause(text),
            riskFlag=risk_flag,  # type: ignore[arg-type]
            explanation="Clause reviewed through the deterministic risk engine.",
            counterClauseSuggestion=suggestion,
        )

    def _generate(self, prompt: str) -> str | None:
        if not self._gemini_available():
            return None

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.2,
                "topP": 0.9,
                "maxOutputTokens": 400,
            },
        }
        try:
            response = httpx.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
                timeout=25.0,
            )
            response.raise_for_status()
            data = response.json()
            parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
            text = " ".join(part.get("text", "").strip() for part in parts if part.get("text"))
            return text or None
        except httpx.HTTPStatusError as error:
            self._handle_http_error(error)
            return None
        except Exception as error:
            logger.warning("Gemini text generation failed: %s", error)
            return None

    def _generate_json(self, prompt: str) -> dict | None:
        if not self._gemini_available():
            return None

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent"
        )
        payload = {
            "contents": [{"parts": [{"text": prompt}]}],
            "generationConfig": {
                "temperature": 0.1,
                "topP": 0.9,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
            },
        }
        try:
            response = httpx.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
                timeout=120.0,
            )
            response.raise_for_status()
            text = self._extract_response_text(response.json())
            return self._parse_json_text(text)
        except httpx.HTTPStatusError as error:
            self._handle_http_error(error)
            return None
        except Exception as error:
            logger.warning("Gemini JSON generation failed: %s", error)
            return None

    def _generate_json_from_file(self, prompt: str, base64_document: str, mime_type: str) -> dict | None:
        if not self._gemini_available():
            return None

        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{settings.gemini_model}:generateContent"
        )
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": mime_type,
                                "data": base64_document,
                            }
                        },
                        {"text": prompt},
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "topP": 0.9,
                "maxOutputTokens": 8192,
                "responseMimeType": "application/json",
            },
        }
        try:
            response = httpx.post(
                url,
                params={"key": settings.gemini_api_key},
                json=payload,
                timeout=180.0,
            )
            response.raise_for_status()
            text = self._extract_response_text(response.json())
            return self._parse_json_text(text)
        except httpx.HTTPStatusError as error:
            self._handle_http_error(error)
            return None
        except Exception as error:
            logger.warning("Gemini file JSON generation failed: %s", error)
            return None

    def _extract_response_text(self, payload: dict) -> str:
        candidates = payload.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "\n".join(part.get("text", "").strip() for part in parts if part.get("text"))

    def _parse_json_text(self, text: str) -> dict | None:
        if not text:
            return None
        cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start == -1 or end == -1 or end <= start:
                return None
            try:
                parsed = json.loads(cleaned[start:end + 1])
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None

    def _gemini_available(self) -> bool:
        if not settings.gemini_api_key:
            return False
        if monotonic() < self._gemini_unavailable_until:
            return False
        return True

    def _handle_http_error(self, error: httpx.HTTPStatusError) -> None:
        status = error.response.status_code if error.response is not None else None
        if status == 429:
            self._gemini_unavailable_until = monotonic() + 120.0
            logger.warning("Gemini rate limit hit. Suspending Gemini calls for 120 seconds and using local fallbacks.")
            return
        logger.warning("Gemini HTTP error %s: %s", status, error)


llm_service = LLMService()
