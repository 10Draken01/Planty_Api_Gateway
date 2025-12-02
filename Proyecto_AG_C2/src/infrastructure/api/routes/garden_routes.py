"""
Garden generation routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from src.application.dtos.GenerateGardenRequest import GenerateGardenRequest
from src.application.dtos.GenerateGardenResponse import GenerateGardenResponse
from src.infrastructure.api.controllers.garden_controller import GardenController
from src.infrastructure.api.dependencies import get_plant_repository, get_compatibility_repository
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository


router = APIRouter(prefix="/generate", tags=["Garden Generation"])


@router.post("", response_model=GenerateGardenResponse)
async def generate_garden(
    request: GenerateGardenRequest = GenerateGardenRequest(),
    plant_repo: IPlantRepository = Depends(get_plant_repository),
    compat_repo: ICompatibilityRepository = Depends(get_compatibility_repository)
) -> GenerateGardenResponse:
    """
    Endpoint para generar configuraciones de huerto usando algoritmo genético.

    Genera las top 3 mejores configuraciones de huerto urbano basándose en:
    - Objetivo del usuario (alimenticio, medicinal, sostenible, ornamental)
    - Restricciones de área, agua, presupuesto y tiempo
    - Algoritmo genético multi-objetivo

    Todos los campos son opcionales. Si no se envía un body o se envía vacío {},
    se usarán los valores por defecto.

    Args:
        request: Parámetros de entrada del usuario (todos opcionales)

    Returns:
        Top 3 mejores configuraciones de huerto con métricas y detalles
    """
    try:
        return await GardenController.generate_garden(request, plant_repo, compat_repo)
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error al generar huerto: {str(e)}"
        )
