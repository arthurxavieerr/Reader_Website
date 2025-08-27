import { Request } from 'express';

// ==================================
// TIPOS PÚBLICOS (COMPATÍVEIS COM FRONTEND)
// ==================================
// Nota: Estes são os mesmos types que seu frontend espera

export interface PublicUser {
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

export interface RegisterData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface OnboardingData {
  commitment: 'committed' | 'curious';
  incomeRange: 'low' | 'medium' | 'high' | 'unemployed';
}

// ==================================
// TIPOS INTERNOS DO BANCO (PRIVADOS)
// ==================================
// Estes NUNCA são enviados para o frontend

export interface UserDatabase extends PublicUser {
  passwordHash: string;    // 🚫 Sensível
  salt: string;           // 🚫 Sensível  
  lastLoginIP?: string;   // 🚫 Privado
  lastLoginAt?: Date;     // 🚫 Privado
  fraudScore: number;     // 🚫 Interno
  isSuspended: boolean;   // 🚫 Interno
  suspendedReason?: string; // 🚫 Interno
  conversionAttempts: number; // 🚫 Analytics interno
  updatedAt: Date;        // 🚫 Interno
}

// ==================================
// TIPOS ESPECÍFICOS DO BACKEND
// ==================================

// Request customizada com usuário autenticado
export interface AuthenticatedRequest extends Request {
  user?: PublicUser;
}

// Payload do JWT
export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

// Sistema Anti-Fraude
export interface ReadingSession {
  id: string;
  userId: string;
  bookId: string;
  startTime: Date;
  endTime?: Date;
  isValid: boolean;
  fraudScore: number;
  trackingData: ReadingTrackingData;
}

export interface ReadingTrackingData {
  totalTime: number; // ms
  activeTime: number; // ms
  idleTime: number; // ms
  pageViews: PageView[];
  scrollEvents: ScrollEvent[];
  tabSwitches: number;
  averageScrollSpeed: number;
  readingSpeed: number; // palavras por minuto
}

export interface PageView {
  page: number;
  timestamp: Date;
  timeSpent: number; // ms
  scrollDepth: number; // % da página vista
  wordsOnPage: number;
}

export interface ScrollEvent {
  timestamp: Date;
  scrollPosition: number;
  scrollDirection: 'up' | 'down';
  scrollSpeed: number; // pixels por segundo
}

export interface FraudDetectionResult {
  isValid: boolean;
  fraudScore: number; // 0-100
  reasons: string[];
  decision: 'APPROVED' | 'REJECTED' | 'MANUAL_REVIEW';
  canReceiveReward: boolean;
}

// Controle de Recompensas Únicas
export interface UserBookReward {
  id: string;
  userId: string;
  bookId: string;
  hasReceivedReward: boolean;
  readingAttempts: number;
  firstReadingDate: Date;
  validReadingDate?: Date;
  fraudAttempts: number;
}

// Sistema de Conversão
export interface ConversionMetrics {
  userId: string;
  popupViews: number;
  upgradeAttempts: number;
  conversionDate?: Date;
  abandonmentReasons: string[];
  lastUpgradePrompt: Date;
}

// Configurações do Sistema
export interface SystemConfig {
  premiumPrice: number; // em centavos
  freeBalanceLimit: number; // em centavos - R$ 15,00
  freeMinWithdrawal: number; // em centavos - R$ 50,00
  premiumMinWithdrawal: number; // em centavos - R$ 15,00
  pointsToMoneyRatio: number; // quantos pontos = 1 centavo
  fraudScoreThreshold: number; // acima disso = suspeito
  manualReviewThreshold: number; // acima disso = revisão manual
}

// Saques PIX
export interface WithdrawalRequest {
  id: string;
  userId: string;
  amount: number; // em centavos
  pixKey: string;
  pixKeyType: 'cpf' | 'email' | 'phone' | 'random';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  requestedAt: Date;
  processedAt?: Date;
  failureReason?: string;
  transactionId?: string; // ID do Mercado Pago
}

// Logs Administrativos
export interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: AdminAction;
  targetId?: string;
  targetType?: 'user' | 'book' | 'withdrawal' | 'system';
  details?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
}

export type AdminAction = 
  | 'view_user' | 'edit_user' | 'suspend_user' | 'delete_user'
  | 'view_book' | 'edit_book' | 'activate_book' | 'deactivate_book' 
  | 'approve_withdrawal' | 'reject_withdrawal' | 'view_withdrawal'
  | 'view_analytics' | 'export_data' | 'modify_settings' | 'view_logs';

// Resposta padrão da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ==================================
// CONSTANTES (valores atualizados)
// ==================================

export const BUSINESS_CONFIG = {
  PREMIUM_PRICE: 2990, // R$ 29,90 em centavos
  FREE_BALANCE_LIMIT: 1500, // R$ 15,00 em centavos (trava aqui)
  FREE_MIN_WITHDRAWAL: 5000, // R$ 50,00 em centavos (impossível!)
  PREMIUM_MIN_WITHDRAWAL: 1500, // R$ 15,00 em centavos (alcançável)
  POINTS_TO_MONEY_RATIO: 10, // 10 pontos = 1 centavo = R$ 0,01
  INITIAL_BOOKS_LIMIT: 3, // Apenas 3 livros dão recompensa no free
} as const;

export const FRAUD_CONFIG = {
  MIN_READING_SPEED: 100, // palavras por minuto (mínimo humano)
  MAX_READING_SPEED: 400, // palavras por minuto (máximo humano)
  MIN_TIME_PER_PAGE: 5000, // 5 segundos mínimo por página
  MAX_IDLE_TIME_RATIO: 0.3, // máximo 30% de tempo inativo
  FRAUD_SCORE_THRESHOLD: 50, // acima disso = suspeito
  MANUAL_REVIEW_THRESHOLD: 70, // acima disso = revisão manual
  AUTO_REJECT_THRESHOLD: 85, // acima disso = rejeição automática
} as const;

export const LEVELS = [
  { level: 0, name: 'Bronze', pointsRequired: 0, booksUnlocked: 1, color: '#cd7f32' },
  { level: 1, name: 'Prata', pointsRequired: 100, booksUnlocked: 2, color: '#c0c0c0' },
  { level: 2, name: 'Ouro', pointsRequired: 300, booksUnlocked: 3, color: '#ffd700' },
  { level: 3, name: 'Platina', pointsRequired: 600, booksUnlocked: 4, color: '#e5e4e2' },
  { level: 4, name: 'Diamante', pointsRequired: 1000, booksUnlocked: 5, color: '#b9f2ff' },
  { level: 5, name: 'Mestre', pointsRequired: 1500, booksUnlocked: 6, color: '#895aed' },
  { level: 99, name: 'Admin', pointsRequired: 0, booksUnlocked: 999, color: '#dc2626', isAdmin: true }
] as const;