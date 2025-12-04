"""Cliente HTTP para comunicarse con el servicio de notificaciones."""
import logging
import httpx
from typing import List, Dict, Any
from app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationsClient:
    """Cliente para enviar notificaciones a través del servicio de notificaciones."""

    def __init__(self):
        self.base_url = settings.NOTIFICATIONS_SERVICE_URL
        self.timeout = 10.0

    async def send_to_user(
        self,
        user_id: str,
        title: str,
        body: str,
        data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Envía una notificación a un usuario específico.

        Args:
            user_id: ID del usuario
            title: Título de la notificación
            body: Cuerpo del mensaje
            data: Datos adicionales (opcional)

        Returns:
            Respuesta del servicio de notificaciones
        """
        url = f"{self.base_url}/user/{user_id}"
        payload = {
            "title": title,
            "body": body,
            "data": data or {}
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to send notification to user {user_id}: {e}")
            raise

    async def send_to_multiple_users(
        self,
        user_ids: List[str],
        title: str,
        body: str,
        data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Envía notificaciones a múltiples usuarios.

        Args:
            user_ids: Lista de IDs de usuarios
            title: Título de la notificación
            body: Cuerpo del mensaje
            data: Datos adicionales (opcional)

        Returns:
            Respuesta del servicio de notificaciones con resumen de envíos
        """
        url = f"{self.base_url}/users"
        payload = {
            "userIds": user_ids,
            "title": title,
            "body": body,
            "data": data or {}
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to send notifications to multiple users: {e}")
            raise

    async def broadcast(
        self,
        title: str,
        body: str,
        data: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Envía una notificación broadcast a todos los usuarios.

        Args:
            title: Título de la notificación
            body: Cuerpo del mensaje
            data: Datos adicionales (opcional)

        Returns:
            Respuesta del servicio de notificaciones con resumen de envíos
        """
        url = f"{self.base_url}/broadcast"
        payload = {
            "title": title,
            "body": body,
            "data": data or {}
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return response.json()
        except httpx.HTTPError as e:
            logger.error(f"Failed to broadcast notification: {e}")
            raise


# Instancia global del cliente
notifications_client = NotificationsClient()
