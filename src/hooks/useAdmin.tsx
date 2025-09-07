// src/hooks/useAdmin.tsx - COMPLETAMENTE CORRIGIDO
import { useState } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review-website.onrender.com/api';

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar se o usuário é admin
  const isAdmin = user?.isAdmin || false;

  // Função para fazer requisições autenticadas
  const makeAuthenticatedRequest = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
    }

    return response.json();
  };

  // Obter estatísticas do dashboard
  const getDashboardStats = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest('/admin/dashboard-stats');
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter lista de usuários
  const getUsers = async (page = 1, limit = 10, search = '', filter = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        search,
        filter
      });
      
      const data = await makeAuthenticatedRequest(`/admin/users?${params}`);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Editar usuário
  const editUser = async (userId: string, updates: any) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest(`/admin/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Deletar/suspender usuário
  const deleteUser = async (userId: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest(`/admin/users/${userId}`, {
        method: 'DELETE',
      });
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter lista de saques
  const getWithdrawals = async (page = 1, limit = 10, filter = 'all') => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        filter
      });
      
      const data = await makeAuthenticatedRequest(`/admin/withdrawals?${params}`);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Processar saque
  const processWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject') => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest(`/admin/withdrawals/${withdrawalId}/${action}`, {
        method: 'POST',
      });
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter analytics
  const getAnalytics = async (period = '30d') => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await makeAuthenticatedRequest(`/admin/analytics?period=${period}`);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Obter logs
  const getLogs = async (page = 1, limit = 20) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      });
      
      const data = await makeAuthenticatedRequest(`/admin/logs?${params}`);
      return data.data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Funções utilitárias
  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: '#10b981',
      inactive: '#6b7280',
      suspended: '#ef4444',
      pending: '#f59e0b',
      approved: '#10b981',
      rejected: '#ef4444',
      free: '#6b7280',
      premium: '#8b5cf6'
    };
    return colors[status] || '#6b7280';
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado',
      free: 'Gratuito',
      premium: 'Premium'
    };
    return translations[status] || status;
  };

  const translateAction = (action: string) => {
    const translations: Record<string, string> = {
      login: 'Login',
      logout: 'Logout',
      register: 'Registro',
      read_book: 'Leitura de livro',
      withdraw: 'Saque',
      admin_action: 'Ação administrativa'
    };
    return translations[action] || action;
  };

  return {
    isAdmin,
    loading,
    error,
    getDashboardStats,
    getUsers,
    editUser,
    deleteUser,
    getWithdrawals,
    processWithdrawal,
    getAnalytics,
    getLogs,
    formatCurrency,
    formatDate,
    getStatusColor,
    translateStatus,
    translateAction
  };
};