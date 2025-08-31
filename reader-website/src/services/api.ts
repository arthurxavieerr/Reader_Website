// src/services/api.ts
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiService {
  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && !token.startsWith('mock-') ? { 'Authorization': `Bearer ${token}` } : {})
    };
  }

  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (response.status === 429) {
      throw new Error('Rate limit exceeded');
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }

    return data;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getAuthHeaders(),
          ...options.headers,
        },
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      // Se for rate limit ou erro de rede, propagar o erro para usar fallback
      if (error.message.includes('Rate limit') || 
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.name === 'TypeError') {
        throw error;
      }
      
      throw new Error(error.message || 'Erro na requisição');
    }
  }

  // Auth endpoints
  async getUserData(): Promise<ApiResponse<{
    user: any;
  }>> {
    return this.request('/auth/me');
  }

  // Books endpoints
  async getBooks(): Promise<ApiResponse<{
    books: any[];
  }>> {
    return this.request('/books');
  }

  async getBookById(id: string): Promise<ApiResponse<any>> {
    return this.request(`/books/${id}`);
  }

  async getBookContent(id: string): Promise<ApiResponse<{
    content: string;
  }>> {
    return this.request(`/books/${id}/content`);
  }

  async startReading(bookId: string): Promise<ApiResponse<{
    sessionId: string;
  }>> {
    return this.request(`/books/${bookId}/start-reading`, {
      method: 'POST'
    });
  }

  async completeReading(bookId: string, data: {
    rating: number;
    comment?: string;
    donationAmount?: number;
  }): Promise<ApiResponse<{
    reward: {
      points: number;
      money: number;
    };
    user: any;
  }>> {
    return this.request(`/books/${bookId}/complete`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}

export const apiService = new ApiService();
export default apiService;