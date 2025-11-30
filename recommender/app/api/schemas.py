"""Schemas Pydantic para la API."""
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime


class TrainingResponse(BaseModel):
    success: bool
    message: str
    n_clusters: int
    n_users_clustered: int
    silhouette_score: float
    trained_at: datetime


class TrainingStatus(BaseModel):
    model_exists: bool
    trained_at: Optional[datetime]
    n_clusters: Optional[int]
    metrics: Optional[Dict[str, float]]


class ClusterInfo(BaseModel):
    cluster_id: int
    size: int
    centroid_numeric: List[float]
    centroid_categorical: List[int]


class ClustersInfo(BaseModel):
    n_clusters: int
    clusters: List[ClusterInfo]
    total_users: int


class OrchardRecommendation(BaseModel):
    orchardId: str
    name: str
    shortDescription: str
    estimatedWeeklyWater: float
    maintenanceMinutes: int
    fitness: float
    score: float


class RecommendationsResponse(BaseModel):
    userId: str
    clusterIdAssigned: int
    recommendations: List[OrchardRecommendation]
    generatedAt: datetime


class UserRegisteredWebhook(BaseModel):
    userId: str
