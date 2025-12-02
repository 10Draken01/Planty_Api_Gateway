"""
Health Check Controller.
Handles health check endpoint logic.
"""
from typing import Dict, Any
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository
from src.infrastructure.database.MongoConnection import MongoConnection


class HealthController:
    """
    Controller for health check operations.
    """

    @staticmethod
    async def check_health(
        plant_repo: IPlantRepository,
        compat_repo: ICompatibilityRepository
    ) -> Dict[str, Any]:
        """
        Perform health check on the service.

        Args:
            plant_repo: Plant repository instance
            compat_repo: Compatibility repository instance

        Returns:
            Health status dictionary

        Raises:
            Exception: If MongoDB is not available or other errors occur
        """
        # Verify MongoDB connection
        is_connected = await MongoConnection.health_check()

        if not is_connected:
            raise Exception("MongoDB no disponible")

        # Verify data availability
        plant_count = await plant_repo.count()
        compat_count = await compat_repo.count_pairs()

        return {
            "status": "healthy",
            "service": "PlantGen API",
            "version": "1.0.0",
            "database": "connected",
            "plants_count": plant_count,
            "compatibility_pairs_count": compat_count
        }
