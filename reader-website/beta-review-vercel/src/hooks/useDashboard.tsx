// src/hooks/useDashboard.ts
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import apiService from '../services/api';

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
    rewardMoney: 100, // R$ 1,00 para free (baseRewardMoney: 10000 centavos / 100)
    reviewsCount: 84288,
    coverColor: '#895aed',
    isAvailable: true,
    estimatedTime: '7 min',
    synopsis: 'Descubra o conto mitológico de Pandora, que nos revela a origem dos males do mundo e o dom da esperança.',
    baseRewardMoney: 10000,
    estimatedReadTime: 420,
    isInitialBook: true
  },
  {
    id: '2',
    title: 'O Príncipe e a Gata',
    author: 'Charles Perrault',
    genre: 'Conto de fadas',
    rewardMoney: 200, // R$ 2,00 para free
    reviewsCount: 12947,
    coverColor: '#dc2626',
    isAvailable: true,
    estimatedTime: '7 min',
    synopsis: 'Era uma vez um rei, pai de três corajosos príncipes, que estava em dúvida sobre qual deles deveria lhe suceder no trono.',
    baseRewardMoney: 20000,
    estimatedReadTime: 420,
    isInitialBook: true
  },
  {
    id: '3',
    title: 'O Banqueiro Anarquista',
    author: 'Fernando Pessoa',
    genre: 'Ensaio filosófico',
    rewardMoney: 300, // R$ 3,00 para free
    reviewsCount: 11698,
    coverColor: '#059669',
    isAvailable: true,
    estimatedTime: '93 min',
    synopsis: 'Ensaio filosófico em forma de diálogo, onde um banqueiro se declara anarquista.',
    baseRewardMoney: 30000,
    estimatedReadTime: 5580,
    isInitialBook: true
  },
  {
    id: '4',
    title: 'De Quanta Terra um Homem Precisa?',
    author: 'Leon Tolstói',
    genre: 'Conto filosófico/moral',
    rewardMoney: 500, // R$ 5,00 para free
    reviewsCount: 8234,
    coverColor: '#f59e0b',
    isAvailable: false, // Não é inicial, requer nível
    estimatedTime: '18 min',
    synopsis: 'Uma reflexão profunda sobre ganância, simplicidade e os limites do desejo humano.',
    baseRewardMoney: 50000,
    estimatedReadTime: 1100,
    isInitialBook: true,
    requiredLevel: 0 // Deveria ser disponível mas vamos tratar como bloqueado por enquanto
  },
  {
    id: '5',
    title: 'O Último Detetive de Baker Street',
    author: 'Eduardo Santos',
    genre: 'Mistério Urbano',
    rewardMoney: 800, // R$ 8,00 para premium
    reviewsCount: 5621,
    coverColor: '#8b5cf6',
    isAvailable: false,
    estimatedTime: '14 min',
    synopsis: 'Mistérios sombrios nas ruas de Londres com um detetive excepcional.',
    baseRewardMoney: 80000,
    estimatedReadTime: 840,
    requiredLevel: 1,
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

  const isRateLimited = (error: any): boolean => {
    return error?.message?.includes('Rate limit') || 
           error?.message?.includes('Failed to fetch') ||
           error?.message?.includes('NetworkError') ||
           error?.name === 'TypeError' ||
           error?.status === 429;
  };

  const fetchDashboardData = async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Tentar buscar dados reais da API
      const [userResponse, booksResponse] = await Promise.all([
        apiService.getUserData(),
        apiService.getBooks()
      ]);

      if (userResponse.success && booksResponse.success) {
        console.log('Dashboard data loaded from API');
        
        const userData = userResponse.data?.user;
        const booksData = booksResponse.data?.books || [];
        
        // Processar livros da API
        const processedBooks = booksData.map((book: any) => ({
          ...book,
          rewardMoney: calculateUserReward(book.baseRewardMoney, user.planType),
          coverColor: getBookCoverColor(book.genre),
          estimatedTime: formatEstimatedTime(book.estimatedReadTime || 480),
          reviewsCount: book.reviewsCount || Math.floor(Math.random() * 50000) + 10000
        }));

        // Separar livros disponíveis e bloqueados baseado no nível do usuário
        const userLevel = userData?.level || user.level || 0;
        const availableBooks = processedBooks.filter((book: any) => 
          book.isInitialBook === true || (book.requiredLevel || 0) <= userLevel
        );
        const lockedBooks = processedBooks.filter((book: any) => 
          book.isInitialBook === false && (book.requiredLevel || 0) > userLevel
        );

        setState({
          stats: extractStatsFromUser(userData),
          progress: MOCK_PROGRESS, // Por enquanto mock até implementar tracking
          availableBooks,
          lockedBooks,
          isLoading: false,
          error: null,
        });

        return;
      }
    } catch (error: any) {
      console.warn('Dashboard API error:', error);
      
      // Se for rate limit ou erro de rede, usar dados mock
      if (isRateLimited(error)) {
        console.log('Using mock data due to rate limit/network error');
        useMockData();
        return;
      }
    }

    // Fallback para dados mock
    console.log('Using fallback mock data');
    useMockData();
  };

  const useMockData = () => {
    // Filtrar livros baseado no nível do usuário
    const userLevel = user?.level || 0;
    const userPlan = user?.planType || 'free';
    
    // Processar livros mock
    const processedBooks = MOCK_BOOKS.map(book => ({
      ...book,
      rewardMoney: calculateUserReward(book.baseRewardMoney || 10000, userPlan),
      reviewsCount: book.reviewsCount || Math.floor(Math.random() * 50000) + 10000
    }));

    // Por enquanto, usar isInitialBook e requiredLevel do mock
    const availableBooks = processedBooks.filter(book => {
      if (book.isInitialBook === true) return true;
      if (book.requiredLevel !== undefined) return book.requiredLevel <= userLevel;
      return false;
    });
    
    const lockedBooks = processedBooks.filter(book => {
      if (book.isInitialBook === false) return true;
      if (book.requiredLevel !== undefined) return book.requiredLevel > userLevel;
      return false;
    });

    setState({
      stats: MOCK_STATS,
      progress: MOCK_PROGRESS,
      availableBooks,
      lockedBooks,
      isLoading: false,
      error: null,
    });
  };

  const calculateUserReward = (baseRewardMoney: number, planType: 'free' | 'premium'): number => {
    // baseRewardMoney está em centavos, precisamos converter para reais
    // Para usuários free: usar valor base / 100 (centavos para reais)  
    // Para premium: poderia ser multiplicado por algum fator
    
    const rewardInReais = baseRewardMoney / 100;
    
    if (planType === 'premium') {
      // Premium poderia ter multiplicador, mas por enquanto usar o mesmo
      return rewardInReais;
    }
    
    return rewardInReais;
  };

  const extractStatsFromUser = (userData: any): DashboardStats => {
    // Por enquanto retornar mock, quando implementar tracking usar dados reais
    return {
      booksRead: userData?.booksCompleted || 0,
      weeklyEarnings: userData?.weeklyEarnings || 0,
      totalWithdrawn: userData?.totalWithdrawn || 0,
    };
  };

  const getBookCoverColor = (genre: string): string => {
    const colorMap: Record<string, string> = {
      'Mitologia grega': '#895aed',
      'Conto de fadas': '#dc2626', 
      'Ensaio filosófico': '#059669',
      'Conto filosófico/moral': '#f59e0b',
      'Conto filosófico/moral.': '#f59e0b', // Com ponto final
      'Mistério Urbano': '#8b5cf6',
      'Fantasia Épica': '#667eea',
      'Thriller Tecnológico': '#dc2626',
      'Romance Contemporâneo': '#059669',
    };
    
    return colorMap[genre] || '#64748b';
  };

  const formatEstimatedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = Math.round(minutes % 60);
    
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    
    return `${hours}h ${remainingMinutes}min`;
  };

  const refetch = () => {
    fetchDashboardData();
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user?.id]);

  return {
    ...state,
    refetch,
  };
};