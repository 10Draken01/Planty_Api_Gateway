"""
Interfaz IPlantRepository - Contrato para acceso a datos de plantas.
"""
from abc import ABC, abstractmethod
from typing import List, Optional
from src.domain.entities.Plant import Plant


class IPlantRepository(ABC):
    """
    Interfaz que define el contrato para el repositorio de plantas.
    Separa la lógica de dominio de la infraestructura de persistencia.
    """

    @abstractmethod
    async def get_all(self) -> List[Plant]:
        """
        Obtiene todas las plantas disponibles.

        Returns:
            Lista de todas las plantas
        """
        pass

    @abstractmethod
    async def get_by_id(self, plant_id: int) -> Optional[Plant]:
        """
        Busca una planta por su ID.

        Args:
            plant_id: ID de la planta (1-50)

        Returns:
            Planta encontrada o None
        """
        pass

    @abstractmethod
    async def get_by_type(self, plant_type: str) -> List[Plant]:
        """
        Filtra plantas por tipo.

        Args:
            plant_type: Tipo de planta (vegetable, medicinal, aromatic, ornamental)

        Returns:
            Lista de plantas del tipo especificado
        """
        pass

    @abstractmethod
    async def get_by_species(self, species: str) -> Optional[Plant]:
        """
        Busca una planta por su especie.

        Args:
            species: Nombre de la especie (ej: "Cilantro")

        Returns:
            Planta encontrada o None
        """
        pass

    @abstractmethod
    async def count(self) -> int:
        """
        Cuenta el número total de plantas.

        Returns:
            Número total de plantas
        """
        pass
