"""Rutas de la API FastAPI."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Request, status
from typing import List, Optional

from app.api import schemas
from app.api.deps import get_db, get_current_user
from app.services import training_service, recommendation_service

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/train", response_model=schemas.TrainingResponse, tags=["Training"])
async def train_model(
    request: Request,
    db=Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Entrena modelo de clustering (requiere autenticación admin)."""
    try:
        result = await training_service.train_clustering_model(db)
        return result
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/status", response_model=schemas.TrainingStatus, tags=["Training"])
async def get_training_status(db=Depends(get_db)):
    """Obtiene el estado del último entrenamiento."""
    try:
        status_info = await training_service.get_training_status(db)
        return status_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/clusters", response_model=schemas.ClustersInfo, tags=["Clusters"])
async def get_clusters(db=Depends(get_db)):
    """Lista todos los clusters con metadata."""
    try:
        clusters_info = await training_service.get_clusters_info(db)
        return clusters_info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get(
    "/recommendations/user/{user_id}",
    response_model=schemas.RecommendationsResponse,
    tags=["Recommendations"]
)
async def get_user_recommendations(
    user_id: str,
    limit: int = 10,
    db=Depends(get_db)
):
    """Obtiene recomendaciones de huertos para un usuario."""
    try:
        recommendations = await recommendation_service.get_recommendations_for_user(
            db, user_id, limit=limit
        )
        return recommendations
    except Exception as e:
        logger.error(f"Failed to get recommendations for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/webhook/user-registered", tags=["Webhooks"])
async def user_registered_webhook(
    payload: schemas.UserRegisteredWebhook,
    db=Depends(get_db)
):
    """Webhook para usuario recién registrado - genera recomendación y notifica."""
    try:
        await recommendation_service.handle_user_registered(db, payload.userId)
        return {"success": True, "message": "User processed"}
    except Exception as e:
        logger.error(f"Webhook failed for user {payload.userId}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/notify/cluster/{cluster_id}", tags=["Notifications"])
async def notify_cluster(
    cluster_id: int,
    db=Depends(get_db),
    current_user: Optional[dict] = Depends(get_current_user)
):
    """Fuerza envío de recomendaciones a un cluster completo (admin only)."""
    try:
        result = await recommendation_service.notify_cluster(db, cluster_id)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
