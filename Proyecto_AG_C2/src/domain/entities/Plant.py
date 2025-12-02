"""
Entidad Plant - Representa una planta en el dominio.
"""
from dataclasses import dataclass
from typing import List, Literal


@dataclass(frozen=True)
class Plant:
    """
    Entidad inmutable que representa una planta disponible para el huerto.
    """
    id: int
    species: str
    scientific_name: str
    type: List[Literal["vegetable", "medicinal", "aromatic", "ornamental"]]
    sun_requirement: Literal["high", "medium", "low"]
    weekly_watering: float  # Litros por semana
    harvest_days: int  # Días hasta la cosecha
    soil_type: str
    water_per_kg: float  # Litros de agua necesarios por kg de producción
    benefits: List[str]
    size: float  # Tamaño en m²

    def __post_init__(self):
        """Validaciones de dominio"""
        if self.id < 1 or self.id > 50:
            raise ValueError(f"Plant ID debe estar entre 1 y 50, recibido: {self.id}")
        if self.size <= 0:
            raise ValueError(f"El tamaño debe ser positivo, recibido: {self.size}")
        if self.weekly_watering < 0:
            raise ValueError(f"El riego semanal no puede ser negativo: {self.weekly_watering}")
        if self.harvest_days <= 0:
            raise ValueError(f"Los días de cosecha deben ser positivos: {self.harvest_days}")

    def is_compatible_with(self, compatibility_value: float) -> bool:
        """
        Verifica si la planta es compatible con otra basándose en el valor de compatibilidad.

        Args:
            compatibility_value: Valor entre -1 y 1

        Returns:
            True si la compatibilidad es positiva (> 0)
        """
        return compatibility_value > 0

    def has_type(self, plant_type: str) -> bool:
        """
        Verifica si la planta pertenece a un tipo específico.

        Args:
            plant_type: Tipo a verificar (vegetable, medicinal, aromatic, ornamental)

        Returns:
            True si la planta es de ese tipo
        """
        return plant_type in self.type

    def get_production_per_cycle(self) -> float:
        """
        Estima la producción por ciclo basándose en datos promedio.
        Plantas más grandes y con ciclos más largos producen más.

        Returns:
            Producción estimada en kg por ciclo
        """
        # Fórmula heurística basada en el tamaño y días de cosecha
        base_production = self.size * 10  # Base: 10 kg/m²
        time_factor = min(self.harvest_days / 100, 1.5)  # Factor de tiempo (max 1.5x)
        return base_production * time_factor
