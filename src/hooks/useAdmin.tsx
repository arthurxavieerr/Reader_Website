// src/hooks/useAdmin.tsx - CORRIGIDO
import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review-website.onrender.com/api';

export const useAdmin = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (user) {
      setIsAdmin(user.isAdmin || false);
      setLoading(false);
    } else {
      setIsAdmin(false);
      setLoading(false);
    }
  }, [user]);

  // Funções placeholder para admin (implementar conforme necessário)
  const getDashboardStats = async () => {
    // TODO: Implementar chamada para API
    return {
      totalUsers: 0,
      totalBooks: 0,
      totalRevenue: 0,
      activeReaders: 0
    };
  };

  const getUsers = async (page = 1, limit = 10, search = '', filter = 'all') => {
    // TODO: Implementar chamada para API
    return {
      users: [],
      total: 0,
      page,
      limit
    };
  };

  const editUser = async (userId: string, userData: any) => {
    // TODO: Implementar chamada para API
    console.log('Edit user:', userId, userData);
  };

  const deleteUser = async (userId: string) => {
    // TODO: Implementar chamada para API
    console.log('Delete user:', userId);
  };

  const getWithdrawals = async (page = 1, limit = 10, filter = 'all') => {
    // TODO: Implementar chamada para API
    return {
      withdrawals: [],
      total: 0,
      page,
      limit
    };
  };

  const processWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject', reason?: string) => {
    // TODO: Implementar chamada para API
    console.log('Process withdrawal:', withdrawalId, action, reason);
  };

  const getAnalytics = async (period = '30d') => {
    // TODO: Implementar chamada para API
    return {
      period,
      data: []
    };
  };

  const getLogs = async (page = 1, limit = 10) => {
    // TODO: Implementar chamada para API
    return {
      logs: [],
      total: 0,
      page,
      limit
    };
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
      active: 'green',
      inactive: 'gray',
      suspended: 'red',
      pending: 'yellow',
      approved: 'green',
      rejected: 'red'
    };
    return colors[status] || 'gray';
  };

  const translateStatus = (status: string) => {
    const translations: Record<string, string> = {
      active: 'Ativo',
      inactive: 'Inativo',
      suspended: 'Suspenso',
      pending: 'Pendente',
      approved: 'Aprovado',
      rejected: 'Rejeitado'
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