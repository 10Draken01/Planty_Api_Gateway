"""
Servicio de entrenamiento v2.

Integra:
- Consumo de endpoints de users y orchards
- Enhanced feature pipeline
- Multi-clustering con 3 algoritmos
- Guardado de modelos con fecha
- Registro de métricas
"""
import logging
import httpx
import os
from datetime import datetime, timedelta
from typing import Dict, Optional
from pathlib import Path

from app.core.config import settings
from app.services.enhanced_feature_pipeline import EnhancedFeaturePipeline
from app.services.multi_clustering_service import MultiClusteringService

logger = logging.getLogger(__name__)


class TrainingServiceV2:
    """Servicio de entrenamiento con multi-algoritmo y features mejoradas."""

    def __init__(self, db):
        self.db = db
        self.users_service_url = settings.USERS_SERVICE_URL
        self.orchards_service_url = settings.ORCHARDS_SERVICE_URL
        self.models_path = Path(settings.MODEL_STORAGE_PATH)
        self.models_path.mkdir(exist_ok=True)

    async def train_model(self, training_date: Optional[str] = None) -> Dict:
        """
        Entrena un nuevo modelo de clustering.

        Args:
            training_date: Fecha opcional en formato YYYY-MM-DD.
                          Si no se proporciona, usa fecha actual.
                          El modelo se entrena con 6 meses de datos ANTES de esta fecha.

        Returns:
            Dict con resultados del entrenamiento
        """
        try:
            # Determinar rango de fechas
            if training_date:
                end_date = datetime.fromisoformat(training_date)
            else:
                end_date = datetime.now()

            start_date = end_date - timedelta(days=180)  # 6 meses atrás

            logger.info(f"🎯 Entrenando modelo con datos desde {start_date.date()} hasta {end_date.date()}")

            # 1. Obtener usuarios del rango de fechas
            users = await self._fetch_users_by_date_range(start_date, end_date)

            if len(users) < 10:
                raise ValueError(f"Datos insuficientes para entrenar: solo {len(users)} usuarios encontrados")

            logger.info(f"✓ {len(users)} usuarios obtenidos")

            # 2. Obtener userIds
            user_ids = [u.get('id') or u.get('_id') for u in users]

            # 3. Obtener orchards de esos usuarios
            orchards = await self._fetch_orchards_by_users(user_ids)
            logger.info(f"✓ {len(orchards)} huertos obtenidos")

            # 4. Extraer features
            pipeline = EnhancedFeaturePipeline()
            X_num, X_cat, cat_indices = pipeline.extract_features(users, orchards)

            logger.info(f"✓ Features extraídas: {X_num.shape}")

            # 5. Entrenar modelo con 3 algoritmos
            clustering = MultiClusteringService(
                min_clusters=settings.MIN_CLUSTERS,
                max_clusters=settings.MAX_CLUSTERS
            )

            training_result = clustering.fit(X_num, X_cat, cat_indices)

            logger.info(f"✓ Mejor algoritmo: {training_result['algorithm']} con {training_result['n_clusters']} clusters")

            # 6. Asignar clusters a usuarios
            cluster_labels = clustering.cluster_labels
            await self._assign_clusters_to_users(users, cluster_labels)

            # 7. Guardar modelo con fecha
            model_filename = f"model_{end_date.strftime('%Y-%m-%d')}.pkl"
            model_path = self.models_path / model_filename

            # Guardar pipeline junto con clustering
            model_data = {
                'clustering': clustering,
                'pipeline': pipeline,
                'algorithm': training_result['algorithm'],
                'n_clusters': training_result['n_clusters'],
                'silhouette_score': training_result['silhouette_score'],
                'training_date': end_date.isoformat(),
                'data_range': {
                    'start': start_date.isoformat(),
                    'end': end_date.isoformat()
                },
                'n_users': len(users),
                'n_orchards': len(orchards)
            }

            import joblib
            joblib.dump(model_data, model_path)

            logger.info(f"💾 Modelo guardado: {model_path}")

            # 8. Registrar en MongoDB
            await self._save_training_history(model_data, model_filename)

            return {
                'success': True,
                'model_file': model_filename,
                'algorithm': training_result['algorithm'],
                'n_clusters': training_result['n_clusters'],
                'silhouette_score': training_result['silhouette_score'],
                'n_users_trained': len(users),
                'n_orchards': len(orchards),
                'training_date': end_date.isoformat(),
                'data_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            }

        except Exception as e:
            logger.error(f"❌ Error en entrenamiento: {e}")
            raise

    async def _fetch_users_by_date_range(self, start_date: datetime, end_date: datetime) -> list:
        """Obtiene usuarios del servicio de users por rango de fechas."""
        url = f"{self.users_service_url}/api/by-registration-date"
        params = {
            'startDate': start_date.isoformat(),
            'endDate': end_date.isoformat()
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])

    async def _fetch_orchards_by_users(self, user_ids: list) -> list:
        """Obtiene orchards del servicio de orchards por lista de userIds."""
        url = f"{self.orchards_service_url}/orchards/by-users"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json={'userIds': user_ids})
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])

    async def _assign_clusters_to_users(self, users: list, cluster_labels: list):
        """Asigna cluster_id a cada usuario en la BD."""
        collection = self.db['users']

        for user, cluster_id in zip(users, cluster_labels):
            user_id = user.get('id') or user.get('_id')
            await collection.update_one(
                {'_id': user_id},
                {'$set': {'cluster_id': int(cluster_id)}}
            )

        logger.info(f"✓ Clusters asignados a {len(users)} usuarios")

    async def _save_training_history(self, model_data: Dict, model_filename: str):
        """Guarda historial de entrenamiento en MongoDB."""
        collection = self.db['training_history']

        record = {
            'model_file': model_filename,
            'algorithm': model_data['algorithm'],
            'n_clusters': model_data['n_clusters'],
            'silhouette_score': model_data['silhouette_score'],
            'n_users': model_data['n_users'],
            'n_orchards': model_data['n_orchards'],
            'training_date': model_data['training_date'],
            'data_range': model_data['data_range'],
            'created_at': datetime.now()
        }

        await collection.insert_one(record)
        logger.info("✓ Historial de entrenamiento guardado")

    async def get_latest_model(self) -> Optional[Dict]:
        """Obtiene el modelo más reciente."""
        # Buscar el archivo más reciente en el directorio
        model_files = list(self.models_path.glob("model_*.pkl"))

        if not model_files:
            return None

        # Ordenar por fecha en el nombre del archivo
        latest_file = max(model_files, key=lambda p: p.stem.split('_')[1])

        import joblib
        model_data = joblib.load(latest_file)

        return {
            'model_file': latest_file.name,
            'model_data': model_data
        }

    async def get_model_by_date(self, date_str: str) -> Optional[Dict]:
        """Obtiene un modelo específico por fecha."""
        model_file = self.models_path / f"model_{date_str}.pkl"

        if not model_file.exists():
            return None

        import joblib
        model_data = joblib.load(model_file)

        return {
            'model_file': model_file.name,
            'model_data': model_data
        }

    async def get_training_history(self, limit: int = 10) -> list:
        """Obtiene historial de entrenamientos."""
        collection = self.db['training_history']

        cursor = collection.find().sort('created_at', -1).limit(limit)
        history = []

        async for doc in cursor:
            doc['_id'] = str(doc['_id'])
            history.append(doc)

        return history
