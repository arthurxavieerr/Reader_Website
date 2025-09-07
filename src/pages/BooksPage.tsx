// src/pages/BooksPage.tsx - VERSÃO LIMPA
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { 
  BookOpen, Star, Clock, Award, Lock, Search, Filter,
  Users, TrendingUp, Zap, Target, ArrowRight
} from 'lucide-react';

// Constantes de níveis locais
const LEVELS = [
  { level: 0, name: 'Iniciante', color: '#94a3b8', minPoints: 0 },
  { level: 1, name: 'Leitor', color: '#3b82f6', minPoints: 1000 },
  { level: 2, name: 'Avaliador', color: '#10b981', minPoints: 2500 },
  { level: 3, name: 'Crítico', color: '#f59e0b', minPoints: 5000 },
  { level: 4, name: 'Especialista', color: '#ef4444', minPoints: 10000 },
  { level: 5, name: 'Mestre', color: '#8b5cf6', minPoints: 20000 },
];

interface BookCardProps {
  book: any;
  userLevel: number;
}

const BookCard: React.FC<BookCardProps> = ({ book, userLevel }) => {
  const isAvailable = book.requiredLevel <= userLevel;
  
  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.ceil(seconds / 60);
    return `${minutes} min`;
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-3 h-3 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className={`book-card ${!isAvailable ? 'locked' : ''}`}>
      <div className="book-cover">
        <div 
          className="cover-placeholder"
          style={{ backgroundColor: book.coverColor || '#3b82f6' }}
        >
          <BookOpen className="w-8 h-8 text-white" />
        </div>
        {!isAvailable && (
          <div className="lock-overlay">
            <Lock className="w-6 h-6 text-white" />
          </div>
        )}
      </div>

      <div className="book-info">
        <h3 className="book-title">{book.title}</h3>
        <p className="book-author">por {book.author}</p>
        <p className="book-genre">{book.genre}</p>

        <div className="book-stats">
          <div className="stat">
            <div className="stars">
              {renderStars(book.averageRating)}
            </div>
            <span className="rating-text">
              {book.averageRating.toFixed(1)} ({book.reviewsCount.toLocaleString()})
            </span>
          </div>
          
          <div className="stat">
            <Clock className="w-4 h-4 text-gray-500" />
            <span>{book.estimatedTime || formatTime(book.estimatedReadTime)}</span>
          </div>
        </div>

        <div className="book-reward">
          <Award className="w-4 h-4 text-yellow-500" />
          <span className="reward-amount">
            {formatCurrency(book.rewardMoney || (book.baseRewardMoney / 100))}
          </span>
        </div>

        <p className="book-synopsis">{book.synopsis}</p>

        <div className="book-actions">
          {isAvailable ? (
            <Link to={`/book/${book.id}`} className="read-button">
              <BookOpen className="w-4 h-4" />
              Ler Livro
            </Link>
          ) : (
            <div className="locked-info">
              <Target className="w-4 h-4" />
              <span>Nível {book.requiredLevel} necessário</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BooksPage: React.FC = () => {
  const { user } = useAuth();
  const { availableBooks, lockedBooks, isLoading, error, refetch } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  const getLevelInfoSafe = (level: number) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  };

  const getNextLevelInfoSafe = (level: number) => {
    return LEVELS.find(l => l.level === level + 1) || LEVELS[LEVELS.length - 1];
  };

  // Filtrar e ordenar livros
  const allBooks = [...availableBooks, ...lockedBooks];
  
  const filteredBooks = allBooks.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGenre = selectedGenre === 'all' || book.genre === selectedGenre;
    return matchesSearch && matchesGenre;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return b.averageRating - a.averageRating;
      case 'popular':
        return b.reviewsCount - a.reviewsCount;
      case 'reward':
        return (b.rewardMoney || (b.baseRewardMoney / 100)) - (a.rewardMoney || (a.baseRewardMoney / 100));
      case 'newest':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  // Obter gêneros únicos
  const genres = Array.from(new Set(allBooks.map(book => book.genre)));

  if (isLoading) {
    return (
      <>
        <div className="books-page">
          <div className="loading-state">
            <div className="loading-spinner" />
            <h2>Carregando livros...</h2>
            <p>Buscando os melhores livros para você</p>
          </div>
        </div>
        <style>{loadingStyles}</style>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="books-page">
          <div className="error-state">
            <h2>Erro ao carregar livros</h2>
            <p>{error}</p>
            <button onClick={refetch} className="retry-button">
              Tentar novamente
            </button>
          </div>
        </div>
        <style>{errorStyles}</style>
      </>
    );
  }

  return (
    <>
      <div className="books-page">
        <div className="page-container">
          <div className="page-header">
            <div className="header-content">
              <h1>Biblioteca de Livros</h1>
              <p>Descubra e leia livros incríveis enquanto ganha recompensas</p>
            </div>
            
            {user && (
              <div className="user-progress">
                <div className="level-info">
                  <span className="current-level">
                    Nível {user.level} - {getLevelInfoSafe(user.level).name}
                  </span>
                  {user.level < LEVELS.length - 1 && (
                    <span className="next-level">
                      Próximo: {getNextLevelInfoSafe(user.level).name}
                    </span>
                  )}
                </div>
                <div className="stats">
                  <div className="stat">
                    <Zap className="w-4 h-4 text-blue-500" />
                    <span>{user.points} pontos</span>
                  </div>
                  <div className="stat">
                    <BookOpen className="w-4 h-4 text-green-500" />
                    <span>{availableBooks.length} disponíveis</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="filters-section">
            <div className="search-box">
              <Search className="w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por título ou autor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-controls">
              <select
                value={selectedGenre}
                onChange={(e) => setSelectedGenre(e.target.value)}
                aria-label="Filtrar por gênero"
              >
                <option value="all">Todos os gêneros</option>
                {genres.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="Ordenar por"
              >
                <option value="newest">Mais novos</option>
                <option value="rating">Melhor avaliados</option>
                <option value="popular">Mais populares</option>
                <option value="reward">Maior recompensa</option>
              </select>
            </div>
          </div>

          <div className="books-grid">
            {sortedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                userLevel={user?.level || 0}
              />
            ))}
          </div>

          {sortedBooks.length === 0 && (
            <div className="empty-state">
              <BookOpen className="w-16 h-16 text-gray-300" />
              <h3>Nenhum livro encontrado</h3>
              <p>Tente ajustar os filtros de busca</p>
            </div>
          )}

          {lockedBooks.length > 0 && (
            <div className="locked-section">
              <div className="section-header">
                <h2>Desbloqueie mais livros</h2>
                <span className="unlock-hint">Continue lendo para desbloquear</span>
              </div>
              
              <div className="locked-preview">
                {lockedBooks.slice(0, 3).map(book => (
                  <div key={book.id} className="locked-book-preview">
                    <div className="preview-cover">
                      <Lock className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="preview-info">
                      <h4>{book.title}</h4>
                      <p>Nível {book.requiredLevel} necessário</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{pageStyles}</style>
    </>
  );
};

const loadingStyles = `
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: white;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top: 3px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 20px;
  }

  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const errorStyles = `
  .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    color: white;
  }

  .retry-button {
    background: white;
    color: #3b82f6;
    border: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    margin-top: 16px;
  }
`;

const pageStyles = `
  .books-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 40px 0;
  }

  .page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .page-header {
    text-align: center;
    margin-bottom: 40px;
    color: white;
  }

  .header-content h1 {
    font-size: 2.5rem;
    font-weight: bold;
    margin-bottom: 8px;
  }

  .header-content p {
    font-size: 1.1rem;
    opacity: 0.9;
    margin-bottom: 24px;
  }

  .user-progress {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 24px;
    margin-top: 24px;
  }

  .level-info {
    margin-bottom: 16px;
  }

  .current-level {
    font-size: 1.1rem;
    font-weight: 600;
    display: block;
    margin-bottom: 4px;
  }

  .next-level {
    opacity: 0.8;
    font-size: 0.9rem;
  }

  .stats {
    display: flex;
    gap: 24px;
    justify-content: center;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }

  .filters-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 32px;
    display: flex;
    gap: 16px;
    align-items: center;
    flex-wrap: wrap;
  }

  .search-box {
    position: relative;
    flex: 1;
    min-width: 250px;
  }

  .search-box input {
    width: 100%;
    padding: 12px 16px 12px 44px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    font-size: 1rem;
  }

  .search-box svg {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
  }

  .filter-controls {
    display: flex;
    gap: 12px;
  }

  .filter-controls select {
    padding: 12px 16px;
    border: 2px solid #e5e7eb;
    border-radius: 12px;
    background: white;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 24px;
    margin-bottom: 40px;
  }

  .book-card {
    background: white;
    border-radius: 16px;
    padding: 20px;
    display: flex;
    gap: 16px;
    transition: all 0.3s ease;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .book-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
  }

  .book-card.locked {
    opacity: 0.7;
  }

  .book-cover {
    position: relative;
    flex-shrink: 0;
  }

  .cover-placeholder {
    width: 80px;
    height: 120px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .lock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.6);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .book-info {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .book-title {
    font-size: 1.1rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 4px;
    line-height: 1.3;
  }

  .book-author {
    color: #6b7280;
    font-size: 0.9rem;
    margin-bottom: 4px;
  }

  .book-genre {
    color: #9ca3af;
    font-size: 0.8rem;
    margin-bottom: 12px;
  }

  .book-stats {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin-bottom: 12px;
  }

  .stat {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 0.8rem;
    color: #6b7280;
  }

  .stars {
    display: flex;
    gap: 2px;
  }

  .rating-text {
    font-size: 0.8rem;
  }

  .book-reward {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
  }

  .reward-amount {
    font-weight: 600;
    color: #059669;
    font-size: 1rem;
  }

  .book-synopsis {
    color: #4b5563;
    font-size: 0.85rem;
    line-height: 1.4;
    margin-bottom: 16px;
    flex: 1;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .book-actions {
    margin-top: auto;
  }

  .read-button {
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
    padding: 10px 16px;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    font-size: 0.9rem;
    justify-content: center;
  }

  .read-button:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
  }

  .locked-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-size: 0.9rem;
    justify-content: center;
    padding: 10px 16px;
    background: #f9fafb;
    border-radius: 8px;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: white;
  }

  .empty-state h3 {
    margin: 16px 0 8px;
    font-size: 1.5rem;
  }

  .locked-section {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border-radius: 16px;
    padding: 32px;
    color: white;
    text-align: center;
  }

  .section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .locked-section h2 {
    font-size: 1.5rem;
    margin: 0;
  }

  .unlock-hint {
    font-size: 0.9rem;
    opacity: 0.8;
  }

  .locked-preview {
    display: flex;
    gap: 16px;
    justify-content: center;
    flex-wrap: wrap;
  }

  .locked-book-preview {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.1);
    padding: 16px;
    border-radius: 12px;
    min-width: 200px;
  }

  .preview-cover {
    width: 40px;
    height: 60px;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-info h4 {
    font-size: 0.9rem;
    margin-bottom: 4px;
  }

  .preview-info p {
    font-size: 0.8rem;
    opacity: 0.8;
    margin: 0;
  }

  @media (max-width: 768px) {
    .page-header {
      margin-bottom: 24px;
    }

    .header-content h1 {
      font-size: 2rem;
    }

    .filters-section {
      flex-direction: column;
      align-items: stretch;
    }

    .search-box {
      min-width: auto;
    }

    .filter-controls {
      justify-content: space-between;
    }

    .books-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .book-card {
      flex-direction: column;
      text-align: center;
    }

      margin: 0 auto;
    }

    .stats {
      gap: 16px;
    }

    .locked-preview {
      flex-direction: column;
      align-items: center;
    }

    .section-header {
      flex-direction: column;
      gap: 8px;
      text-align: center;
    }
  }
`;

export default BooksPage;