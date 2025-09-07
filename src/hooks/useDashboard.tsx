// src/hooks/useDashboard.tsx - VERSÃO CORRIGIDA SÓ COM MOCK
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

interface DashboardStats {
  booksRead: number;
  weeklyEarnings: number;
  totalWithdrawn: number;
}

interface DashboardProgress {
  dailyBooks: number;
  dailyReviews: number;
  dailyEarnings: number;
}

interface DashboardBook {
  id: string;
  title: string;
  author: string;
  genre: string;
  rewardMoney: number;
  reviewsCount: number;
  coverColor: string;
  isAvailable: boolean;
  estimatedTime: string;
  synopsis?: string;
  requiredLevel?: number;
  baseRewardMoney?: number;
  estimatedReadTime?: number;
  isInitialBook?: boolean;
}

interface DashboardState {
  stats: DashboardStats;
  progress: DashboardProgress;
  availableBooks: DashboardBook[];
  lockedBooks: DashboardBook[];
  isLoading: boolean;
  error: string | null;
}

// Mock data baseado no seed.ts
const MOCK_STATS: DashboardStats = {
  booksRead: 0,
  weeklyEarnings: 0,
  totalWithdrawn: 0,
};

const MOCK_PROGRESS: DashboardProgress = {
  dailyBooks: 0,
  dailyReviews: 0,
  dailyEarnings: 0,
};

// Dados dos livros baseados no seed.ts
const MOCK_BOOKS: DashboardBook[] = [
  {
    id: '1',
    title: 'A Caixa de Pandora',
    author: 'Hesíodo',
    genre: 'Mitologia grega',
    rewardMoney: 100,
    reviewsCount: 84288,
    coverColor: '#895aed',
    isAvailable: true,
    estimatedTime: '7 min',
    synopsis: 'Descubra o conto mitológico de Pandora, que nos revela a origem dos males do mundo e o dom da esperança.',
    baseRewardMoney: 10000,
    estimatedReadTime: 420,
    isInitialBook: true,
    requiredLevel: 0
  },
  {
    id: '2',
    title: 'O Príncipe e a Gata',
    author: 'Charles Perrault',
    genre: 'Conto de fadas',
    rewardMoney: 200,
    reviewsCount: 12947,
    coverColor: '#dc2626',
    isAvailable: true,
    estimatedTime: '7 min',
    synopsis: 'Era uma vez um rei, pai de três corajosos príncipes, que estava em dúvida sobre qual deles deveria lhe suceder no trono.',
    baseRewardMoney: 20000,
    estimatedReadTime: 420,
    isInitialBook: true,
    requiredLevel: 0
  },
  {
    id: '3',
    title: 'O Banqueiro Anarquista',
    author: 'Fernando Pessoa',
    genre: 'Ensaio filosófico',
    rewardMoney: 300,
    reviewsCount: 11698,
    coverColor: '#059669',
    isAvailable: true,
    estimatedTime: '93 min',
    synopsis: 'Ensaio filosófico em forma de diálogo, onde um banqueiro se declara anarquista.',
    baseRewardMoney: 30000,
    estimatedReadTime: 5580,
    isInitialBook: true,
    requiredLevel: 0
  },
  {
    id: '4',
    title: 'De Quanta Terra um Homem Precisa?',
    author: 'Liev Tolstói',
    genre: 'Literatura russa',
    rewardMoney: 500,
    reviewsCount: 8754,
    coverColor: '#f59e0b',
    isAvailable: true,
    estimatedTime: '18 min',
    synopsis: 'Um conto sobre ambição e as verdadeiras necessidades humanas.',
    baseRewardMoney: 50000,
    estimatedReadTime: 1100,
    isInitialBook: true,
    requiredLevel: 0
  },
  {
    id: '5',
    title: 'O Último Detetive de Baker Street',
    author: 'Eduardo Santos',
    genre: 'Mistério Urbano',
    rewardMoney: 800,
    reviewsCount: 5621,
    coverColor: '#8b5cf6',
    isAvailable: false,
    estimatedTime: '14 min',
    synopsis: 'Mistérios sombrios nas ruas de Londres com um detetive excepcional.',
    baseRewardMoney: 80000,
    estimatedReadTime: 840,
    requiredLevel: 1,
    isInitialBook: false
  },
  {
    id: '6',
    title: 'Suspeito Comum',
    author: 'Maria Silva',
    genre: 'Thriller psicológico',
    rewardMoney: 600,
    reviewsCount: 3245,
    coverColor: '#dc2626',
    isAvailable: false,
    estimatedTime: '12 min',
    synopsis: 'Um thriller que questiona a natureza da culpa e inocência.',
    baseRewardMoney: 60000,
    estimatedReadTime: 720,
    requiredLevel: 2,
    isInitialBook: false
  }
];

export const useDashboard = () => {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    stats: MOCK_STATS,
    progress: MOCK_PROGRESS,
    availableBooks: [],
    lockedBooks: [],
    isLoading: true,
    error: null,
  });

  const loadMockData = async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    // Simular delay da API
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      console.log('📚 Carregando dados mock do dashboard');

      // Filtrar livros baseado no nível do usuário
      const userLevel = user?.level || 0;
      const userPlan = user?.planType || 'free';
      
      // Processar livros mock
      const processedBooks = MOCK_BOOKS.map(book => ({
        ...book,
        rewardMoney: calculateUserReward(book.baseRewardMoney || 10000, userPlan),
        reviewsCount: book.reviewsCount || Math.floor(Math.random() * 50000) + 10000
      }));

      // Separar livros disponíveis e bloqueados
      const availableBooks = processedBooks.filter(book => {
        if (book.isInitialBook === true) return true;
        if (book.requiredLevel !== undefined) return book.requiredLevel <= userLevel;
        return false;
      });
      
      const lockedBooks = processedBooks.filter(book => {
        if (book.isInitialBook === false && book.requiredLevel !== undefined) {
          return book.requiredLevel > userLevel;
        }
        return false;
      });

      setState({
        stats: extractStatsFromUser(user),
        progress: MOCK_PROGRESS,
        availableBooks,
        lockedBooks,
        isLoading: false,
        error: null,
      });

    } catch (error: any) {
      console.error('Erro ao carregar dados mock:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Erro ao carregar dados do dashboard'
      }));
    }
  };

  const calculateUserReward = (baseRewardMoney: number, planType: 'free' | 'premium'): number => {
    // baseRewardMoney está em centavos, converter para reais
    const rewardInReais = baseRewardMoney / 100;
    
    if (planType === 'premium') {
      // Premium poderia ter multiplicador
      return rewardInReais * 1.5; // 50% a mais
    }
    
    return rewardInReais;
  };

  const extractStatsFromUser = (userData: any): DashboardStats => {
    return {
      booksRead: userData?.booksCompleted || 0,
      weeklyEarnings: userData?.weeklyEarnings || 0,
      totalWithdrawn: userData?.totalWithdrawn || 0,
    };
  };

  const refetch = () => {
    loadMockData();
  };

  useEffect(() => {
    loadMockData();
  }, [user?.id]);

  return {
    ...state,
    refetch,
  };
};