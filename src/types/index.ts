// src/types/index.ts - ARQUIVO COMPLETO COM TODAS AS FUNCIONALIDADES + CPF

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  cpf: string; // CAMPO CPF OBRIGATÓRIO
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
  updateProfile: (data: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  phone?: string;
  cpf: string; // CAMPO CPF OBRIGATÓRIO
  password: string;
}

export interface UpdateProfileData {
  name?: string;
  phone?: string;
  cpf?: string; // CAMPO CPF PARA ATUALIZAÇÃO
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

// Interfaces para validação
export interface ValidationError {
  field: string;
  message: string;
}

// Constants
export const INCOME_RANGES = {
  LOW: 'R$ 1.000 - R$ 10.000',
  MEDIUM: 'R$ 10.000 - R$ 50.000',
  HIGH: 'R$ 100.000+',
  UNEMPLOYED: 'Desempregado(a)'
} as const;

export const PLAN_BENEFITS = {
  FREE: {
    pointsPerBook: 10,
    pointsPerReview: 3,
    pointsPerComment: 1,
    booksPerLevel: 1,
    minWithdrawal: 12000, // R$ 120 (em centavos)
  },
  PREMIUM: {
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

// FUNÇÕES UTILITÁRIAS PARA CPF
export const validateCPF = (cpf: string): boolean => {
  // Remove formatação
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Verifica se tem 11 dígitos
  if (cleanCPF.length !== 11) return false;
  
  // Verifica se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  // Validação dos dígitos verificadores
  let sum = 0;
  let remainder;
  
  // Primeiro dígito verificador
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Segundo dígito verificador
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

export const formatCPF = (cpf: string): string => {
  const cleanCPF = cpf.replace(/\D/g, '');
  return cleanCPF.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const cleanCPF = (cpf: string): string => {
  return cpf.replace(/\D/g, '');
};