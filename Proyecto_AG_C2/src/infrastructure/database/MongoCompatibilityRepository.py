"""
Implementación del repositorio de compatibilidad con MongoDB.
"""
from typing import Optional, Dict, List
from motor.motor_asyncio import AsyncIOMotorDatabase
from src.domain.entities.CompatibilityPair import CompatibilityPair
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository


class MongoCompatibilityRepository(ICompatibilityRepository):
    """
    Implementación del repositorio de compatibilidad usando MongoDB.
    Los documentos tienen formato: {plant1: str, plant2: str, compatibility: float}
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database["Matriz"]

    async def get_compatibility(self, plant1: str, plant2: str) -> Optional[float]:
        """Obtiene compatibilidad entre dos plantas"""
        # Buscar en ambas direcciones (simetría)
        data = await self.collection.find_one({
            "$or": [
                {"plant1": plant1, "plant2": plant2},
                {"plant1": plant2, "plant2": plant1}
            ]
        })

        if data:
            return float(data["compatibility"])
        return None

    async def get_all_compatibilities_for_plant(self, plant: str) -> Dict[str, float]:
        """Obtiene todas las compatibilidades de una planta"""
        cursor = self.collection.find({
            "$or": [
                {"plant1": plant},
                {"plant2": plant}
            ]
        })

        compatibilities = {}
        async for data in cursor:
            other_plant = data["plant2"] if data["plant1"] == plant else data["plant1"]
            compatibilities[other_plant] = float(data["compatibility"])

        return compatibilities

    async def get_all_pairs(self) -> List[CompatibilityPair]:
        """Obtiene todos los pares de compatibilidad"""
        cursor = self.collection.find({})
        pairs = []

        async for data in cursor:
            pair = CompatibilityPair(
                plant1=data["plant1"],
                plant2=data["plant2"],
                compatibility=float(data["compatibility"])
            )
            pairs.append(pair)

        return pairs

    async def count_pairs(self) -> int:
        """Cuenta pares de compatibilidad"""
        return await self.collection.count_documents({})
