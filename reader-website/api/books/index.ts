import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../_utils/cors';
import { prisma } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCors(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return sendError(res, 405, 'Method not allowed');
  }

  try {
    const books = await prisma.book.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        author: true,
        genre: true,
        synopsis: true,
        baseRewardMoney: true,
        requiredLevel: true,
        reviewsCount: true,
        averageRating: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    return sendSuccess(res, { books });

  } catch (error) {
    console.error('Books error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await prisma.$disconnect();
  }
}