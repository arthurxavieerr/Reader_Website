// src/types/index.ts - ATUALIZADO COM CAMPO CPF

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf?: string; // NOVO CAMPO CPF
  level: number;
  points: number;
  balance: number;
  planType: 'FREE' | 'PREMIUM';
  isAdmin: boolean;
  onboardingCompleted: boolean;
  commitment?: 'COMMITTED' | 'CURIOUS';
  incomeRange?: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNEMPLOYED';
  profileImage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  cpf?: string; // NOVO CAMPO CPF
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  cpf?: string; // NOVO CAMPO CPF
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
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'REWARD' | 'BONUS' | 'REFUND';
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REJECTED';
  amount: number;
  currency: string;
  pixKey?: string;
  pixKeyType?: 'CPF' | 'EMAIL' | 'PHONE' | 'RANDOM';
  nivusPayTransactionId?: string;
  nivusPayCustomId?: string;
  nivusPayStatus?: string;
  pixData?: any;
  bankAccount?: any;
  adminNotes?: string;
  processedBy?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
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
  commitment: 'COMMITTED' | 'CURIOUS';
  incomeRange: 'LOW' | 'MEDIUM' | 'HIGH' | 'UNEMPLOYED';
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface AuthActions {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  updateProfile: (data: UpdateProfileData) => Promise<void>;
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
  message?: string;
}

// Utility types for forms
export interface FormErrors {
  [key: string]: string | undefined;
}

export interface CPFValidation {
  isValid: boolean;
  message?: string;
}

export interface PhoneValidation {
  isValid: boolean;
  formatted: string;
  message?: string;
}