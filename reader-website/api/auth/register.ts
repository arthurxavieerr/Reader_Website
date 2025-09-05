// api/auth/register.ts
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
    const { name, email, phone, password } = req.body;

    // Validação dos dados
    if (!name || !email || !phone || !password) {
      return sendError(res, 400, 'Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Senha deve ter pelo menos 6 caracteres');
    }

    // Verificar se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return sendError(res, 409, 'Email já está em uso');
    }

    // Criptografar senha
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
        lastLoginIP: getClientIP(req)
      }
    });

    // Gerar token JWT
    const token = generateToken(newUser.id, newUser.email, newUser.isAdmin);

    // Dados públicos do usuário (sem senha)
    const publicUser = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      level: newUser.level,
      points: newUser.points,
      balance: newUser.balance,
      planType: newUser.planType.toLowerCase(),
      isAdmin: newUser.isAdmin,
      onboardingCompleted: newUser.onboardingCompleted,
      commitment: newUser.commitment?.toLowerCase(),
      incomeRange: newUser.incomeRange?.toLowerCase(),
      profileImage: newUser.profileImage,
      isSuspended: newUser.isSuspended,
      suspendedReason: newUser.suspendedReason,
      createdAt: newUser.createdAt.toISOString(),
      lastLoginAt: newUser.lastLoginAt?.toISOString(),
    };

    return sendSuccess(res, { user: publicUser, token });

  } catch (error) {
    console.error('Register error:', error);
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