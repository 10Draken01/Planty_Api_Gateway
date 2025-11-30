"""Scheduler para jobs periódicos."""
import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.config import settings

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()


async def monthly_retrain_job():
    """Job mensual de reentrenamiento."""
    logger.info("Running monthly retrain job...")
    # Implementar lógica de reentrenamiento
    # await train_clustering_model(db)


async def weekly_recommendations_job():
    """Job semanal de recomendaciones."""
    logger.info("Running weekly recommendations job...")
    # Implementar lógica de envío masivo
    # await send_weekly_recommendations(db)


def start_scheduler():
    """Inicia el scheduler con jobs configurados."""
    # Job mensual: día 1 de cada mes a las 2:00 AM
    scheduler.add_job(
        monthly_retrain_job,
        CronTrigger(
            day=settings.MONTHLY_RETRAIN_DAY,
            hour=settings.MONTHLY_RETRAIN_HOUR,
            minute=0
        ),
        id="monthly_retrain",
        name="Monthly model retraining",
        replace_existing=True
    )

    # Job semanal: lunes a las 9:00 AM
    scheduler.add_job(
        weekly_recommendations_job,
        CronTrigger(
            day_of_week=settings.WEEKLY_RECOMMENDATIONS_DAY,
            hour=settings.WEEKLY_RECOMMENDATIONS_HOUR,
            minute=0
        ),
        id="weekly_recommendations",
        name="Weekly recommendations",
        replace_existing=True
    )

    scheduler.start()
    logger.info("Scheduler started with 2 jobs")
