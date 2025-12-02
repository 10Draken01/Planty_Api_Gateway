"""
DTO para la solicitud de generación de huerto.
"""
from pydantic import BaseModel, Field
from typing import Literal, Optional


class GenerateGardenRequest(BaseModel):
    """
    DTO para el endpoint POST /generate.
    Define los parámetros de entrada del usuario.
    Todos los campos son opcionales con valores por defecto.
    """
    objective: Optional[Literal["alimenticio", "medicinal", "sostenible", "ornamental"]] = Field(
        default="alimenticio",
        description="Objetivo principal del huerto"
    )

    area: Optional[float] = Field(
        default=2.0,
        ge=1.0,
        le=5.0,
        description="Área disponible en m² (1-5 m² para Suchiapas)"
    )

    max_water: Optional[float] = Field(
        default=150.0,
        ge=80.0,
        le=200.0,
        description="Agua máxima disponible en litros/semana (80-200L clima Af)"
    )

    budget: Optional[float] = Field(
        default=400.0,
        ge=200.0,
        le=800.0,
        description="Presupuesto disponible en MXN (200-800 MXN)"
    )

    maintenance_time: Optional[int] = Field(
        default=90,
        ge=30,
        le=300,
        description="Tiempo de mantenimiento disponible en minutos/semana"
    )

    # Parámetros opcionales del AG
    population_size: Optional[int] = Field(
        default=40,
        ge=10,
        le=100,
        description="Tamaño de la población del algoritmo genético"
    )

    max_generations: Optional[int] = Field(
        default=150,
        ge=50,
        le=500,
        description="Número máximo de generaciones"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "objective": "alimenticio",
                "area": 2.0,
                "max_water": 150.0,
                "budget": 400.0,
                "maintenance_time": 90,
                "population_size": 40,
                "max_generations": 150
            }
        }
