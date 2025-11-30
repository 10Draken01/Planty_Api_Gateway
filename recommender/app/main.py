"""Aplicación principal FastAPI - Recommender Service."""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient

from app.core.config import settings
from app.api import routes
from app.services.scheduler import start_scheduler

# Configurar logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Cliente MongoDB global
mongodb_client: AsyncIOMotorClient = None
database = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager para startup/shutdown."""
    # Startup
    global mongodb_client, database
    logger.info("Starting Recommender Service...")

    # Conectar a MongoDB
    mongodb_client = AsyncIOMotorClient(settings.MONGO_URI)
    database = mongodb_client[settings.MONGO_DB_NAME]
    app.state.db = database
    logger.info("MongoDB connected")

    # Iniciar scheduler
    start_scheduler()
    logger.info("Scheduler started")

    yield

    # Shutdown
    logger.info("Shutting down...")
    if mongodb_client:
        mongodb_client.close()


# Crear app
app = FastAPI(
    title="PlantGen Recommender Service",
    description="Microservicio de recomendaciones con clustering no supervisado",
    version="1.0.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir rutas
app.include_router(routes.router)


@app.get("/")
async def root():
    """Health check raíz."""
    return {
        "service": "PlantGen Recommender",
        "version": "1.0.0",
        "status": "online"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
        log_level=settings.LOG_LEVEL.lower()
    )
