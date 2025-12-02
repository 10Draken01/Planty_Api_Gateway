"""
Value Object GardenObjective - Representa el objetivo del huerto.
"""
from dataclasses import dataclass
from typing import Literal, Dict


@dataclass(frozen=True)
class GardenObjective:
    """
    Representa el objetivo principal del huerto urbano.
    Define los pesos para la función de fitness según el objetivo.
    """
    objective_type: Literal["alimenticio", "medicinal", "sostenible", "ornamental"]

    def get_weights(self) -> Dict[str, float]:
        """
        Retorna los pesos para la función de fitness según el objetivo.

        Returns:
            Diccionario con pesos para CEE, PSNTPA, WCE, UE
        """
        weights_config = {
            "alimenticio": {
                "cee": 0.20,    # Compatibilidad Entre Especies
                "psntpa": 0.50,  # Rendimiento Nutricional
                "wce": 0.20,     # Eficiencia Hídrica
                "ue": 0.10       # Utilización de Espacio
            },
            "medicinal": {
                "cee": 0.25,
                "psntpa": 0.45,
                "wce": 0.15,
                "ue": 0.15
            },
            "sostenible": {
                "cee": 0.25,
                "psntpa": 0.20,
                "wce": 0.40,  # Prioriza eficiencia hídrica
                "ue": 0.15
            },
            "ornamental": {
                "cee": 0.20,
                "psntpa": 0.40,
                "wce": 0.15,
                "ue": 0.25   # Prioriza utilización de espacio
            }
        }
        return weights_config[self.objective_type]

    def prioritizes_nutrition(self) -> bool:
        """Retorna True si el objetivo prioriza la nutrición"""
        return self.objective_type == "alimenticio"

    def prioritizes_medicinal(self) -> bool:
        """Retorna True si el objetivo prioriza plantas medicinales"""
        return self.objective_type == "medicinal"

    def prioritizes_sustainability(self) -> bool:
        """Retorna True si el objetivo prioriza la sostenibilidad"""
        return self.objective_type == "sostenible"

    def prioritizes_aesthetics(self) -> bool:
        """Retorna True si el objetivo prioriza lo ornamental"""
        return self.objective_type == "ornamental"
