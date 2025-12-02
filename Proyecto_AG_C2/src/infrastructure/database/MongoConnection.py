"""
Conexión a MongoDB con autenticación.
"""
import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from src.infrastructure.config import get_settings

logger = logging.getLogger("plantgen.database")


class MongoConnection:
    """
    Singleton para manejar la conexión a MongoDB.
    Utiliza settings centralizados para la configuración.
    """
    _client: AsyncIOMotorClient = None
    _database: AsyncIOMotorDatabase = None

    @classmethod
    async def get_database(cls) -> AsyncIOMotorDatabase:
        """
        Obtiene la instancia de la base de datos MongoDB.

        Returns:
            Base de datos MongoDB
        """
        if cls._database is None:
            await cls.connect()
        return cls._database

    @classmethod
    async def connect(cls):
        """
        Establece conexión con MongoDB usando configuración centralizada.
        """
        settings = get_settings()

        try:
            # Crear cliente usando URI de settings
            cls._client = AsyncIOMotorClient(
                settings.mongo_uri,
                serverSelectionTimeoutMS=5000
            )

            # Verificar conexión
            await cls._client.admin.command('ping')
            logger.info(f"✓ Conectado exitosamente a MongoDB: {settings.MONGO_DATABASE}")

            # Obtener base de datos
            cls._database = cls._client[settings.MONGO_DATABASE]

        except Exception as e:
            logger.error(f"✗ Error al conectar a MongoDB: {e}")
            raise

    @classmethod
    async def disconnect(cls):
        """Cierra la conexión a MongoDB"""
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._database = None
            logger.info("✓ Desconectado de MongoDB")

    @classmethod
    async def health_check(cls) -> bool:
        """
        Verifica el estado de la conexión.

        Returns:
            True si la conexión está activa
        """
        try:
            if cls._client is None:
                return False
            await cls._client.admin.command('ping')
            return True
        except Exception:
            return False
