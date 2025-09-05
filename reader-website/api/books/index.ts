// api/books/index.ts - VERSÃO REAL COM SUPABASE
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // Importar e conectar Prisma
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();

    try {
      await prisma.$connect();

      // Buscar livros reais do banco
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
          isInitialBook: true,
          createdAt: true
        },
        orderBy: [
          { isInitialBook: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      await prisma.$disconnect();

      console.log(`📚 Retornando ${books.length} livros do banco de dados`);

      return res.status(200).json({
        success: true,
        data: { books }
      });

    } catch (dbError) {
      await prisma.$disconnect();
      console.error('Database error:', dbError);
      
      // Fallback para mock se banco falhar
      const mockBooks = [
        {
          id: '1',
          title: 'A Caixa de Pandora',
          author: 'Hesíodo',
          genre: 'Mitologia grega',
          synopsis: 'Descubra o conto mitológico de Pandora, que nos revela a origem dos males do mundo e o dom da esperança.',
          baseRewardMoney: 10000,
          requiredLevel: 0,
          reviewsCount: 84288,
          averageRating: 4.5,
          isInitialBook: true,
          createdAt: '2024-01-01T00:00:00.000Z'
        },
        {
          id: '2',
          title: 'O Príncipe e a Gata',
          author: 'Charles Perrault',
          genre: 'Conto de fadas',
          synopsis: 'Era uma vez um rei, pai de três corajosos príncipes, que estava em dúvida sobre qual deles deveria lhe suceder no trono.',
          baseRewardMoney: 20000,
          requiredLevel: 0,
          reviewsCount: 12947,
          averageRating: 4.3,
          isInitialBook: true,
          createdAt: '2024-01-02T00:00:00.000Z'
        }
      ];

      console.log('📚 Fallback: retornando livros mock devido a erro no banco');

      return res.status(200).json({
        success: true,
        data: { books: mockBooks }
      });
    }

  } catch (error) {
    console.error('Books API error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}