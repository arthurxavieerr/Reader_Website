// api/books/index.ts - VERSÃO TEMPORÁRIA COM MOCK
import { VercelRequest, VercelResponse } from '@vercel/node';

// Mock data - os mesmos 6 livros
const MOCK_BOOKS = [
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
    createdAt: '2024-01-04T00:00:00.000Z'
  },
  {
    id: '5',
    title: 'O Último Detetive de Baker Street',
    author: 'Eduardo Santos',
    genre: 'Mistério Urbano',
    synopsis: 'Mistérios sombrios nas ruas de Londres com um detetive excepcional.',
    baseRewardMoney: 80000,
    requiredLevel: 1,
    reviewsCount: 5621,
    averageRating: 4.4,
    createdAt: '2024-01-05T00:00:00.000Z'
  },
  {
    id: '6',
    title: 'Suspeito Comum',
    author: 'Maria Silva',
    genre: 'Thriller psicológico',
    synopsis: 'Um thriller que questiona a natureza da culpa e inocência.',
    baseRewardMoney: 60000,
    requiredLevel: 2,
    reviewsCount: 3245,
    averageRating: 4.8,
    createdAt: '2024-01-06T00:00:00.000Z'
  }
];

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
    // Simular delay do banco
    await new Promise(resolve => setTimeout(resolve, 100));
    
    console.log('📚 Retornando livros mock temporariamente');
    
    return res.status(200).json({
      success: true,
      data: { books: MOCK_BOOKS }
    });

  } catch (error) {
    console.error('Books error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Erro interno do servidor'
    });
  }
}