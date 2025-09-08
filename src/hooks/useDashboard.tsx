// src/hooks/useDashboard.tsx - USANDO DADOS REAIS DA API
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiService } from '../services/api';

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
  averageRating?: number;
}

interface DashboardState {
  stats: DashboardStats;
  progress: DashboardProgress;
  availableBooks: DashboardBook[];
  lockedBooks: DashboardBook[];
  isLoading: boolean;
  error: string | null;
}

export const useDashboard = () => {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    stats: {
      booksRead: 0,
      weeklyEarnings: 0,
      totalWithdrawn: 0,
    },
    progress: {
      dailyBooks: 0,
      dailyReviews: 0,
      dailyEarnings: 0,
    },
    availableBooks: [],
    lockedBooks: [],
    isLoading: true,
    error: null,
  });

  const loadDashboardData = async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('📊 Carregando dados do dashboard da API...');

      // Buscar livros da API
      const booksResponse = await apiService.getBooks();
      
      if (!booksResponse.success || !booksResponse.data?.books) {
        throw new Error('Erro ao carregar livros da API');
      }

      const apiBooks = booksResponse.data.books;
      console.log(`✅ ${apiBooks.length} livros carregados da API para o dashboard`);

      // Processar livros da API
      const userLevel = user?.level || 0;
      const userPlan = user?.planType || 'FREE';

      const processedBooks = apiBooks.map(book => ({
        id: book.id,
        title: book.title,
        author: book.author,
        genre: book.genre,
        synopsis: book.synopsis,
        rewardMoney: calculateUserReward(book.baseRewardMoney || 10000, userPlan),
        reviewsCount: book.reviewsCount || 0,
        averageRating: book.averageRating || 0,
        baseRewardMoney: book.baseRewardMoney,
        requiredLevel: book.requiredLevel || 0,
        estimatedReadTime: book.estimatedReadTime || 600, // 10 minutos em segundos
        estimatedTime: formatEstimatedTime(book.estimatedReadTime || 600),
        coverColor: generateCoverColor(book.genre),
        isAvailable: (book.requiredLevel || 0) <= userLevel
      }));

      // Separar livros disponíveis e bloqueados
      const availableBooks = processedBooks.filter(book => book.isAvailable);
      const lockedBooks = processedBooks.filter(book => !book.isAvailable);

      // Extrair estatísticas do usuário
      const stats = extractStatsFromUser(user);

      // Progress baseado nas estatísticas atuais (pode ser expandido futuramente)
      const progress = {
        dailyBooks: 0, // Pode ser calculado baseado em reading sessions do dia
        dailyReviews: 0, // Pode ser calculado baseado em reviews do dia
        dailyEarnings: 0, // Pode ser calculado baseado em earnings do dia
      };

      setState({
        stats,
        progress,
        availableBooks,
        lockedBooks,
        isLoading: false,
        error: null,
      });

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados do dashboard:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao carregar dados do dashboard'
      }));
    }
  };

  const calculateUserReward = (baseRewardMoney: number, planType: string): number => {
    // baseRewardMoney está em centavos, converter para reais
    const rewardInReais = baseRewardMoney / 100;
    
    if (planType === 'PREMIUM') {
      // Premium tem multiplicador de 1.5x
      return Math.floor(rewardInReais * 1.5);
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

  const formatEstimatedTime = (timeInSeconds: number): string => {
    const minutes = Math.ceil(timeInSeconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}min`;
    }
  };

  const generateCoverColor = (genre: string): string => {
    // Gerar cores baseadas no gênero
    const genreColors: { [key: string]: string } = {
      'Mitologia grega': '#895aed',
      'Conto de fadas': '#dc2626', 
      'Ensaio filosófico': '#059669',
      'Literatura russa': '#f59e0b',
      'Mistério Urbano': '#7c3aed',
      'Thriller psicológico': '#dc2626',
      'Romance': '#ec4899',
      'Ficção científica': '#06b6d4',
      'Terror': '#1f2937',
      'Fantasia': '#10b981',
      'Drama': '#6366f1',
      'Comédia': '#fbbf24',
    };

    return genreColors[genre] || '#6b7280'; // Cor padrão cinza
  };

  const refetch = () => {
    loadDashboardData();
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  return {
    ...state,
    refetch,
  };
};