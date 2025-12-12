"""
Servicio de clustering múltiple con 3 algoritmos:
1. K-Prototypes (datos mixtos)
2. DBSCAN (densidad)
3. Gaussian Mixture Model (probabilístico)

Selecciona el mejor modelo basado en métricas de calidad.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple, Optional
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
from sklearn.mixture import GaussianMixture
from sklearn.cluster import DBSCAN
from kmodes.kprototypes import KPrototypes
import joblib
from datetime import datetime

logger = logging.getLogger(__name__)


class MultiClusteringService:
    """Servicio que prueba 3 algoritmos y selecciona el mejor."""

    def __init__(self, min_clusters: int = 3, max_clusters: int = 15):
        self.min_clusters = min_clusters
        self.max_clusters = max_clusters
        self.scaler = StandardScaler()
        self.best_model = None
        self.best_algorithm = None
        self.best_score = -1
        self.cluster_labels = None
        self.n_clusters = None

    def fit(
        self,
        numerical_features: np.ndarray,
        categorical_features: np.ndarray,
        categorical_indices: List[int]
    ) -> Dict:
        """
        Entrena los 3 algoritmos y selecciona el mejor.

        Args:
            numerical_features: Features numéricas normalizadas
            categorical_features: Features categóricas codificadas
            categorical_indices: Índices de columnas categóricas en la matriz combinada

        Returns:
            Dict con resultados del entrenamiento
        """
        logger.info("🔄 Iniciando entrenamiento multi-algoritmo...")

        # Combinar features
        X_combined = np.hstack([numerical_features, categorical_features])

        results = {}

        # 1. K-Prototypes (mejor para datos mixtos)
        logger.info("📊 Entrenando K-Prototypes...")
        kproto_result = self._train_kprototypes(
            X_combined, categorical_indices
        )
        results['kprototypes'] = kproto_result

        # 2. DBSCAN (clustering basado en densidad)
        logger.info("📊 Entrenando DBSCAN...")
        dbscan_result = self._train_dbscan(numerical_features)
        results['dbscan'] = dbscan_result

        # 3. Gaussian Mixture Model (clustering probabilístico)
        logger.info("📊 Entrenando Gaussian Mixture Model...")
        gmm_result = self._train_gmm(numerical_features)
        results['gmm'] = gmm_result

        # Seleccionar el mejor modelo
        self._select_best_model(results, X_combined, numerical_features)

        return {
            'algorithm': self.best_algorithm,
            'n_clusters': self.n_clusters,
            'silhouette_score': self.best_score,
            'all_results': results
        }

    def _train_kprototypes(
        self, X: np.ndarray, categorical_indices: List[int]
    ) -> Dict:
        """Entrena K-Prototypes con diferentes números de clusters."""
        best_score = -1
        best_model = None
        best_k = None
        best_labels = None

        for k in range(self.min_clusters, self.max_clusters + 1):
            try:
                model = KPrototypes(
                    n_clusters=k,
                    init='Huang',
                    n_init=10,
                    verbose=0
                )

                labels = model.fit_predict(X, categorical=categorical_indices)

                # Calcular silhouette score solo con features numéricas
                numerical_features = np.delete(X, categorical_indices, axis=1)
                score = silhouette_score(numerical_features, labels)

                if score > best_score:
                    best_score = score
                    best_model = model
                    best_k = k
                    best_labels = labels

            except Exception as e:
                logger.warning(f"KPrototypes falló para k={k}: {e}")
                continue

        return {
            'model': best_model,
            'labels': best_labels,
            'n_clusters': best_k,
            'silhouette_score': best_score
        }

    def _train_dbscan(self, X: np.ndarray) -> Dict:
        """Entrena DBSCAN con diferentes valores de eps."""
        best_score = -1
        best_model = None
        best_labels = None
        best_n_clusters = 0

        # Probar diferentes valores de eps
        eps_values = np.linspace(0.3, 2.0, 10)

        for eps in eps_values:
            try:
                model = DBSCAN(eps=eps, min_samples=5)
                labels = model.fit_predict(X)

                # Ignorar ruido (-1)
                n_clusters = len(set(labels)) - (1 if -1 in labels else 0)

                if n_clusters < self.min_clusters or n_clusters > self.max_clusters:
                    continue

                # Filtrar puntos de ruido para calcular score
                mask = labels != -1
                if np.sum(mask) < 10:  # Muy pocos puntos
                    continue

                score = silhouette_score(X[mask], labels[mask])

                if score > best_score:
                    best_score = score
                    best_model = model
                    best_labels = labels
                    best_n_clusters = n_clusters

            except Exception as e:
                logger.warning(f"DBSCAN falló para eps={eps}: {e}")
                continue

        return {
            'model': best_model,
            'labels': best_labels,
            'n_clusters': best_n_clusters,
            'silhouette_score': best_score
        }

    def _train_gmm(self, X: np.ndarray) -> Dict:
        """Entrena Gaussian Mixture Model con diferentes números de componentes."""
        best_score = -1
        best_model = None
        best_k = None
        best_labels = None

        for k in range(self.min_clusters, self.max_clusters + 1):
            try:
                model = GaussianMixture(
                    n_components=k,
                    covariance_type='full',
                    n_init=10,
                    random_state=42
                )

                model.fit(X)
                labels = model.predict(X)

                score = silhouette_score(X, labels)

                if score > best_score:
                    best_score = score
                    best_model = model
                    best_k = k
                    best_labels = labels

            except Exception as e:
                logger.warning(f"GMM falló para k={k}: {e}")
                continue

        return {
            'model': best_model,
            'labels': best_labels,
            'n_clusters': best_k,
            'silhouette_score': best_score
        }

    def _select_best_model(
        self, results: Dict, X_combined: np.ndarray, X_numerical: np.ndarray
    ):
        """Selecciona el mejor modelo basado en silhouette score."""
        best_algo = None
        best_score = -1

        for algo, result in results.items():
            score = result.get('silhouette_score', -1)
            if score > best_score:
                best_score = score
                best_algo = algo

        if best_algo is None:
            raise ValueError("Ningún algoritmo produjo resultados válidos")

        logger.info(f"✅ Mejor algoritmo: {best_algo} (silhouette={best_score:.4f})")

        self.best_algorithm = best_algo
        self.best_model = results[best_algo]['model']
        self.cluster_labels = results[best_algo]['labels']
        self.n_clusters = results[best_algo]['n_clusters']
        self.best_score = best_score

    def predict(self, X: np.ndarray, categorical_indices: List[int] = None) -> np.ndarray:
        """Predice el cluster para nuevos datos."""
        if self.best_model is None:
            raise ValueError("El modelo no ha sido entrenado")

        if self.best_algorithm == 'kprototypes':
            return self.best_model.predict(X, categorical=categorical_indices)
        elif self.best_algorithm == 'dbscan':
            # DBSCAN no tiene método predict, usamos el más cercano
            return self._predict_dbscan(X)
        elif self.best_algorithm == 'gmm':
            # Solo features numéricas para GMM
            X_num = np.delete(X, categorical_indices, axis=1) if categorical_indices else X
            return self.best_model.predict(X_num)

    def _predict_dbscan(self, X: np.ndarray) -> np.ndarray:
        """Predice clusters para DBSCAN asignando al centroide más cercano."""
        # Calcular centroides de cada cluster
        unique_labels = set(self.cluster_labels)
        unique_labels.discard(-1)  # Remover ruido

        centroids = []
        for label in sorted(unique_labels):
            mask = self.cluster_labels == label
            centroid = np.mean(X[mask], axis=0)
            centroids.append(centroid)

        centroids = np.array(centroids)

        # Asignar al centroide más cercano
        from scipy.spatial.distance import cdist
        distances = cdist(X, centroids)
        return np.argmin(distances, axis=1)

    def save_model(self, filepath: str):
        """Guarda el modelo entrenado."""
        model_data = {
            'algorithm': self.best_algorithm,
            'model': self.best_model,
            'scaler': self.scaler,
            'n_clusters': self.n_clusters,
            'best_score': self.best_score,
            'cluster_labels': self.cluster_labels,
            'timestamp': datetime.now().isoformat()
        }

        joblib.dump(model_data, filepath)
        logger.info(f"💾 Modelo guardado en {filepath}")

    def load_model(self, filepath: str):
        """Carga un modelo previamente entrenado."""
        model_data = joblib.load(filepath)

        self.best_algorithm = model_data['algorithm']
        self.best_model = model_data['model']
        self.scaler = model_data['scaler']
        self.n_clusters = model_data['n_clusters']
        self.best_score = model_data['best_score']
        self.cluster_labels = model_data.get('cluster_labels')

        logger.info(f"📂 Modelo cargado desde {filepath}")
        logger.info(f"   Algoritmo: {self.best_algorithm}, Clusters: {self.n_clusters}")
