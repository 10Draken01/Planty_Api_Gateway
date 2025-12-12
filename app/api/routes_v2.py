"""Rutas de la API v2 - Sistema de recomendaciones con ML."""
import logging
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional

from app.api import schemas_v2
from app.api.deps import get_db
from app.services.training_service_v2 import TrainingServiceV2
from app.services.recommendation_service_v2 import RecommendationServiceV2
from app.services.chatbot_client import ChatbotClient

logger = logging.getLogger(__name__)

router = APIRouter()


# ============== TRAINING ENDPOINTS ==============

@router.post("/train", response_model=schemas_v2.TrainModelResponse, tags=["Training"])
async def train_model(
    training_date: Optional[str] = Query(None, description="Fecha en formato YYYY-MM-DD"),
    db=Depends(get_db)
):
    """
    Entrena un nuevo modelo de clustering.

    - Si no se proporciona training_date, usa la fecha actual
    - Toma 6 meses de datos ANTES de la fecha proporcionada
    - Entrena con 3 algoritmos y selecciona el mejor
    - Guarda el modelo como model_YYYY-MM-DD.pkl
    """
    try:
        service = TrainingServiceV2(db)
        result = await service.train_model(training_date)
        return result
    except Exception as e:
        logger.error(f"Training failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/training-history", response_model=schemas_v2.TrainingHistoryResponse, tags=["Training"])
async def get_training_history(
    limit: int = Query(10, ge=1, le=100),
    db=Depends(get_db)
):
    """Obtiene el historial de entrenamientos."""
    try:
        service = TrainingServiceV2(db)
        history = await service.get_training_history(limit)

        return {
            'success': True,
            'history': history,
            'total': len(history)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== RECOMMENDATION ENDPOINTS ==============

@router.post("/recommend/{user_id}", response_model=schemas_v2.RecommendationsResponse, tags=["Recommendations"])
async def get_recommendations(
    user_id: str,
    limit: int = Query(3, ge=1, le=10, description="Número de recomendaciones"),
    db=Depends(get_db)
):
    """
    Genera recomendaciones de huertos para un usuario.

    - Usa el modelo más reciente
    - Retorna los top 3 huertos recomendados (por defecto)
    - Filtra huertos que el usuario ya tiene
    """
    try:
        # Obtener modelo más reciente
        training_service = TrainingServiceV2(db)
        model_info = await training_service.get_latest_model()

        if not model_info:
            raise HTTPException(
                status_code=404,
                detail="No hay ningún modelo entrenado. Ejecuta POST /train primero."
            )

        # Generar recomendaciones
        rec_service = RecommendationServiceV2(db)
        result = await rec_service.get_recommendations(
            user_id,
            model_info['model_data'],
            limit
        )

        return {
            'success': True,
            **result
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get recommendations for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/test/{user_id}", response_model=schemas_v2.TestRecommendationResponse, tags=["Testing"])
async def test_recommendation(
    user_id: str,
    db=Depends(get_db)
):
    """
    Endpoint de prueba completo que retorna:
    - Datos del usuario
    - Huertos actuales del usuario
    - 3 huertos recomendados
    - Mensajes generados por Planty (FCM + Vista)

    Útil para testing end-to-end.
    """
    try:
        # Obtener modelo
        training_service = TrainingServiceV2(db)
        model_info = await training_service.get_latest_model()

        if not model_info:
            raise HTTPException(
                status_code=404,
                detail="No hay ningún modelo entrenado. Ejecuta POST /train primero."
            )

        # Obtener recomendaciones
        rec_service = RecommendationServiceV2(db)
        recommendations = await rec_service.get_recommendations(
            user_id,
            model_info['model_data'],
            limit=3
        )

        # Obtener datos completos del usuario
        user = await rec_service._fetch_user_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail=f"Usuario {user_id} no encontrado")

        # Obtener huertos actuales
        current_orchards = await rec_service._fetch_user_orchards(user_id)

        # Generar mensajes con chatbot
        chatbot = ChatbotClient()
        messages = await chatbot.generate_recommendation_message(
            user,
            current_orchards,
            recommendations['recommendations']
        )

        return {
            'success': True,
            'user': user,
            'current_orchards': current_orchards,
            'recommended_orchards': recommendations['recommendations'],
            'chatbot_messages': {
                'fcm': messages.get('fcm_message', ''),
                'view': messages.get('view_message', '')
            },
            'cluster_id': recommendations['cluster_id'],
            'generated_at': messages.get('generated_at') or 'now'
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Test failed for user {user_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ============== MODEL STATUS ENDPOINTS ==============

@router.get("/status", response_model=schemas_v2.ModelStatusResponse, tags=["Status"])
async def get_model_status(db=Depends(get_db)):
    """Obtiene el estado del modelo actual."""
    try:
        service = TrainingServiceV2(db)
        model_info = await service.get_latest_model()

        if not model_info:
            return {
                'success': True,
                'model_loaded': False,
                'model_file': None
            }

        model_data = model_info['model_data']

        return {
            'success': True,
            'model_loaded': True,
            'model_file': model_info['model_file'],
            'algorithm': model_data.get('algorithm'),
            'n_clusters': model_data.get('n_clusters'),
            'training_date': model_data.get('training_date'),
            'n_users': model_data.get('n_users')
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/models", response_model=schemas_v2.ListModelsResponse, tags=["Status"])
async def list_models():
    """Lista todos los modelos entrenados disponibles."""
    try:
        from pathlib import Path
        from app.core.config import settings

        models_path = Path(settings.MODEL_STORAGE_PATH)
        model_files = list(models_path.glob("model_*.pkl"))

        models = []
        for file in sorted(model_files, reverse=True):
            # Extraer fecha del nombre
            date_str = file.stem.split('_')[1]
            models.append({
                'filename': file.name,
                'date': date_str,
                'size_mb': round(file.stat().st_size / (1024 * 1024), 2)
            })

        return {
            'success': True,
            'models': models,
            'total': len(models)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
