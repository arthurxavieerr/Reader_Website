// src/services/api.ts - SOLUÇÃO HÍBRIDA
import { ApiResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review777.vercel.app/api';

// Mock data para livros
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
  // BOOKS - USA MOCK (SEM API)
  // ============================================

  async getBooks(): Promise<ApiResponse<{ books: any[] }>> {
    // Simular delay de rede
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('📚 Retornando livros mock (sem API)');
    
    return {
      success: true,
      data: { books: MOCK_BOOKS }
    };
  }

  async getBookById(id: string): Promise<ApiResponse<any>> {
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

  async startReading(bookId: string): Promise<ApiResponse<{ sessionId: string }>> {
    await new Promise(resolve => setTimeout(resolve, 200));
    
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
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const book = MOCK_BOOKS.find(b => b.id === bookId);
    if (!book) {
      throw new Error('Livro não encontrado');
    }
    
    // Simular recompensa
    const reward = {
      points: 100,
      money: book.baseRewardMoney
    };
    
    // Atualizar usuário (isso deveria vir da API real posteriormente)
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
  }
}

export const apiService = new ApiService();
export default apiService;