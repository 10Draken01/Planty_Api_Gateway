"""
Application settings using Pydantic Settings.
Centralized configuration management.
"""
from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Literal
from functools import lru_cache


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    Uses .env file for local development.
    """
    # MongoDB Configuration
    MONGO_ROOT_USER: str = "admin"
    MONGO_ROOT_PASSWORD: str = "password"
    MONGO_HOST: str = "localhost"
    MONGO_PORT: int = 27017
    MONGO_DATABASE: str = "Data_plants"

    # API Configuration
    PORT: int = 3005
    ENVIRONMENT: Literal["development", "staging", "production"] = "development"

    # CORS Configuration
    CORS_ORIGINS: list = ["*"]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]

    # Logging
    LOG_LEVEL: str = "INFO"

    # API Metadata
    API_TITLE: str = "PlantGen API"
    API_VERSION: str = "1.0.0"
    API_DESCRIPTION: str = """
    Sistema Inteligente para Optimización de Huertos Urbanos mediante Algoritmos Genéticos.

    ## Características
    - Algoritmo genético multi-objetivo
    - Optimización de 4 métricas: CEE, PSNTPA, WCE, UE
    - Base de 50 plantas adaptadas a clima tropical (Suchiapas, Chiapas)
    - Matriz de compatibilidad basada en agricultura asociativa
    - Arquitectura limpia y microservicios

    ## Endpoints
    - **GET /health**: Verificar estado del servicio
    - **POST /generate**: Generar configuraciones de huerto optimizadas
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True
    )

    @property
    def mongo_uri(self) -> str:
        """Build MongoDB connection URI"""
        # Si no hay usuario/password, conectar sin autenticación (para desarrollo local)
        if not self.MONGO_ROOT_USER or self.MONGO_ROOT_USER == "none":
            return f"mongodb://{self.MONGO_HOST}:{self.MONGO_PORT}"
        return f"mongodb://{self.MONGO_ROOT_USER}:{self.MONGO_ROOT_PASSWORD}@{self.MONGO_HOST}:{self.MONGO_PORT}"

    @property
    def is_development(self) -> bool:
        """Check if running in development mode"""
        return self.ENVIRONMENT == "development"

    @property
    def is_production(self) -> bool:
        """Check if running in production mode"""
        return self.ENVIRONMENT == "production"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to ensure settings are loaded only once.

    Returns:
        Settings instance
    """
    return Settings()
