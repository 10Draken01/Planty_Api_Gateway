"""
Punto de entrada principal del microservicio PlantGen API.
FastAPI application con arquitectura limpia.
"""
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.infrastructure.config import get_settings
from src.infrastructure.database.MongoConnection import MongoConnection
from src.infrastructure.api.routes import health_router, garden_router
from src.infrastructure.api.middlewares import (
    error_handler_middleware,
    request_logger_middleware
)

# Load settings
settings = get_settings()

# Configure logging
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("plantgen.api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Gestión del ciclo de vida de la aplicación.
    Se ejecuta al inicio y al cierre.
    """
    # Startup
    logger.info("🚀 Iniciando PlantGen API...")
    await MongoConnection.connect()
    logger.info("✅ MongoDB conectado exitosamente")
    yield
    # Shutdown
    logger.info("🛑 Cerrando PlantGen API...")
    await MongoConnection.disconnect()
    logger.info("✅ MongoDB desconectado")


# Crear aplicación FastAPI
app = FastAPI(
    title=settings.API_TITLE,
    description=settings.API_DESCRIPTION,
    version=settings.API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configurar middlewares
app.add_middleware(error_handler_middleware())
app.add_middleware(request_logger_middleware())

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=settings.CORS_ALLOW_CREDENTIALS,
    allow_methods=settings.CORS_ALLOW_METHODS,
    allow_headers=settings.CORS_ALLOW_HEADERS,
)

# Registrar rutas con prefijo /algorithm_gen/v1
API_V1_PREFIX = "/algorithm_gen"
app.include_router(health_router, prefix=API_V1_PREFIX)
app.include_router(garden_router, prefix=API_V1_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    """Endpoint raíz"""
    return {
        "service": settings.API_TITLE,
        "version": settings.API_VERSION,
        "status": "running",
        "environment": settings.ENVIRONMENT,
        "docs": "/docs",
        "redoc": "/redoc",
        "endpoints": {
            "health": "/algorithm_gen/health",
            "generate": "/algorithm_gen/generate"
        }
    }


if __name__ == "__main__":
    import uvicorn

    logger.info(f"""
    ╔═══════════════════════════════════════════════════╗
    ║           PlantGen API - Microservicio            ║
    ║    Optimización de Huertos Urbanos con AG         ║
    ╠═══════════════════════════════════════════════════╣
    ║  Puerto: {settings.PORT}                                      ║
    ║  Entorno: {settings.ENVIRONMENT}                         ║
    ║  Docs: http://localhost:{settings.PORT}/docs                  ║
    ║  Health: http://localhost:{settings.PORT}/algorithm_gen/health       ║
    ║  Generate: http://localhost:{settings.PORT}/algorithm_gen/generate   ║
    ╚═══════════════════════════════════════════════════╝
    """)

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.is_development,
        log_level=settings.LOG_LEVEL.lower()
    )
