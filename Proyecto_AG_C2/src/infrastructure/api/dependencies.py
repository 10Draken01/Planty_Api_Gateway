"""
FastAPI Dependencies.
Centralized dependency injection for controllers and routes.
"""
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository
from src.infrastructure.database.MongoConnection import MongoConnection
from src.infrastructure.database.MongoPlantRepository import MongoPlantRepository
from src.infrastructure.database.MongoCompatibilityRepository import MongoCompatibilityRepository


async def get_plant_repository() -> IPlantRepository:
    """
    Dependency injection for Plant Repository.

    Returns:
        IPlantRepository implementation (MongoPlantRepository)
    """
    database = await MongoConnection.get_database()
    return MongoPlantRepository(database)


async def get_compatibility_repository() -> ICompatibilityRepository:
    """
    Dependency injection for Compatibility Repository.

    Returns:
        ICompatibilityRepository implementation (MongoCompatibilityRepository)
    """
    database = await MongoConnection.get_database()
    return MongoCompatibilityRepository(database)
