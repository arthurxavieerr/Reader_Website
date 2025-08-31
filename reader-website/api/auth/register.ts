import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { setCors } from '../_utils/cors';
import { prisma } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { generateToken } from '../_utils/auth';

interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

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
    const { name, email, phone, password }: RegisterData = req.body;

    if (!name || !email || !phone || !password) {
      return sendError(res, 400, 'Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Senha deve ter pelo menos 6 caracteres');
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return sendError(res, 409, 'Email já está em uso');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        passwordHash,
        salt,
        lastLoginIP: req.headers['x-forwarded-for'] as string || 'unknown'
      }
    });

    const token = generateToken(newUser.id, newUser.email, newUser.isAdmin);
    const publicUser = toPublicUser(newUser);

    return sendSuccess(res, { user: publicUser, token });

  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await prisma.$disconnect();
  }
}