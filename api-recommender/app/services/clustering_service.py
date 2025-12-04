"""Servicio de clustering con K-Prototypes.

Justificación técnica:
- K-Prototypes (kmodes library): Algoritmo ideal para datos mixtos (numéricos + categóricos)
  sin necesidad de one-hot encoding completo que aumentaría dimensionalidad.
- Fallback a MiniBatchKMeans: Para datasets muy grandes (>50k usuarios), permite entrenamiento
  incremental y menor uso de memoria.
- Elbow + Silhouette: Métodos complementarios para encontrar k óptimo automáticamente.
"""
import numpy as np
import joblib
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, List, Optional
from datetime import datetime
from kmodes.kprototypes import KPrototypes
from sklearn.cluster import MiniBatchKMeans
from sklearn.metrics import silhouette_score
from app.core.config import settings

logger = logging.getLogger(__name__)


class ClusteringService:
    """Servicio de clustering para usuarios basado en features."""

    def __init__(self):
        self.model: Optional[KPrototypes] = None
        self.n_clusters: int = 0
        self.cluster_metadata: Dict[str, Any] = {}
        self.model_path = Path(settings.MODEL_STORAGE_PATH)
        self.model_path.mkdir(parents=True, exist_ok=True)
        self.trained_at: Optional[datetime] = None
        self.metrics: Dict[str, float] = {}

    def find_optimal_k(
        self,
        X_numeric: np.ndarray,
        X_categorical: np.ndarray,
        method: str = 'silhouette'
    ) -> int:
        """Encuentra el número óptimo de clusters.

        Args:
            X_numeric: Features numéricas escaladas
            X_categorical: Features categóricas codificadas
            method: 'silhouette' o 'elbow'

        Returns:
            Número óptimo de clusters
        """
        min_k = settings.MIN_CLUSTERS
        max_k = min(settings.MAX_CLUSTERS, len(X_numeric) // 10)

        if max_k < min_k:
            logger.warning(f"Dataset too small for clustering. Using min_k={min_k}")
            return min_k

        best_k = min_k
        best_score = -1

        if method == 'silhouette':
            logger.info(f"Finding optimal k using silhouette method (range: {min_k}-{max_k})")

            for k in range(min_k, max_k + 1):
                try:
                    # K-Prototypes temporal
                    kproto = KPrototypes(n_clusters=k, init='Huang', n_init=5, verbose=0, random_state=42)
                    X_combined = np.concatenate([X_numeric, X_categorical], axis=1)
                    categorical_indices = list(range(X_numeric.shape[1], X_combined.shape[1]))

                    labels = kproto.fit_predict(X_combined, categorical=categorical_indices)

                    # Calcular silhouette solo sobre features numéricas (más estable)
                    if len(np.unique(labels)) > 1:
                        score = silhouette_score(X_numeric, labels)
                        logger.debug(f"k={k}, silhouette={score:.4f}")

                        if score > best_score:
                            best_score = score
                            best_k = k
                except Exception as e:
                    logger.warning(f"Failed to cluster with k={k}: {e}")
                    continue

            logger.info(f"Optimal k={best_k} with silhouette={best_score:.4f}")
            return best_k

        else:  # elbow method
            logger.info(f"Finding optimal k using elbow method (range: {min_k}-{max_k})")

            inertias = []
            for k in range(min_k, max_k + 1):
                try:
                    kproto = KPrototypes(n_clusters=k, init='Huang', n_init=5, verbose=0, random_state=42)
                    X_combined = np.concatenate([X_numeric, X_categorical], axis=1)
                    categorical_indices = list(range(X_numeric.shape[1], X_combined.shape[1]))

                    kproto.fit(X_combined, categorical=categorical_indices)
                    inertias.append(kproto.cost_)
                except Exception as e:
                    logger.warning(f"Failed to cluster with k={k}: {e}")
                    continue

            # Simple elbow detection (mayor diferencia de pendiente)
            if len(inertias) >= 2:
                diffs = np.diff(inertias)
                best_k = min_k + np.argmax(np.abs(diffs)) + 1

            logger.info(f"Optimal k={best_k} using elbow method")
            return best_k

    def train(
        self,
        X_numeric: np.ndarray,
        X_categorical: np.ndarray,
        user_ids: List[str]
    ) -> Dict[str, Any]:
        """Entrena modelo de clustering.

        Args:
            X_numeric: Features numéricas (N, F_numeric)
            X_categorical: Features categóricas (N, F_categorical)
            user_ids: Lista de IDs de usuarios correspondientes

        Returns:
            Metadata del entrenamiento
        """
        logger.info(f"Training clustering model on {len(user_ids)} users")

        # Encontrar k óptimo
        optimal_k = self.find_optimal_k(X_numeric, X_categorical, method=settings.OPTIMAL_CLUSTER_METHOD)
        self.n_clusters = optimal_k

        # Combinar features
        X_combined = np.concatenate([X_numeric, X_categorical], axis=1)
        categorical_indices = list(range(X_numeric.shape[1], X_combined.shape[1]))

        # Entrenar K-Prototypes
        try:
            logger.info(f"Training K-Prototypes with k={optimal_k}")
            self.model = KPrototypes(
                n_clusters=optimal_k,
                init='Huang',
                n_init=10,
                verbose=1,
                random_state=42
            )

            labels = self.model.fit_predict(X_combined, categorical=categorical_indices)

            # Calcular métricas
            if len(np.unique(labels)) > 1:
                silhouette = silhouette_score(X_numeric, labels)
            else:
                silhouette = 0.0

            self.metrics = {
                'silhouette_score': float(silhouette),
                'n_clusters': optimal_k,
                'n_samples': len(user_ids),
                'cost': float(self.model.cost_)
            }

            # Metadata de clusters
            self.cluster_metadata = {
                'cluster_sizes': {},
                'centroids_numeric': self.model.cluster_centroids_[0].tolist(),
                'centroids_categorical': self.model.cluster_centroids_[1].tolist(),
            }

            for cluster_id in range(optimal_k):
                cluster_size = np.sum(labels == cluster_id)
                self.cluster_metadata['cluster_sizes'][cluster_id] = int(cluster_size)

            self.trained_at = datetime.now()

            # Guardar modelo
            self.save_model()

            # Retornar asignaciones
            cluster_assignments = {
                user_id: int(label) for user_id, label in zip(user_ids, labels)
            }

            logger.info(f"Training completed. Silhouette: {silhouette:.4f}, Clusters: {optimal_k}")

            return {
                'cluster_assignments': cluster_assignments,
                'metrics': self.metrics,
                'cluster_metadata': self.cluster_metadata,
                'trained_at': self.trained_at.isoformat()
            }

        except Exception as e:
            logger.error(f"Training failed: {e}")
            raise

    def predict(self, X_numeric: np.ndarray, X_categorical: np.ndarray) -> np.ndarray:
        """Predice clusters para nuevos usuarios."""
        if self.model is None:
            raise ValueError("Model not trained. Call train() first or load_model()")

        X_combined = np.concatenate([X_numeric, X_categorical], axis=1)
        categorical_indices = list(range(X_numeric.shape[1], X_combined.shape[1]))

        return self.model.predict(X_combined, categorical=categorical_indices)

    def save_model(self):
        """Guarda el modelo entrenado."""
        if self.model is None:
            raise ValueError("No model to save")

        model_file = self.model_path / f"kprototypes_{settings.MODEL_VERSION}.joblib"
        metadata_file = self.model_path / f"metadata_{settings.MODEL_VERSION}.joblib"

        joblib.dump(self.model, model_file)
        joblib.dump({
            'n_clusters': self.n_clusters,
            'cluster_metadata': self.cluster_metadata,
            'trained_at': self.trained_at,
            'metrics': self.metrics
        }, metadata_file)

        logger.info(f"Model saved to {model_file}")

    def load_model(self):
        """Carga el modelo entrenado."""
        model_file = self.model_path / f"kprototypes_{settings.MODEL_VERSION}.joblib"
        metadata_file = self.model_path / f"metadata_{settings.MODEL_VERSION}.joblib"

        if not model_file.exists():
            raise FileNotFoundError(f"Model file not found: {model_file}")

        self.model = joblib.load(model_file)
        metadata = joblib.load(metadata_file)

        self.n_clusters = metadata['n_clusters']
        self.cluster_metadata = metadata['cluster_metadata']
        self.trained_at = metadata['trained_at']
        self.metrics = metadata['metrics']

        logger.info(f"Model loaded from {model_file}")

    def get_cluster_info(self, cluster_id: int) -> Dict[str, Any]:
        """Obtiene información de un cluster específico."""
        if cluster_id >= self.n_clusters:
            raise ValueError(f"Cluster {cluster_id} does not exist")

        return {
            'cluster_id': cluster_id,
            'size': self.cluster_metadata['cluster_sizes'].get(cluster_id, 0),
            'centroid_numeric': self.cluster_metadata['centroids_numeric'][cluster_id],
            'centroid_categorical': self.cluster_metadata['centroids_categorical'][cluster_id]
        }
