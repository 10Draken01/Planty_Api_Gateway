"""Schemas Pydantic para API v2."""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime


# ============== TRAINING SCHEMAS ==============

class TrainModelRequest(BaseModel):
    """Request para entrenar modelo."""
    training_date: Optional[str] = Field(
        None,
        description="Fecha de entrenamiento en formato YYYY-MM-DD. Si no se proporciona, usa fecha actual."
    )


class TrainModelResponse(BaseModel):
    """Response del entrenamiento."""
    success: bool
    model_file: str
    algorithm: str
    n_clusters: int
    silhouette_score: float
    n_users_trained: int
    n_orchards: int
    training_date: str
    data_range: Dict[str, str]


class TrainingHistoryResponse(BaseModel):
    """Response del historial de entrenamientos."""
    success: bool
    history: List[Dict[str, Any]]
    total: int


# ============== RECOMMENDATION SCHEMAS ==============

class OrchardRecommendation(BaseModel):
    """Schema para una recomendación de huerto."""
    orchard_id: str
    name: str
    description: str
    area: float
    countPlants: int
    score: float
    area_similarity: Optional[float] = None
    plants_similarity: Optional[float] = None
    popularity_score: Optional[float] = None


class RecommendationsResponse(BaseModel):
    """Response de recomendaciones."""
    success: bool
    user_id: str
    cluster_id: int
    recommendations: List[OrchardRecommendation]
    total_candidates: Optional[int] = None
    message: str


# ============== TEST SCHEMAS ==============

class TestRecommendationResponse(BaseModel):
    """Response completa del endpoint de prueba."""
    success: bool
    user: Dict[str, Any]
    current_orchards: List[Dict[str, Any]]
    recommended_orchards: List[OrchardRecommendation]
    chatbot_messages: Dict[str, str]
    cluster_id: int
    generated_at: str


# ============== MODEL STATUS SCHEMAS ==============

class ModelStatusResponse(BaseModel):
    """Response del estado del modelo."""
    success: bool
    model_loaded: bool
    model_file: Optional[str] = None
    algorithm: Optional[str] = None
    n_clusters: Optional[int] = None
    training_date: Optional[str] = None
    n_users: Optional[int] = None


class ListModelsResponse(BaseModel):
    """Response de lista de modelos disponibles."""
    success: bool
    models: List[Dict[str, Any]]
    total: int


# ============== ERROR SCHEMAS ==============

class ErrorResponse(BaseModel):
    """Schema para errores."""
    success: bool = False
    error: str
    detail: Optional[str] = None
