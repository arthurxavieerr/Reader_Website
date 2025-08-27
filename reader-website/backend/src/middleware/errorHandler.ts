import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Interface para erros customizados
export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

// Middleware de tratamento de erros
export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { method, url, ip } = req;
  const userAgent = req.get('User-Agent') || 'unknown';
  
  // Log do erro
  logger.error(`${method} ${url} - ${error.message}`, {
    error: error.message,
    stack: error.stack,
    statusCode: error.statusCode,
    ip,
    userAgent,
    body: req.body,
    params: req.params,
    query: req.query
  });

  // Determinar status code
  const statusCode = error.statusCode || 500;
  
  // Diferentes tipos de erro
  let message = 'Erro interno do servidor';
  
  if (error.isOperational || statusCode < 500) {
    // Erros operacionais (seguros para mostrar ao usuário)
    message = error.message;
  } else if (process.env.NODE_ENV === 'development') {
    // Em desenvolvimento, mostrar erro completo
    message = error.message;
  }

  // Resposta padronizada (compatível com o frontend)
  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: {
        method,
        url,
        timestamp: new Date().toISOString()
      }
    })
  });
};

// Middleware 404 - rota não encontrada
export const notFoundHandler = (req: Request, res: Response, next: NextFunction) => {
  const error = new Error(`Rota não encontrada: ${req.method} ${req.originalUrl}`) as AppError;
  error.statusCode = 404;
  error.isOperational = true;
  next(error);
};

// Função para criar erros customizados
export const createError = (message: string, statusCode: number = 500): AppError => {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

// Erros comuns pré-definidos
export const errors = {
  // Autenticação
  UNAUTHORIZED: () => createError('Token não fornecido ou inválido', 401),
  FORBIDDEN: () => createError('Acesso negado', 403),
  INVALID_CREDENTIALS: () => createError('Email ou senha inválidos', 401),
  USER_NOT_FOUND: () => createError('Usuário não encontrado', 404),
  EMAIL_ALREADY_EXISTS: () => createError('Email já está em uso', 409),
  
  // Validação
  VALIDATION_ERROR: (message: string) => createError(`Erro de validação: ${message}`, 400),
  MISSING_FIELDS: (fields: string[]) => createError(`Campos obrigatórios: ${fields.join(', ')}`, 400),
  
  // Recursos
  BOOK_NOT_FOUND: () => createError('Livro não encontrado', 404),
  REVIEW_NOT_FOUND: () => createError('Avaliação não encontrada', 404),
  
  // Business logic
  INSUFFICIENT_BALANCE: () => createError('Saldo insuficiente', 400),
  MINIMUM_WITHDRAWAL_NOT_REACHED: (minimum: number) => 
    createError(`Valor mínimo para saque: R$ ${(minimum / 100).toFixed(2)}`, 400),
  READING_TOO_FAST: () => createError('Leitura muito rápida detectada. Leia com mais atenção.', 400),
  FRAUD_DETECTED: () => createError('Padrão suspeito de leitura detectado', 403),
  REWARD_ALREADY_CLAIMED: () => createError('Recompensa já foi recebida para este livro', 409),
  PREMIUM_REQUIRED: () => createError('Funcionalidade disponível apenas para usuários Premium', 403),
  FREE_BALANCE_LIMIT: (limit: number) => 
    createError(`Limite de saldo gratuito atingido: R$ ${(limit / 100).toFixed(2)}. Faça upgrade para Premium!`, 403),
  
  // Sistema
  DATABASE_ERROR: () => createError('Erro na base de dados', 500),
  EXTERNAL_API_ERROR: (service: string) => createError(`Erro no serviço ${service}`, 502)
};

export default errorHandler;