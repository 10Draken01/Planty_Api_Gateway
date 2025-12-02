"""
Custom exceptions for the domain layer.
"""


class DomainException(Exception):
    """Base exception for domain-related errors"""
    def __init__(self, message: str, details: dict = None):
        self.message = message
        self.details = details or {}
        super().__init__(self.message)


class InvalidGardenConstraintsException(DomainException):
    """Raised when garden constraints are invalid"""
    def __init__(self, message: str, constraints: dict = None):
        super().__init__(
            message=message,
            details={"constraints": constraints}
        )


class InsufficientPlantsException(DomainException):
    """Raised when there are not enough plants in the database"""
    def __init__(self, available_count: int, minimum_required: int = 10):
        super().__init__(
            message=f"Insufficient plants in database. Found: {available_count}, Required: {minimum_required}",
            details={"available_count": available_count, "minimum_required": minimum_required}
        )


class InvalidGardenLayoutException(DomainException):
    """Raised when a garden layout is invalid"""
    def __init__(self, message: str, layout_details: dict = None):
        super().__init__(
            message=message,
            details={"layout": layout_details}
        )


class GeneticAlgorithmException(DomainException):
    """Raised when the genetic algorithm encounters an error"""
    def __init__(self, message: str, generation: int = None):
        super().__init__(
            message=message,
            details={"generation": generation}
        )
