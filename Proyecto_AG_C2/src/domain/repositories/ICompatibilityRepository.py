"""
Interfaz ICompatibilityRepository - Contrato para matriz de compatibilidad.
"""
from abc import ABC, abstractmethod
from typing import Optional, Dict
from src.domain.entities.CompatibilityPair import CompatibilityPair


class ICompatibilityRepository(ABC):
    """
    Interfaz para el repositorio de compatibilidad entre especies.
    """

    @abstractmethod
    async def get_compatibility(self, plant1: str, plant2: str) -> Optional[float]:
        """
        Obtiene el valor de compatibilidad entre dos especies.

        Args:
            plant1: Nombre de la primera especie
            plant2: Nombre de la segunda especie

        Returns:
            Valor de compatibilidad entre -1 y 1, o None si no existe
        """
        pass

    @abstractmethod
    async def get_all_compatibilities_for_plant(self, plant: str) -> Dict[str, float]:
        """
        Obtiene todas las compatibilidades de una planta con las demás.

        Args:
            plant: Nombre de la especie

        Returns:
            Diccionario con pares {especie: compatibilidad}
        """
        pass

    @abstractmethod
    async def get_all_pairs(self) -> list[CompatibilityPair]:
        """
        Obtiene todos los pares de compatibilidad.

        Returns:
            Lista de todos los pares de compatibilidad
        """
        pass

    @abstractmethod
    async def count_pairs(self) -> int:
        """
        Cuenta el número total de pares de compatibilidad.

        Returns:
            Número total de pares
        """
        pass
