"""Servicio de entrenamiento del modelo de clustering."""
import logging
from typing import Dict, Any
from datetime import datetime
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.services.feature_pipeline import FeaturePipeline
from app.services.clustering_service import ClusteringService

logger = logging.getLogger(__name__)


async def train_clustering_model(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Entrena modelo de clustering con todos los usuarios."""
    logger.info("Starting clustering training...")

    # Cargar usuarios y orchards
    users_cursor = db.users.find({})
    users = await users_cursor.to_list(length=None)

    if len(users) < 10:
        raise ValueError("Not enough users for clustering (minimum: 10)")

    # Extraer features
    pipeline = FeaturePipeline()
    users_features = []
    user_ids = []

    for user in users:
        user_id = str(user['_id'])
        # Obtener orchards del usuario
        orchards_cursor = db.orchards.find({"userId": user_id})
        orchards = await orchards_cursor.to_list(length=None)

        features = pipeline.extract_user_features(user, orchards)
        users_features.append(features)
        user_ids.append(user_id)

    # Fit pipeline
    X_numeric, X_categorical = pipeline.fit_transform(users_features)

    # Entrenar clustering
    clustering = ClusteringService()
    result = clustering.train(X_numeric, X_categorical, user_ids)

    # Guardar cluster_id en usuarios
    cluster_assignments = result['cluster_assignments']
    for user_id, cluster_id in cluster_assignments.items():
        await db.users.update_one(
            {"_id": user_id},
            {"$set": {"cluster_id": cluster_id}}
        )

    # Guardar metadata de training
    await db.training_history.insert_one({
        "trained_at": result['trained_at'],
        "n_clusters": result['metrics']['n_clusters'],
        "n_samples": result['metrics']['n_samples'],
        "silhouette_score": result['metrics']['silhouette_score'],
        "cluster_sizes": result['cluster_metadata']['cluster_sizes']
    })

    logger.info(f"Training completed: {result['metrics']['n_clusters']} clusters")

    return {
        "success": True,
        "message": "Model trained successfully",
        "n_clusters": result['metrics']['n_clusters'],
        "n_users_clustered": len(cluster_assignments),
        "silhouette_score": result['metrics']['silhouette_score'],
        "trained_at": datetime.fromisoformat(result['trained_at'])
    }


async def get_training_status(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Obtiene estado del último entrenamiento."""
    last_training = await db.training_history.find_one(
        {}, sort=[("trained_at", -1)]
    )

    if not last_training:
        return {
            "model_exists": False,
            "trained_at": None,
            "n_clusters": None,
            "metrics": None
        }

    return {
        "model_exists": True,
        "trained_at": last_training.get("trained_at"),
        "n_clusters": last_training.get("n_clusters"),
        "metrics": {
            "silhouette_score": last_training.get("silhouette_score"),
            "n_samples": last_training.get("n_samples")
        }
    }


async def get_clusters_info(db: AsyncIOMotorDatabase) -> Dict[str, Any]:
    """Obtiene información de todos los clusters."""
    last_training = await db.training_history.find_one(
        {}, sort=[("trained_at", -1)]
    )

    if not last_training:
        return {"n_clusters": 0, "clusters": [], "total_users": 0}

    cluster_sizes = last_training.get("cluster_sizes", {})
    clusters = []

    for cluster_id, size in cluster_sizes.items():
        clusters.append({
            "cluster_id": int(cluster_id),
            "size": size,
            "centroid_numeric": [],  # Cargar desde modelo si es necesario
            "centroid_categorical": []
        })

    total_users = sum(cluster_sizes.values())

    return {
        "n_clusters": len(clusters),
        "clusters": clusters,
        "total_users": total_users
    }
