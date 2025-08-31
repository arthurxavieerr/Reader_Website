import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../_utils/cors';
import { prisma } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { authenticateRequest } from '../_utils/auth';

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

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const authUser = await authenticateRequest(req);
    if (!authUser) {
      return sendError(res, 401, 'Usuário não autenticado');
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user) {
      return sendError(res, 404, 'Usuário não encontrado');
    }

    const publicUser = toPublicUser(user);
    return sendSuccess(res, { user: publicUser });

  } catch (error) {
    console.error('Get me error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await prisma.$disconnect();
  }
}