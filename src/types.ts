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