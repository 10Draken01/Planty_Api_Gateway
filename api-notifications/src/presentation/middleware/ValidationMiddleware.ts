import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../../infrastructure/services/LoggerService';

export const validateNotificationPayload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const schema = Joi.object({
    title: Joi.string().required().min(1).max(100).messages({
      'string.empty': 'El título no puede estar vacío',
      'string.min': 'El título debe tener al menos 1 carácter',
      'string.max': 'El título no puede exceder 100 caracteres',
      'any.required': 'El título es obligatorio',
    }),
    body: Joi.string().required().min(1).max(500).messages({
      'string.empty': 'El cuerpo no puede estar vacío',
      'string.min': 'El cuerpo debe tener al menos 1 carácter',
      'string.max': 'El cuerpo no puede exceder 500 caracteres',
      'any.required': 'El cuerpo es obligatorio',
    }),
    data: Joi.object().optional(),
    imageUrl: Joi.string().uri().optional().messages({
      'string.uri': 'La URL de la imagen debe ser válida',
    }),
  });

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map((detail) => detail.message);
    logger.warn('Validación fallida', { errors });

    res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors,
    });
    return;
  }

  next();
};
