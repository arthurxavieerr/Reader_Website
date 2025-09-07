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
  createdAt: string;
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
  isAdmin?: boolean; // Nova propriedade para identificar nível admin
}

export interface OnboardingData {
  commitment: 'committed' | 'curious';
  incomeRange: 'low' | 'medium' | 'high' | 'unemployed';
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
  updateProfile: (data: Partial<User>) => Promise<void>;
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
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Constants
export const INCOME_RANGES = {
  low: 'R$ 1.000 - R$ 10.000',
  medium: 'R$ 10.000 - R$ 50.000',
  high: 'R$ 100.000+',
  unemployed: 'Desempregado(a)'
} as const;

export const PLAN_BENEFITS = {
  free: {
    pointsPerBook: 10,
    pointsPerReview: 3,
    pointsPerComment: 1,
    booksPerLevel: 1,
    minWithdrawal: 12000, // R$ 120 (em centavos)
  },
  premium: {
    pointsPerBook: 30,
    pointsPerReview: 9,
    pointsPerComment: 3,
    booksPerLevel: 3,
    minWithdrawal: 5000, // R$ 50 (em centavos)
  }
} as const;

// Níveis do sistema com nível Admin especial
export const LEVELS: Level[] = [
  { level: 0, name: 'Bronze', pointsRequired: 0, booksUnlocked: 1, color: '#cd7f32' },
  { level: 1, name: 'Prata', pointsRequired: 100, booksUnlocked: 2, color: '#c0c0c0' },
  { level: 2, name: 'Ouro', pointsRequired: 300, booksUnlocked: 3, color: '#ffd700' },
  { level: 3, name: 'Platina', pointsRequired: 600, booksUnlocked: 4, color: '#e5e4e2' },
  { level: 4, name: 'Diamante', pointsRequired: 1000, booksUnlocked: 5, color: '#b9f2ff' },
  { level: 5, name: 'Mestre', pointsRequired: 1500, booksUnlocked: 6, color: '#895aed' },
  { level: 99, name: 'Admin', pointsRequired: 0, booksUnlocked: 999, color: '#dc2626', isAdmin: true }
];

// Função utilitária para obter informações do nível
export const getLevelInfo = (level: number, isAdmin: boolean = false): Level => {
  if (isAdmin) {
    return LEVELS.find(l => l.isAdmin) || LEVELS[0];
  }
  return LEVELS.find(l => l.level === level && !l.isAdmin) || LEVELS[0];
};

// Função para verificar se um nível é administrativo
export const isAdminLevel = (level: number): boolean => {
  return LEVELS.find(l => l.level === level)?.isAdmin || false;
};

// Função para obter o próximo nível (excluindo admin)
export const getNextLevel = (currentLevel: number): Level | null => {
  const regularLevels = LEVELS.filter(l => !l.isAdmin);
  const currentIndex = regularLevels.findIndex(l => l.level === currentLevel);
  return currentIndex >= 0 && currentIndex < regularLevels.length - 1 
    ? regularLevels[currentIndex + 1] 
    : null;
};

// Tipos para gerenciamento de permissões admin
export interface AdminPermissions {
  canManageUsers: boolean;
  canManageBooks: boolean;
  canProcessWithdrawals: boolean;
  canViewAnalytics: boolean;
  canModifySettings: boolean;
  canAccessSystemLogs: boolean;
}

// Permissões padrão para administradores
export const DEFAULT_ADMIN_PERMISSIONS: AdminPermissions = {
  canManageUsers: true,
  canManageBooks: true,
  canProcessWithdrawals: true,
  canViewAnalytics: true,
  canModifySettings: true,
  canAccessSystemLogs: true
};

// Tipos para ações administrativas
export type AdminAction = 
  | 'view_user' | 'edit_user' | 'suspend_user' | 'delete_user'
  | 'view_book' | 'edit_book' | 'activate_book' | 'deactivate_book'
  | 'approve_withdrawal' | 'reject_withdrawal' | 'view_withdrawal'
  | 'view_analytics' | 'export_data'
  | 'modify_settings' | 'view_logs';

// Interface para logs de ações administrativas
export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminAction;
  targetId?: string;
  targetType?: 'user' | 'book' | 'withdrawal' | 'system';
  details?: string;
  timestamp: string;
  ipAddress?: string;
}