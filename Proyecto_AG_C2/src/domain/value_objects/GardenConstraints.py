"""
Value Object GardenConstraints - Restricciones del huerto.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class GardenConstraints:
    """
    Restricciones hard (inviolables) para el diseño del huerto.
    Basado en el documento LaTeX, sección "Restricciones Regionales".
    """
    max_area: float  # Área máxima disponible en m² (1-5 m² para Suchiapas)
    max_water_weekly: float  # Agua máxima semanal en litros (80-200 L)
    max_budget: float  # Presupuesto máximo en MXN (200-800 MXN)
    maintenance_time_weekly: int = 90  # Tiempo de mantenimiento en minutos/semana

    def __post_init__(self):
        """Validaciones de dominio"""
        if not 1.0 <= self.max_area <= 5.0:
            raise ValueError(
                f"El área debe estar entre 1 y 5 m² para huertos urbanos en Suchiapas. "
                f"Recibido: {self.max_area}m²"
            )
        if not 80.0 <= self.max_water_weekly <= 200.0:
            raise ValueError(
                f"El agua semanal debe estar entre 80 y 200 litros para clima Af. "
                f"Recibido: {self.max_water_weekly}L"
            )
        if not 200.0 <= self.max_budget <= 800.0:
            raise ValueError(
                f"El presupuesto debe estar entre 200 y 800 MXN. "
                f"Recibido: ${self.max_budget} MXN"
            )
        if self.maintenance_time_weekly < 30:
            raise ValueError(
                f"El tiempo de mantenimiento debe ser al menos 30 min/semana. "
                f"Recibido: {self.maintenance_time_weekly} min"
            )

    def is_area_valid(self, used_area: float) -> bool:
        """
        Verifica si el área utilizada cumple la restricción.

        Args:
            used_area: Área utilizada en m²

        Returns:
            True si cumple la restricción
        """
        return used_area <= self.max_area

    def is_water_valid(self, used_water: float) -> bool:
        """
        Verifica si el consumo de agua cumple la restricción.

        Args:
            used_water: Agua utilizada en litros/semana

        Returns:
            True si cumple la restricción
        """
        return used_water <= self.max_water_weekly

    def is_budget_valid(self, used_budget: float) -> bool:
        """
        Verifica si el presupuesto utilizado cumple la restricción.

        Args:
            used_budget: Presupuesto utilizado en MXN

        Returns:
            True si cumple la restricción
        """
        return used_budget <= self.max_budget

    def get_utilization_percentage(self, used_area: float) -> float:
        """
        Calcula el porcentaje de utilización del área.

        Args:
            used_area: Área utilizada en m²

        Returns:
            Porcentaje de utilización (0-1)
        """
        return min(used_area / self.max_area, 1.0)
