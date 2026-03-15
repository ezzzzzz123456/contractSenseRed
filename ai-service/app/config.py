from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    ai_service_port: int = Field(default=8000, alias="AI_SERVICE_PORT")
    openai_api_key: str = Field(default="", alias="OPENAI_API_KEY")
    anthropic_api_key: str = Field(default="", alias="ANTHROPIC_API_KEY")
    scraper_timeout_seconds: int = Field(default=10, alias="SCRAPER_TIMEOUT_SECONDS")

    class Config:
        populate_by_name = True


settings = Settings()

