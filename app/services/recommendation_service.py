"""Servicio de generación de recomendaciones."""
import logging
from typing import List, Dict, Any
from datetime import datetime
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.feature_pipeline import FeaturePipeline
from app.services.notifications_client import notifications_client

logger = logging.getLogger(__name__)


async def get_recommendations_for_user(
    db: AsyncIOMotorDatabase,
    user_id: str,
    limit: int = 10
) -> Dict[str, Any]:
    """Genera recomendaciones de huertos para un usuario."""
    # Obtener usuario
    user = await db.users.find_one({"_id": user_id})
    if not user:
        raise ValueError(f"User {user_id} not found")

    cluster_id = user.get("cluster_id")
    if cluster_id is None:
        logger.warning(f"User {user_id} has no cluster_id assigned")
        cluster_id = 0

    # Obtener orchards del mismo cluster (excluyendo los del usuario)
    cluster_users_cursor = db.users.find({"cluster_id": cluster_id})
    cluster_users = await cluster_users_cursor.to_list(length=None)
    cluster_user_ids = [str(u['_id']) for u in cluster_users if str(u['_id']) != user_id]

    # Obtener orchards candidatos
    orchards_cursor = db.orchards.find({
        "userId": {"$in": cluster_user_ids},
        "state": True
    })
    candidate_orchards = await orchards_cursor.to_list(length=None)

    if not candidate_orchards:
        return {
            "userId": user_id,
            "clusterIdAssigned": cluster_id,
            "recommendations": [],
            "generatedAt": datetime.now()
        }

    # Calcular scores (simplificado - en producción usar embeddings)
    recommendations = []
    for orchard in candidate_orchards[:limit]:
        score = np.random.random()  # Placeholder - implementar similarity real

        recommendations.append({
            "orchardId": str(orchard['_id']),
            "name": orchard.get("name", "Huerto sin nombre"),
            "shortDescription": orchard.get("description", "")[:100],
            "estimatedWeeklyWater": orchard.get("width", 1) * orchard.get("height", 1) * 60,
            "maintenanceMinutes": orchard.get("countPlants", 5) * 15,
            "fitness": 0.85,  # Placeholder
            "score": float(score)
        })

    # Ordenar por score
    recommendations.sort(key=lambda x: x['score'], reverse=True)

    return {
        "userId": user_id,
        "clusterIdAssigned": cluster_id,
        "recommendations": recommendations[:limit],
        "generatedAt": datetime.now()
    }


async def handle_user_registered(db: AsyncIOMotorDatabase, user_id: str):
    """Maneja webhook de usuario recién registrado."""
    logger.info(f"Handling new user registered: {user_id}")

    # Obtener recomendaciones inmediatas
    recommendations = await get_recommendations_for_user(db, user_id, limit=3)

    # Enviar notificación al usuario
    if recommendations['recommendations']:
        try:
            top_recommendations = recommendations['recommendations'][:3]
            orchard_names = ", ".join([r['name'] for r in top_recommendations])

            await notifications_client.send_to_user(
                user_id=user_id,
                title="¡Bienvenido a PlantGen! 🌱",
                body=f"Descubre estos huertos recomendados para ti: {orchard_names}",
                data={
                    "type": "new_user_recommendations",
                    "recommendations": top_recommendations
                }
            )
            logger.info(f"Notification sent to new user {user_id}")
        except Exception as e:
            logger.error(f"Failed to send notification to user {user_id}: {e}")

    logger.info(f"Generated {len(recommendations['recommendations'])} recommendations for new user {user_id}")

    return recommendations


async def notify_cluster(db: AsyncIOMotorDatabase, cluster_id: int) -> Dict[str, Any]:
    """Envía recomendaciones a todos los usuarios de un cluster."""
    users_cursor = db.users.find({"cluster_id": cluster_id, "tokenFCM": {"$ne": None}})
    users = await users_cursor.to_list(length=None)

    notified = 0
    failed = 0

    for user in users:
        try:
            user_id = str(user['_id'])
            # Generar recomendaciones para este usuario
            recommendations = await get_recommendations_for_user(db, user_id, limit=5)

            if recommendations['recommendations']:
                top_recommendations = recommendations['recommendations'][:3]
                orchard_names = ", ".join([r['name'] for r in top_recommendations])

                # Enviar notificación
                await notifications_client.send_to_user(
                    user_id=user_id,
                    title="Nuevas recomendaciones de huertos 🌿",
                    body=f"Descubre estos huertos: {orchard_names}",
                    data={
                        "type": "cluster_recommendations",
                        "cluster_id": cluster_id,
                        "recommendations": top_recommendations
                    }
                )
                notified += 1
                logger.info(f"Notified user {user_id} in cluster {cluster_id}")
        except Exception as e:
            failed += 1
            logger.error(f"Failed to notify user {user.get('_id')}: {e}")

    return {
        "cluster_id": cluster_id,
        "users_notified": notified,
        "users_failed": failed,
        "total_users": len(users)
    }
