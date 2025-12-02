"""
Error Handler Middleware.
Global error handling for the API.
"""
import logging
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger("plantgen.api")


class ErrorHandlerMiddleware(BaseHTTPMiddleware):
    """
    Middleware to handle all unhandled exceptions globally.
    """

    async def dispatch(self, request: Request, call_next):
        """
        Process the request and handle any exceptions.

        Args:
            request: Incoming HTTP request
            call_next: Next middleware/route handler

        Returns:
            HTTP response or error response
        """
        try:
            response = await call_next(request)
            return response
        except Exception as exc:
            # Log the error
            logger.error(
                f"Unhandled exception: {str(exc)}",
                exc_info=True,
                extra={
                    "method": request.method,
                    "path": request.url.path,
                    "error": str(exc)
                }
            )

            # Return error response
            return JSONResponse(
                status_code=500,
                content={
                    "success": False,
                    "message": "Internal server error",
                    "error": str(exc),
                    "path": request.url.path
                }
            )


def error_handler_middleware():
    """
    Factory function to create ErrorHandlerMiddleware.

    Returns:
        ErrorHandlerMiddleware instance
    """
    return ErrorHandlerMiddleware
