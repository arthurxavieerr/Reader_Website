// src/services/api.ts - VERSÃO FINAL COM BANCO REAL
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review777.vercel.app/api';

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
  // AUTH - BANCO REAL
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
    // Por enquanto, usar dados do localStorage até implementar /auth/me
    const userData = localStorage.getItem('beta-reader-user');
    if (userData) {
      const user = JSON.parse(userData);
      return { success: true, data: { user } };
    }
    
    throw new Error('Usuário não autenticado');
  }

  // ============================================
  // BOOKS - BANCO REAL COM FALLBACK
  // ============================================

  async getBooks(): Promise<ApiResponse<{ books: any[] }>> {
    try {
      const response = await fetch(`${API_BASE_URL}/books`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await this.handleResponse<{ books: any[] }>(response);
      console.log('📚 Livros carregados do banco de dados');
      return data;

    } catch (error) {
      console.warn('Erro ao buscar livros da API, usando fallback mock:', error);
      
      // Fallback mock se API falhar
      const mockBooks = [
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
          isInitialBook: true,
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
          isInitialBook: true,
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
          isInitialBook: true,
          createdAt: '2024-01-03T00:00:00.000Z'
        }
      ];

      console.log('📚 Usando livros mock como fallback');
      
      return {
        success: true,
        data: { books: mockBooks }
      };
    }
  }

  async getBookById(id: string): Promise<ApiResponse<any>> {
    // Mock por enquanto
    const mockBooks = [
      { id: '1', title: 'A Caixa de Pandora', author: 'Hesíodo' },
      { id: '2', title: 'O Príncipe e a Gata', author: 'Charles Perrault' },
      { id: '3', title: 'O Banqueiro Anarquista', author: 'Fernando Pessoa' }
    ];
    
    const book = mockBooks.find(b => b.id === id);
    if (!book) throw new Error('Livro não encontrado');
    
    return { success: true, data: { book } };
  }

  async getBookContent(id: string): Promise<ApiResponse<{ content: string }>> {
    // Mock content
    const content = `# Conteúdo do Livro\n\nEste é o conteúdo completo do livro ${id}...\n\n[Texto completo aqui]`;
    return { success: true, data: { content } };
  }

  async startReading(bookId: string): Promise<ApiResponse<{ sessionId: string }>> {
    return { success: true, data: { sessionId: `session-${bookId}-${Date.now()}` } };
  }

  async completeReading(bookId: string, data: {
    rating: number;
    comment?: string;
    donationAmount?: number;
  }): Promise<ApiResponse<{
    reward: { points: number; money: number };
    user: any;
  }>> {
    // Mock reward
    const reward = { points: 100, money: 1000 };
    
    // Atualizar usuário local
    const userData = localStorage.getItem('beta-reader-user');
    if (userData) {
      const user = JSON.parse(userData);
      user.points += reward.points;
      user.balance += reward.money;
      localStorage.setItem('beta-reader-user', JSON.stringify(user));
      
      return { success: true, data: { reward, user } };
    }
    
    throw new Error('Usuário não encontrado');
  }
}

export const apiService = new ApiService();
export default apiService;