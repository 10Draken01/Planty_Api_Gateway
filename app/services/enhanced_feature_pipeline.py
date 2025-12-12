"""
Pipeline de extracción de features mejorado.

Extrae features de:
- Users (datos base + preferencias)
- Orchards (agregados por usuario)
- Métricas derivadas

Normaliza y prepara datos para clustering.
"""
import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Tuple
from sklearn.preprocessing import StandardScaler, LabelEncoder
from datetime import datetime

logger = logging.getLogger(__name__)


class EnhancedFeaturePipeline:
    """Pipeline para extraer y procesar features de users + orchards."""

    def __init__(self):
        self.scaler = StandardScaler()
        self.label_encoders = {}
        self.feature_names = []
        self.categorical_indices = []

    def extract_features(
        self, users: List[Dict], orchards: List[Dict]
    ) -> Tuple[np.ndarray, np.ndarray, List[int]]:
        """
        Extrae features de usuarios y huertos.

        Args:
            users: Lista de usuarios con sus datos
            orchards: Lista de huertos de todos los usuarios

        Returns:
            Tuple de (features_numericas, features_categoricas, indices_categoricas)
        """
        logger.info(f"📊 Extrayendo features de {len(users)} usuarios y {len(orchards)} huertos...")

        # Crear DataFrame de usuarios
        df_users = pd.DataFrame(users)

        # Crear DataFrame de orchards y agregar por usuario
        df_orchards = pd.DataFrame(orchards) if orchards else pd.DataFrame()

        # Agregar datos de orchards por usuario
        orchard_features = self._aggregate_orchard_features(df_users, df_orchards)

        # Combinar features
        df_features = pd.concat([df_users, orchard_features], axis=1)

        # Extraer features numéricas
        numerical_features = self._extract_numerical_features(df_features)

        # Extraer features categóricas
        categorical_features, cat_indices = self._extract_categorical_features(df_features)

        logger.info(f"✅ Features extraídas: {numerical_features.shape[1]} numéricas, {categorical_features.shape[1]} categóricas")

        return numerical_features, categorical_features, cat_indices

    def _aggregate_orchard_features(self, df_users: pd.DataFrame, df_orchards: pd.DataFrame) -> pd.DataFrame:
        """Agrega estadísticas de huertos por usuario."""
        if df_orchards.empty:
            # Si no hay orchards, retornar features vacías
            return pd.DataFrame({
                'count_orchards': [0] * len(df_users),
                'avg_orchard_area': [0.0] * len(df_users),
                'total_plants': [0] * len(df_users),
                'avg_plants_per_orchard': [0.0] * len(df_users),
                'avg_orchard_age_days': [0.0] * len(df_users),
                'has_orchards': [False] * len(df_users)
            }, index=df_users.index)

        # Agregar por userId
        aggregated = []

        for idx, user in df_users.iterrows():
            user_id = user.get('id') or user.get('_id')
            user_orchards = df_orchards[df_orchards['userId'] == user_id]

            if len(user_orchards) == 0:
                aggregated.append({
                    'count_orchards': 0,
                    'avg_orchard_area': 0.0,
                    'total_plants': 0,
                    'avg_plants_per_orchard': 0.0,
                    'avg_orchard_age_days': 0.0,
                    'has_orchards': False
                })
            else:
                # Calcular edad promedio de huertos
                now = datetime.now()
                ages = []
                for _, orchard in user_orchards.iterrows():
                    created = orchard.get('createAt')
                    if created:
                        if isinstance(created, str):
                            created = datetime.fromisoformat(created.replace('Z', '+00:00'))
                        age_days = (now - created).days
                        ages.append(age_days)

                avg_age = np.mean(ages) if ages else 0.0

                aggregated.append({
                    'count_orchards': len(user_orchards),
                    'avg_orchard_area': user_orchards['area'].mean() if 'area' in user_orchards.columns else 0.0,
                    'total_plants': user_orchards['countPlants'].sum() if 'countPlants' in user_orchards.columns else 0,
                    'avg_plants_per_orchard': user_orchards['countPlants'].mean() if 'countPlants' in user_orchards.columns else 0.0,
                    'avg_orchard_age_days': avg_age,
                    'has_orchards': True
                })

        return pd.DataFrame(aggregated, index=df_users.index)

    def _extract_numerical_features(self, df: pd.DataFrame) -> np.ndarray:
        """Extrae y normaliza features numéricas."""
        numerical_cols = [
            'experience_level',
            'count_orchards',
            'avg_orchard_area',
            'total_plants',
            'avg_plants_per_orchard',
            'avg_orchard_age_days'
        ]

        # Features derivadas
        df['has_profile_image'] = df['profile_image'].notna().astype(int) if 'profile_image' in df.columns else 0
        df['has_fcm_token'] = df['tokenFCM'].notna().astype(int) if 'tokenFCM' in df.columns else 0
        df['is_verified_int'] = df['is_verified'].astype(int) if 'is_verified' in df.columns else 0

        # Calcular account age
        if 'createdAt' in df.columns:
            now = datetime.now()
            df['account_age_days'] = df['createdAt'].apply(lambda x: (now - pd.to_datetime(x)).days if pd.notna(x) else 0)
        else:
            df['account_age_days'] = 0

        # Preferencias de categorías (count)
        if 'preferred_plant_category' in df.columns:
            df['count_preferred_categories'] = df['preferred_plant_category'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            )
        else:
            df['count_preferred_categories'] = 0

        # Favorite plants count
        if 'favorite_plants' in df.columns:
            df['count_favorite_plants'] = df['favorite_plants'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            )
        else:
            df['count_favorite_plants'] = 0

        numerical_cols.extend([
            'has_profile_image',
            'has_fcm_token',
            'is_verified_int',
            'account_age_days',
            'count_preferred_categories',
            'count_favorite_plants'
        ])

        # Extraer valores
        X_num = df[numerical_cols].fillna(0).values.astype(float)

        # Normalizar
        X_num_scaled = self.scaler.fit_transform(X_num)

        self.feature_names = numerical_cols

        return X_num_scaled

    def _extract_categorical_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, List[int]]:
        """Extrae y codifica features categóricas."""
        categorical_features = []
        cat_indices = []

        # Categoría de planta más preferida (si tiene preferencias)
        if 'preferred_plant_category' in df.columns:
            df['main_preferred_category'] = df['preferred_plant_category'].apply(
                lambda x: x[0] if isinstance(x, list) and len(x) > 0 else 'none'
            )

            if 'main_preferred_category' not in self.label_encoders:
                self.label_encoders['main_preferred_category'] = LabelEncoder()

            encoded = self.label_encoders['main_preferred_category'].fit_transform(
                df['main_preferred_category'].fillna('none')
            )
            categorical_features.append(encoded.reshape(-1, 1))
            cat_indices.append(len(self.feature_names) + len(cat_indices))

        # Nivel de engagement (basado en orchards y actividad)
        df['engagement_level'] = df.apply(lambda row: self._calculate_engagement_level(row), axis=1)

        if 'engagement_level' not in self.label_encoders:
            self.label_encoders['engagement_level'] = LabelEncoder()

        encoded = self.label_encoders['engagement_level'].fit_transform(df['engagement_level'])
        categorical_features.append(encoded.reshape(-1, 1))
        cat_indices.append(len(self.feature_names) + len(cat_indices))

        if not categorical_features:
            # Si no hay features categóricas, retornar array vacío
            return np.zeros((len(df), 0)), []

        X_cat = np.hstack(categorical_features)
        return X_cat, cat_indices

    def _calculate_engagement_level(self, row: pd.Series) -> str:
        """Calcula nivel de engagement del usuario."""
        orchards = row.get('count_orchards', 0)
        is_verified = row.get('is_verified', False)
        has_preferences = row.get('count_preferred_categories', 0) > 0

        if orchards >= 3 and is_verified and has_preferences:
            return 'high'
        elif orchards >= 1 and (is_verified or has_preferences):
            return 'medium'
        else:
            return 'low'

    def transform(self, users: List[Dict], orchards: List[Dict]) -> np.ndarray:
        """
        Transforma nuevos datos usando los encoders ya entrenados.

        Args:
            users: Lista de usuarios
            orchards: Lista de huertos

        Returns:
            Features transformadas
        """
        # Crear DataFrame
        df_users = pd.DataFrame(users)
        df_orchards = pd.DataFrame(orchards) if orchards else pd.DataFrame()

        # Agregar features de orchards
        orchard_features = self._aggregate_orchard_features(df_users, df_orchards)
        df_features = pd.concat([df_users, orchard_features], axis=1)

        # Extraer features numéricas (sin fit)
        X_num = self._extract_numerical_features_transform(df_features)

        # Extraer features categóricas (sin fit)
        X_cat = self._extract_categorical_features_transform(df_features)

        # Combinar
        return np.hstack([X_num, X_cat])

    def _extract_numerical_features_transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transforma features numéricas sin fit."""
        # Aplicar las mismas transformaciones que en extract
        df['has_profile_image'] = df['profile_image'].notna().astype(int) if 'profile_image' in df.columns else 0
        df['has_fcm_token'] = df['tokenFCM'].notna().astype(int) if 'tokenFCM' in df.columns else 0
        df['is_verified_int'] = df['is_verified'].astype(int) if 'is_verified' in df.columns else 0

        if 'createdAt' in df.columns:
            now = datetime.now()
            df['account_age_days'] = df['createdAt'].apply(lambda x: (now - pd.to_datetime(x)).days if pd.notna(x) else 0)
        else:
            df['account_age_days'] = 0

        if 'preferred_plant_category' in df.columns:
            df['count_preferred_categories'] = df['preferred_plant_category'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            )
        else:
            df['count_preferred_categories'] = 0

        if 'favorite_plants' in df.columns:
            df['count_favorite_plants'] = df['favorite_plants'].apply(
                lambda x: len(x) if isinstance(x, list) else 0
            )
        else:
            df['count_favorite_plants'] = 0

        X_num = df[self.feature_names].fillna(0).values.astype(float)
        return self.scaler.transform(X_num)

    def _extract_categorical_features_transform(self, df: pd.DataFrame) -> np.ndarray:
        """Transforma features categóricas sin fit."""
        categorical_features = []

        if 'preferred_plant_category' in df.columns:
            df['main_preferred_category'] = df['preferred_plant_category'].apply(
                lambda x: x[0] if isinstance(x, list) and len(x) > 0 else 'none'
            )
            encoded = self.label_encoders['main_preferred_category'].transform(
                df['main_preferred_category'].fillna('none')
            )
            categorical_features.append(encoded.reshape(-1, 1))

        df['engagement_level'] = df.apply(lambda row: self._calculate_engagement_level(row), axis=1)
        encoded = self.label_encoders['engagement_level'].transform(df['engagement_level'])
        categorical_features.append(encoded.reshape(-1, 1))

        if not categorical_features:
            return np.zeros((len(df), 0))

        return np.hstack(categorical_features)
