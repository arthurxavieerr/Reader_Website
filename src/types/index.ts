// src/types/index.ts

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: number;
  points: number;
  balance: number;
  planType: 'free' | 'premium';
  isAdmin: boolean;
  onboardingCompleted: boolean;
  commitment?: 'committed' | 'curious';
  incomeRange?: 'low' | 'medium' | 'high' | 'unemployed';
  profileImage?: string | null;
  isSuspended?: boolean;
  suspendedReason?: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  genre: string;
  rewardPoints: number;
  rewardMoney: number;
  active: boolean;
  requiredLevel: number;
  synopsis: string;
  coverImage?: string;
  reviewsCount: number;
  averageRating: number;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string;
  bookId: string;
  rating: number;
  comment?: string;
  donationAmount?: number;
  createdAt: string;
  user: {
    name: string;
    level: number;
  };
}

export interface Reading {
  id: string;
  userId: string;
  bookId: string;
  completed: boolean;
  completedAt?: string;
  startedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'earning' | 'withdrawal' | 'bonus';
  amount: number;
  status: 'pending' | 'completed' | 'failed';
  description: string;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  content: string;
  likes: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  user: {
    name: string;
    level: number;
  };
}

export interface Comment {
  id: string;
  postId: string;
  userId: string;
  content: string;
  createdAt: string;
  user: {
    name: string;
    level: number;
  };
}

export interface Level {
  level: number;
  name: string;
  pointsRequired: number;
  booksUnlocked: number;
  color: string;
  isAdmin?: boolean;
}

export interface OnboardingData {
  commitment: 'committed' | 'curious';
  incomeRange: 'low' | 'medium' | 'high' | 'unemployed';
}

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface BookStats {
  totalBooks: number;
  booksRead: number;
  booksAvailable: number;
  averageRating: number;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  newUsersThisMonth: number;
}

export interface PlatformStats {
  totalWithdrawals: number;
  totalDeposits: number;
  platformRevenue: number;
  conversionRate: number;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}