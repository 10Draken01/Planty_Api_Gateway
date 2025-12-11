"""
Cliente HTTP para comunicarse con el servicio de chatbot.

Genera mensajes personalizados de recomendación con Planty.
"""
import logging
import httpx
from typing import Dict, List

from app.core.config import settings

logger = logging.getLogger(__name__)


class ChatbotClient:
    """Cliente para interactuar con api-chatbot."""

    def __init__(self):
        self.chatbot_url = settings.CHATBOT_SERVICE_URL

    async def generate_recommendation_message(
        self,
        user_data: Dict,
        current_orchards: List[Dict],
        recommended_orchards: List[Dict]
    ) -> Dict:
        """
        Genera mensajes de recomendación personalizados.

        Args:
            user_data: Datos del usuario (sin datos sensibles)
            current_orchards: Huertos actuales del usuario
            recommended_orchards: Huertos recomendados

        Returns:
            Dict con:
            - fcm_message: Mensaje corto para notificación push
            - view_message: Mensaje largo para vista en la app
        """
        try:
            url = f"{self.chatbot_url}/chat/generate-recommendation-message"

            # Preparar datos (eliminar campos sensibles si existen)
            sanitized_user = {
                'id': user_data.get('id') or user_data.get('_id'),
                'name': user_data.get('name', 'Usuario'),
                'experience_level': user_data.get('experience_level', 1),
                'preferred_plant_category': user_data.get('preferred_plant_category', []),
                'count_orchards': len(current_orchards)
            }

            payload = {
                'user': sanitized_user,
                'currentOrchards': current_orchards,
                'recommendedOrchards': recommended_orchards
            }

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()

                data = response.json()

                return {
                    'success': data.get('success', True),
                    'fcm_message': data.get('fcm_message', ''),
                    'view_message': data.get('view_message', ''),
                    'generated_at': data.get('generated_at')
                }

        except httpx.HTTPError as e:
            logger.error(f"❌ Error llamando a chatbot: {e}")
            # Retornar mensajes genéricos en caso de error
            return self._generate_fallback_messages(user_data, recommended_orchards)

    def _generate_fallback_messages(
        self, user_data: Dict, recommended_orchards: List[Dict]
    ) -> Dict:
        """Genera mensajes genéricos si el chatbot falla."""
        user_name = user_data.get('name', 'Usuario')
        count = len(recommended_orchards)

        fcm_message = f"¡Hola {user_name}! 🌱 Tenemos {count} huertos nuevos para ti"

        orchard_names = ', '.join([o.get('name', 'Huerto') for o in recommended_orchards[:3]])
        view_message = f"""¡Hola {user_name}! 🌱

¡Planty tiene nuevas recomendaciones para ti!

Basado en tus preferencias, estos huertos podrían interesarte:
{orchard_names}

¡Explóralos y sigue creciendo tu jardín! 🌿
"""

        return {
            'success': True,
            'fcm_message': fcm_message,
            'view_message': view_message,
            'generated_at': None,
            'fallback': True
        }
