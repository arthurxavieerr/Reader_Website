import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    // Tentar importar Prisma dinamicamente
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    // Conectar e buscar livros
    await prisma.$connect();
    
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

    await prisma.$disconnect();

    return res.status(200).json({ 
      success: true, 
      data: { books } 
    });

  } catch (error) {
    console.error('Books error:', error);
    return res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}