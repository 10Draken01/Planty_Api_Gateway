"""
Garden Generation Controller.
Handles garden generation endpoint logic.
"""
from src.application.dtos.GenerateGardenRequest import GenerateGardenRequest
from src.application.dtos.GenerateGardenResponse import GenerateGardenResponse
from src.application.use_cases.GenerateGardenUseCase import GenerateGardenUseCase
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository


class GardenController:
    """
    Controller for garden generation operations.
    """

    @staticmethod
    async def generate_garden(
        request: GenerateGardenRequest,
        plant_repo: IPlantRepository,
        compat_repo: ICompatibilityRepository
    ) -> GenerateGardenResponse:
        """
        Generate optimized garden configurations using genetic algorithm.

        Args:
            request: Garden generation request with user parameters
            plant_repo: Plant repository instance
            compat_repo: Compatibility repository instance

        Returns:
            Garden generation response with top 3 configurations

        Raises:
            Exception: If generation fails
        """
        # Execute use case
        use_case = GenerateGardenUseCase(plant_repo, compat_repo)
        response = await use_case.execute(request)

        if not response.success:
            raise Exception(response.message)

        return response
