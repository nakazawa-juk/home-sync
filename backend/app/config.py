import os

from dotenv import load_dotenv
from pydantic_settings import BaseSettings

load_dotenv()


class Settings(BaseSettings):
    # Supabase Settings
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

    # Database Settings
    database_url: str = os.getenv("DATABASE_URL", "")

    # FastAPI Settings
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    log_level: str = os.getenv("LOG_LEVEL", "info")
    secret_key: str = os.getenv("SECRET_KEY", "your-secret-key-here")

    # CORS Settings
    allowed_origins: str = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")

    @property
    def origins_list(self) -> list[str]:
        """CORS許可オリジンをリストとして取得"""
        return [origin.strip() for origin in self.allowed_origins.split(",")]

    # File Upload Settings
    max_file_size: int = int(os.getenv("MAX_FILE_SIZE", "10485760"))  # 10MB
    allowed_file_types: str = os.getenv("ALLOWED_FILE_TYPES", "application/pdf")

    @property
    def file_types_list(self) -> list[str]:
        """許可するファイルタイプをリストとして取得"""
        return [file_type.strip() for file_type in self.allowed_file_types.split(",")]

    # PDF Processing Settings
    pdf_output_path: str = os.getenv("PDF_OUTPUT_PATH", "/tmp/generated_pdfs")
    pdf_temp_path: str = os.getenv("PDF_TEMP_PATH", "/tmp/uploaded_pdfs")

    # Environment
    environment: str = os.getenv("ENVIRONMENT", "development")

    class Config:
        env_file = ".env"
        case_sensitive = False


settings = Settings()
