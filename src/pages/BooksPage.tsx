// src/pages/BooksPage.tsx - CONECTADO À API REAL
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';
import { BookOpen, Users, Lock, Star, Crown, Award, Clock, Zap, TrendingUp } from 'lucide-react';
import { LEVELS } from '../types';

// Tipos para livros da API
interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  baseRewardMoney: number;
  requiredLevel: number;
  reviewsCount: number;
  averageRating: number;
  createdAt: string;
  active?: boolean;
  // Campos calculados localmente
  rewardMoney?: number;
  rewardPoints?: number;
  estimatedReadTime?: number;
  difficulty?: string;
  isAvailable?: boolean;
  hasReceivedReward?: boolean;
}

const BooksPage: React.FC = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Carregar livros da API
  useEffect(() => {
    const loadBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔄 Carregando livros da API...');
        const response = await apiService.getBooks();
        
        if (response.success && response.data?.books) {
          // Processar dados da API para formato compatível
          const processedBooks = response.data.books.map(book => ({
            ...book,
            // Converter valores da API para formato esperado pela UI
            rewardMoney: Math.floor((book.baseRewardMoney || 10000) / 100), // Converter centavos para reais
            rewardPoints: Math.floor((book.baseRewardMoney || 10000) / 200), // Pontos baseados na recompensa
            estimatedReadTime: Math.max(5, Math.floor(Math.random() * 60) + 5), // Mock do tempo de leitura
            difficulty: book.baseRewardMoney > 40000 ? 'Difícil' : book.baseRewardMoney > 20000 ? 'Médio' : 'Fácil',
            isAvailable: (book.requiredLevel || 0) <= (user?.level || 0),
            hasReceivedReward: false // Mock - deveria vir da API
          }));
          
          setBooks(processedBooks);
          console.log(`✅ ${processedBooks.length} livros carregados da API`);
        } else {
          throw new Error('Resposta inválida da API');
        }
        
      } catch (err: any) {
        console.error('❌ Erro ao carregar livros:', err);
        setError(err.message || 'Erro ao carregar livros');
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      loadBooks();
    }
  }, [user]);

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
        <style>{loadingStyles}</style>
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
        <style>{errorStyles}</style>
      </div>
    );
  }

  // Processar livros baseado no nível do usuário
  const userLevel = user.level || 0;
  const availableBooks = books.filter(book => 
    book.isAvailable && (book.requiredLevel || 0) <= userLevel
  );
  const lockedBooks = books.filter(book => 
    !book.isAvailable || (book.requiredLevel || 0) > userLevel
  );

  // Dados básicos do usuário
  const currentLevel = LEVELS.find(level => level.level === user.level) || LEVELS[0];
  const nextLevel = LEVELS.find(level => level.level === user.level + 1);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'fácil': return '#10b981';
      case 'médio': return '#f59e0b';
      case 'difícil': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getGenreColor = (genre: string) => {
    const colors: Record<string, string> = {
      'Mitologia grega': '#895aed',
      'Conto de fadas': '#dc2626',
      'Ensaio filosófico': '#059669',
      'Literatura russa': '#f59e0b',
      'Mistério Urbano': '#8b5cf6',
      'Thriller psicológico': '#dc2626'
    };
    return colors[genre] || '#6b7280';
  };

  return (
    <div className="books-page">
      <div className="container">
        {/* Header da página */}
        <div className="page-header">
          <div className="header-content-books">
            <h1>Biblioteca</h1>
            <p>Descubra, leia e ganhe dinheiro com os melhores livros</p>
          </div>
          
          <div className="user-level-card">
            <div className="level-info">
              <div className="level-badge" style={{ backgroundColor: currentLevel.color }}>
                <Crown size={16} />
                <span>{currentLevel.name}</span>
              </div>
              <div className="level-details">
                <span className="points">{user.points} pontos</span>
                {nextLevel && (
                  <span className="next-level">
                    {nextLevel.pointsRequired - user.points} para {nextLevel.name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas rápidas */}
        <div className="stats-row">
          <div className="stat-item">
            <BookOpen size={20} />
            <span className="stat-value">{availableBooks.length}</span>
            <span className="stat-label">Disponíveis</span>
          </div>
          <div className="stat-item">
            <Lock size={20} />
            <span className="stat-value">{lockedBooks.length}</span>
            <span className="stat-label">Bloqueados</span>
          </div>
          <div className="stat-item">
            <Award size={20} />
            <span className="stat-value">{formatCurrency((user.balance || 0) / 100)}</span>
            <span className="stat-label">Seu Saldo</span>
          </div>
        </div>

        {/* Livros Disponíveis */}
        {availableBooks.length > 0 && (
          <section className="books-section">
            <div className="section-header">
              <h2>Livros Disponíveis</h2>
              <span className="count">{availableBooks.length} livros</span>
            </div>
            
            <div className="books-grid">
              {availableBooks.map((book) => (
                <div key={book.id} className="book-card available">
                  <div className="book-cover" style={{ backgroundColor: getGenreColor(book.genre) }}>
                    <div className="cover-content">
                      <BookOpen size={32} />
                      <div className="genre-badge">{book.genre}</div>
                    </div>
                  </div>
                  
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">por {book.author}</p>
                    <p className="book-synopsis">{book.synopsis}</p>
                    
                    <div className="book-meta">
                      <div className="meta-item">
                        <Clock size={14} />
                        <span>{formatTime(book.estimatedReadTime || 10)}</span>
                      </div>
                      <div className="meta-item">
                        <Star size={14} />
                        <span>{(book.averageRating || 0).toFixed(1)}</span>
                      </div>
                      <div className="meta-item">
                        <Users size={14} />
                        <span>{(book.reviewsCount || 0).toLocaleString()}</span>
                      </div>
                    </div>
                    
                    <div className="book-rewards">
                      <div className="reward-item">
                        <Zap size={16} />
                        <span>{formatCurrency(book.rewardMoney || 0)}</span>
                      </div>
                      <div className="reward-item">
                        <Award size={16} />
                        <span>{book.rewardPoints || 0} pts</span>
                      </div>
                    </div>
                    
                    <div className="difficulty-badge" style={{ backgroundColor: getDifficultyColor(book.difficulty || 'Fácil') }}>
                      {book.difficulty || 'Fácil'}
                    </div>
                  </div>
                  
                  <div className="book-actions">
                    <Link to={`/books/${book.id}/read`} className="btn-primary">
                      <BookOpen size={16} />
                      Ler Agora
                    </Link>
                    <Link to={`/books/${book.id}`} className="btn-secondary">
                      Ver Detalhes
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Livros Bloqueados */}
        {lockedBooks.length > 0 && (
          <section className="books-section">
            <div className="section-header">
              <h2>Livros Bloqueados</h2>
              <span className="count">{lockedBooks.length} livros</span>
            </div>
            
            <div className="books-grid">
              {lockedBooks.map((book) => (
                <div key={book.id} className="book-card locked">
                  <div className="book-cover locked" style={{ backgroundColor: getGenreColor(book.genre) }}>
                    <div className="cover-content">
                      <Lock size={32} />
                      <div className="lock-overlay">
                        <span>Nível {book.requiredLevel || 0}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="book-info">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">por {book.author}</p>
                    <p className="book-synopsis">{book.synopsis}</p>
                    
                    <div className="unlock-requirement">
                      <Lock size={16} />
                      <span>Requer nível {book.requiredLevel || 0}</span>
                    </div>
                    
                    <div className="book-rewards">
                      <div className="reward-item">
                        <Zap size={16} />
                        <span>{formatCurrency(book.rewardMoney || 0)}</span>
                      </div>
                      <div className="reward-item">
                        <Award size={16} />
                        <span>{book.rewardPoints || 0} pts</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="book-actions">
                    <button className="btn-disabled" disabled>
                      <Lock size={16} />
                      Bloqueado
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {availableBooks.length === 0 && lockedBooks.length === 0 && (
          <div className="empty-state">
            <BookOpen size={64} />
            <h2>Nenhum livro encontrado</h2>
            <p>Não encontramos livros disponíveis no momento.</p>
          </div>
        )}
      </div>

      <style>{getStyles()}</style>
    </div>
  );
};

// Estilos da página (mantidos os mesmos)
const loadingStyles = `
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
`;

const errorStyles = `
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
`;

const getStyles = () => `
  .books-page {
    min-height: 100vh;
    background: #white;
    padding: 20px 0 100px;
  }

  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .page-header {
    background: #8b5cf6;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .header-content-books {
    display: flex;
    flex-direction: column;
    margin: 0;
    align-items: flex-start;
  }

  .header-content-books h1 {
    color: white;
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: #fff;
  }

  .header-content-books p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 1.1rem;
    color: #fff;
  }

  .user-level-card {
    background: rgba(255, 255, 255, 0.15);
    border-radius: 12px;
    padding: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .level-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 8px;
    padding: 6px 12px;
    border-radius: 8px;
    width: fit-content;
  }

  .level-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .points {
    color: white;
    font-weight: 600;
  }

  .next-level {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }

  .stats-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .stat-item {
    background: #white;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 12px;
    padding: 24px;
    text-align: center;
    border: 1px solid rgba(255, 255, 255, 0.2);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .stat-item svg {
    color: #1e293b;
  }

  .stat-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #1e293b;
  }

  .stat-label {
    color: #1e293b;
    font-size: 0.9rem;
  }

  .books-section {
    margin-bottom: 48px;
  }

  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .section-header h2 {
    color: #1e293b;
    font-size: 1.8rem;
    font-weight: 600;
  }

  .count {
    color: #1e293b;
    font-size: 1rem;
  }

  .books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }

  .book-card {
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    position: relative;
  }

  .book-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
  }

  .book-card.locked {
    opacity: 0.7;
  }

  .book-cover {
    height: 120px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
  }

  .book-cover.locked::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.4);
    backdrop-filter: blur(2px);
  }

  .cover-content {
    position: relative;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  .cover-content svg {
    color: white;
    opacity: 0.9;
  }

  .genre-badge {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 500;
  }

  .lock-overlay {
    background: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.75rem;
    font-weight: 600;
  }

  .book-info {
    padding: 20px;
    position: relative;
  }

  .book-title {
    font-size: 1.1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .book-author {
    color: #64748b;
    font-size: 0.9rem;
    margin-bottom: 12px;
  }

  .book-synopsis {
    color: #475569;
    font-size: 0.85rem;
    line-height: 1.4;
    margin-bottom: 16px;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .book-meta {
    display: flex;
    gap: 16px;
    margin-bottom: 16px;
  }

  .meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    font-size: 0.8rem;
  }

  .meta-item svg {
    opacity: 0.7;
  }

  .book-rewards {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
  }

  .reward-item {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f1f5f9;
    padding: 6px 10px;
    border-radius: 8px;
    font-size: 0.8rem;
    font-weight: 600;
    color: #475569;
  }

  .reward-item svg {
    color: #8b5cf6;
  }

  .difficulty-badge {
    position: absolute;
    top: 16px;
    right: 16px;
    color: white;
    padding: 4px 8px;
    border-radius: 6px;
    font-size: 0.7rem;
    font-weight: 600;
  }

  .unlock-requirement {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #dc2626;
    font-size: 0.85rem;
    font-weight: 500;
    margin-bottom: 16px;
    padding: 8px 12px;
    background: #fef2f2;
    border-radius: 8px;
  }

  .book-actions {
    padding: 0 20px 20px;
    display: flex;
    gap: 12px;
  }

  .btn-primary {
    flex: 1;
    background: #8b5cf6;
    color: white;
    text-decoration: none;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 600;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    transition: background 0.2s;
  }

  .btn-primary:hover {
    background: #7c3aed;
  }

  .btn-secondary {
    background: #f1f5f9;
    color: #475569;
    text-decoration: none;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    transition: background 0.2s;
  }

  .btn-secondary:hover {
    background: #e2e8f0;
  }

  .btn-disabled {
    flex: 1;
    background: #e2e8f0;
    color: #94a3b8;
    border: none;
    padding: 12px 16px;
    border-radius: 8px;
    font-weight: 500;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    cursor: not-allowed;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: white;
  }

  .empty-state svg {
    opacity: 0.5;
    margin-bottom: 20px;
  }

  .empty-state h2 {
    margin-bottom: 8px;
    opacity: 0.9;
  }

  .empty-state p {
    opacity: 0.7;
  }

  @media (max-width: 768px) {
    .page-header {
      flex-direction: column;
      text-align: center;
      gap: 20px;
    }

    .books-grid {
      grid-template-columns: 1fr;
    }

    .stats-row {
      grid-template-columns: 1fr;
    }
  }
`;

export default BooksPage;