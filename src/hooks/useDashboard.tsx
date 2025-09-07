// src/hooks/useDashboard.tsx - MIGRADO PARA API REAL
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { apiService } from '../services/api';

interface DashboardStats {
  booksRead: number;
  weeklyEarnings: number;
  totalWithdrawn: number;
}

interface DashboardProgress {
  currentLevel: number;
  pointsToNextLevel: number;
  progressPercentage: number;
}

interface BookFromAPI {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  baseRewardMoney: number;
  requiredLevel: number;
  reviewsCount: number;
  averageRating: number;
  createdAt: string;
  // Campos calculados no frontend
  rewardMoney?: number;
  isAvailable?: boolean;
  estimatedTime?: string;
  coverColor?: string;
  estimatedReadTime?: number;
  isInitialBook?: boolean;
}

interface DashboardState {
  stats: DashboardStats;
  progress: DashboardProgress;
  availableBooks: BookFromAPI[];
  lockedBooks: BookFromAPI[];
  isLoading: boolean;
  error: string | null;
}

// Mock para stats e progress (até migrarmos essas APIs também)
const MOCK_STATS: DashboardStats = {
  booksRead: 0,
  weeklyEarnings: 0,
  totalWithdrawn: 0,
};

const MOCK_PROGRESS: DashboardProgress = {
  currentLevel: 0,
  pointsToNextLevel: 1000,
  progressPercentage: 0,
};

// Cores para capas dos livros
const BOOK_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald  
  '#f59e0b', // amber
  '#ef4444', // red
  '#8b5cf6', // violet
  '#06b6d4', // cyan
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

  const loadDataFromAPI = async () => {
    if (!user) {
      setState(prev => ({ ...prev, isLoading: false }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('📚 Carregando dados reais da API...');

      const booksResponse = await apiService.getBooks();
      
      if (!booksResponse.success || !booksResponse.data) {
        throw new Error(booksResponse.error || 'Erro ao buscar livros');
      }

      const books = booksResponse.data.books;
      console.log('📖 Livros carregados da API:', books.length);

      // Processar livros com dados calculados
      const userLevel = user?.level || 0;
      const userPlan = user?.planType || 'free';
      
      const processedBooks = books.map((book: any, index: number) => ({
        ...book,
        // Calcular recompensa baseada no plano do usuário
        rewardMoney: calculateUserReward(book.baseRewardMoney || 10000, userPlan),
        // Definir disponibilidade baseada no nível
        isAvailable: book.requiredLevel <= userLevel,
        // Estimar tempo de leitura (converter de segundos para minutos)
        estimatedTime: book.estimatedReadTime 
          ? `${Math.ceil(book.estimatedReadTime / 60)} min`
          : '5 min',
        // Cor da capa
        coverColor: BOOK_COLORS[index % BOOK_COLORS.length],
        // Tempo em segundos para componentes que precisam
        estimatedReadTime: book.estimatedReadTime || 300,
        // Flag para livros iniciais
        isInitialBook: book.isInitialBook || false
      }));

      // Separar livros disponíveis e bloqueados
      const availableBooks = processedBooks.filter((book: BookFromAPI) => {
        return book.requiredLevel <= userLevel;
      });
      
      const lockedBooks = processedBooks.filter((book: BookFromAPI) => {
        return book.requiredLevel > userLevel;
      });

      console.log('✅ Livros disponíveis:', availableBooks.length);
      console.log('🔒 Livros bloqueados:', lockedBooks.length);

      setState({
        stats: extractStatsFromUser(user),
        progress: calculateProgressFromUser(user),
        availableBooks,
        lockedBooks,
        isLoading: false,
        error: null,
      });

    } catch (error: any) {
      console.error('❌ Erro ao carregar dados da API:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Erro ao carregar dados do dashboard'
      }));
    }
  };

  const calculateUserReward = (baseRewardMoney: number, planType: 'free' | 'premium'): number => {
    // baseRewardMoney está em centavos, converter para reais
    const rewardInReais = baseRewardMoney / 100;
    
    if (planType === 'premium') {
      // Premium tem 50% a mais
      return rewardInReais * 1.5;
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

  const calculateProgressFromUser = (userData: any): DashboardProgress => {
    const currentLevel = userData?.level || 0;
    const currentPoints = userData?.points || 0;
    
    // Cada nível precisa de 1000 pontos
    const pointsPerLevel = 1000;
    const pointsInCurrentLevel = currentPoints % pointsPerLevel;
    const pointsToNextLevel = pointsPerLevel - pointsInCurrentLevel;
    const progressPercentage = (pointsInCurrentLevel / pointsPerLevel) * 100;
    
    return {
      currentLevel,
      pointsToNextLevel,
      progressPercentage: Math.round(progressPercentage)
    };
  };

  const refetch = () => {
    loadDataFromAPI();
  };

  useEffect(() => {
    loadDataFromAPI();
  }, [user?.id]);

  return {
    ...state,
    refetch,
  };
};