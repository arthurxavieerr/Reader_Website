import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';

const prisma = new PrismaClient();

interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

// Extender Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        isAdmin: boolean;
      };
    }
  }
}

// Middleware de autenticação
export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token de acesso requerido'
      });
      return;
    }

    // Verificar e decodificar o token
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;

    // Verificar se usuário ainda existe e não está suspenso
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isSuspended: true,
        suspendedReason: true
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Usuário não encontrado'
      });
      return;
    }

    if (user.isSuspended) {
      res.status(403).json({
        success: false,
        error: `Conta suspensa: ${user.suspendedReason || 'Violação dos termos'}`
      });
      return;
    }

    // Adicionar dados do usuário ao request
    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin
    };

    next();

  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token expirado'
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Token inválido'
      });
      return;
    }

    logger.error('Erro na autenticação:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
    return;
  }
};

// Middleware para verificar se é admin
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user?.isAdmin) {
    logger.warn(`Tentativa de acesso admin negada: ${req.user?.email}`, {
      userId: req.user?.id,
      ip: req.ip,
      url: req.originalUrl
    });
    
    return res.status(403).json({
      success: false,
      error: 'Acesso restrito a administradores'
    });
  }
  
  next();
};

// Middleware opcional - não obrigatório estar logado
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continua sem usuário
    }

    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'fallback-secret'
    ) as JWTPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        isAdmin: true,
        isSuspended: true
      }
    });

    if (user && !user.isSuspended) {
      req.user = {
        id: user.id,
        email: user.email,
        isAdmin: user.isAdmin
      };
    }

    next();

  } catch (error) {
    // Erro no token opcional não bloqueia a requisição
    next();
  }
};