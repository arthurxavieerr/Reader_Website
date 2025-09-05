// api/books/index.ts - VERSÃO SIMPLES PARA DEBUG
export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    console.log('📚 Books API chamada');

    // PRIMEIRO: Testar sem Prisma - só retornar dados fixos
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
      },
      {
        id: '3',
        title: 'O Banqueiro Anarquista',
        author: 'Fernando Pessoa',
        genre: 'Ensaio filosófico',
        synopsis: 'Ensaio filosófico em forma de diálogo, onde um banqueiro se declara anarquista.',
        baseRewardMoney: 30000,
        requiredLevel: 0,
        reviewsCount: 11698,
        averageRating: 4.7,
        isInitialBook: true,
        createdAt: '2024-01-03T00:00:00.000Z'
      },
      {
        id: '4',
        title: 'De Quanta Terra um Homem Precisa?',
        author: 'Liev Tolstói',
        genre: 'Literatura russa',
        synopsis: 'Um conto sobre ambição e as verdadeiras necessidades humanas.',
        baseRewardMoney: 50000,
        requiredLevel: 0,
        reviewsCount: 8754,
        averageRating: 4.6,
        isInitialBook: true,
        createdAt: '2024-01-04T00:00:00.000Z'
      }
    ];

    console.log(`📚 Retornando ${mockBooks.length} livros mock`);

    return res.status(200).json({
      success: true,
      data: { books: mockBooks }
    });

  } catch (error) {
    console.error('Books API error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor',
      debug: {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      }
    });
  }
}