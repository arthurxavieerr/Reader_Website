import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, Users, Lock, Star, Crown, Award, Clock, Zap, TrendingUp } from 'lucide-react';
import { LEVELS } from '../types';

// Tipos para a API
interface BookFromAPI {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  coverImage?: string;
  rewardMoney: number;
  rewardPoints: number;
  reviewsCount: number;
  averageRating: number;
  estimatedReadTime: number; // em minutos
  difficulty: string;
  isAvailable: boolean;
  requiredLevel: number;
  hasReceivedReward: boolean;
  createdAt: string;
}

interface BooksAPIResponse {
  success: boolean;
  data: {
    available: BookFromAPI[];
    locked: BookFromAPI[];
    userLevel: number;
    totalBooks: number;
  };
  error?: string;
}

const BooksPage: React.FC = () => {
  const { user } = useAuth();
  const [booksData, setBooksData] = useState<BooksAPIResponse['data'] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Buscar livros da API
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const token = localStorage.getItem('beta-reader-token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch('http://localhost:3001/api/books', {
          headers
        });

        const data: BooksAPIResponse = await response.json();

        if (data.success) {
          setBooksData(data.data);
        } else {
          setError(data.error || 'Erro ao carregar livros');
        }
      } catch (err) {
        console.error('Erro ao buscar livros:', err);
        setError('Erro de conexão com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  if (!user) return null;

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="books-page">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Carregando livros...</h2>
            <p>Buscando os melhores livros para você</p>
          </div>
        </div>
        <style>{`
          .loading-state {
            text-align: center;
            padding: 60px 20px;
          }
          .loading-spinner {
            width: 40px;
            height: 40px;
            border: 4px solid #e2e8f0;
            border-top: 4px solid #8b5cf6;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto 20px;
          }
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          .loading-state h2 {
            color: #1e293b;
            margin-bottom: 8px;
          }
          .loading-state p {
            color: #64748b;
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="books-page">
        <div className="container">
          <div className="error-state">
            <h2>Erro ao carregar livros</h2>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="retry-btn">
              Tentar novamente
            </button>
          </div>
        </div>
        <style>{`
          .error-state {
            text-align: center;
            padding: 60px 20px;
          }
          .error-state h2 {
            color: #dc2626;
            margin-bottom: 16px;
          }
          .error-state p {
            color: #64748b;
            margin-bottom: 24px;
          }
          .retry-btn {
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 500;
          }
          .retry-btn:hover {
            background: #7c3aed;
          }
        `}</style>
      </div>
    );
  }

  // Dados básicos do usuário
  const currentLevel = LEVELS.find(level => level.level === user.level) || LEVELS[0];
  const nextLevel = LEVELS.find(level => level.level === user.level + 1);

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  // Mapear dados da API para formato do componente
  const mapApiBookToComponent = (apiBook: BookFromAPI) => ({
    id: apiBook.id,
    title: apiBook.title,
    author: apiBook.author,
    genre: apiBook.genre,
    rewardMoney: apiBook.rewardMoney / 100, // API retorna em centavos
    reviewsCount: apiBook.reviewsCount,
    rating: apiBook.averageRating,
    readTime: `${apiBook.estimatedReadTime} min`,
    isAvailable: apiBook.isAvailable,
    requiredLevel: apiBook.requiredLevel,
    cover: getBookEmoji(apiBook.genre), // Gerar emoji baseado no gênero
    description: apiBook.synopsis,
    difficulty: apiBook.difficulty,
    trending: apiBook.reviewsCount > 50000, // Popular se tiver muitas avaliações
    hasReceivedReward: apiBook.hasReceivedReward
  });

  // Função para gerar emoji baseado no gênero
  const getBookEmoji = (genre: string): string => {
    if (genre.includes('Fantasia')) return '🏰';
    if (genre.includes('Thriller') || genre.includes('Tecnológico')) return '💻';
    if (genre.includes('Romance')) return '🌸';
    if (genre.includes('Mistério') || genre.includes('Detetive')) return '🔍';
    return '📚'; // Default
  };

  // Organizar livros por disponibilidade
  const availableBooks = booksData ? booksData.available.map(mapApiBookToComponent) : [];
  const lockedBooks = booksData ? booksData.locked.map(mapApiBookToComponent) : [];

  // Separar livros bloqueados por nível
  const getBooksForLevel = (level: number) => {
    return lockedBooks.filter(book => book.requiredLevel === level);
  };

  return (
    <div className="books-page">
      <div className="container">
        {/* Header com status centralizado */}
        <div className="page-header">
          <div className="header-content">
            <div className="title-section">
              <BookOpen size={28} />
              <div className="title-text">
                <h1>Biblioteca de Livros</h1>
                <p>Escolha um livro para avaliar hoje</p>
              </div>
            </div>
            
            <div className="user-status-card">
              <div className="level-info">
                <div className="level-badge">
                  <Crown size={16} />
                  <span>Nível {currentLevel.name}</span>
                </div>
                <div className="points-display">
                  <Award size={16} />
                  <span>{user.points} pontos</span>
                </div>
              </div>
              
              <div className="daily-limit">
                <div className="limit-display">
                  <span className="current">
                    {user.planType === 'premium' ? '3' : '1'}
                  </span>
                  <span className="separator">/</span>
                  <span className="max">
                    {user.planType === 'premium' ? '3' : '1'}
                  </span>
                  <span className="label">livros hoje • limite diário</span>
                </div>
                
                {nextLevel && (
                  <p className="next-level">
                    Faltam <strong>{nextLevel.pointsRequired - user.points} pontos</strong> para {nextLevel.name} 
                    ({nextLevel.booksUnlocked || 3} livros/dia)
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Livros Disponíveis */}
        {availableBooks.length > 0 && (
          <div className="section">
            <div className="section-header">
              <h2>
                <span className="icon">⚡</span>
                Disponíveis Agora
              </h2>
              <div className="section-info">
                {availableBooks.length} livro(s)
              </div>
            </div>
            
            <div className="books-container">
              {availableBooks.map((book) => (
                <div key={book.id} className="book-card available">
                  {/* Header do Card */}
                  <div className="book-header">
                    <div className="book-cover-section">
                      <div className="book-cover">
                        <span className="cover-emoji">{book.cover}</span>
                        <div className="availability-dot"></div>
                        {book.trending && (
                          <div className="trending-badge">
                            <TrendingUp size={12} />
                            Popular
                          </div>
                        )}
                        {book.hasReceivedReward && (
                          <div className="completed-badge">
                            <Star size={12} />
                            Concluído
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="book-info-section">
                      <div className="book-title-area">
                        <h3 className="book-title">{book.title}</h3>
                        <p className="book-author">por {book.author}</p>
                      </div>
                      
                      <div className="book-meta-tags">
                        <span className="genre-tag">{book.genre}</span>
                        <div className="rating-display">
                          <Star size={12} fill="currentColor" />
                          <span>{book.rating}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="book-reward-section">
                      <div className="reward-amount">{formatCurrency(book.rewardMoney)}</div>
                      <span className="reward-label">
                        {book.hasReceivedReward ? 'já recebido' : 'por avaliação'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Body do Card */}
                  <div className="book-content">
                    <p className="book-description">{book.description}</p>
                    
                    <div className="book-stats-row">
                      <div className="stats-left">
                        <div className="stat-item">
                          <Clock size={14} />
                          <span>{book.readTime}</span>
                        </div>
                        <div className="stat-item">
                          <Users size={14} />
                          <span>+{book.reviewsCount.toLocaleString()} usuários já avaliaram</span>
                        </div>
                      </div>
                      <div className="stats-right">
                        <div className={`difficulty-badge difficulty-${book.difficulty.toLowerCase()}`}>
                          {book.difficulty}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Footer do Card */}
                  <div className="book-action">
                    <Link to={`/books/${book.id}`} className="btn-evaluate">
                      <Zap size={16} />
                      {book.hasReceivedReward ? 'Ver detalhes' : 'Clique para avaliar'}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Livros por Nível */}
        {[1, 2].map((level) => {
          const levelBooks = getBooksForLevel(level);
          const levelInfo = LEVELS.find(l => l.level === level);
          
          if (levelBooks.length === 0) return null;
          
          return (
            <div key={level} className="section locked-section">
              <div className="section-header">
                <h2>
                  <span className="icon">🔒</span>
                  Nível {levelInfo?.name}
                </h2>
                <div className="section-info">
                  {levelBooks.length} livro(s) • {levelInfo?.booksUnlocked || 3} por dia
                </div>
              </div>
              
              <div className="books-container">
                {levelBooks.map((book) => (
                  <div key={book.id} className="book-card locked">
                    <div className="book-header">
                      <div className="book-cover-section">
                        <div className="book-cover">
                          <span className="cover-emoji">{book.cover}</span>
                          <div className="lock-overlay">
                            <Lock size={16} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="book-info-section">
                        <div className="book-title-area">
                          <h3 className="book-title">{book.title}</h3>
                          <p className="book-author">por {book.author}</p>
                        </div>
                        
                        <div className="book-meta-tags">
                          <span className="genre-tag">{book.genre}</span>
                          <div className="rating-display">
                            <Star size={12} fill="currentColor" />
                            <span>{book.rating}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="book-reward-section">
                        <div className="reward-amount">{formatCurrency(book.rewardMoney)}</div>
                        <span className="reward-label">por avaliação</span>
                      </div>
                    </div>
                    
                    <div className="book-content">
                      <p className="book-description">{book.description}</p>
                      
                      <div className="book-stats-row">
                        <div className="stats-left">
                          <div className="stat-item">
                            <Clock size={14} />
                            <span>{book.readTime}</span>
                          </div>
                          <div className="stat-item">
                            <Users size={14} />
                            <span>+{book.reviewsCount.toLocaleString()} usuários já avaliaram</span>
                          </div>
                        </div>
                        <div className="stats-right">
                          <div className={`difficulty-badge difficulty-${book.difficulty.toLowerCase()}`}>
                            {book.difficulty}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="book-action">
                      <div className="locked-info">
                        <Lock size={14} />
                        <span>Nível {levelInfo?.name} necessário</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {/* Caso não tenha nenhum livro */}
        {availableBooks.length === 0 && lockedBooks.length === 0 && (
          <div className="no-books-state">
            <BookOpen size={48} />
            <h2>Nenhum livro disponível</h2>
            <p>Não há livros cadastrados no momento. Volte em breve!</p>
          </div>
        )}
      </div>
      
      <style>{`
        .books-page {
          min-height: calc(100vh - 140px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 32px 0;
        }
        
        .container {
          max-width: 1000px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        /* Estados especiais */
        .no-books-state {
          text-align: center;
          padding: 60px 20px;
          color: #64748b;
        }
        
        .no-books-state h2 {
          color: #1e293b;
          margin: 16px 0 8px 0;
        }
        
        /* Badge para livros concluídos */
        .completed-badge {
          position: absolute;
          bottom: -8px;
          left: -8px;
          background: #10b981;
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        /* Header Estruturado */
        .page-header {
          margin-bottom: 48px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 40px;
          flex-wrap: wrap;
        }
        
        .title-section {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #8b5cf6;
        }
        
        .title-text h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .title-text p {
          color: #64748b;
          margin: 0;
          font-size: 16px;
        }
        
        /* Status Card Alinhado */
        .user-status-card {
          background: white;
          padding: 24px;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          min-width: 320px;
          flex-shrink: 0;
        }
        
        .level-info {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .level-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #8b5cf6;
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .points-display {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
        }
        
        .daily-limit {
          text-align: center;
        }
        
        .limit-display {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .current { color: #10b981; }
        .separator { color: #94a3b8; }
        .max { color: #10b981; }
        .label { 
          color: #64748b; 
          font-size: 13px;
          margin-left: 8px;
        }
        
        .next-level {
          font-size: 12px;
          color: #64748b;
          margin: 0;
          line-height: 1.4;
        }
        
        /* Seções Organizadas */
        .section {
          margin-bottom: 48px;
        }
        
        .locked-section {
          opacity: 0.9;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .section-header h2 {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .locked-section .section-header h2 {
          color: #64748b;
        }
        
        .icon {
          font-size: 20px;
        }
        
        .section-info {
          background: #f1f5f9;
          color: #475569;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        
        /* Container dos Cards */
        .books-container {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        /* Cards Estruturados */
        .book-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }
        
        .book-card.available {
          border-color: #10b981;
        }
        
        .book-card.available:hover {
          transform: translateY(-4px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
        
        .book-card.locked {
          border-color: #e5e7eb;
          opacity: 0.8;
        }
        
        /* Header do Card Alinhado */
        .book-header {
          display: flex;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 16px;
        }
        
        .book-cover-section {
          flex-shrink: 0;
          position: relative;
        }
        
        .book-cover {
          position: relative;
          width: 70px;
          height: 90px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }
        
        .cover-emoji {
          font-size: 28px;
        }
        
        .availability-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background: #10b981;
          border: 3px solid white;
          border-radius: 50%;
        }
        
        .lock-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          border-radius: 12px;
        }
        
        .trending-badge {
          position: absolute;
          top: -8px;
          left: -8px;
          background: linear-gradient(135deg, #ff6b6b, #ffa500);
          color: white;
          padding: 4px 8px;
          border-radius: 8px;
          font-size: 10px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        
        .book-info-section {
          flex: 1;
          min-width: 0;
        }
        
        .book-title-area {
          margin-bottom: 12px;
        }
        
        .book-title {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }
        
        .book-author {
          color: #64748b;
          font-size: 14px;
          margin: 0;
          font-weight: 500;
        }
        
        .book-meta-tags {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .genre-tag {
          background: #fef3c7;
          color: #d97706;
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .rating-display {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #f59e0b;
          font-size: 14px;
          font-weight: 600;
        }
        
        .book-reward-section {
          text-align: right;
          flex-shrink: 0;
        }
        
        .reward-amount {
          font-size: 20px;
          font-weight: 700;
          color: #10b981;
          margin-bottom: 2px;
        }
        
        .reward-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        
        /* Content do Card */
        .book-content {
          margin-bottom: 20px;
        }
        
        .book-description {
          color: #475569;
          font-size: 14px;
          line-height: 1.6;
          margin: 0 0 16px 0;
        }
        
        .book-stats-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .stats-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #64748b;
          font-size: 13px;
          font-weight: 500;
        }
        
        .stats-right {
          flex-shrink: 0;
        }
        
        .difficulty-badge {
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .difficulty-fácil {
          background: #dcfce7;
          color: #16a34a;
        }
        
        .difficulty-médio {
          background: #fef3c7;
          color: #d97706;
        }
        
        .difficulty-difícil {
          background: #fee2e2;
          color: #dc2626;
        }
        
        /* Action do Card */
        .book-action {
          display: flex;
          justify-content: center;
        }
        
        .btn-evaluate {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        
        .btn-evaluate:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }
        
        .locked-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #9ca3af;
          font-size: 14px;
          font-weight: 600;
          background: #f9fafb;
          padding: 12px 20px;
          border-radius: 10px;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
          
          .header-content {
            flex-direction: column;
            align-items: stretch;
            gap: 24px;
          }
          
          .user-status-card {
            min-width: 0;
          }
          
          .book-header {
            flex-direction: column;
            align-items: center;
            text-align: center;
          }
          
          .book-reward-section {
            text-align: center;
            order: -1;
          }
          
          .book-stats-row {
            flex-direction: column;
            gap: 12px;
            align-items: center;
          }
          
          .stats-left {
            flex-direction: column;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default BooksPage;