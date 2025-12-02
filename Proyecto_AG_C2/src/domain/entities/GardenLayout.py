"""
Entidad GardenLayout - Representa un diseño de huerto (individuo del AG).
"""
from dataclasses import dataclass, field
from typing import List, Dict, Optional
import random
from src.domain.entities.Plant import Plant


@dataclass
class GardenLayout:
    """
    Representa un diseño de huerto urbano (individuo en el algoritmo genético).
    Contiene una matriz de plantas y métricas de fitness.
    """
    width: float  # Ancho del huerto en metros
    height: float  # Alto del huerto en metros
    layout: List[List[Optional[int]]]  # Matriz con IDs de plantas (None = vacío)
    fitness: float = 0.0

    # Métricas individuales
    cee: float = 0.0  # Compatibilidad Entre Especies
    psntpa: float = 0.0  # Porcentaje Satisfacción Nutricional/Terapéutico
    wce: float = 0.0  # Water Consumption Efficiency (Eficiencia Hídrica)
    ue: float = 0.0  # Utilización de Espacio

    def __post_init__(self):
        """Validaciones de dominio"""
        if self.width <= 0 or self.height <= 0:
            raise ValueError("Las dimensiones del huerto deben ser positivas")

        area = self.width * self.height
        if area < 1.0 or area > 5.0:
            raise ValueError(f"El área del huerto debe estar entre 1 y 5 m², actual: {area:.2f}m²")

    def get_area(self) -> float:
        """Retorna el área total del huerto en m²"""
        return self.width * self.height

    def get_plant_ids(self) -> List[int]:
        """
        Retorna lista de IDs únicos de plantas en el huerto.

        Returns:
            Lista de IDs de plantas (sin duplicados, sin None)
        """
        plant_ids = set()
        for row in self.layout:
            for cell in row:
                if cell is not None:
                    plant_ids.add(cell)
        return list(plant_ids)

    def count_plant(self, plant_id: int) -> int:
        """
        Cuenta cuántas veces aparece una planta en el layout.

        Args:
            plant_id: ID de la planta a contar

        Returns:
            Número de ocurrencias
        """
        count = 0
        for row in self.layout:
            for cell in row:
                if cell == plant_id:
                    count += 1
        return count

    def get_total_plants(self) -> int:
        """Retorna el número total de plantas en el huerto"""
        total = 0
        for row in self.layout:
            for cell in row:
                if cell is not None:
                    total += 1
        return total

    def clone(self) -> 'GardenLayout':
        """
        Crea una copia profunda del layout.

        Returns:
            Nueva instancia de GardenLayout con los mismos datos
        """
        import copy
        new_layout = [row[:] for row in self.layout]  # Copia profunda de la matriz
        return GardenLayout(
            width=self.width,
            height=self.height,
            layout=new_layout,
            fitness=self.fitness,
            cee=self.cee,
            psntpa=self.psntpa,
            wce=self.wce,
            ue=self.ue
        )
