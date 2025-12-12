"""Pipeline de extracción y transformación de features para clustering.

Justificación técnica:
- StandardScaler: Normaliza features numéricas para que todas contribuyan equitativamente
- K-Prototypes: Maneja datos mixtos (numéricos + categóricos) sin necesidad de one-hot encode todo
- Discretización de ubicación: Reduce dimensionalidad manteniendo información geográfica
"""
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from datetime import datetime
from typing import List, Dict, Any, Tuple
import logging

logger = logging.getLogger(__name__)


class FeaturePipeline:
    """Extrae y transforma features de usuarios y orchards para clustering."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.location_clusterer = None  # KMeans para discretizar lat/lon
        self.feature_names_numeric = []
        self.feature_names_categorical = []
        self.fitted = False

    def extract_user_features(self, user: Dict[str, Any], orchards: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Extrae features de un usuario y sus orchards.

        Args:
            user: Documento de usuario desde MongoDB
            orchards: Lista de orchards del usuario

        Returns:
            Dict con features numéricas y categóricas
        """
        features = {}

        # ===== USER FEATURES =====
        features['experience_level'] = user.get('experience_level', 2)
        features['count_orchards'] = len(orchards)
        features['has_tokenFCM'] = 1 if user.get('tokenFCM') else 0
        features['profile_image_present'] = 1 if user.get('profile_image') else 0

        # Account age in days
        created_at = user.get('createdAt', datetime.now())
        if isinstance(created_at, str):
            created_at = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
        account_age = (datetime.now() - created_at).days
        features['account_age_days'] = max(0, account_age)

        # ===== AGGREGATE ORCHARD FEATURES =====
        if orchards:
            # Área promedio
            areas = []
            for orchard in orchards:
                # Priorizar totalArea, fallback a width*height
                if 'layout' in orchard and 'dimensions' in orchard['layout']:
                    area = orchard['layout']['dimensions'].get('totalArea')
                    if not area:
                        w = orchard.get('width', 0)
                        h = orchard.get('height', 0)
                        area = w * h
                else:
                    area = orchard.get('width', 0) * orchard.get('height', 0)
                areas.append(area)

            features['avg_orchard_area'] = np.mean(areas) if areas else 0

            # Agua semanal total
            water = []
            for orchard in orchards:
                if 'estimations' in orchard:
                    water.append(orchard['estimations'].get('weeklyWaterLiters', 0))
            features['sum_weekly_water_liters'] = np.sum(water) if water else 0

            # Mantenimiento promedio
            maintenance = []
            for orchard in orchards:
                if 'estimations' in orchard:
                    maintenance.append(orchard['estimations'].get('maintenanceMinutesPerWeek', 0))
                elif 'maintenanceMinutes' in orchard:
                    maintenance.append(orchard['maintenanceMinutes'])
            features['avg_maintenance_minutes'] = np.mean(maintenance) if maintenance else 0

            # Contadores promedio
            features['avg_count_plants'] = np.mean([o.get('countPlants', 0) for o in orchards])
            features['avg_timeOfLife'] = np.mean([o.get('timeOfLife', 0) for o in orchards])
            features['avg_streak'] = np.mean([o.get('streakOfDays', 0) for o in orchards])

            # Diversidad de plantas (número de tipos distintos)
            all_types = set()
            for orchard in orchards:
                if 'layout' in orchard and 'plants' in orchard['layout']:
                    for plant in orchard['layout']['plants']:
                        all_types.update(plant.get('type', []))
            features['avg_plant_diversity'] = len(all_types)

            # Category distribution
            category_breakdown = {'vegetable': [], 'medicinal': [], 'ornamental': [], 'aromatic': []}
            for orchard in orchards:
                if 'layout' in orchard and 'categoryBreakdown' in orchard['layout']:
                    cb = orchard['layout']['categoryBreakdown']
                    for cat in category_breakdown.keys():
                        category_breakdown[cat].append(cb.get(cat, 0))
                elif 'metadata' in orchard and 'inputParameters' in orchard['metadata']:
                    dist = orchard['metadata']['inputParameters'].get('categoryDistribution', {})
                    for cat in category_breakdown.keys():
                        category_breakdown[cat].append(dist.get(cat, 0))

            for cat, values in category_breakdown.items():
                features[f'pct_{cat}'] = np.mean(values) if values else 0

            # Objetivo más común
            objectives = []
            for orchard in orchards:
                if 'objective' in orchard:
                    objectives.append(orchard['objective'])
                elif 'metadata' in orchard:
                    obj = orchard['metadata'].get('inputParameters', {}).get('objective')
                    if obj:
                        objectives.append(obj)

            if objectives:
                features['objective'] = max(set(objectives), key=objectives.count)
            else:
                features['objective'] = 'alimenticio'

            # Ubicación (usar primera orchard o default)
            lat, lon = None, None
            for orchard in orchards:
                if 'metadata' in orchard:
                    loc = orchard['metadata'].get('inputParameters', {}).get('location', {})
                    lat = loc.get('lat')
                    lon = loc.get('lon')
                    if lat is not None and lon is not None:
                        break

            features['latitude'] = lat if lat is not None else 16.75
            features['longitude'] = lon if lon is not None else -93.11

        else:
            # Usuario sin orchards - valores default
            features['avg_orchard_area'] = 0
            features['sum_weekly_water_liters'] = 0
            features['avg_maintenance_minutes'] = 0
            features['avg_count_plants'] = 0
            features['avg_timeOfLife'] = 0
            features['avg_streak'] = 0
            features['avg_plant_diversity'] = 0
            features['pct_vegetable'] = 0
            features['pct_medicinal'] = 0
            features['pct_ornamental'] = 0
            features['pct_aromatic'] = 0
            features['objective'] = 'alimenticio'
            features['latitude'] = 16.75
            features['longitude'] = -93.11

        return features

    def fit_transform(self, users_features: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray]:
        """Ajusta el pipeline y transforma features.

        Args:
            users_features: Lista de features extraídas de usuarios

        Returns:
            Tuple (numeric_features, categorical_features)
        """
        df = pd.DataFrame(users_features)

        # Definir columnas
        numeric_cols = [
            'experience_level', 'count_orchards', 'has_tokenFCM', 'profile_image_present',
            'account_age_days', 'avg_orchard_area', 'sum_weekly_water_liters',
            'avg_maintenance_minutes', 'avg_count_plants', 'avg_timeOfLife', 'avg_streak',
            'avg_plant_diversity', 'pct_vegetable', 'pct_medicinal', 'pct_ornamental',
            'pct_aromatic'
        ]

        categorical_cols = ['objective']

        # Discretizar ubicación (cluster_region)
        if 'latitude' in df.columns and 'longitude' in df.columns:
            locations = df[['latitude', 'longitude']].values
            n_location_clusters = min(10, len(df) // 10)  # Max 10 regiones
            if n_location_clusters >= 2:
                self.location_clusterer = KMeans(n_clusters=n_location_clusters, random_state=42, n_init=10)
                df['cluster_region'] = self.location_clusterer.fit_predict(locations)
            else:
                df['cluster_region'] = 0

            categorical_cols.append('cluster_region')

        # Rellenar nulos
        for col in numeric_cols:
            if col in df.columns:
                df[col].fillna(df[col].median() if df[col].median() == df[col].median() else 0, inplace=True)
            else:
                df[col] = 0

        for col in categorical_cols:
            if col in df.columns:
                df[col].fillna('unknown', inplace=True)
            else:
                df[col] = 'unknown'

        # Escalar numéricos
        X_numeric = df[numeric_cols].values
        X_numeric_scaled = self.scaler.fit_transform(X_numeric)

        # Categóricos (convertir a int para k-prototypes)
        X_categorical = df[categorical_cols].astype('category')
        X_categorical = X_categorical.apply(lambda x: x.cat.codes).values

        self.feature_names_numeric = numeric_cols
        self.feature_names_categorical = categorical_cols
        self.fitted = True

        logger.info(f"Pipeline fitted: {len(numeric_cols)} numeric features, {len(categorical_cols)} categorical features")

        return X_numeric_scaled, X_categorical

    def transform(self, users_features: List[Dict[str, Any]]) -> Tuple[np.ndarray, np.ndarray]:
        """Transforma features usando scaler ya ajustado."""
        if not self.fitted:
            raise ValueError("Pipeline not fitted. Call fit_transform first.")

        df = pd.DataFrame(users_features)

        # Discretizar ubicación
        if self.location_clusterer and 'latitude' in df.columns and 'longitude' in df.columns:
            locations = df[['latitude', 'longitude']].values
            df['cluster_region'] = self.location_clusterer.predict(locations)
        else:
            df['cluster_region'] = 0

        # Rellenar nulos
        for col in self.feature_names_numeric:
            if col in df.columns:
                df[col].fillna(0, inplace=True)
            else:
                df[col] = 0

        for col in self.feature_names_categorical:
            if col in df.columns:
                df[col].fillna('unknown', inplace=True)
            else:
                df[col] = 'unknown'

        # Escalar y codificar
        X_numeric = df[self.feature_names_numeric].values
        X_numeric_scaled = self.scaler.transform(X_numeric)

        X_categorical = df[self.feature_names_categorical].astype('category')
        X_categorical = X_categorical.apply(lambda x: x.cat.codes).values

        return X_numeric_scaled, X_categorical
