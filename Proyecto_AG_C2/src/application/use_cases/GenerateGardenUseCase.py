"""
Caso de Uso: Generar Configuraciones de Huerto.
Orquesta el algoritmo genético y transforma resultados.
"""
import time
from typing import List
from src.application.dtos.GenerateGardenRequest import GenerateGardenRequest
from src.application.dtos.GenerateGardenResponse import (
    GenerateGardenResponse,
    GardenSolutionDTO,
    PlantInGardenDTO
)
from src.domain.entities.GardenLayout import GardenLayout
from src.domain.entities.Plant import Plant
from src.domain.value_objects.GardenObjective import GardenObjective
from src.domain.value_objects.GardenConstraints import GardenConstraints
from src.domain.services.GeneticAlgorithm import GeneticAlgorithm
from src.domain.repositories.IPlantRepository import IPlantRepository
from src.domain.repositories.ICompatibilityRepository import ICompatibilityRepository


class GenerateGardenUseCase:
    """
    Caso de uso para generar configuraciones de huerto usando AG.
    """

    def __init__(
        self,
        plant_repository: IPlantRepository,
        compatibility_repository: ICompatibilityRepository
    ):
        self.plant_repository = plant_repository
        self.compatibility_repository = compatibility_repository

    async def execute(self, request: GenerateGardenRequest) -> GenerateGardenResponse:
        """
        Ejecuta el caso de uso de generación de huerto.

        Args:
            request: Parámetros de entrada del usuario

        Returns:
            Respuesta con top 3 configuraciones
        """
        try:
            start_time = time.time()

            # 1. Obtener datos del repositorio
            plants = await self.plant_repository.get_all()
            compatibility_matrix = await self._build_compatibility_matrix()

            if not plants:
                return GenerateGardenResponse(
                    success=False,
                    message="No se encontraron plantas en la base de datos",
                    solutions=[],
                    generations_executed=0,
                    convergence_reason="Error: Sin datos",
                    execution_time_seconds=0.0,
                    parameters_used={}
                )

            # 2. Crear objetos de dominio
            objective = GardenObjective(objective_type=request.objective)
            constraints = GardenConstraints(
                max_area=request.area,
                max_water_weekly=request.max_water,
                max_budget=request.budget,
                maintenance_time_weekly=request.maintenance_time
            )

            # 3. Inicializar y ejecutar AG
            import logging
            logger = logging.getLogger("plantgen.usecase")
            logger.info(f"🔬 Ejecutando AG con {len(plants)} plantas")
            logger.info(f"🔬 Parámetros - area={request.area}, water={request.max_water}, budget={request.budget}")

            ga = GeneticAlgorithm(
                plants=plants,
                compatibility_matrix=compatibility_matrix,
                objective=objective,
                constraints=constraints,
                population_size=request.population_size,
                max_generations=request.max_generations
            )


            logger.info(f"🔬 AG inicializado, ejecutando run()...")
            top_3_layouts = ga.run()
            logger.info(f"🔬 AG completado. Soluciones encontradas: {len(top_3_layouts) if top_3_layouts else 0}")

            # Validar que se generaron soluciones
            if not top_3_layouts or len(top_3_layouts) == 0:
                return GenerateGardenResponse(
                    success=False,
                    message="No se pudieron generar soluciones válidas con los parámetros proporcionados. Intenta con restricciones más flexibles (mayor área, presupuesto o agua).",
                    solutions=[],
                    generations_executed=len(ga.generation_stats) if hasattr(ga, 'generation_stats') else 0,
                    convergence_reason="Error: Población vacía - restricciones muy estrictas",
                    execution_time_seconds=0.0,
                    parameters_used={
                        "objective": request.objective,
                        "area": request.area,
                        "max_water": request.max_water,
                        "budget": request.budget,
                        "population_size": request.population_size,
                        "max_generations": request.max_generations
                    }
                )

            # 4. Transformar resultados a DTOs
            solutions = []
            for rank, layout in enumerate(top_3_layouts, start=1):
                solution_dto = await self._layout_to_dto(layout, rank, plants)
                solutions.append(solution_dto)

            # 5. Determinar razón de convergencia
            convergence_reason = self._get_convergence_reason(ga)

            end_time = time.time()
            execution_time = end_time - start_time

            return GenerateGardenResponse(
                success=True,
                message=f"Se generaron {len(solutions)} configuraciones de huerto exitosamente",
                solutions=solutions,
                generations_executed=len(ga.generation_stats),
                convergence_reason=convergence_reason,
                execution_time_seconds=round(execution_time, 2),
                parameters_used={
                    "objective": request.objective,
                    "area": request.area,
                    "max_water": request.max_water,
                    "budget": request.budget,
                    "population_size": request.population_size,
                    "max_generations": request.max_generations
                }
            )

        except Exception as e:
            return GenerateGardenResponse(
                success=False,
                message=f"Error al generar huerto: {str(e)}",
                solutions=[],
                generations_executed=0,
                convergence_reason=f"Error: {str(e)}",
                execution_time_seconds=0.0,
                parameters_used={}
            )

    async def _build_compatibility_matrix(self) -> dict:
        """
        Construye la matriz de compatibilidad desde el repositorio.

        Returns:
            Diccionario anidado {planta1: {planta2: compatibilidad}}
        """
        all_pairs = await self.compatibility_repository.get_all_pairs()

        matrix = {}
        for pair in all_pairs:
            if pair.plant1 not in matrix:
                matrix[pair.plant1] = {}
            matrix[pair.plant1][pair.plant2] = pair.compatibility

        return matrix

    async def _layout_to_dto(
        self,
        layout: GardenLayout,
        rank: int,
        plants: List[Plant]
    ) -> GardenSolutionDTO:
        """
        Convierte un GardenLayout a GardenSolutionDTO.
        """
        # Obtener plantas únicas en el huerto
        plant_ids = layout.get_plant_ids()
        plants_in_garden = []
        total_water = 0.0
        total_area = 0.0
        total_cost = 0.0
        total_production = 0.0

        for plant_id in plant_ids:
            plant = next((p for p in plants if p.id == plant_id), None)
            if not plant:
                continue

            count = layout.count_plant(plant_id)
            plant_area = plant.size * count
            plant_water = plant.weekly_watering * count
            plant_cost = plant.size * 50 * count  # 50 MXN por m²
            plant_production = plant.get_production_per_cycle() * count

            plants_in_garden.append(PlantInGardenDTO(
                id=plant.id,
                species=plant.species,
                scientific_name=plant.scientific_name,
                type=plant.type,
                count=count,
                total_area=round(plant_area, 2),
                total_water=round(plant_water, 2)
            ))

            total_water += plant_water
            total_area += plant_area
            total_cost += plant_cost
            total_production += plant_production

        # Generar calendario de siembra
        planting_calendar = self._generate_planting_calendar(plants_in_garden, plants)

        return GardenSolutionDTO(
            rank=rank,
            layout=layout.layout,
            width=round(layout.width, 2),
            height=round(layout.height, 2),
            fitness=round(layout.fitness, 3),
            cee=round(layout.cee, 3),
            psntpa=round(layout.psntpa, 3),
            wce=round(layout.wce, 3),
            ue=round(layout.ue, 3),
            plants=plants_in_garden,
            total_plants=layout.get_total_plants(),
            total_water_weekly=round(total_water, 2),
            total_area_used=round(total_area, 2),
            total_cost=round(total_cost, 2),
            estimated_production_monthly=round(total_production / 4, 2),  # kg/mes
            planting_calendar=planting_calendar
        )

    def _generate_planting_calendar(
        self,
        plants_in_garden: List[PlantInGardenDTO],
        all_plants: List[Plant]
    ) -> List[dict]:
        """
        Genera calendario de siembra basado en ciclos de cosecha.
        """
        calendar = []

        for plant_dto in plants_in_garden:
            plant = next((p for p in all_plants if p.id == plant_dto.id), None)
            if not plant:
                continue

            calendar.append({
                "species": plant.species,
                "planting_week": 0,  # Semana 0 = inicio
                "harvest_week": plant.harvest_days // 7,
                "harvest_days": plant.harvest_days,
                "maintenance": "Riego regular, control de plagas"
            })

        # Ordenar por tiempo de cosecha
        calendar.sort(key=lambda x: x["harvest_days"])

        return calendar

    def _get_convergence_reason(self, ga: GeneticAlgorithm) -> str:
        """Determina la razón de convergencia del AG"""
        if len(ga.generation_stats) >= ga.max_generations:
            return f"Alcanzó el máximo de {ga.max_generations} generaciones"

        if len(ga.generation_stats) > 0:
            last_stats = ga.generation_stats[-1]
            if 'diversity' in last_stats and last_stats['diversity'] < 0.001:
                return "Convergencia por baja varianza de fitness (< 0.001)"

        return f"Sin mejora en {ga.patience} generaciones consecutivas"
