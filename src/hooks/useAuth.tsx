// src/hooks/useAuth.tsx - VERSÃO FINAL CORRIGIDA
import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, RegisterData, ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review-website.onrender.com/api';

// Interface local para dados de onboarding
interface OnboardingData {
  commitment: 'committed' | 'curious';
  incomeRange: 'low' | 'medium' | 'high' | 'unemployed';
}

// Tipos para o contexto
interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  completeOnboarding: (data: OnboardingData) => Promise<void>;
  loading: boolean; // Alias para isLoading para compatibilidade
}

// Actions para o reducer
type AuthAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'LOGOUT' };

// Reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, error: null, isLoading: false };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'LOGOUT':
      return { user: null, isLoading: false, error: null };
    default:
      return state;
  }
};

// Estado inicial
const initialState: AuthState = {
  user: null,
  isLoading: true,
  error: null,
};

// Contexto
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider
interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Verificar autenticação ao inicializar
  useEffect(() => {
    const checkAuth = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('beta-reader-user');
        
        if (token && userData && !token.startsWith('mock-')) {
          const user = JSON.parse(userData);
          
          // Verificar se o token ainda é válido
          const response = await fetch(`${API_BASE_URL}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.data.user) {
              dispatch({ type: 'SET_USER', payload: data.data.user });
              localStorage.setItem('beta-reader-user', JSON.stringify(data.data.user));
            } else {
              throw new Error('Token inválido');
            }
          } else {
            throw new Error('Token expirado');
          }
        } else if (userData && token?.startsWith('mock-')) {
          // Usuário mock (para desenvolvimento)
          const user = JSON.parse(userData);
          dispatch({ type: 'SET_USER', payload: user });
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('beta-reader-user');
        
        if (error instanceof Error && error.message.includes('Token')) {
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
        throw new Error(errorData.error || 'Erro no registro');
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
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro no registro' });
      throw error;
    }
  };

  const completeOnboarding = async (data: OnboardingData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Token não encontrado');
      }

      const response = await fetch(`${API_BASE_URL}/auth/complete-onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Erro ao completar onboarding');
      }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data.user) {
        const updatedUser = responseData.data.user;
        localStorage.setItem('beta-reader-user', JSON.stringify(updatedUser));
        dispatch({ type: 'SET_USER', payload: updatedUser });
        console.log('Onboarding completado com sucesso');
      } else {
        throw new Error('Resposta inválida do servidor');
      }
      
    } catch (error: any) {
      console.error('Erro no onboarding:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message || 'Erro no onboarding' });
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('beta-reader-user');
    dispatch({ type: 'LOGOUT' });
  };

  const updateUser = (userData: Partial<User>) => {
    if (state.user) {
      const updatedUser = { ...state.user, ...userData };
      localStorage.setItem('beta-reader-user', JSON.stringify(updatedUser));
      dispatch({ type: 'SET_USER', payload: updatedUser });
    }
  };

  const value: AuthContextType = {
    ...state,
    loading: state.isLoading, // Alias para compatibilidade
    login,
    register,
    logout,
    updateUser,
    completeOnboarding,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook para usar o contexto
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};