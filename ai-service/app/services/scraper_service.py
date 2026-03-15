class ScraperService:
    def summarize_counterparty(self, party_name: str, website: str | None) -> tuple[str, list[str]]:
        summary = f"{party_name} has a light-touch diligence profile with publicly available footprint data."
        sources = [website] if website else ["https://example.com/counterparty-profile"]
        return summary, sources


scraper_service = ScraperService()

