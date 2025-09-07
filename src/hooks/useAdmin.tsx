// src/hooks/useAdmin.tsx
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review-website.onrender.com/api';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  premiumUsers: number;
  suspendedUsers: number;
  totalBooks: number;
  activeBooks: number;
  totalWithdrawals: number;
  pendingWithdrawals: number;
  approvedWithdrawals: number;
  rejectedWithdrawals: number;
  totalReadingSessions: number;
  recentReadingSessions: number;
  estimatedRevenue: number;
  conversionRate: number;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  level: number;
  points: number;
  balance: number;
  planType: string;
  isAdmin: boolean;
  isSuspended: boolean;
  suspendedReason?: string;
  onboardingCompleted: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface PaginatedUsers {
  users: AdminUser[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Withdrawal {
  id: string;
  userId: string;
  amount: number;
  pixKey: string;
  pixKeyType: string;
  status: string;
  requestedAt: string;
  processedAt?: string;
  processedBy?: string;
  rejectionReason?: string;
  user: {
    id: string;
    name: string;
    email: string;
    planType: string;
  };
}

interface PaginatedWithdrawals {
  withdrawals: Withdrawal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface AdminLog {
  id: string;
  adminId: string;
  adminName: string;
  action: string;
  targetId?: string;
  targetType?: string;
  details?: string;
  ipAddress: string;
  userAgent?: string;
  timestamp: string;
}

interface PaginatedLogs {
  logs: AdminLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface Analytics {
  period: string;
  newUsers: number;
  totalRevenue: number;
  readingSessions: number;
  userGrowth: any[];
  planDistribution: Array<{
    planType: string;
    count: number;
  }>;
}

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se é admin
  const isAdmin = user?.isAdmin || false;

  // Função utilitária para fazer requisições autenticadas
  const makeAuthRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return response.json();
  };

  // Buscar estatísticas do dashboard
  const getDashboardStats = async (): Promise<AdminStats> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthRequest('/admin/dashboard');
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar usuários com filtros
  const getUsers = async (
    page: number = 1,
    limit: number = 10,
    search: string = '',
    filter: string = 'all'
  ): Promise<PaginatedUsers> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        filter
      });
      
      const response = await makeAuthRequest(`/admin/users?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Editar usuário
  const editUser = async (userId: string, updates: Partial<AdminUser>): Promise<AdminUser> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthRequest(`/admin/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      });
      return response.data.user;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Suspender/deletar usuário
  const deleteUser = async (
    userId: string, 
    action: 'suspend' | 'delete' = 'suspend',
    reason?: string
  ): Promise<void> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      await makeAuthRequest(`/admin/users/${userId}`, {
        method: 'DELETE',
        body: JSON.stringify({ action, reason }),
      });
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar saques
  const getWithdrawals = async (
    page: number = 1,
    limit: number = 10,
    status: string = 'all'
  ): Promise<PaginatedWithdrawals> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        status
      });
      
      const response = await makeAuthRequest(`/admin/withdrawals?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Processar saque (aprovar/rejeitar)
  const processWithdrawal = async (
    withdrawalId: string,
    action: 'approve' | 'reject',
    reason?: string
  ): Promise<Withdrawal> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await makeAuthRequest(`/admin/withdrawals/${withdrawalId}`, {
        method: 'PATCH',
        body: JSON.stringify({ action, reason }),
      });
      return response.data.withdrawal;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar analytics
  const getAnalytics = async (period: string = '30d'): Promise<Analytics> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({ period });
      const response = await makeAuthRequest(`/admin/analytics?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Buscar logs administrativos
  const getLogs = async (
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedLogs> => {
    if (!isAdmin) throw new Error('Acesso negado');
    
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const response = await makeAuthRequest(`/admin/logs?${params}`);
      return response.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Formatador de moeda
  const formatCurrency = (value: number): string => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  // Formatador de data
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  // Obter status badge color
  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'pending': return '#f59e0b';
      case 'approved': return '#10b981';
      case 'rejected': return '#ef4444';
      case 'active': return '#10b981';
      case 'suspended': return '#ef4444';
      case 'premium': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  // Traduzir status
  const translateStatus = (status: string): string => {
    const translations: { [key: string]: string } = {
      'pending': 'Pendente',
      'approved': 'Aprovado',
      'rejected': 'Rejeitado',
      'processing': 'Processando',
      'completed': 'Concluído',
      'failed': 'Falhou',
      'active': 'Ativo',
      'suspended': 'Suspenso',
      'free': 'Gratuito',
      'premium': 'Premium'
    };
    return translations[status.toLowerCase()] || status;
  };

  // Traduzir ações admin
  const translateAction = (action: string): string => {
    const translations: { [key: string]: string } = {
      'VIEW_USER': 'Visualizar Usuário',
      'EDIT_USER': 'Editar Usuário',
      'SUSPEND_USER': 'Suspender Usuário',
      'DELETE_USER': 'Deletar Usuário',
      'VIEW_WITHDRAWAL': 'Visualizar Saque',
      'APPROVE_WITHDRAWAL': 'Aprovar Saque',
      'REJECT_WITHDRAWAL': 'Rejeitar Saque',
      'VIEW_ANALYTICS': 'Visualizar Analytics',
      'EXPORT_DATA': 'Exportar Dados',
      'MODIFY_SETTINGS': 'Modificar Configurações',
      'VIEW_LOGS': 'Visualizar Logs'
    };
    return translations[action] || action;
  };

  return {
    // Estados
    loading,
    error,
    isAdmin,
    
    // Funções principais
    getDashboardStats,
    getUsers,
    editUser,
    deleteUser,
    getWithdrawals,
    processWithdrawal,
    getAnalytics,
    getLogs,
    
    // Utilitários
    formatCurrency,
    formatDate,
    getStatusColor,
    translateStatus,
    translateAction
  };
};