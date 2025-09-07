// src/types.ts - Tipos TypeScript para o projeto

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  level: number;
  points: number;
  balance: number; // em centavos
  planType: 'free' | 'premium';
  isAdmin: boolean;
  onboardingCompleted: boolean;
  commitment?: 'committed' | 'curious';
  incomeRange?: 'low' | 'medium' | 'high' | 'unemployed';
  profileImage?: string;
  isSuspended: boolean;
  suspendedReason?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  baseRewardMoney: number; // em centavos
  rewardPoints: number;
  requiredLevel: number;
  reviewsCount: number;
  averageRating: number;
  estimatedReadTime: number; // em segundos
  wordCount: number;
  pageCount: number;
  isInitialBook: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface DashboardStats {
  booksRead: number;
  weeklyEarnings: number;
  totalWithdrawn: number;
}

export interface DashboardProgress {
  currentLevel: number;
  pointsToNextLevel: number;
  progressPercentage: number;
}

// Constantes de níveis
export const LEVELS = [
  { level: 0, name: 'Iniciante', color: '#94a3b8', minPoints: 0 },
  { level: 1, name: 'Leitor', color: '#3b82f6', minPoints: 1000 },
  { level: 2, name: 'Avaliador', color: '#10b981', minPoints: 2500 },
  { level: 3, name: 'Crítico', color: '#f59e0b', minPoints: 5000 },
  { level: 4, name: 'Especialista', color: '#ef4444', minPoints: 10000 },
  { level: 5, name: 'Mestre', color: '#8b5cf6', minPoints: 20000 },
];

// Funções utilitárias para níveis
export const getLevelInfo = (level: number) => {
  return LEVELS.find(l => l.level === level) || LEVELS[0];
};

export const getNextLevelInfo = (level: number) => {
  return LEVELS.find(l => l.level === level + 1) || LEVELS[LEVELS.length - 1];
};