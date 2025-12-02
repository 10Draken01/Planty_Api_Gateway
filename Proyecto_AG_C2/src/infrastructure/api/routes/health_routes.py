"""
Health check routes.
"""
from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from src.infrastructure.api.controllers.health_controller import HealthController
from src.infrastructure.api.dependencies import get_plant_repository, get_compatibility_repository
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository


router = APIRouter(prefix="/health", tags=["Health"])


@router.get("", response_model=Dict[str, Any])
async def health_check(
    plant_repo: IPlantRepository = Depends(get_plant_repository),
    compat_repo: ICompatibilityRepository = Depends(get_compatibility_repository)
) -> Dict[str, Any]:
    """
    Endpoint de health check.
    Verifica que el servicio y la conexión a MongoDB estén funcionando.

    Returns:
        Estado del servicio
    """
    try:
        return await HealthController.check_health(plant_repo, compat_repo)
    except Exception as e:
        raise HTTPException(
            status_code=503,
            detail=f"Error en health check: {str(e)}"
        )
