// src/pages/BookDetailPage.tsx - MIGRADO PARA API REAL
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users, Star, Clock, BookOpen, Award, Zap, Heart, TrendingUp, Eye, Target } from 'lucide-react';
import { apiService } from '../services/api';

// Tipos para a API
interface BookDetailFromAPI {
  id: string;
  title: string;
  author: string;
  genre: string;
  synopsis: string;
  baseRewardMoney: number;
  rewardPoints: number;
  reviewsCount: number;
  averageRating: number;
  estimatedReadTime: number; // em segundos
  wordCount: number;
  pageCount: number;
  requiredLevel: number;
  isInitialBook: boolean;
  createdAt: string;
  // Campos calculados
  rewardMoney?: number;
  isAvailable?: boolean;
  canRead?: boolean;
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
        console.log('📖 Buscando livro da API real...');
        
        const response = await apiService.getBookById(id);
        
        if (response.success && response.data.book) {
          const bookData = response.data.book;
          
          // Calcular campos adicionais
          const userLevel = getUserLevel(); // Pegar do localStorage ou contexto
          const userPlan = getUserPlan();
          
          const processedBook: BookDetailFromAPI = {
            ...bookData,
            rewardMoney: calculateUserReward(bookData.baseRewardMoney, userPlan),
            isAvailable: bookData.requiredLevel <= userLevel,
            canRead: bookData.requiredLevel <= userLevel
          };
          
          setBook(processedBook);
          console.log('✅ Livro carregado:', processedBook.title);
        } else {
          setError('Livro não encontrado');
        }
      } catch (err: any) {
        console.error('❌ Erro ao buscar livro:', err);
        setError(err.message || 'Erro de conexão com o servidor');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // Funções auxiliares
  const getUserLevel = (): number => {
    try {
      const userData = localStorage.getItem('beta-reader-user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.level || 0;
      }
    } catch (error) {
      console.error('Erro ao obter nível do usuário:', error);
    }
    return 0;
  };

  const getUserPlan = (): 'free' | 'premium' => {
    try {
      const userData = localStorage.getItem('beta-reader-user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.planType || 'free';
      }
    } catch (error) {
      console.error('Erro ao obter plano do usuário:', error);
    }
    return 'free';
  };

  const calculateUserReward = (baseRewardMoney: number, planType: 'free' | 'premium'): number => {
    // baseRewardMoney está em centavos, converter para reais
    const rewardInReais = baseRewardMoney / 100;
    
    if (planType === 'premium') {
      return rewardInReais * 1.5; // 50% a mais
    }
    
    return rewardInReais;
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatReadTime = (timeInSeconds: number) => {
    const minutes = Math.ceil(timeInSeconds / 60);
    return `${minutes} min`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

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
            <Link to="/dashboard" className="back-button">
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Dashboard
            </Link>
          </div>
        </div>
        <style>{errorStyles}</style>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      <div className="page-container">
        {/* Header com navegação */}
        <div className="page-header">
          <Link to="/dashboard" className="back-button">
            <ArrowLeft className="w-5 h-5" />
            Voltar
          </Link>
          <button
            onClick={() => setIsFavorited(!isFavorited)}
            className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
            aria-label={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Informações principais do livro */}
        <div className="book-main-info">
          <div className="book-cover">
            <div className="cover-placeholder">
              <BookOpen className="w-12 h-12" />
            </div>
          </div>

          <div className="book-details">
            <h1 className="book-title">{book.title}</h1>
            <p className="book-author">por {book.author}</p>
            <p className="book-genre">{book.genre}</p>

            <div className="book-stats">
              <div className="stat-item">
                <div className="stat-icons">
                  {renderStars(book.averageRating)}
                </div>
                <span className="stat-text">
                  {book.averageRating.toFixed(1)} • {book.reviewsCount.toLocaleString()} avaliações
                </span>
              </div>

              <div className="stat-item">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="stat-text">{formatReadTime(book.estimatedReadTime)}</span>
              </div>

              <div className="stat-item">
                <BookOpen className="w-4 h-4 text-gray-500" />
                <span className="stat-text">{book.pageCount} páginas • {book.wordCount.toLocaleString()} palavras</span>
              </div>
            </div>

            {/* Recompensa */}
            <div className="reward-info">
              <div className="reward-money">
                <Award className="w-5 h-5 text-yellow-500" />
                <span className="reward-amount">
                  {formatCurrency(book.rewardMoney || 0)}
                </span>
                <span className="reward-label">por leitura completa</span>
              </div>
              
              {book.rewardPoints && (
                <div className="reward-points">
                  <Zap className="w-4 h-4 text-blue-500" />
                  <span>{book.rewardPoints} pontos</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sinopse */}
        <div className="book-synopsis">
          <h2>Sinopse</h2>
          <p>{book.synopsis}</p>
        </div>

        {/* Botão de ação */}
        <div className="action-section">
          {book.isAvailable ? (
            <Link to={`/book/${book.id}/read`} className="read-button">
              <BookOpen className="w-5 h-5" />
              Começar Leitura
            </Link>
          ) : (
            <div className="locked-info">
              <Target className="w-5 h-5" />
              <span>Disponível no nível {book.requiredLevel}</span>
            </div>
          )}
        </div>

        {/* Informações adicionais */}
        <div className="additional-info">
          <div className="info-grid">
            <div className="info-item">
              <strong>Nível necessário:</strong>
              <span>{book.requiredLevel}</span>
            </div>
            <div className="info-item">
              <strong>Publicado em:</strong>
              <span>{formatDate(book.createdAt)}</span>
            </div>
            <div className="info-item">
              <strong>Livro inicial:</strong>
              <span>{book.isInitialBook ? 'Sim' : 'Não'}</span>
            </div>
          </div>
        </div>
      </div>

      <style>{pageStyles}</style>
    </div>
  );
};

// Estilos CSS
const loadingStyles = `
  .loading-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
  }

  .loading-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #f3f4f6;
    border-top: 3px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: 16px;
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
  }

  .error-state h2 {
    color: #ef4444;
    margin-bottom: 8px;
  }

  .error-state p {
    color: #6b7280;
    margin-bottom: 24px;
  }
`;

const pageStyles = `
  .book-detail-page {
    min-height: 100vh;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px 0;
  }

  .page-container {
    max-width: 800px;
    margin: 0 auto;
    padding: 0 20px;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
  }

  .back-button {
    display: flex;
    align-items: center;
    gap: 8px;
    color: white;
    text-decoration: none;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .back-button:hover {
    opacity: 0.8;
  }

  .favorite-button {
    background: rgba(255, 255, 255, 0.1);
    border: none;
    border-radius: 50%;
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .favorite-button:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .favorite-button.favorited {
    color: #ef4444;
  }

  .book-main-info {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    display: flex;
    gap: 32px;
  }

  .book-cover {
    flex-shrink: 0;
  }

  .cover-placeholder {
    width: 160px;
    height: 240px;
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }

  .book-details {
    flex: 1;
  }

  .book-title {
    font-size: 2rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 8px;
  }

  .book-author {
    font-size: 1.1rem;
    color: #6b7280;
    margin-bottom: 4px;
  }

  .book-genre {
    font-size: 0.9rem;
    color: #9ca3af;
    margin-bottom: 24px;
  }

  .book-stats {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 24px;
  }

  .stat-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .stat-icons {
    display: flex;
    gap: 2px;
  }

  .stat-text {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .reward-info {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .reward-money {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .reward-amount {
    font-size: 1.25rem;
    font-weight: bold;
    color: #059669;
  }

  .reward-label {
    color: #6b7280;
    font-size: 0.9rem;
  }

  .reward-points {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #3b82f6;
    font-size: 0.9rem;
  }

  .book-synopsis {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
  }

  .book-synopsis h2 {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1f2937;
    margin-bottom: 16px;
  }

  .book-synopsis p {
    color: #4b5563;
    line-height: 1.6;
  }

  .action-section {
    background: white;
    border-radius: 16px;
    padding: 32px;
    margin-bottom: 24px;
    display: flex;
    justify-content: center;
  }

  .read-button {
    background: linear-gradient(135deg, #059669, #047857);
    color: white;
    padding: 16px 32px;
    border-radius: 12px;
    text-decoration: none;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s;
    font-size: 1.1rem;
  }

  .read-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(5, 150, 105, 0.3);
  }

  .locked-info {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #6b7280;
    font-size: 1.1rem;
  }

  .additional-info {
    background: white;
    border-radius: 16px;
    padding: 32px;
  }

  .info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #f3f4f6;
  }

  .info-item strong {
    color: #374151;
  }

  .info-item span {
    color: #6b7280;
  }

  @media (max-width: 768px) {
    .book-main-info {
      flex-direction: column;
      text-align: center;
    }

    .cover-placeholder {
      margin: 0 auto;
    }

    .book-title {
      font-size: 1.5rem;
    }
  }
`;

export default BookDetailPage;