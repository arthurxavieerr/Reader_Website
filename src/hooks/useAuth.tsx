// src/hooks/useAuth.tsx - VERSÃO FINAL COM API REAL
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, AuthActions, RegisterData, OnboardingData, getLevelInfo } from '../types';

// Configuração da API - agora usando server.js
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review777.vercel.app/api';

type AuthAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_USER'; payload: Partial<User> };

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, loading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'UPDATE_USER':
      return {
        ...state,
        user: state.user ? { ...state.user, ...action.payload } : null,
      };
    default:
      return state;
  }
};

const AuthContext = createContext<(AuthState & AuthActions) | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    loading: true,
    error: null,
  });

  // Função utilitária para requisições autenticadas
  const makeAuthenticatedRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expirado - fazer logout
        localStorage.removeItem('token');
        localStorage.removeItem('beta-reader-user');
        dispatch({ type: 'SET_USER', payload: null });
        throw new Error('Sessão expirada');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return response.json();
  };

  // Verificar autenticação na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        
        if (!token) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        // Verificar token com o servidor
        const data = await makeAuthenticatedRequest('/auth/me');
        
        if (data.success && data.data.user) {
          localStorage.setItem('beta-reader-user', JSON.stringify(data.data.user));
          dispatch({ type: 'SET_USER', payload: data.data.user });
        } else {
          // Token inválido
          localStorage.removeItem('token');
          localStorage.removeItem('beta-reader-user');
          dispatch({ type: 'SET_LOADING', payload: false });
        }
        
      } catch (error: any) {
        console.error('Erro ao verificar autenticação:', error);
        
        // Limpar dados inválidos
        localStorage.removeItem('token');
        localStorage.removeItem('beta-reader-user');
        
        if (error.message === 'Sessão expirada') {
          dispatch({ type: 'SET_ERROR', payload: 'Sessão expirada. Faça login novamente.' });
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Erro ao conectar com o servidor' });
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro no login');
      }

      const data = await response.json();
      
      if (data.success && data.data.user && data.data.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('beta-reader-user', JSON.stringify(data.data.user));
        
        dispatch({ type: 'SET_USER', payload: data.data.user });
        console.log('Login realizado com sucesso');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error: any) {
      console.error('Erro no login:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro no login' });
      throw error;
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro no cadastro');
      }

      const data = await response.json();
      
      if (data.success && data.data.user && data.data.token) {
        localStorage.setItem('token', data.data.token);
        localStorage.setItem('beta-reader-user', JSON.stringify(data.data.user));
        
        dispatch({ type: 'SET_USER', payload: data.data.user });
        console.log('Registro realizado com sucesso');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error: any) {
      console.error('Erro no registro:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro no cadastro' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('beta-reader-user');
    dispatch({ type: 'SET_USER', payload: null });
    console.log('Logout realizado');
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!state.user) {
      throw new Error('Usuário não autenticado');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await makeAuthenticatedRequest('/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (result.success && result.data.user) {
        localStorage.setItem('beta-reader-user', JSON.stringify(result.data.user));
        dispatch({ type: 'SET_USER', payload: result.data.user });
        console.log('Onboarding completado com sucesso');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error: any) {
      console.error('Erro no onboarding:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro ao completar onboarding' });
      throw error;
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) {
      throw new Error('Usuário não autenticado');
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const result = await makeAuthenticatedRequest('/auth/update-profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      });

      if (result.success && result.data.user) {
        localStorage.setItem('beta-reader-user', JSON.stringify(result.data.user));
        dispatch({ type: 'SET_USER', payload: result.data.user });
        console.log('Perfil atualizado com sucesso');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro ao atualizar perfil' });
      throw error;
    }
  };

  // Funções utilitárias
  const getCurrentLevelName = (): string => {
    if (!state.user) return 'Visitante';
    if (state.user.isAdmin) return 'Admin';
    const levelInfo = getLevelInfo(state.user.level, state.user.isAdmin);
    return levelInfo.name;
  };

  const getCurrentLevelColor = (): string => {
    if (!state.user) return '#64748b';
    if (state.user.isAdmin) return '#dc2626';
    const levelInfo = getLevelInfo(state.user.level, state.user.isAdmin);
    return levelInfo.color;
  };

  const isCurrentUserAdmin = (): boolean => {
    return state.user?.isAdmin || false;
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    completeOnboarding,
    updateProfile,
    getCurrentLevelName,
    getCurrentLevelColor,
    isCurrentUserAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};