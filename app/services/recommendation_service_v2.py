"""
Servicio de recomendaciones v2.

Genera recomendaciones de huertos basadas en clustering.
"""
import logging
import httpx
import numpy as np
from typing import Dict, List, Optional
from sklearn.metrics.pairwise import cosine_similarity

from app.core.config import settings

logger = logging.getLogger(__name__)


class RecommendationServiceV2:
    """Servicio de recomendaciones basado en clustering."""

    def __init__(self, db):
        self.db = db
        self.users_service_url = settings.USERS_SERVICE_URL
        self.orchards_service_url = settings.ORCHARDS_SERVICE_URL

    async def get_recommendations(
        self, user_id: str, model_data: Dict, limit: int = 3
    ) -> Dict:
        """
        Genera recomendaciones de huertos para un usuario.

        Args:
            user_id: ID del usuario
            model_data: Datos del modelo cargado
            limit: Número de recomendaciones (default: 3)

        Returns:
            Dict con recomendaciones
        """
        try:
            # 1. Obtener datos del usuario
            user = await self._fetch_user_by_id(user_id)
            if not user:
                raise ValueError(f"Usuario {user_id} no encontrado")

            # 2. Obtener cluster del usuario (si ya está asignado)
            cluster_id = user.get('cluster_id')

            # Si no tiene cluster, predecir
            if cluster_id is None:
                cluster_id = await self._predict_user_cluster(user, model_data)
                logger.info(f"Cluster predicho para usuario {user_id}: {cluster_id}")
            else:
                logger.info(f"Usuario {user_id} ya tiene cluster: {cluster_id}")

            # 3. Obtener huertos propios del usuario
            user_orchards = await self._fetch_user_orchards(user_id)
            user_orchard_ids = [o.get('_id') or o.get('id') for o in user_orchards]

            # 4. Buscar usuarios del mismo cluster
            users_in_cluster = await self._fetch_users_by_cluster(cluster_id)

            # Excluir al usuario actual
            other_users = [u for u in users_in_cluster if (u.get('id') or u.get('_id')) != user_id]

            if not other_users:
                logger.warning(f"No hay otros usuarios en el cluster {cluster_id}")
                return {
                    'user_id': user_id,
                    'cluster_id': cluster_id,
                    'recommendations': [],
                    'message': 'No hay suficientes datos para generar recomendaciones'
                }

            # 5. Obtener huertos de otros usuarios del cluster
            other_user_ids = [u.get('id') or u.get('_id') for u in other_users]
            candidate_orchards = await self._fetch_orchards_by_users(other_user_ids)

            # Filtrar huertos que el usuario ya tiene
            candidate_orchards = [
                o for o in candidate_orchards
                if (o.get('_id') or o.get('id')) not in user_orchard_ids
            ]

            if not candidate_orchards:
                logger.warning(f"No hay huertos candidatos para recomendar")
                return {
                    'user_id': user_id,
                    'cluster_id': cluster_id,
                    'recommendations': [],
                    'message': 'No hay nuevos huertos disponibles para recomendar'
                }

            # 6. Calcular similarity scores
            scored_orchards = self._score_orchards(user, user_orchards, candidate_orchards)

            # 7. Ordenar por score y tomar top N
            top_recommendations = sorted(scored_orchards, key=lambda x: x['score'], reverse=True)[:limit]

            return {
                'user_id': user_id,
                'cluster_id': cluster_id,
                'recommendations': top_recommendations,
                'total_candidates': len(candidate_orchards),
                'message': f'{len(top_recommendations)} huertos recomendados'
            }

        except Exception as e:
            logger.error(f"❌ Error generando recomendaciones para {user_id}: {e}")
            raise

    async def _predict_user_cluster(self, user: Dict, model_data: Dict) -> int:
        """Predice el cluster de un usuario usando el modelo."""
        # Obtener orchards del usuario
        user_id = user.get('id') or user.get('_id')
        orchards = await self._fetch_user_orchards(user_id)

        # Extraer features
        pipeline = model_data['pipeline']
        features = pipeline.transform([user], orchards)

        # Predecir cluster
        clustering = model_data['clustering']
        cat_indices = pipeline.categorical_indices

        cluster_id = clustering.predict(features, cat_indices)[0]

        # Guardar en BD
        await self.db['users'].update_one(
            {'_id': user_id},
            {'$set': {'cluster_id': int(cluster_id)}}
        )

        return int(cluster_id)

    def _score_orchards(
        self, user: Dict, user_orchards: List[Dict], candidate_orchards: List[Dict]
    ) -> List[Dict]:
        """
        Calcula score de similaridad para cada huerto candidato.

        Factores:
        - Similaridad de tamaño (área)
        - Similaridad de número de plantas
        - Popularidad (número de plantas)
        - Frescura (orchards más recientes)
        """
        scored = []

        # Calcular promedios de huertos del usuario
        if user_orchards:
            avg_user_area = np.mean([o.get('area', 0) for o in user_orchards])
            avg_user_plants = np.mean([o.get('countPlants', 0) for o in user_orchards])
        else:
            avg_user_area = 10.0  # Default
            avg_user_plants = 5.0  # Default

        for orchard in candidate_orchards:
            # Features del orchard
            area = orchard.get('area', 0)
            count_plants = orchard.get('countPlants', 0)

            # Similarity scores (normalizados entre 0 y 1)
            area_similarity = 1.0 - min(abs(area - avg_user_area) / max(avg_user_area, 1), 1.0)
            plants_similarity = 1.0 - min(abs(count_plants - avg_user_plants) / max(avg_user_plants, 1), 1.0)

            # Popularity score (más plantas = más popular)
            popularity_score = min(count_plants / 20.0, 1.0)  # Normalizar a 1

            # Score final (weighted average)
            final_score = (
                area_similarity * 0.3 +
                plants_similarity * 0.4 +
                popularity_score * 0.3
            )

            scored.append({
                'orchard_id': orchard.get('_id') or orchard.get('id'),
                'name': orchard.get('name', 'Huerto sin nombre'),
                'description': orchard.get('description', ''),
                'area': area,
                'countPlants': count_plants,
                'score': round(final_score, 4),
                'area_similarity': round(area_similarity, 4),
                'plants_similarity': round(plants_similarity, 4),
                'popularity_score': round(popularity_score, 4)
            })

        return scored

    async def _fetch_user_by_id(self, user_id: str) -> Optional[Dict]:
        """Obtiene un usuario por ID."""
        url = f"{self.users_service_url}/api/{user_id}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 404:
                return None
            response.raise_for_status()
            data = response.json()
            return data.get('data')

    async def _fetch_user_orchards(self, user_id: str) -> List[Dict]:
        """Obtiene los huertos de un usuario."""
        url = f"{self.orchards_service_url}/orchards/user/{user_id}"

        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url)
            if response.status_code == 404:
                return []
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])

    async def _fetch_users_by_cluster(self, cluster_id: int) -> List[Dict]:
        """Obtiene usuarios de un cluster específico desde MongoDB."""
        collection = self.db['users']
        cursor = collection.find({'cluster_id': cluster_id})

        users = []
        async for user in cursor:
            users.append(user)

        return users

    async def _fetch_orchards_by_users(self, user_ids: List[str]) -> List[Dict]:
        """Obtiene orchards de una lista de usuarios."""
        url = f"{self.orchards_service_url}/orchards/by-users"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json={'userIds': user_ids})
            response.raise_for_status()
            data = response.json()
            return data.get('data', [])
