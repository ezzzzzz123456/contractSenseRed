import asyncio
import base64
import json

import httpx

from app.config import settings
from app.services.document_preprocessing_engine import PreprocessedPage


class VLMInferenceEngine:
    """
    Default VLM backend: Gemini multimodal document understanding.

    Model choice rationale:
    - Accuracy: strong zero-shot document understanding for contracts and scans.
    - Latency: practical hosted inference without local model warm-up.
    - Layout capability: can reason over page images and mixed visual/text regions.
    - Deployment feasibility: already aligned with the repository's current hosted-AI stack.
    """

    async def infer_document(self, pages: list[PreprocessedPage], document_kind: str) -> dict:
        if not settings.gemini_api_key or not pages:
            return {}
        tasks = [self._infer_page(page, document_kind) for page in pages[:8]]
        results = await asyncio.gather(*tasks, return_exceptions=True)
        page_results = [result for result in results if isinstance(result, dict) and result]
        if not page_results:
            return {}
        return {"pages": page_results}

    async def _infer_page(self, page: PreprocessedPage, document_kind: str) -> dict:
        if not page.image_bytes:
            return {}
        prompt = (
            "You are a document understanding vision-language model. "
            "Return strict JSON only with keys: pageNumber, elements. "
            "Each element must include: type, text, bboxNormalized [x0,y0,x1,y1], hierarchyPath. "
            "Detect titles, sections, subsections, clauses, tables, lists, signatures, footnotes, and annotations. "
            "Keep reading order and do not invent missing text."
        )
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{settings.gemini_model}:generateContent"
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "inline_data": {
                                "mime_type": "image/png",
                                "data": base64.b64encode(page.image_bytes).decode("utf-8"),
                            }
                        },
                        {"text": prompt},
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.0,
                "topP": 0.9,
                "maxOutputTokens": 4096,
                "responseMimeType": "application/json",
            },
        }
        try:
            async with httpx.AsyncClient(timeout=90.0) as client:
                response = await client.post(url, params={"key": settings.gemini_api_key}, json=payload)
                response.raise_for_status()
            data = response.json()
            text = self._extract_response_text(data)
            parsed = self._parse_json(text)
            if isinstance(parsed, dict):
                parsed["pageNumber"] = page.page_number
                return parsed
        except Exception:
            return {}
        return {}

    def _extract_response_text(self, payload: dict) -> str:
        candidates = payload.get("candidates", [])
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "\n".join(part.get("text", "").strip() for part in parts if part.get("text"))

    def _parse_json(self, text: str) -> dict | None:
        if not text:
            return None
        cleaned = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
        try:
            parsed = json.loads(cleaned)
            return parsed if isinstance(parsed, dict) else None
        except json.JSONDecodeError:
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start == -1 or end == -1 or start >= end:
                return None
            try:
                parsed = json.loads(cleaned[start:end + 1])
                return parsed if isinstance(parsed, dict) else None
            except json.JSONDecodeError:
                return None


vlm_inference_engine = VLMInferenceEngine()
