import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { setCors } from '../_utils/cors';
import { prisma, disconnectDatabase } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { generateToken } from '../_utils/auth';

/**
 * Interface para dados de login
 */
interface LoginData {
  email: string;
  password: string;
}

/**
 * Converte dados do usuário para formato público (sem dados sensíveis)
 */
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

/**
 * Login Endpoint
 * POST /api/auth/login
 * 
 * Autentica um usuário existente
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura CORS
  setCors(res);

  // Responde a requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceita método POST
  if (req.method !== 'POST') {
    return sendError(res, 405, 'Método não permitido');
  }

  try {
    const { email, password }: LoginData = req.body;

    // Validações básicas
    if (!email || !password) {
      return sendError(res, 400, 'Email e senha são obrigatórios');
    }

    // Busca usuário pelo email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    // Verifica se usuário está suspenso
    if (user.isSuspended) {
      return sendError(res, 403, 'Conta suspensa. Entre em contato com o suporte.');
    }

    // Verifica a senha
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return sendError(res, 401, 'Credenciais inválidas');
    }

    // Atualiza dados de último login
    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIP: (req.headers['x-forwarded-for'] as string) || 'unknown'
      }
    });

    // Gera token JWT
    const token = generateToken(user.id, user.email, user.isAdmin);
    
    // Retorna dados públicos do usuário + token
    const publicUser = toPublicUser(user);

    return sendSuccess(res, { 
      user: publicUser, 
      token 
    }, 'Login realizado com sucesso');

  } catch (error) {
    console.error('Login error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await disconnectDatabase();
  }
}