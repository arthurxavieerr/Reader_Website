import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, AuthActions, RegisterData, OnboardingData, getLevelInfo } from '../types';

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

  // Função utilitária para fazer requisições à API
  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('beta-reader-token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  };

  // Verificar autenticação na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('beta-reader-token');
        if (token) {
          // Verificar se o token ainda é válido fazendo requisição para /me
          const response = await apiRequest('/api/auth/me');
          if (response.success && response.data.user) {
            dispatch({ type: 'SET_USER', payload: response.data.user });
          } else {
            // Token inválido, remover
            localStorage.removeItem('beta-reader-token');
            dispatch({ type: 'SET_LOADING', payload: false });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        // Token inválido, remover
        localStorage.removeItem('beta-reader-token');
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await apiRequest('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      if (response.success && response.data.user && response.data.token) {
        // Salvar token no localStorage
        localStorage.setItem('beta-reader-token', response.data.token);
        
        // Atualizar estado do usuário
        dispatch({ type: 'SET_USER', payload: response.data.user });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erro no login' 
      });
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await apiRequest('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.success && response.data.user && response.data.token) {
        // Salvar token no localStorage
        localStorage.setItem('beta-reader-token', response.data.token);
        
        // Atualizar estado do usuário
        dispatch({ type: 'SET_USER', payload: response.data.user });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro no registro:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: error instanceof Error ? error.message : 'Erro no cadastro' 
      });
    }
  };

  const logout = () => {
    localStorage.removeItem('beta-reader-token');
    dispatch({ type: 'SET_USER', payload: null });
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!state.user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await apiRequest('/api/auth/onboarding', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      if (response.success && response.data.user) {
        dispatch({ type: 'SET_USER', payload: response.data.user });
      } else {
        throw new Error('Resposta inválida do servidor');
      }
    } catch (error) {
      console.error('Erro ao completar onboarding:', error);
      dispatch({ 
        type: 'SET_ERROR', 
        payload: 'Erro ao completar onboarding' 
      });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      // Por enquanto, vamos simular a atualização localmente
      // até implementarmos a rota de update no backend
      await new Promise(resolve => setTimeout(resolve, 500));

      const updatedUser = { ...state.user, ...data };
      dispatch({ type: 'SET_USER', payload: updatedUser });
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar perfil' });
    }
  };

  // Função utilitária para obter o nome do nível atual
  const getCurrentLevelName = (): string => {
    if (!state.user) return 'Visitante';
    if (state.user.isAdmin) return 'Admin';
    const levelInfo = getLevelInfo(state.user.level, state.user.isAdmin);
    return levelInfo.name;
  };

  // Função utilitária para obter a cor do nível atual
  const getCurrentLevelColor = (): string => {
    if (!state.user) return '#64748b';
    if (state.user.isAdmin) return '#dc2626';
    const levelInfo = getLevelInfo(state.user.level, state.user.isAdmin);
    return levelInfo.color;
  };

  // Função utilitária para verificar se o usuário é admin
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