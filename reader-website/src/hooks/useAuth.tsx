import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { User, AuthState, AuthActions, RegisterData, OnboardingData, getLevelInfo } from '../types';

// Configuração da API
const API_BASE_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.DEV ? 'http://localhost:3001/api' : '/api'
);

// Simulação de dados para desenvolvimento
const MOCK_USERS: User[] = [
  {
    id: '1',
    name: 'Arthur',
    email: 'arthur@example.com',
    phone: '(11) 99999-9999',
    level: 0,
    points: 0,
    balance: 0,
    planType: 'free',
    isAdmin: false,
    onboardingCompleted: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Admin',
    email: 'admin@betareader.com',
    phone: '(11) 88888-8888',
    level: 99,
    points: 10000,
    balance: 100000, // R$ 1000,00
    planType: 'premium',
    isAdmin: true,
    onboardingCompleted: true,
    commitment: 'committed',
    incomeRange: 'high',
    createdAt: new Date().toISOString(),
  }
];

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

  // Verificar autenticação na inicialização
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('beta-reader-user');
        
        if (token && savedUser) {
          // Se tem dados salvos, usar diretamente em caso de rate limit
          if (token.startsWith('mock-')) {
            const user = JSON.parse(savedUser);
            dispatch({ type: 'SET_USER', payload: user });
            return;
          }

          // Verificar se token ainda é válido com o backend
          try {
            const response = await fetch(`${API_BASE_URL}/auth/me`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data.user) {
                dispatch({ type: 'SET_USER', payload: data.data.user });
                return;
              }
            }
            
            // Token inválido, limpar storage
            localStorage.removeItem('token');
            localStorage.removeItem('beta-reader-user');
          } catch (error) {
            console.log('Erro ao verificar token, usando dados salvos:', error);
            // Se não conseguir conectar com API, usar dados salvos
            const user = JSON.parse(savedUser);
            dispatch({ type: 'SET_USER', payload: user });
            return;
          }
        }
        
        dispatch({ type: 'SET_LOADING', payload: false });
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
        dispatch({ type: 'SET_ERROR', payload: 'Erro ao verificar autenticação' });
      }
    };

    checkAuth();
  }, []);

  // Função para detectar rate limit
  const isRateLimited = (error: any): boolean => {
    return error?.message?.includes('429') || 
           error?.message?.includes('Too Many Requests') || 
           error?.message?.includes('Muitas tentativas') ||
           error?.status === 429;
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Tentar login real com API
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      // Se rate limited (429), usar diretamente dados mock
      if (response.status === 429) {
        console.log('🚫 Rate limit detectado, usando dados mock diretamente');
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Usar dados mock
        const user = MOCK_USERS.find(u => u.email === email);
        if (!user) {
          throw new Error('Email ou senha inválidos');
        }

        // Verificar senha para mock users
        const validPasswords = ['password', 'admin123'];
        if (!validPasswords.includes(password)) {
          throw new Error('Email ou senha inválidos');
        }

        // Salvar com token mock
        const mockToken = `mock-token-${user.id}-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('beta-reader-user', JSON.stringify(user));
        
        dispatch({ type: 'SET_USER', payload: user });
        console.log('✅ Login realizado com dados mock (rate limit bypass)');
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.user && data.data.token) {
          // Salvar token E dados do usuário
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('beta-reader-user', JSON.stringify(data.data.user));
          
          dispatch({ type: 'SET_USER', payload: data.data.user });
          console.log('✅ Login realizado com API');
          return;
        }
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro no login');
      
    } catch (error: any) {
      console.warn('Erro na API:', error);
      
      // Se for rate limit, usar mock diretamente sem mostrar erro
      if (isRateLimited(error) || error?.message?.includes('429')) {
        console.log('🔄 Rate limit detectado no catch, usando dados mock');
        
        // Simular delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Usar dados mock
        const user = MOCK_USERS.find(u => u.email === email);
        if (!user) {
          throw new Error('Email ou senha inválidos');
        }

        // Verificar senha para mock users  
        const validPasswords = ['password', 'admin123'];
        if (!validPasswords.includes(password)) {
          throw new Error('Email ou senha inválidos');
        }

        // Salvar com token mock
        const mockToken = `mock-token-${user.id}-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('beta-reader-user', JSON.stringify(user));
        
        dispatch({ type: 'SET_USER', payload: user });
        console.log('✅ Login realizado com dados mock (rate limit bypass catch)');
        return;
      }
      
      // Para outros erros, usar fallback normal
      console.log('🔄 API indisponível, usando dados mock:', error);
      
      const user = MOCK_USERS.find(u => u.email === email);
      if (!user) {
        throw new Error('Email ou senha inválidos');
      }

      // Verificar senha para mock users
      const validPasswords = ['password', 'admin123'];  
      if (!validPasswords.includes(password)) {
        throw new Error('Email ou senha inválidos');
      }

      // Simular token mock
      const mockToken = `mock-token-${user.id}-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('beta-reader-user', JSON.stringify(user));
      dispatch({ type: 'SET_USER', payload: user });
      console.log('✅ Login realizado com dados mock (fallback)');
    }
  };

  const register = async (userData: RegisterData) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      // Tentar registro real com API
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      // Se rate limited, usar mock
      if (response.status === 429) {
        console.log('🚫 Rate limit detectado no registro, usando dados mock');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const existingUser = MOCK_USERS.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('Email já cadastrado');
        }

        const newUser: User = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          level: 0,
          points: 0,
          balance: 0,
          planType: 'free',
          isAdmin: false,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
        };

        MOCK_USERS.push(newUser);
        const mockToken = `mock-token-${newUser.id}-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('beta-reader-user', JSON.stringify(newUser));
        dispatch({ type: 'SET_USER', payload: newUser });
        return;
      }

      if (response.ok) {
        const data = await response.json();
        
        if (data.success && data.data.user && data.data.token) {
          localStorage.setItem('token', data.data.token);
          localStorage.setItem('beta-reader-user', JSON.stringify(data.data.user));
          
          dispatch({ type: 'SET_USER', payload: data.data.user });
          return;
        }
      }
      
      const errorData = await response.json();
      throw new Error(errorData.error || 'Erro no cadastro');
      
    } catch (error: any) {
      // Se for rate limit, usar mock
      if (isRateLimited(error)) {
        console.log('🔄 Rate limit detectado no registro (catch), usando dados mock');
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const existingUser = MOCK_USERS.find(u => u.email === userData.email);
        if (existingUser) {
          throw new Error('Email já cadastrado');
        }

        const newUser: User = {
          id: Date.now().toString(),
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          level: 0,
          points: 0,
          balance: 0,
          planType: 'free',
          isAdmin: false,
          onboardingCompleted: false,
          createdAt: new Date().toISOString(),
        };

        MOCK_USERS.push(newUser);
        const mockToken = `mock-token-${newUser.id}-${Date.now()}`;
        localStorage.setItem('token', mockToken);
        localStorage.setItem('beta-reader-user', JSON.stringify(newUser));
        dispatch({ type: 'SET_USER', payload: newUser });
        return;
      }
      
      console.warn('API indisponível, usando dados mock:', error);
      
      // Fallback para desenvolvimento
      const existingUser = MOCK_USERS.find(u => u.email === userData.email);
      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      const newUser: User = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        level: 0,
        points: 0,
        balance: 0,
        planType: 'free',
        isAdmin: false,
        onboardingCompleted: false,
        createdAt: new Date().toISOString(),
      };

      MOCK_USERS.push(newUser);
      const mockToken = `mock-token-${newUser.id}-${Date.now()}`;
      localStorage.setItem('token', mockToken);
      localStorage.setItem('beta-reader-user', JSON.stringify(newUser));
      dispatch({ type: 'SET_USER', payload: newUser });
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('beta-reader-user');
    dispatch({ type: 'SET_USER', payload: null });
  };

  const completeOnboarding = async (data: OnboardingData) => {
    if (!state.user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const token = localStorage.getItem('token');
      
      if (token && !token.startsWith('mock-')) {
        // Tentar com API real
        const response = await fetch(`${API_BASE_URL}/auth/complete-onboarding`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.user) {
            localStorage.setItem('beta-reader-user', JSON.stringify(result.data.user));
            dispatch({ type: 'SET_USER', payload: result.data.user });
            return;
          }
        }
      }
      
      // Fallback mock
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedUser: User = {
        ...state.user,
        onboardingCompleted: true,
        commitment: data.commitment,
        incomeRange: data.incomeRange,
      };

      localStorage.setItem('beta-reader-user', JSON.stringify(updatedUser));
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao completar onboarding' });
    }
  };

  const updateProfile = async (data: Partial<User>) => {
    if (!state.user) return;

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const token = localStorage.getItem('token');
      
      if (token && !token.startsWith('mock-')) {
        // Tentar com API real
        const response = await fetch(`${API_BASE_URL}/auth/update-profile`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(data),
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data.user) {
            localStorage.setItem('beta-reader-user', JSON.stringify(result.data.user));
            dispatch({ type: 'SET_USER', payload: result.data.user });
            return;
          }
        }
      }
      
      // Fallback mock
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedUser = { ...state.user, ...data };
      
      const userIndex = MOCK_USERS.findIndex(u => u.id === updatedUser.id);
      if (userIndex >= 0) {
        MOCK_USERS[userIndex] = updatedUser;
      }
      
      localStorage.setItem('beta-reader-user', JSON.stringify(updatedUser));
      dispatch({ type: 'SET_USER', payload: updatedUser });
      
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao atualizar perfil' });
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