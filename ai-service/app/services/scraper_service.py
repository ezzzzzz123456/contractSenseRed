from dataclasses import dataclass
from html import unescape
import re
from urllib.parse import parse_qs, quote, unquote, urlparse

import httpx


RESULT_PATTERN = re.compile(
    r'<a[^>]*class="result__a"[^>]*href="(?P<url>[^"]+)"[^>]*>(?P<title>.*?)</a>.*?'
    r'(?:<a[^>]*class="result__snippet"[^>]*>|<div[^>]*class="result__snippet"[^>]*>)(?P<snippet>.*?)</(?:a|div)>',
    re.IGNORECASE | re.DOTALL,
)
TAG_PATTERN = re.compile(r"<[^>]+>")

NEGATIVE_KEYWORDS = {
    "lawsuit": 0.9,
    "sued": 0.9,
    "litigation": 0.85,
    "investigation": 0.8,
    "probe": 0.75,
    "fine": 0.85,
    "penalty": 0.8,
    "fraud": 1.0,
    "settlement": 0.6,
    "recall": 0.55,
    "complaint": 0.55,
    "bankruptcy": 1.0,
    "default": 0.75,
    "warning": 0.5,
    "violation": 0.75,
}

POSITIVE_KEYWORDS = {
    "award": 0.45,
    "certified": 0.5,
    "accredited": 0.5,
    "compliance": 0.35,
    "partnership": 0.35,
    "growth": 0.25,
    "expansion": 0.2,
    "funding": 0.2,
    "trusted": 0.35,
}


@dataclass
class ReputationEvidence:
    label: str
    source: str
    sentiment: str
    severity: float
    snippet: str


class ScraperService:
    SEARCH_BASE = "https://html.duckduckgo.com/html/"
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0 Safari/537.36"

    def summarize_counterparty(self, party_name: str, website: str | None) -> tuple[str, list[str], list[ReputationEvidence]]:
        evidences = self._collect_evidence(party_name, website)
        positive = [item for item in evidences if item.sentiment == "positive"]
        negative = [item for item in evidences if item.sentiment == "negative"]
        source_urls = list(dict.fromkeys([item.source for item in evidences if item.source]))
        if website and website not in source_urls:
            source_urls.insert(0, website)

        if not evidences:
            summary = (
                f"No reliable public-source signal set was collected for {party_name}. "
                "Manual diligence is still recommended before relying on this counterparty."
            )
            return summary, source_urls[:8], []

        summary = (
            f"Public-source diligence for {party_name} found {len(positive)} positive and {len(negative)} negative signals "
            f"across news, dispute, regulatory, and reputation-oriented searches."
        )
        return summary, source_urls[:8], evidences[:12]

    def _collect_evidence(self, party_name: str, website: str | None) -> list[ReputationEvidence]:
        queries = [
            f'"{party_name}" official website',
            f'"{party_name}" lawsuit regulatory complaint',
            f'"{party_name}" fraud penalty investigation',
            f'"{party_name}" customer complaint review',
            f'"{party_name}" business registry funding award',
        ]
        evidences: list[ReputationEvidence] = []
        seen_urls: set[str] = set()
        with httpx.Client(headers={"User-Agent": self.USER_AGENT}, timeout=15.0, follow_redirects=True) as client:
            for query in queries:
                try:
                    response = client.get(f"{self.SEARCH_BASE}?q={quote(query)}")
                    response.raise_for_status()
                except Exception:
                    continue
                for result in self._parse_results(response.text):
                    if result["url"] in seen_urls:
                        continue
                    seen_urls.add(result["url"])
                    evidence = self._classify_result(party_name, result["title"], result["snippet"], result["url"], website)
                    if evidence is not None:
                        evidences.append(evidence)
                    if len(evidences) >= 12:
                        return evidences
        return evidences

    def _parse_results(self, html: str) -> list[dict[str, str]]:
        results: list[dict[str, str]] = []
        for match in RESULT_PATTERN.finditer(html):
            title = self._clean_html(match.group("title"))
            snippet = self._clean_html(match.group("snippet"))
            url = self._normalize_result_url(unescape(match.group("url")))
            if title and url:
                results.append({"title": title, "snippet": snippet, "url": url})
        return results

    def _classify_result(
        self,
        party_name: str,
        title: str,
        snippet: str,
        url: str,
        website: str | None,
    ) -> ReputationEvidence | None:
        text = f"{title} {snippet}".lower()
        if party_name.lower() not in text and party_name.lower() not in url.lower():
            return None

        negative_hits = [(keyword, weight) for keyword, weight in NEGATIVE_KEYWORDS.items() if keyword in text]
        positive_hits = [(keyword, weight) for keyword, weight in POSITIVE_KEYWORDS.items() if keyword in text]

        if website and website.lower() in url.lower():
            return ReputationEvidence(
                label="Official website located",
                source=url,
                sentiment="positive",
                severity=0.2,
                snippet=snippet or title,
            )

        if negative_hits:
            keyword, weight = max(negative_hits, key=lambda item: item[1])
            return ReputationEvidence(
                label=f"Public negative signal: {keyword}",
                source=url,
                sentiment="negative",
                severity=weight,
                snippet=snippet or title,
            )

        if positive_hits:
            keyword, weight = max(positive_hits, key=lambda item: item[1])
            return ReputationEvidence(
                label=f"Public positive signal: {keyword}",
                source=url,
                sentiment="positive",
                severity=weight,
                snippet=snippet or title,
            )

        if any(token in text for token in ["news", "company", "profile", "overview", "business"]):
            return ReputationEvidence(
                label="Neutral public company footprint",
                source=url,
                sentiment="neutral",
                severity=0.15,
                snippet=snippet or title,
            )
        return None

    def _clean_html(self, value: str) -> str:
        return re.sub(r"\s+", " ", unescape(TAG_PATTERN.sub(" ", value))).strip()

    def _normalize_result_url(self, url: str) -> str:
        parsed = urlparse(url)
        query = parse_qs(parsed.query)
        if "uddg" in query and query["uddg"]:
            return unquote(query["uddg"][0])
        return url


scraper_service = ScraperService()
