import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { setCors } from '../_utils/cors';
import { prisma } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { generateToken } from '../_utils/auth';

const toPublicUser = (user: any) => ({
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
});

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return sendError(res, 400, 'Email e senha são obrigatórios');
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return sendError(res, 401, 'Email ou senha inválidos');
    }

    if (user.isSuspended) {
      return sendError(res, 403, `Conta suspensa: ${user.suspendedReason || 'Violação dos termos de uso'}`);
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return sendError(res, 401, 'Email ou senha inválidos');
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIP: req.headers['x-forwarded-for'] as string || 'unknown'
      }
    });

    const token = generateToken(user.id, user.email, user.isAdmin);
    const publicUser = toPublicUser(user);

    return sendSuccess(res, { user: publicUser, token });

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await prisma.$disconnect();
  }
}