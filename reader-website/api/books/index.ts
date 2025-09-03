import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../_utils/cors';
import { prisma, disconnectDatabase } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';

/**
 * Formata dados do livro para resposta pública
 */
const formatBookForList = (book: any) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  genre: book.genre,
  synopsis: book.synopsis,
  coverImage: book.coverImage,
  baseRewardMoney: book.baseRewardMoney,
  rewardPoints: book.rewardPoints,
  requiredLevel: book.requiredLevel,
  estimatedReadTime: book.estimatedReadTime,
  wordCount: book.wordCount,
  pageCount: book.pageCount,
  reviewsCount: book.reviewsCount,
  averageRating: book.averageRating,
  totalReads: book.totalReads,
  isInitialBook: book.isInitialBook,
  createdAt: book.createdAt.toISOString(),
});

/**
 * Books List Endpoint
 * GET /api/books
 * 
 * Retorna lista de todos os livros ativos
 * Pode ser filtrado por query parameters (opcional)
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
    // Query parameters opcionais para filtros
    const { 
      genre, 
      level, 
      limit = '50', 
      page = '1',
      search 
    } = req.query;

    // Constrói filtros dinamicamente
    const where: any = {
      active: true, // Só livros ativos
    };

    // Filtro por gênero
    if (genre && typeof genre === 'string') {
      where.genre = {
        contains: genre,
        mode: 'insensitive'
      };
    }

    // Filtro por nível requerido
    if (level && typeof level === 'string') {
      const levelNumber = parseInt(level);
      if (!isNaN(levelNumber)) {
        where.requiredLevel = {
          lte: levelNumber // Livros até o nível do usuário
        };
      }
    }

    // Filtro por busca (título ou autor)
    if (search && typeof search === 'string') {
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          author: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Paginação
    const limitNumber = Math.min(parseInt(limit as string) || 50, 100); // Máximo 100
    const pageNumber = parseInt(page as string) || 1;
    const skip = (pageNumber - 1) * limitNumber;

    // Busca livros no banco
    const [books, totalBooks] = await Promise.all([
      prisma.book.findMany({
        where,
        select: {
          id: true,
          title: true,
          author: true,
          genre: true,
          synopsis: true,
          coverImage: true,
          baseRewardMoney: true,
          rewardPoints: true,
          requiredLevel: true,
          estimatedReadTime: true,
          wordCount: true,
          pageCount: true,
          reviewsCount: true,
          averageRating: true,
          totalReads: true,
          isInitialBook: true,
          createdAt: true,
        },
        orderBy: [
          { isInitialBook: 'desc' }, // Livros iniciais primeiro
          { createdAt: 'desc' }      // Depois por data
        ],
        take: limitNumber,
        skip: skip
      }),
      
      prisma.book.count({ where }) // Total para paginação
    ]);

    // Formata resposta
    const formattedBooks = books.map(formatBookForList);
    
    // Calcula informações de paginação
    const totalPages = Math.ceil(totalBooks / limitNumber);
    const hasNextPage = pageNumber < totalPages;
    const hasPrevPage = pageNumber > 1;

    return sendSuccess(res, {
      books: formattedBooks,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalBooks,
        hasNextPage,
        hasPrevPage,
        limit: limitNumber
      }
    }, `${books.length} livros encontrados`);

  } catch (error) {
    console.error('Books list error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await disconnectDatabase();
  }
}