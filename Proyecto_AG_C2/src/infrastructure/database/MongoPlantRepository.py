"""
Implementación del repositorio de plantas con MongoDB.
"""
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase
from src.domain.entities.Plant import Plant
from src.domain.repositories.IPlantRepository import IPlantRepository


class MongoPlantRepository(IPlantRepository):
    """
    Implementación concreta del repositorio de plantas usando MongoDB.
    """

    def __init__(self, database: AsyncIOMotorDatabase):
        self.database = database
        self.collection = database["Plants"]

    async def get_all(self) -> List[Plant]:
        """Obtiene todas las plantas"""
        cursor = self.collection.find({})
        plants_data = await cursor.to_list(length=None)

        plants = []
        for data in plants_data:
            try:
                plant = self._map_to_entity(data)
                plants.append(plant)
            except Exception as e:
                print(f"Error al mapear planta {data.get('id', 'unknown')}: {e}")
                continue

        return plants

    async def get_by_id(self, plant_id: int) -> Optional[Plant]:
        """Busca planta por ID"""
        data = await self.collection.find_one({"id": plant_id})
        if data:
            return self._map_to_entity(data)
        return None

    async def get_by_type(self, plant_type: str) -> List[Plant]:
        """Filtra plantas por tipo"""
        cursor = self.collection.find({"type": plant_type})
        plants_data = await cursor.to_list(length=None)

        return [self._map_to_entity(data) for data in plants_data]

    async def get_by_species(self, species: str) -> Optional[Plant]:
        """Busca planta por especie"""
        data = await self.collection.find_one({"species": species})
        if data:
            return self._map_to_entity(data)
        return None

    async def count(self) -> int:
        """Cuenta plantas"""
        return await self.collection.count_documents({})

    def _map_to_entity(self, data: dict) -> Plant:
        """
        Mapea documento de MongoDB a entidad Plant.

        Args:
            data: Documento de MongoDB

        Returns:
            Entidad Plant
        """
        return Plant(
            id=data["id"],
            species=data["species"],
            scientific_name=data["scientificName"],
            type=data["type"],
            sun_requirement=data["sunRequirement"],
            weekly_watering=float(data["weeklyWatering"]),
            harvest_days=data["harvestDays"],
            soil_type=data["soilType"],
            water_per_kg=float(data["waterPerKg"]),
            benefits=data["benefits"],
            size=float(data["size"])
        )
