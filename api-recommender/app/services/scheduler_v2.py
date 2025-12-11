"""
Scheduler v2 para tareas automáticas.

- Reentrenamiento automático 1 de enero y 1 de julio a las 2:00 AM
"""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from datetime import datetime

logger = logging.getLogger(__name__)


scheduler = AsyncIOScheduler()


async def auto_retrain_job():
    """
    Job de reentrenamiento automático.
    Se ejecuta el 1 de enero y 1 de julio.
    """
    try:
        logger.info("🤖 Iniciando reentrenamiento automático programado...")

        # Importar aquí para evitar circular imports
        from app.main import database
        from app.services.training_service_v2 import TrainingServiceV2

        if database is None:
            logger.error("❌ Database no está disponible")
            return

        # Entrenar con fecha actual
        service = TrainingServiceV2(database)
        result = await service.train_model()

        logger.info(f"✅ Reentrenamiento automático completado:")
        logger.info(f"   - Algoritmo: {result['algorithm']}")
        logger.info(f"   - Clusters: {result['n_clusters']}")
        logger.info(f"   - Score: {result['silhouette_score']:.4f}")
        logger.info(f"   - Usuarios: {result['n_users_trained']}")

    except Exception as e:
        logger.error(f"❌ Error en reentrenamiento automático: {e}")


def start_scheduler():
    """Inicia el scheduler con las tareas programadas."""
    try:
        # Job 1: Reentrenamiento automático en enero y julio
        # Cron: "0 2 1 1,7 *" = A las 2:00 AM del día 1 de enero y julio
        scheduler.add_job(
            auto_retrain_job,
            trigger=CronTrigger(
                day=1,           # Día 1 del mes
                month='1,7',     # Enero y Julio
                hour=2,          # 2:00 AM
                minute=0
            ),
            id='auto_retrain',
            name='Reentrenamiento automático semestral',
            replace_existing=True
        )

        logger.info("📅 Scheduler configurado:")
        logger.info("   - Reentrenamiento: 1 de enero y 1 de julio a las 2:00 AM")

        scheduler.start()
        logger.info("✅ Scheduler iniciado correctamente")

    except Exception as e:
        logger.error(f"❌ Error iniciando scheduler: {e}")


def stop_scheduler():
    """Detiene el scheduler."""
    try:
        scheduler.shutdown()
        logger.info("Scheduler detenido")
    except Exception as e:
        logger.error(f"Error deteniendo scheduler: {e}")
