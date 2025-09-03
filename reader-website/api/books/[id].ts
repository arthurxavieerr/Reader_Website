import { VercelRequest, VercelResponse } from '@vercel/node';
import { setCors } from '../_utils/cors';
import { prisma, disconnectDatabase } from '../_utils/database';
import { sendError, sendSuccess } from '../_utils/response';
import { authenticateRequest } from '../_utils/auth';

/**
 * Formata dados completos do livro para resposta
 */
const formatBookDetails = (book: any, userProgress: any = null) => ({
  id: book.id,
  title: book.title,
  author: book.author,
  genre: book.genre,
  synopsis: book.synopsis,
  content: book.content, // Conteúdo completo do livro
  coverImage: book.coverImage,
  baseRewardMoney: book.baseRewardMoney,
  rewardPoints: book.rewardPoints,
  premiumMultiplier: book.premiumMultiplier,
  requiredLevel: book.requiredLevel,
  estimatedReadTime: book.estimatedReadTime,
  wordCount: book.wordCount,
  pageCount: book.pageCount,
  reviewsCount: book.reviewsCount,
  averageRating: book.averageRating,
  totalReads: book.totalReads,
  isInitialBook: book.isInitialBook,
  conversionBook: book.conversionBook,
  createdAt: book.createdAt.toISOString(),
  updatedAt: book.updatedAt.toISOString(),
  
  // Progresso do usuário (se autenticado)
  userProgress: userProgress ? {
    hasRead: userProgress.hasReceivedReward,
    startedAt: userProgress.firstReadingDate?.toISOString(),
    completedAt: userProgress.validReadingDate?.toISOString(),
    hasReviewed: !!userProgress.review,
    userRating: userProgress.review?.rating,
    userComment: userProgress.review?.comment
  } : null
});

/**
 * Book Details Endpoint
 * GET /api/books/[id]
 * 
 * Retorna detalhes completos de um livro específico
 * Se usuário estiver autenticado, inclui progresso pessoal
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
    // Extrai ID do livro da URL
    const { id } = req.query;

    if (!id || typeof id !== 'string') {
      return sendError(res, 400, 'ID do livro é obrigatório');
    }

    // Busca o livro no banco
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        reviews: {
          take: 5, // Últimas 5 avaliações
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            rating: true,
            comment: true,
            donationAmount: true,
            createdAt: true,
            user: {
              select: {
                name: true,
                level: true,
                profileImage: true
              }
            }
          }
        }
      }
    });

    if (!book) {
      return sendError(res, 404, 'Livro não encontrado');
    }

    // Verifica se livro está ativo
    if (!book.active) {
      return sendError(res, 403, 'Este livro não está mais disponível');
    }

    // Tenta autenticar usuário (opcional)
    const authUser = await authenticateRequest(req);
    let userProgress: any = null; // Alteração: Especifica tipo explicitamente

    // Se usuário autenticado, busca progresso
    if (authUser) {
      const user = await prisma.user.findUnique({
        where: { id: authUser.userId }
      });

      // Verifica se usuário tem nível suficiente
      if (user && user.level < book.requiredLevel) {
        return sendError(res, 403, `Você precisa estar no nível ${book.requiredLevel} para acessar este livro`);
      }

      // Busca progresso de leitura com review separadamente
      const userBookReward = await prisma.userBookReward.findUnique({
        where: {
          userId_bookId: {
            userId: authUser.userId,
            bookId: book.id
          }
        }
      });

      // Se encontrou o progresso, busca a review também
      if (userBookReward) {
        const review = await prisma.review.findFirst({
          where: {
            userId: authUser.userId,
            bookId: book.id
          }
        });

        userProgress = {
          ...userBookReward,
          review: review
        };
      }
    }

    // Formata resposta
    const bookDetails = formatBookDetails(book, userProgress);

    return sendSuccess(res, {
      book: bookDetails,
      recentReviews: book.reviews
    }, 'Detalhes do livro obtidos com sucesso');

  } catch (error) {
    console.error('Book details error:', error);
    return sendError(res, 500, 'Erro interno do servidor');
  } finally {
    await disconnectDatabase();
  }
}