"""Configuración del microservicio recommender."""
from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Configuración global del servicio."""

    # MongoDB
    MONGO_URI: str = "mongodb://admin:password123@localhost:27017/plantgen?authSource=admin"
    MONGO_DB_NAME: str = "plantgen"

    # External Services
    AG_SERVICE_URL: str = "http://localhost:3005/v1"
    NOTIFICATIONS_SERVICE_URL: str = "http://localhost:3003"
    USERS_SERVICE_URL: str = "http://localhost:3001"
    ORCHARDS_SERVICE_URL: str = "http://localhost:3002"

    # Clustering Config
    MIN_CLUSTERS: int = 3
    MAX_CLUSTERS: int = 15
    OPTIMAL_CLUSTER_METHOD: str = "silhouette"
    RETRAIN_THRESHOLD_PCT: float = 0.15

    # Scheduler
    MONTHLY_RETRAIN_DAY: int = 1
    MONTHLY_RETRAIN_HOUR: int = 2
    WEEKLY_RECOMMENDATIONS_DAY: int = 0  # 0 = Lunes
    WEEKLY_RECOMMENDATIONS_HOUR: int = 9

    # Model Storage
    MODEL_STORAGE_PATH: str = "./models"
    MODEL_VERSION: str = "v1"

    # Security
    JWT_SECRET_KEY: str = "your-secret-key-change-this-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 30

    # API
    API_PORT: int = 8000
    API_HOST: str = "0.0.0.0"
    WORKERS: int = 4

    # Logging
    LOG_LEVEL: str = "INFO"

    class Config:
        env_file = ".env"
        case_sensitive = True


settings = Settings()
