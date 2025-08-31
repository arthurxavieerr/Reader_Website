import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RegisterData, OnboardingData, PublicUser } from '../types';
import logger from '../config/logger';

const prisma = new PrismaClient();

// Converter usuário do banco para formato público (frontend)
const toPublicUser = (user: any): PublicUser => {
  if (!user) {
    throw new Error('Usuário não encontrado');
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    level: user.level,
    points: user.points,
    balance: user.balance,
    planType: user.planType.toLowerCase(),
    isAdmin: user.isAdmin,
    onboardingCompleted: user.onboardingCompleted,
    commitment: user.commitment?.toLowerCase(),
    incomeRange: user.incomeRange?.toLowerCase(),
    profileImage: user.profileImage,
    createdAt: user.createdAt.toISOString(),
  };
};

// Gerar JWT token
const generateToken = (userId: string, email: string, isAdmin: boolean) => {
  return jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

// REGISTER - Cadastro de novo usuário
export const register = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { name, email, phone, password }: RegisterData = req.body;

    // Validações básicas
    if (!name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos são obrigatórios'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'Senha deve ter pelo menos 6 caracteres'
      });
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email já está em uso'
      });
    }

    // Criar hash da senha
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Criar usuário no banco
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        passwordHash,
        salt,
        lastLoginIP: req.ip
      }
    });

    // Gerar token
    const token = generateToken(newUser.id, newUser.email, newUser.isAdmin);

    // Log da criação
    logger.info(`Novo usuário cadastrado: ${newUser.email}`, {
      userId: newUser.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Retornar usuário público (igual ao frontend espera)
    const publicUser = toPublicUser(newUser);
    
    return res.status(201).json({
      success: true,
      data: {
        user: publicUser,
        token
      }
    });

  } catch (error) {
    logger.error('Erro no registro:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// LOGIN - Autenticação de usuário
export const login = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { email, password } = req.body;

    // Validações básicas
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Verificar se está suspenso
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        error: `Conta suspensa: ${user.suspendedReason || 'Violação dos termos de uso'}`
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIP: req.ip
      }
    });

    // Gerar token
    const token = generateToken(user.id, user.email, user.isAdmin);

    // Log do login
    logger.info(`Login realizado: ${user.email}`, {
      userId: user.id,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    // Retornar usuário público
    const publicUser = toPublicUser(user);
    
    return res.json({
      success: true,
      data: {
        user: publicUser,
        token
      }
    });

  } catch (error) {
    logger.error('Erro no login:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// COMPLETE ONBOARDING - Finalizar cadastro
export const completeOnboarding = async (req: Request, res: Response): Promise<Response> => {
  try {
    const { commitment, incomeRange }: OnboardingData = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    // Validar dados
    const validCommitments = ['committed', 'curious'];
    const validIncomeRanges = ['low', 'medium', 'high', 'unemployed'];

    if (!validCommitments.includes(commitment) || !validIncomeRanges.includes(incomeRange)) {
      return res.status(400).json({
        success: false,
        error: 'Dados de onboarding inválidos'
      });
    }

    // Atualizar usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        onboardingCompleted: true,
        commitment: commitment.toUpperCase() as any,
        incomeRange: incomeRange.toUpperCase() as any
      }
    });

    // Criar métricas de conversão
    await prisma.conversionMetrics.create({
      data: {
        userId: updatedUser.id,
        popupViews: 0,
        upgradeAttempts: 0
      }
    });

    logger.info(`Onboarding completado: ${updatedUser.email}`, {
      userId: updatedUser.id,
      commitment,
      incomeRange
    });

    const publicUser = toPublicUser(updatedUser);
    
    return res.json({
      success: true,
      data: { user: publicUser }
    });

  } catch (error) {
    logger.error('Erro no onboarding:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET ME - Obter dados do usuário atual
export const getMe = async (req: Request, res: Response): Promise<Response> => {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuário não autenticado'
      });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const publicUser = toPublicUser(user);
    
    return res.json({
      success: true,
      data: { user: publicUser }
    });

  } catch (error) {
    logger.error('Erro ao buscar usuário:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};
