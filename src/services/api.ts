// src/services/api.ts - MIGRADO PARA API REAL
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review-website.onrender.com/api';

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
  // BOOKS - AGORA USA API REAL! ✅
  // ============================================

  async getBooks(): Promise<ApiResponse<{ books: any[] }>> {
    console.log('📚 Buscando livros da API real...');
    
    const response = await fetch(`${API_BASE_URL}/books`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  async getBookById(id: string): Promise<ApiResponse<any>> {
    console.log(`📖 Buscando livro ${id} da API real...`);
    
    const response = await fetch(`${API_BASE_URL}/books/${id}`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  async getBookContent(id: string): Promise<ApiResponse<{ content: string; title: string; author: string }>> {
    console.log(`📄 Buscando conteúdo do livro ${id} da API real...`);
    
    const response = await fetch(`${API_BASE_URL}/books/${id}/content`, {
      headers: this.getAuthHeaders(),
    });

    return await this.handleResponse(response);
  }

  // ============================================
  // READING SESSIONS - AINDA USA MOCK (PRÓXIMA FASE)
  // ============================================

  async startReading(bookId: string): Promise<ApiResponse<{ sessionId: string }>> {
    // TODO: Implementar na próxima fase
    await new Promise(resolve => setTimeout(resolve, 200));
    
    console.log('📚 Iniciando sessão de leitura (mock)...');
    
    return {
      success: true,
      data: { sessionId: `session-${bookId}-${Date.now()}` }
    };
  }

  async completeReading(bookId: string, data: {
    rating: number;
    comment?: string;
    donationAmount?: number;
  }): Promise<ApiResponse<{
    reward: { points: number; money: number };
    user: any;
  }>> {
    // TODO: Implementar na próxima fase
    await new Promise(resolve => setTimeout(resolve, 800));
    
    console.log('✅ Completando leitura (mock)...');
    
    // Buscar dados do livro da API para calcular recompensa
    try {
      const bookResponse = await this.getBookById(bookId);
      const book = bookResponse.data.book;
      
      // Simular recompensa baseada nos dados reais do livro
      const reward = {
        points: book.rewardPoints || 100,
        money: book.baseRewardMoney || 10000
      };
      
      // Atualizar usuário local (isso deveria vir da API real posteriormente)
      const userData = localStorage.getItem('beta-reader-user');
      if (userData) {
        const user = JSON.parse(userData);
        user.points += reward.points;
        user.balance += reward.money;
        localStorage.setItem('beta-reader-user', JSON.stringify(user));
        
        return {
          success: true,
          data: { reward, user }
        };
      }
      
      throw new Error('Usuário não encontrado');
    } catch (error) {
      console.error('Erro ao completar leitura:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();
export default apiService;