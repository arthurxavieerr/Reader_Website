import { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { setCors } from '../_utils/cors';
import { prisma, disconnectDatabase } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { generateToken } from '../_utils/auth';

/**
 * Interface para dados de registro
 */
interface RegisterData {
  name: string;
  email: string;
  phone: string;
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
 * Register Endpoint
 * POST /api/auth/register
 * 
 * Cadastra um novo usuário no sistema
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
    const { name, email, phone, password }: RegisterData = req.body;

    // Validações básicas
    if (!name || !email || !phone || !password) {
      return sendError(res, 400, 'Todos os campos são obrigatórios');
    }

    if (password.length < 6) {
      return sendError(res, 400, 'Senha deve ter pelo menos 6 caracteres');
    }

    // Verifica se email já existe
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });

    if (existingUser) {
      return sendError(res, 409, 'Este email já está em uso');
    }

    // Gera hash seguro da senha
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Cria o novo usuário
    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        passwordHash,
        salt,
        lastLoginIP: (req.headers['x-forwarded-for'] as string) || 'unknown',
        lastLoginAt: new Date()
      }
    });

    // Gera token JWT
    const token = generateToken(newUser.id, newUser.email, newUser.isAdmin);
    
    // Retorna dados públicos do usuário + token
    const publicUser = toPublicUser(newUser);

    return sendSuccess(res, { 
      user: publicUser, 
      token 
    }, 'Usuário cadastrado com sucesso');

  } catch (error) {
    console.error('Register error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await disconnectDatabase();
  }
}