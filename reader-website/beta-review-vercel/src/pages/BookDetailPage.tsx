import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Star, Clock, BookOpen, Award, Zap, Heart, TrendingUp, Eye, Target } from 'lucide-react';

// Tipos para a API
interface ReviewFromAPI {
  id: string;
  rating: number;
  comment?: string;
  createdAt: string;
  user: {
    name: string;
    level: number;
  };
}

interface BookDetailFromAPI {
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
  canRead: boolean;
  createdAt: string;
  reviews: ReviewFromAPI[];
}

interface BookDetailAPIResponse {
  success: boolean;
  data: {
    book: BookDetailFromAPI;
  };
  error?: string;
}

const BookDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [book, setBook] = useState<BookDetailFromAPI | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorited, setIsFavorited] = useState(false);

  // Buscar dados do livro da API
  useEffect(() => {
    const fetchBook = async () => {
      if (!id) return;

      try {
        const token = localStorage.getItem('beta-reader-token');
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        };
        
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const response = await fetch(`http://localhost:3001/api/books/${id}`, {
          headers
        });

        const data: BookDetailAPIResponse = await response.json();

        if (data.success && data.data.book) {
          setBook(data.data.book);
        } else {
          setError(data.error || 'Livro não encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar livro:', err);
        setError('Erro de conexão com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // Estados de loading e erro
  if (loading) {
    return (
      <div className="book-detail-page">
        <div className="page-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <h2>Carregando livro...</h2>
            <p>Buscando detalhes do livro</p>
          </div>
        </div>
        <style>{loadingStyles}</style>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="book-detail-page">
        <div className="page-container">
          <div className="error-state">
            <h2>Livro não encontrado</h2>
            <p>{error || 'O livro que você está procurando não existe.'}</p>
            <Link to="/books" className="back-to-books">
              Voltar para biblioteca
            </Link>
          </div>
        </div>
        <style>{errorStyles}</style>
      </div>
    );
  }

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  // Gerar emoji baseado no gênero
  const getBookEmoji = (genre: string): string => {
    if (genre.includes('Fantasia')) return '🏰';
    if (genre.includes('Thriller') || genre.includes('Tecnológico')) return '💻';
    if (genre.includes('Romance')) return '🌸';
    if (genre.includes('Mistério') || genre.includes('Detetive')) return '🔍';
    return '📚';
  };

  // Gerar tags fictícias baseadas no gênero (já que a API não retorna tags)
  const generateTags = (genre: string): string[] => {
    if (genre.includes('Fantasia')) return ['Magia', 'Aventura', 'Mistério'];
    if (genre.includes('Thriller')) return ['Suspense', 'Tecnologia', 'Ação'];
    if (genre.includes('Romance')) return ['Amor', 'Emoção', 'Drama'];
    if (genre.includes('Mistério')) return ['Investigação', 'Suspense', 'Crime'];
    return ['Ficção', 'Literatura'];
  };

  const bookEmoji = getBookEmoji(book.genre);
  const bookTags = generateTags(book.genre);
  const isPopular = book.reviewsCount > 50000;

  return (
    <div className="book-detail-page">
      <div className="page-container">
        {/* Header de navegação */}
        <div className="detail-header">
          <Link to="/books" className="back-button">
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </Link>
          
          <div className="header-actions">
            <button 
              className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
              onClick={toggleFavorite}
              aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>

        {/* Card principal */}
        <div className="book-detail-card">
          {/* Seção do cabeçalho */}
          <div className="book-hero-section">
            <div className="book-cover-area">
              <div className="book-cover-large">
                <span className="cover-emoji">{bookEmoji}</span>
                
                {/* Badges da capa */}
                <div className="cover-badges">
                  <div className="rating-badge">
                    <Star size={12} fill="currentColor" />
                    <span>{book.averageRating}</span>
                  </div>
                  {isPopular && (
                    <div className="trending-badge">
                      <TrendingUp size={12} />
                      <span>Popular</span>
                    </div>
                  )}
                  {book.hasReceivedReward && (
                    <div className="completed-badge">
                      <Award size={12} />
                      <span>Concluído</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="book-info-area">
              <div className="book-title-section">
                <h1 className="book-title">{book.title}</h1>
                <p className="book-author">por {book.author}</p>
                
                <div className="book-meta-tags">
                  <span className="genre-tag">{book.genre}</span>
                  <span className={`difficulty-tag difficulty-${book.difficulty.toLowerCase()}`}>
                    {book.difficulty}
                  </span>
                </div>
              </div>
              
              {/* Stats rápidas */}
              <div className="book-quick-stats">
                <div className="stat-item">
                  <Clock size={16} />
                  <span>{book.estimatedReadTime} min de leitura</span>
                </div>
                <div className="stat-item">
                  <Users size={16} />
                  <span>{book.reviewsCount.toLocaleString()} avaliações</span>
                </div>
                <div className="stat-item">
                  <BookOpen size={16} />
                  <span>Disponível para leitura</span>
                </div>
              </div>
            </div>
          </div>

          {/* Seção de sinopse */}
          <div className="synopsis-section">
            <h3 className="section-title">
              <Eye size={18} />
              Sinopse
            </h3>
            <p className="synopsis-text">{book.synopsis}</p>
            
            {/* Tags do livro */}
            <div className="book-tags">
              {bookTags.map((tag, index) => (
                <span key={index} className="tag">{tag}</span>
              ))}
            </div>
          </div>

          {/* Seção de recompensa */}
          <div className="reward-section">
            <div className="reward-card">
              <div className="reward-header">
                <Target size={20} />
                <h3>Sua Recompensa</h3>
              </div>
              
              <div className="reward-content">
                <div className="reward-amount-display">
                  <span className="reward-value">{formatCurrency(book.rewardMoney)}</span>
                  <span className="reward-label">
                    {book.hasReceivedReward ? 'já recebido' : 'por avaliação completa'}
                  </span>
                </div>
                
                <div className="bonus-info">
                  <div className="bonus-item">
                    <Award size={16} />
                    <span>+{book.rewardPoints} pontos XP</span>
                  </div>
                  <div className="bonus-item">
                    <Zap size={16} />
                    <span>Progresso no nível</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Botão de ação */}
          <div className="action-section">
            {book.canRead ? (
              <Link to={`/books/${id}/read`} className="read-button">
                <BookOpen size={20} />
                <span>{book.hasReceivedReward ? 'Ler novamente' : 'Ler e Avaliar'}</span>
              </Link>
            ) : (
              <div className="read-button disabled">
                <BookOpen size={20} />
                <span>Nível {book.requiredLevel} necessário</span>
              </div>
            )}
            
            <div className="action-info">
              <p>
                {book.canRead 
                  ? (book.hasReceivedReward 
                      ? 'Você já avaliou este livro e recebeu a recompensa'
                      : 'Leia o livro completo e deixe sua avaliação para receber a recompensa')
                  : `Alcance o nível ${book.requiredLevel} para desbloquear este livro`
                }
              </p>
            </div>
          </div>
        </div>

        {/* Avaliações dos usuários */}
        {book.reviews && book.reviews.length > 0 && (
          <div className="reviews-section">
            <h3>Últimas Avaliações</h3>
            <div className="reviews-list">
              {book.reviews.slice(0, 3).map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="reviewer-info">
                      <span className="reviewer-name">{review.user.name}</span>
                      <span className="reviewer-level">Nível {review.user.level}</span>
                    </div>
                    <div className="review-rating">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          size={14} 
                          fill={i < review.rating ? 'currentColor' : 'none'}
                        />
                      ))}
                    </div>
                  </div>
                  {review.comment && (
                    <p className="review-comment">{review.comment}</p>
                  )}
                  <span className="review-date">
                    {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações adicionais */}
        <div className="additional-info">
          <div className="info-grid">
            <div className="info-item">
              <span className="info-label">Idioma</span>
              <span className="info-value">Português</span>
            </div>
            <div className="info-item">
              <span className="info-label">Publicado</span>
              <span className="info-value">{new Date(book.createdAt).getFullYear()}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Tempo estimado</span>
              <span className="info-value">{book.estimatedReadTime} minutos</span>
            </div>
            <div className="info-item">
              <span className="info-label">Avaliação</span>
              <span className="info-value">{book.averageRating}/5</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{mainStyles}</style>
    </div>
  );
};

// Estilos separados para melhor organização
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
  .back-to-books {
    display: inline-block;
    background: #8b5cf6;
    color: white;
    text-decoration: none;
    padding: 12px 24px;
    border-radius: 8px;
    font-weight: 500;
    transition: background 0.2s;
  }
  .back-to-books:hover {
    background: #7c3aed;
  }
`;

const mainStyles = `
  .book-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 20px 0 40px 0;
  }
  
  .page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 24px;
  }
  
  /* Header */
  .detail-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }
  
  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #64748b;
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    padding: 12px 16px;
    border-radius: 12px;
    transition: all 0.2s ease;
    background: white;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  
  .back-button:hover {
    background: #f8fafc;
    color: #334155;
    transform: translateX(-2px);
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
  
  .favorite-button {
    background: white;
    border: 2px solid #e2e8f0;
    padding: 12px;
    border-radius: 12px;
    cursor: pointer;
    color: #64748b;
    transition: all 0.2s ease;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }
  
  .favorite-button:hover {
    border-color: #ef4444;
    color: #ef4444;
  }
  
  .favorite-button.favorited {
    border-color: #ef4444;
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
  
  /* Card principal */
  .book-detail-card {
    background: white;
    border-radius: 24px;
    padding: 32px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    margin-bottom: 24px;
  }
  
  /* Hero section */
  .book-hero-section {
    display: flex;
    gap: 32px;
    margin-bottom: 32px;
    align-items: flex-start;
  }
  
  .book-cover-area {
    flex-shrink: 0;
  }
  
  .book-cover-large {
    position: relative;
    width: 160px;
    height: 200px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .cover-emoji {
    font-size: 64px;
  }
  
  .cover-badges {
    position: absolute;
    top: -8px;
    right: -8px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .rating-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #f59e0b;
    color: white;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
  }
  
  .trending-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    background: linear-gradient(135deg, #ff6b6b, #ffa500);
    color: white;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }

  .completed-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    background: #10b981;
    color: white;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
  }
  
  .book-info-area {
    flex: 1;
    min-width: 0;
  }
  
  .book-title-section {
    margin-bottom: 24px;
  }
  
  .book-title {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    line-height: 1.2;
  }
  
  .book-author {
    font-size: 18px;
    color: #64748b;
    margin: 0 0 16px 0;
    font-weight: 500;
  }
  
  .book-meta-tags {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
  
  .genre-tag {
    background: #fef3c7;
    color: #d97706;
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 14px;
    font-weight: 600;
  }
  
  .difficulty-tag {
    padding: 8px 16px;
    border-radius: 12px;
    font-size: 14px;
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
  
  .book-quick-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    display: flex;
    align-items: center;
    gap: 10px;
    color: #64748b;
    font-size: 15px;
    font-weight: 500;
  }
  
  /* Synopsis */
  .synopsis-section {
    margin-bottom: 32px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 20px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 16px 0;
  }
  
  .synopsis-text {
    color: #475569;
    font-size: 16px;
    line-height: 1.7;
    margin: 0 0 20px 0;
  }
  
  .book-tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }
  
  .tag {
    background: #f1f5f9;
    color: #475569;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    border: 1px solid #e2e8f0;
  }
  
  /* Reward section */
  .reward-section {
    margin-bottom: 32px;
  }
  
  .reward-card {
    background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
    color: white;
    padding: 24px;
    border-radius: 20px;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
  }
  
  .reward-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
  }
  
  .reward-header h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0;
  }
  
  .reward-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .reward-amount-display {
    display: flex;
    flex-direction: column;
  }
  
  .reward-value {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .reward-label {
    font-size: 14px;
    opacity: 0.9;
    color: #e0e7ff;
  }
  
  .bonus-info {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .bonus-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    font-weight: 500;
  }
  
  /* Action section */
  .action-section {
    text-align: center;
  }
  
  .read-button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    color: white;
    text-decoration: none;
    padding: 16px 32px;
    border-radius: 16px;
    font-weight: 700;
    font-size: 18px;
    transition: all 0.3s ease;
    box-shadow: 0 8px 32px rgba(139, 92, 246, 0.3);
    margin-bottom: 16px;
    border: none;
    cursor: pointer;
  }
  
  .read-button:hover:not(.disabled) {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(139, 92, 246, 0.4);
  }

  .read-button.disabled {
    background: #94a3b8;
    cursor: not-allowed;
    box-shadow: none;
  }
  
  .action-info {
    color: #64748b;
    font-size: 14px;
  }
  
  .action-info p {
    margin: 0;
  }

  /* Reviews section */
  .reviews-section {
    background: white;
    border-radius: 16px;
    padding: 24px;
    margin-bottom: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }

  .reviews-section h3 {
    color: #1e293b;
    margin-bottom: 20px;
    font-size: 18px;
  }

  .reviews-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .review-card {
    background: #f8fafc;
    border-radius: 12px;
    padding: 16px;
    border: 1px solid #e2e8f0;
  }

  .review-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .reviewer-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .reviewer-name {
    font-weight: 600;
    color: #1e293b;
  }

  .reviewer-level {
    font-size: 12px;
    color: #64748b;
  }

  .review-rating {
    color: #f59e0b;
    display: flex;
    gap: 2px;
  }

  .review-comment {
    color: #475569;
    margin: 8px 0;
    font-size: 14px;
    line-height: 1.5;
  }

  .review-date {
    font-size: 12px;
    color: #94a3b8;
  }
  
  /* Additional info */
  .additional-info {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    border: 1px solid #e2e8f0;
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
  
  .info-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .info-label {
    font-size: 13px;
    color: #64748b;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
  
  .info-value {
    font-size: 16px;
    color: #1e293b;
    font-weight: 600;
  }
  
  /* Responsive */
  @media (max-width: 768px) {
    .page-container {
      padding: 0 16px;
    }
    
    .book-detail-card {
      padding: 24px 20px;
    }
    
    .book-hero-section {
      flex-direction: column;
      align-items: center;
      text-align: center;
      gap: 24px;
    }
    
    .book-cover-large {
      width: 140px;
      height: 175px;
    }
    
    .cover-emoji {
      font-size: 56px;
    }
    
    .book-title {
      font-size: 28px;
    }
    
    .reward-content {
      flex-direction: column;
      gap: 16px;
      align-items: flex-start;
    }
    
    .info-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .book-quick-stats {
      align-items: center;
    }
  }
`;

export default BookDetailPage;