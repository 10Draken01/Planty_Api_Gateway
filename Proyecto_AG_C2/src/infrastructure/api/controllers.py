"""
Controladores FastAPI para los endpoints del microservicio.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict
from src.application.dtos.GenerateGardenRequest import GenerateGardenRequest
from src.application.dtos.GenerateGardenResponse import GenerateGardenResponse
from src.application.use_cases.GenerateGardenUseCase import GenerateGardenUseCase
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository
from src.infrastructure.database.MongoConnection import MongoConnection
from src.infrastructure.database.MongoPlantRepository import MongoPlantRepository
from src.infrastructure.database.MongoCompatibilityRepository import MongoCompatibilityRepository


router = APIRouter()


async def get_plant_repository() -> IPlantRepository:
    """Dependencia para obtener el repositorio de plantas"""
    database = await MongoConnection.get_database()
    return MongoPlantRepository(database)


async def get_compatibility_repository() -> ICompatibilityRepository:
    """Dependencia para obtener el repositorio de compatibilidad"""
    database = await MongoConnection.get_database()
    return MongoCompatibilityRepository(database)


@router.get("/health", tags=["Health"])
async def health_check() -> Dict[str, str]:
    """
    Endpoint de health check.
    Verifica que el servicio y la conexión a MongoDB estén funcionando.

    Returns:
        Estado del servicio
    """
    try:
        # Verificar conexión a MongoDB
        is_connected = await MongoConnection.health_check()

        if not is_connected:
            raise HTTPException(
                status_code=503,
                detail="MongoDB no disponible"
            )

        # Verificar que haya datos
        plant_repo = await get_plant_repository()
        plant_count = await plant_repo.count()

        compat_repo = await get_compatibility_repository()
        compat_count = await compat_repo.count_pairs()

        return {
            "status": "healthy",
            "service": "PlantGen API",
            "version": "1.0.0",
            "database": "connected",
            "plants_count": plant_count,
            "compatibility_pairs_count": compat_count
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error en health check: {str(e)}"
        )


@router.post("/generate", response_model=GenerateGardenResponse, tags=["Garden Generation"])
async def generate_garden(
    request: GenerateGardenRequest,
    plant_repo: IPlantRepository = Depends(get_plant_repository),
    compat_repo: ICompatibilityRepository = Depends(get_compatibility_repository)
) -> GenerateGardenResponse:
    """
    Endpoint para generar configuraciones de huerto usando algoritmo genético.

    Genera las top 3 mejores configuraciones de huerto urbano basándose en:
    - Objetivo del usuario (alimenticio, medicinal, sostenible, ornamental)
    - Restricciones de área, agua, presupuesto y tiempo
    - Algoritmo genético multi-objetivo

    Args:
        request: Parámetros de entrada del usuario

    Returns:
        Top 3 mejores configuraciones de huerto con métricas y detalles
    """
    try:
        # Ejecutar caso de uso
        use_case = GenerateGardenUseCase(plant_repo, compat_repo)
        response = await use_case.execute(request)

        if not response.success:
            raise HTTPException(
                status_code=500,
                detail=response.message
            )

        return response

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar huerto: {str(e)}"
        )
