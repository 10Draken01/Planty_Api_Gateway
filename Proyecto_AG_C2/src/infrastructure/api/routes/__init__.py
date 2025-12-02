"""
API Routes.
"""
from .health_routes import router as health_router
from .garden_routes import router as garden_router

__all__ = ["health_router", "garden_router"]
