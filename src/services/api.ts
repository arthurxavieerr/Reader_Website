// src/services/api.ts - API REAL PARA LIVROS (LOCALHOST)
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Mock data para livros (mantido como fallback)
const MOCK_BOOKS = [
  {
    id: '1',
    title: 'A Caixa de Pandora',
    author: 'Hesíodo',
    genre: 'Mitologia grega',
    synopsis: 'Descubra o conto mitológico de Pandora, que nos revela a origem dos males do mundo e o dom da esperança.',
    baseRewardMoney: 10000,
    requiredLevel: 0,
    reviewsCount: 84288,
    averageRating: 4.5,
    createdAt: '2024-01-01T00:00:00.000Z'
  },
  {
    id: '2',
    title: 'O Príncipe e a Gata',
    author: 'Charles Perrault',
    genre: 'Conto de fadas',
    synopsis: 'Era uma vez um rei, pai de três corajosos príncipes, que estava em dúvida sobre qual deles deveria lhe suceder no trono.',
    baseRewardMoney: 20000,
    requiredLevel: 0,
    reviewsCount: 12947,
    averageRating: 4.3,
    createdAt: '2024-01-02T00:00:00.000Z'
  },
  {
    id: '3',
    title: 'O Banqueiro Anarquista',
    author: 'Fernando Pessoa',
    genre: 'Ensaio filosófico',
    synopsis: 'Ensaio filosófico em forma de diálogo, onde um banqueiro se declara anarquista.',
    baseRewardMoney: 30000,
    requiredLevel: 0,
    reviewsCount: 11698,
    averageRating: 4.7,
    createdAt: '2024-01-03T00:00:00.000Z'
  },
  {
    id: '4',
    title: 'De Quanta Terra um Homem Precisa?',
    author: 'Liev Tolstói',
    genre: 'Literatura russa',
    synopsis: 'Um conto sobre ambição e as verdadeiras necessidades humanas.',
    baseRewardMoney: 50000,
    requiredLevel: 0,
    reviewsCount: 8754,
    averageRating: 4.6,
    createdAt: '2024-01-04T00:00:00.000Z'
  },
  {
    id: '5',
    title: 'O Último Detetive de Baker Street',
    author: 'Eduardo Santos',
    genre: 'Mistério Urbano',
    synopsis: 'Mistérios sombrios nas ruas de Londres com um detetive excepcional.',
    baseRewardMoney: 80000,
    requiredLevel: 1,
    reviewsCount: 5621,
    averageRating: 4.4,
    createdAt: '2024-01-05T00:00:00.000Z'
  },
  {
    id: '6',
    title: 'Suspeito Comum',
    author: 'Maria Silva',
    genre: 'Thriller psicológico',
    synopsis: 'Um thriller que questiona a natureza da culpa e inocência.',
    baseRewardMoney: 60000,
    requiredLevel: 2,
    reviewsCount: 3245,
    averageRating: 4.8,
    createdAt: '2024-01-06T00:00:00.000Z'
  }
];

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && !token.startsWith('mock-') ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  // ============================================
  // AUTH - USA API REAL (BANCO DE DADOS)
  // ============================================
  
  async login(email: string, password: string): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    return await this.handleResponse(response);
  }

  async register(userData: any): Promise<ApiResponse<{ user: any; token: string }>> {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    return await this.handleResponse(response);
  }

  async getUserData(): Promise<ApiResponse<{ user: any }>> {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  // ============================================
  // BOOKS - AGORA USA API REAL
  // ============================================

  async getBooks(): Promise<ApiResponse<{ books: any[] }>> {
    try {
      console.log('📚 Buscando livros da API real (localhost)...');
      
      const response = await fetch(`${API_BASE_URL}/books`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.books) {
        console.log(`✅ ${result.data.books.length} livros carregados da API`);
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar livros da API:', error);
      
      // Fallback para dados mock em caso de erro
      console.log('📚 Usando dados mock como fallback...');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      return {
        success: true,
        data: { books: MOCK_BOOKS }
      };
    }
  }

  async getBookById(id: string): Promise<ApiResponse<any>> {
    try {
      console.log(`📖 Buscando livro ${id} da API...`);
      
      const response = await fetch(`${API_BASE_URL}/books/${id}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Livro não encontrado');
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.book) {
        console.log(`✅ Livro ${id} carregado da API`);
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error(`❌ Erro ao buscar livro ${id}:`, error);
      
      // Fallback para dados mock
      console.log(`📖 Usando dados mock para livro ${id}...`);
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const book = MOCK_BOOKS.find(b => b.id === id);
      if (!book) {
        throw new Error('Livro não encontrado');
      }
      
      return {
        success: true,
        data: { book }
      };
    }
  }

  async getBookContent(id: string): Promise<ApiResponse<{ content: string }>> {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    const book = MOCK_BOOKS.find(b => b.id === id);
    if (!book) {
      throw new Error('Livro não encontrado');
    }
    
    // Conteúdo mock dos livros
    const mockContent = {
      '1': `# A Caixa de Pandora\n\n**Autor:** Hesíodo\n\nEra uma vez, no tempo em que os deuses caminhavam entre os mortais...\n\n[Conteúdo completo do livro aqui]`,
      '2': `# O Príncipe e a Gata\n\n**Autor:** Charles Perrault\n\nEra uma vez um rei, pai de três corajosos príncipes...\n\n[Conteúdo completo do livro aqui]`,
      '3': `# O Banqueiro Anarquista\n\n**Autor:** Fernando Pessoa\n\n— Como pode você ser ao mesmo tempo banqueiro e anarquista?\n\n[Conteúdo completo do livro aqui]`,
      '4': `# De Quanta Terra um Homem Precisa?\n\n**Autor:** Liev Tolstói\n\nPakhom era um camponês que vivia modestamente...\n\n[Conteúdo completo do livro aqui]`,
      '5': `# O Último Detetive de Baker Street\n\n**Autor:** Eduardo Santos\n\nLondres, 1895. As ruas cobertas de névoa...\n\n[Conteúdo completo do livro aqui]`,
      '6': `# Suspeito Comum\n\n**Autor:** Maria Silva\n\nA linha entre culpa e inocência é mais tênue do que imaginamos...\n\n[Conteúdo completo do livro aqui]`
    };
    
    const content = mockContent[id as keyof typeof mockContent] || `Conteúdo do livro ${book.title}`;
    
    return {
      success: true,
      data: { content }
    };
  }
  
  async getDashboardStats(): Promise<ApiResponse<any>> {
    try {
      console.log('📊 Buscando estatísticas do dashboard...');
      
      const response = await fetch(`${API_BASE_URL}/dashboard/stats`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Estatísticas do dashboard carregadas');
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar estatísticas do dashboard:', error);
      
      // Fallback para dados básicos do usuário
      console.log('📊 Usando dados básicos do usuário...');
      const userData = await this.getUserData();
      
      return {
        success: true,
        data: {
          booksRead: userData.data?.user?.booksCompleted || 0,
          weeklyEarnings: userData.data?.user?.weeklyEarnings || 0,
          totalWithdrawn: userData.data?.user?.totalWithdrawn || 0,
          dailyBooks: 0,
          dailyReviews: 0,
          dailyEarnings: 0,
        }
      };
    }
  }

  async getUserProgress(): Promise<ApiResponse<any>> {
    try {
      console.log('📈 Buscando progresso do usuário...');
      
      const response = await fetch(`${API_BASE_URL}/dashboard/progress`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Progresso do usuário carregado');
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar progresso do usuário:', error);
      
      // Fallback para progresso zerado
      return {
        success: true,
        data: {
          dailyBooks: 0,
          dailyReviews: 0,
          dailyEarnings: 0,
        }
      };
    }
  }

  async getAvailableBooks(userId?: string): Promise<ApiResponse<{ books: any[] }>> {
    try {
      console.log('📚 Buscando livros disponíveis para o usuário...');
      
      const params = userId ? `?userId=${userId}` : '';
      const response = await fetch(`${API_BASE_URL}/dashboard/available-books${params}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.books) {
        console.log(`✅ ${result.data.books.length} livros disponíveis carregados`);
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar livros disponíveis:', error);
      
      // Fallback para todos os livros
      console.log('📚 Usando todos os livros como fallback...');
      return await this.getBooks();
    }
  }

  // ============================================
  // READING SESSIONS - PARA TRACKING DE LEITURA
  // ============================================

  async startReading(bookId: string): Promise<ApiResponse<{ sessionId: string }>> {
    try {
      console.log(`📖 Iniciando sessão de leitura para livro ${bookId}...`);
      
      const response = await fetch(`${API_BASE_URL}/reading/start`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ bookId }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success && result.data?.sessionId) {
        console.log('✅ Sessão de leitura iniciada');
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao iniciar sessão de leitura:', error);
      
      // Fallback para sessão mock
      return {
        success: true,
        data: { sessionId: `session-${bookId}-${Date.now()}` }
      };
    }
  }

  async completeReading(sessionId: string, data: {
    rating: number;
    comment?: string;
    donationAmount?: number;
  }): Promise<ApiResponse<{ 
    reward: { money: number; points: number };
    user: any;
  }>> {
    try {
      console.log(`🏁 Finalizando sessão de leitura ${sessionId}...`);
      
      const response = await fetch(`${API_BASE_URL}/reading/complete`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify({ sessionId, ...data }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Leitura finalizada com sucesso');
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao finalizar leitura:', error);
      
      // Fallback para recompensa mock
      return {
        success: true,
        data: {
          reward: { money: 1000, points: 10 }, // R$ 10,00 e 10 pontos
          user: {} // Seria preenchido com dados atualizados do usuário
        }
      };
    }
  }

  // ============================================
  // USER ANALYTICS - PARA ESTATÍSTICAS DETALHADAS
  // ============================================

  async getUserAnalytics(period: '7d' | '30d' | '90d' = '30d'): Promise<ApiResponse<any>> {
    try {
      console.log(`📊 Buscando analytics do usuário (período: ${period})...`);
      
      const response = await fetch(`${API_BASE_URL}/analytics/user?period=${period}`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Analytics do usuário carregados');
        return result;
      } else {
        throw new Error('Formato de resposta inválido da API');
      }
      
    } catch (error) {
      console.error('❌ Erro ao buscar analytics do usuário:', error);
      
      // Fallback para analytics vazios
      return {
        success: true,
        data: {
          totalBooks: 0,
          totalEarnings: 0,
          totalReadingTime: 0,
          averageRating: 0,
          streak: 0,
          weeklyProgress: [],
          genrePreferences: {},
        }
      };
    }
  }
}

export const apiService = new ApiService();
export default apiService;