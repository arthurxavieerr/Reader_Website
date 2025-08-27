import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { BUSINESS_CONFIG, FRAUD_CONFIG } from '../types';

const prisma = new PrismaClient();

// Converter livro do banco para formato público
const toPublicBook = (book: any, userLevel: number = 0, hasReward: boolean = false) => {
  const isAvailable = book.requiredLevel <= userLevel;
  
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    genre: book.genre,
    synopsis: book.synopsis,
    coverImage: book.coverImage,
    rewardMoney: book.baseRewardMoney,
    rewardPoints: book.rewardPoints,
    reviewsCount: book.reviewsCount,
    averageRating: book.averageRating,
    estimatedReadTime: Math.ceil(book.estimatedReadTime / 60), // converter para minutos
    difficulty: book.requiredLevel === 0 ? 'Fácil' : book.requiredLevel === 1 ? 'Médio' : 'Difícil',
    isAvailable,
    requiredLevel: book.requiredLevel,
    hasReceivedReward: hasReward,
    createdAt: book.createdAt.toISOString()
  };
};

// GET /api/books - Listar livros disponíveis
export const getBooks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    let userLevel = 0;
    let userRewards: any[] = [];

    // Se usuário está logado, buscar seu nível e recompensas já recebidas
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { level: true }
      });
      userLevel = user?.level || 0;

      // Buscar livros já recompensados
      userRewards = await prisma.userBookReward.findMany({
        where: { userId },
        select: { bookId: true, hasReceivedReward: true }
      });
    }

    // Buscar todos os livros ativos
    const books = await prisma.book.findMany({
      where: { active: true },
      orderBy: [
        { requiredLevel: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    // Converter para formato público
    const publicBooks = books.map(book => {
      const userReward = userRewards.find(r => r.bookId === book.id);
      const hasReward = userReward?.hasReceivedReward || false;
      
      return toPublicBook(book, userLevel, hasReward);
    });

    // Separar por categorias
    const availableBooks = publicBooks.filter(book => book.isAvailable);
    const lockedBooks = publicBooks.filter(book => !book.isAvailable);

    res.json({
      success: true,
      data: {
        available: availableBooks,
        locked: lockedBooks,
        userLevel,
        totalBooks: books.length
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar livros:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/books/:id - Detalhes de um livro específico
export const getBook = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // Buscar livro
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            user: {
              select: { name: true, level: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Últimas 10 avaliações
        }
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livro não encontrado'
      });
    }

    if (!book.active) {
      return res.status(404).json({
        success: false,
        error: 'Livro não está disponível'
      });
    }

    let userLevel = 0;
    let hasReward = false;
    let canRead = true;

    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { level: true }
      });
      userLevel = user?.level || 0;

      // Verificar se já recebeu recompensa
      const userReward = await prisma.userBookReward.findUnique({
        where: { 
          userId_bookId: { userId, bookId: id }
        }
      });
      hasReward = userReward?.hasReceivedReward || false;

      // Verificar se pode ler (nível suficiente)
      canRead = book.requiredLevel <= userLevel;
    }

    const publicBook = {
      ...toPublicBook(book, userLevel, hasReward),
      canRead,
      reviews: book.reviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt.toISOString(),
        user: {
          name: review.user.name,
          level: review.user.level
        }
      }))
    };

    res.json({
      success: true,
      data: { book: publicBook }
    });

  } catch (error) {
    logger.error('Erro ao buscar livro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// GET /api/books/:id/content - Conteúdo do livro (protegido)
export const getBookContent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id!; // Middleware garante que existe

    // Verificar se livro existe e está ativo
    const book = await prisma.book.findUnique({
      where: { id, active: true },
      select: { 
        id: true, 
        title: true, 
        content: true, 
        requiredLevel: true,
        wordCount: true,
        estimatedReadTime: true
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livro não encontrado'
      });
    }

    // Verificar nível do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true }
    });

    if (!user || user.level < book.requiredLevel) {
      return res.status(403).json({
        success: false,
        error: 'Nível insuficiente para acessar este livro'
      });
    }

    res.json({
      success: true,
      data: {
        id: book.id,
        title: book.title,
        content: book.content,
        wordCount: book.wordCount,
        estimatedReadTime: book.estimatedReadTime
      }
    });

  } catch (error) {
    logger.error('Erro ao buscar conteúdo do livro:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/books/:id/start-reading - Iniciar sessão de leitura
export const startReading = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id!;

    // Verificar se livro existe
    const book = await prisma.book.findUnique({
      where: { id, active: true }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livro não encontrado'
      });
    }

    // Verificar se já existe sessão ativa
    const activeSession = await prisma.readingSession.findFirst({
      where: {
        userId,
        bookId: id,
        endTime: null
      }
    });

    if (activeSession) {
      return res.json({
        success: true,
        data: {
          sessionId: activeSession.id,
          message: 'Sessão já estava ativa'
        }
      });
    }

    // Criar nova sessão de leitura
    const session = await prisma.readingSession.create({
      data: {
        userId,
        bookId: id,
        startTime: new Date()
      }
    });

    // Log da ação
    logger.info(`Leitura iniciada: ${book.title}`, {
      userId,
      bookId: id,
      sessionId: session.id
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        startTime: session.startTime.toISOString()
      }
    });

  } catch (error) {
    logger.error('Erro ao iniciar leitura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// POST /api/books/:id/complete - Completar leitura e processar recompensa
export const completeReading = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id!;
    const { sessionId, readingTime, rating, comment, donationAmount } = req.body;

    // Validações básicas
    if (!sessionId || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Dados inválidos'
      });
    }

    // Buscar sessão de leitura
    const session = await prisma.readingSession.findUnique({
      where: { id: sessionId },
      include: { book: true, user: true }
    });

    if (!session || session.userId !== userId || session.bookId !== id) {
      return res.status(404).json({
        success: false,
        error: 'Sessão de leitura inválida'
      });
    }

    if (session.endTime) {
      return res.status(400).json({
        success: false,
        error: 'Sessão já foi finalizada'
      });
    }

    // Verificar se já recebeu recompensa para este livro
    let userBookReward = await prisma.userBookReward.findUnique({
      where: { 
        userId_bookId: { userId, bookId: id }
      }
    });

    if (userBookReward?.hasReceivedReward) {
      return res.status(400).json({
        success: false,
        error: 'Recompensa já foi recebida para este livro'
      });
    }

    // Validação anti-fraude básica
    const minReadingTime = session.book.wordCount / FRAUD_CONFIG.MAX_READING_SPEED * 60 * 1000; // ms
    const actualReadingTime = readingTime || (Date.now() - session.startTime.getTime());

    const isFraud = actualReadingTime < minReadingTime;
    const fraudScore = isFraud ? 100 : 0;

    // Finalizar sessão
    await prisma.readingSession.update({
      where: { id: sessionId },
      data: {
        endTime: new Date(),
        totalTime: actualReadingTime,
        activeTime: actualReadingTime,
        isValid: !isFraud,
        fraudScore,
        decision: isFraud ? 'REJECTED' : 'APPROVED',
        canReceiveReward: !isFraud,
        rewardProcessed: true
      }
    });

    // Criar ou atualizar controle de recompensa
    if (!userBookReward) {
      userBookReward = await prisma.userBookReward.create({
        data: {
          userId,
          bookId: id,
          readingAttempts: 1,
          fraudAttempts: isFraud ? 1 : 0
        }
      });
    } else {
      await prisma.userBookReward.update({
        where: { id: userBookReward.id },
        data: {
          readingAttempts: { increment: 1 },
          fraudAttempts: isFraud ? { increment: 1 } : undefined
        }
      });
    }

    // Criar avaliação
    const review = await prisma.review.create({
      data: {
        userId,
        bookId: id,
        rating,
        comment: comment || null,
        donationAmount: donationAmount || 0
      }
    });

    // Processar recompensa se válida
    let rewardProcessed = false;
    let earnedMoney = 0;
    let earnedPoints = 0;

    if (!isFraud) {
      // Verificar se usuário pode receber recompensa
      const canReceiveReward = await canUserReceiveBookReward(userId, id);
      
      if (canReceiveReward) {
        const isPremium = session.user.planType === 'PREMIUM';
        const multiplier = isPremium ? session.book.premiumMultiplier : 1;
        
        earnedMoney = session.book.baseRewardMoney * multiplier;
        earnedPoints = session.book.rewardPoints * multiplier;

        // Atualizar saldo do usuário
        await prisma.user.update({
          where: { id: userId },
          data: {
            balance: { increment: earnedMoney },
            points: { increment: earnedPoints }
          }
        });

        // Registrar transação
        await prisma.transaction.create({
          data: {
            userId,
            type: 'EARNING',
            amount: earnedMoney,
            status: 'COMPLETED',
            description: `Recompensa por avaliar "${session.book.title}"`,
            sourceId: sessionId,
            sourceType: 'reading'
          }
        });

        // Marcar recompensa como recebida
        await prisma.userBookReward.update({
          where: { id: userBookReward.id },
          data: {
            hasReceivedReward: true,
            validReadingDate: new Date()
          }
        });

        rewardProcessed = true;
      }
    }

    // Atualizar estatísticas do livro
    await updateBookStats(id);

    // Log da conclusão
    logger.info(`Leitura concluída: ${session.book.title}`, {
      userId,
      bookId: id,
      sessionId,
      rating,
      earnedMoney,
      earnedPoints,
      isFraud,
      rewardProcessed
    });

    res.json({
      success: true,
      data: {
        reviewId: review.id,
        earnedMoney,
        earnedPoints,
        rewardProcessed,
        message: rewardProcessed 
          ? 'Avaliação criada e recompensa processada!' 
          : isFraud 
            ? 'Avaliação criada, mas tempo de leitura muito rápido'
            : 'Avaliação criada, mas recompensa já foi recebida'
      }
    });

  } catch (error) {
    logger.error('Erro ao completar leitura:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
};

// Função auxiliar para verificar se usuário pode receber recompensa
async function canUserReceiveBookReward(userId: string, bookId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { planType: true }
  });

  if (!user) return false;

  // Usuários premium podem receber recompensa de qualquer livro
  if (user.planType === 'PREMIUM') {
    return true;
  }

  // Usuários free só podem receber dos 3 livros iniciais
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    select: { isInitialBook: true }
  });

  return book?.isInitialBook || false;
}

// Função auxiliar para atualizar estatísticas do livro
async function updateBookStats(bookId: string) {
  const reviews = await prisma.review.findMany({
    where: { bookId },
    select: { rating: true }
  });

  if (reviews.length > 0) {
    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    
    await prisma.book.update({
      where: { id: bookId },
      data: {
        reviewsCount: reviews.length,
        averageRating: Math.round(averageRating * 10) / 10 // 1 casa decimal
      }
    });
  }
}