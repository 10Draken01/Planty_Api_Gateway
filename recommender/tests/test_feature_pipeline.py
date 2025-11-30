"""Tests unitarios para FeaturePipeline."""
import pytest
import numpy as np
from datetime import datetime, timedelta

from app.services.feature_pipeline import FeaturePipeline


@pytest.fixture
def sample_user():
    """Usuario de ejemplo."""
    return {
        "_id": "user-123",
        "name": "Test User",
        "email": "test@example.com",
        "experience_level": 2,
        "tokenFCM": "token-abc",
        "profile_image": "https://example.com/avatar.jpg",
        "createdAt": datetime.now() - timedelta(days=365),
        "count_orchards": 2
    }


@pytest.fixture
def sample_orchards():
    """Orchards de ejemplo."""
    return [
        {
            "width": 2.0,
            "height": 1.5,
            "countPlants": 10,
            "timeOfLife": 180,
            "streakOfDays": 45,
            "layout": {
                "dimensions": {"totalArea": 3.0},
                "plants": [
                    {"type": ["vegetable"]},
                    {"type": ["aromatic", "medicinal"]}
                ],
                "categoryBreakdown": {
                    "vegetable": 50,
                    "medicinal": 20,
                    "aromatic": 20,
                    "ornamental": 10
                }
            },
            "estimations": {
                "weeklyWaterLiters": 120.5,
                "maintenanceMinutesPerWeek": 90
            },
            "objective": "alimenticio"
        }
    ]


def test_extract_user_features(sample_user, sample_orchards):
    """Test extracción de features de usuario."""
    pipeline = FeaturePipeline()
    features = pipeline.extract_user_features(sample_user, sample_orchards)

    # Verificar features de usuario
    assert features['experience_level'] == 2
    assert features['count_orchards'] == 2
    assert features['has_tokenFCM'] == 1
    assert features['profile_image_present'] == 1
    assert features['account_age_days'] >= 365

    # Verificar features agregadas
    assert features['avg_orchard_area'] == 3.0
    assert features['sum_weekly_water_liters'] == 120.5
    assert features['avg_maintenance_minutes'] == 90
    assert features['avg_count_plants'] == 10


def test_extract_user_features_no_orchards(sample_user):
    """Test con usuario sin orchards."""
    pipeline = FeaturePipeline()
    features = pipeline.extract_user_features(sample_user, [])

    # Verificar defaults
    assert features['avg_orchard_area'] == 0
    assert features['sum_weekly_water_liters'] == 0
    assert features['objective'] == 'alimenticio'


def test_fit_transform():
    """Test fit_transform del pipeline."""
    pipeline = FeaturePipeline()

    users_features = [
        {
            'experience_level': 1,
            'count_orchards': 1,
            'has_tokenFCM': 1,
            'profile_image_present': 0,
            'account_age_days': 100,
            'avg_orchard_area': 2.0,
            'sum_weekly_water_liters': 80,
            'avg_maintenance_minutes': 60,
            'avg_count_plants': 5,
            'avg_timeOfLife': 90,
            'avg_streak': 20,
            'avg_plant_diversity': 3,
            'pct_vegetable': 50,
            'pct_medicinal': 20,
            'pct_ornamental': 10,
            'pct_aromatic': 20,
            'objective': 'alimenticio',
            'latitude': 16.75,
            'longitude': -93.11
        }
    ] * 10  # 10 usuarios idénticos

    X_numeric, X_categorical = pipeline.fit_transform(users_features)

    assert X_numeric.shape[0] == 10
    assert X_categorical.shape[0] == 10
    assert pipeline.fitted


def test_transform_after_fit():
    """Test transform usando scaler ya ajustado."""
    pipeline = FeaturePipeline()

    users_features = [
        {
            'experience_level': 2,
            'count_orchards': 2,
            'has_tokenFCM': 1,
            'profile_image_present': 1,
            'account_age_days': 200,
            'avg_orchard_area': 3.0,
            'sum_weekly_water_liters': 100,
            'avg_maintenance_minutes': 75,
            'avg_count_plants': 8,
            'avg_timeOfLife': 120,
            'avg_streak': 30,
            'avg_plant_diversity': 4,
            'pct_vegetable': 40,
            'pct_medicinal': 30,
            'pct_ornamental': 15,
            'pct_aromatic': 15,
            'objective': 'medicinal',
            'latitude': 16.75,
            'longitude': -93.11
        }
    ] * 5

    # Fit
    pipeline.fit_transform(users_features)

    # Transform nuevo dato
    new_user_features = [users_features[0]]
    X_numeric_new, X_categorical_new = pipeline.transform(new_user_features)

    assert X_numeric_new.shape[0] == 1
    assert X_categorical_new.shape[0] == 1
