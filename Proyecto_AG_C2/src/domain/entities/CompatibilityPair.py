"""
Entidad CompatibilityPair - Representa la compatibilidad entre dos plantas.
"""
from dataclasses import dataclass


@dataclass(frozen=True)
class CompatibilityPair:
    """
    Representa la relación de compatibilidad entre dos especies de plantas.
    Valor de compatibilidad en escala [-1, 1]:
    - 1.0: Excelente compatibilidad (plantas compañeras)
    - 0.5: Buena compatibilidad
    - 0.0: Neutral
    - -0.5: Incompatibilidad leve
    - -1.0: Incompatibilidad severa (plantas antagónicas)
    """
    plant1: str  # Nombre de la primera especie
    plant2: str  # Nombre de la segunda especie
    compatibility: float  # Valor entre -1 y 1

    def __post_init__(self):
        """Validaciones de dominio"""
        if not -1.0 <= self.compatibility <= 1.0:
            raise ValueError(
                f"La compatibilidad debe estar entre -1 y 1, recibido: {self.compatibility}"
            )
        if not self.plant1 or not self.plant2:
            raise ValueError("Los nombres de las plantas no pueden estar vacíos")

    def is_positive(self) -> bool:
        """Retorna True si la compatibilidad es positiva"""
        return self.compatibility > 0

    def is_neutral(self) -> bool:
        """Retorna True si la compatibilidad es neutral"""
        return self.compatibility == 0

    def is_negative(self) -> bool:
        """Retorna True si la compatibilidad es negativa"""
        return self.compatibility < 0

    def get_strength(self) -> str:
        """
        Retorna la fuerza de la compatibilidad como string.

        Returns:
            Descripción de la fuerza de compatibilidad
        """
        if self.compatibility >= 0.8:
            return "excellent"
        elif self.compatibility >= 0.5:
            return "good"
        elif self.compatibility > 0:
            return "moderate"
        elif self.compatibility == 0:
            return "neutral"
        elif self.compatibility >= -0.5:
            return "poor"
        else:
            return "incompatible"
