import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../_utils/cors';
import { prisma, disconnectDatabase } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { authenticateRequest } from '../_utils/auth';

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
  updatedAt: user.updatedAt.toISOString(),
});

/**
 * Me Endpoint
 * GET /api/auth/me
 * 
 * Retorna dados do usuário autenticado
 * Requer: Authorization: Bearer <token>
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Configura CORS
  setCors(res);

  // Responde a requisições OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Só aceita método GET
  if (req.method !== 'GET') {
    return sendError(res, 405, 'Método não permitido');
  }

  try {
    // Autentica a requisição
    const authUser = await authenticateRequest(req);
    
    if (!authUser) {
      return sendError(res, 401, 'Token inválido ou expirado');
    }

    // Busca dados atualizados do usuário no banco
    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    // Verifica se usuário está suspenso
    if (user.isSuspended) {
      return sendError(res, 403, 'Conta suspensa. Entre em contato com o suporte.');
    }

    // Retorna dados públicos do usuário
    const publicUser = toPublicUser(user);

    return sendSuccess(res, { 
      user: publicUser 
    }, 'Dados do usuário obtidos com sucesso');

  } catch (error) {
    console.error('Get user error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await disconnectDatabase();
  }
}