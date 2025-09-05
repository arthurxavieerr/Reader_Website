// api/auth/login.ts
import { VercelRequest, VercelResponse } from '@vercel/node';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateToken } from '../_utils/auth';
import { sendError, sendSuccess } from '../_utils/response';
import { setCors } from '../_utils/cors';

const prisma = new PrismaClient();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configurar CORS
  setCors(res);
  
  // Responder a requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Apenas POST permitido
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Método não permitido');
  }

  try {
    const { email, password } = req.body;

    // Validação dos dados
    if (!email || !password) {
      return sendError(res, 400, 'Email e senha são obrigatórios');
    }

    // Buscar usuário no banco
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return sendError(res, 401, 'Email ou senha inválidos');
    }

    // Verificar se conta está suspensa
    if (user.isSuspended) {
      return sendError(res, 403, `Conta suspensa: ${user.suspendedReason || 'Violação dos termos de uso'}`);
    }

    // Verificar se o usuário tem senha cadastrada
    if (!user.passwordHash) {
      return sendError(res, 401, 'Email ou senha inválidos');
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return sendError(res, 401, 'Email ou senha inválidos');
    }

    // Atualizar último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIP: getClientIP(req)
      }
    });

    // Gerar token JWT
    const token = generateToken(user.id, user.email, user.isAdmin);

    // Dados públicos do usuário (sem senha)
    const publicUser = {
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
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString(),
    };

    return sendSuccess(res, { user: publicUser, token });

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await prisma.$disconnect();
  }
}

// Função para obter IP do cliente
function getClientIP(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  const ip = forwarded ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0]) : req.socket?.remoteAddress;
  return ip || 'unknown';
}