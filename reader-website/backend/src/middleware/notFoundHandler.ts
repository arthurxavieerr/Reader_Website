import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const { method, originalUrl, ip } = req;
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Log da tentativa de acesso a rota inexistente
  logger.warn(`404 - Rota não encontrada: ${method} ${originalUrl}`, {
    method,
    url: originalUrl,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });

  // Resposta 404 padronizada
  res.status(404).json({
    success: false,
    error: `Rota não encontrada: ${method} ${originalUrl}`,
    message: 'A rota solicitada não existe neste servidor.',
    availableRoutes: [
      'GET /health - Status do servidor',
      'POST /api/auth/login - Login de usuário',
      'POST /api/auth/register - Registro de usuário',
      '... (outras rotas serão adicionadas)'
    ]
  });
};