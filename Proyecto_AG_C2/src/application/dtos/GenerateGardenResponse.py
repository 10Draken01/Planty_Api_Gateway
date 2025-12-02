"""
DTO para la respuesta de generación de huerto.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Any


class PlantInGardenDTO(BaseModel):
    """Información de una planta en el huerto"""
    id: int
    species: str
    scientific_name: str
    type: List[str]
    count: int = Field(description="Cantidad de plantas de esta especie")
    total_area: float = Field(description="Área total ocupada por esta especie (m²)")
    total_water: float = Field(description="Agua total requerida (L/semana)")


class GardenSolutionDTO(BaseModel):
    """Una solución de huerto optimizada"""
    rank: int = Field(description="Ranking (1=mejor, 2=segundo, 3=tercero)")

    # Layout
    layout: List[List[Optional[int]]] = Field(
        description="Matriz con IDs de plantas (null = vacío)"
    )
    width: float = Field(description="Ancho del huerto en metros")
    height: float = Field(description="Alto del huerto en metros")

    # Métricas de fitness
    fitness: float = Field(description="Puntaje de aptitud global (0-1)")
    cee: float = Field(description="Compatibilidad Entre Especies (0-1)")
    psntpa: float = Field(description="Satisfacción Nutricional/Terapéutica (0-1)")
    wce: float = Field(description="Eficiencia Hídrica (0-1)")
    ue: float = Field(description="Utilización de Espacio (0-1)")

    # Información agregada
    plants: List[PlantInGardenDTO] = Field(description="Plantas en el huerto")
    total_plants: int = Field(description="Número total de plantas")
    total_water_weekly: float = Field(description="Agua total requerida (L/semana)")
    total_area_used: float = Field(description="Área total utilizada (m²)")
    total_cost: float = Field(description="Costo total estimado (MXN)")
    estimated_production_monthly: float = Field(description="Producción estimada (kg/mes)")

    # Calendario de siembra
    planting_calendar: List[dict] = Field(
        description="Calendario de siembra recomendado"
    )


class GenerateGardenResponse(BaseModel):
    """
    DTO para la respuesta del endpoint POST /generate.
    Contiene las top 3 configuraciones de huerto.
    """
    success: bool = Field(description="Indica si la operación fue exitosa")
    message: str = Field(description="Mensaje descriptivo")

    solutions: List[GardenSolutionDTO] = Field(
        default=[],
        description="Top 3 mejores configuraciones de huerto"
    )

    # Metadata del proceso
    generations_executed: int = Field(description="Generaciones ejecutadas del AG")
    convergence_reason: str = Field(description="Razón de convergencia")
    execution_time_seconds: float = Field(description="Tiempo de ejecución en segundos")

    # Parámetros utilizados
    parameters_used: dict = Field(description="Parámetros utilizados en la generación")

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "message": "Huertos generados exitosamente",
                "solutions": [
                    {
                        "rank": 1,
                        "fitness": 0.87,
                        "cee": 0.85,
                        "psntpa": 0.90,
                        "wce": 0.78,
                        "ue": 0.82,
                        "total_plants": 12,
                        "total_water_weekly": 145.5,
                        "total_cost": 380.0,
                        "estimated_production_monthly": 10.5
                    }
                ],
                "generations_executed": 87,
                "convergence_reason": "Sin mejora en 20 generaciones",
                "execution_time_seconds": 2.34
            }
        }
