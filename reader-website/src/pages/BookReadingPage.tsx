import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Star, Heart, CheckCircle, Clock, Users, BookOpen, Award, Plus, Minus, Loader2 } from 'lucide-react';

interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  genre: string;
  rewardPoints: number;
  rewardMoney: number;
  reviewsCount: number;
  averageRating: number;
  synopsis: string;
  requiredLevel: number;
}

const BookReadingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Estados do componente
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [isFavorited, setIsFavorited] = useState(false);
  const [readingProgress, setReadingProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingStartTime] = useState(Date.now());

  // Configuração da API
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

  const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('beta-reader-token');
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Erro na requisição');
    }

    return data;
  };

  // Buscar dados do livro
  useEffect(() => {
    const fetchBook = async () => {
      if (!id) {
        setError('ID do livro não encontrado');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        const response = await apiRequest(`/api/books/${id}`);
        
        if (response.success && response.data) {
          setBook(response.data);
        } else {
          throw new Error('Livro não encontrado');
        }
      } catch (err) {
        console.error('Erro ao buscar livro:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar livro');
      } finally {
        setLoading(false);
      }
    };

    fetchBook();
  }, [id]);

  // Simular progresso de leitura baseado no tempo
  useEffect(() => {
    const timer = setInterval(() => {
      const elapsed = Date.now() - readingStartTime;
      const estimatedReadTime = 12 * 60 * 1000; // 12 minutos em ms
      const progress = Math.min(100, (elapsed / estimatedReadTime) * 100);
      setReadingProgress(Math.floor(progress));
    }, 1000);

    return () => clearInterval(timer);
  }, [readingStartTime]);

  const handleFinishReading = () => {
    // Só permitir avaliação se leu pelo menos 80% ou passou 5 minutos
    const elapsed = Date.now() - readingStartTime;
    const minTime = 5 * 60 * 1000; // 5 minutos
    
    if (readingProgress < 80 && elapsed < minTime) {
      alert('Continue lendo para poder avaliar o livro!');
      return;
    }
    
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      alert('Por favor, selecione uma avaliação de 1 a 5 estrelas');
      return;
    }

    if (!book || !user) return;

    setIsSubmitting(true);

    try {
      // Preparar dados da avaliação
      const reviewData = {
        rating,
        comment: comment.trim() || undefined,
        donationAmount: donationAmount ? parseInt(donationAmount) : undefined
      };

      // Enviar avaliação para a API
      const response = await apiRequest(`/api/books/${book.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify(reviewData),
      });

      if (response.success) {
        // Atualizar dados do usuário se retornados
        if (response.data.user) {
          // Aqui você pode atualizar o contexto do usuário
          // Por enquanto, vamos apenas mostrar sucesso
        }

        // Mostrar sucesso e redirecionar
        alert(`Avaliação enviada com sucesso! Você ganhou ${book.rewardPoints} pontos e R$ ${(book.rewardMoney / 100).toFixed(2)}!`);
        navigate('/dashboard');
      } else {
        throw new Error(response.message || 'Erro ao enviar avaliação');
      }
    } catch (err) {
      console.error('Erro ao enviar avaliação:', err);
      alert(err instanceof Error ? err.message : 'Erro ao enviar avaliação');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRatingClick = (value: number) => {
    setRating(value);
  };

  const handleDonationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    setDonationAmount(value);
  };

  const adjustFontSize = (increment: boolean) => {
    setFontSize(prev => {
      const newSize = increment ? prev + 2 : prev - 2;
      return Math.max(12, Math.min(24, newSize));
    });
  };

  const toggleFavorite = () => {
    setIsFavorited(!isFavorited);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (loading) {
    return (
      <div className="reading-page-loading">
        <div className="loading-container">
          <Loader2 size={48} className="loading-spinner" />
          <h2>Carregando livro...</h2>
          <p>Preparando sua experiência de leitura</p>
        </div>
        <style>{`
          .reading-page-loading {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
          }
          .loading-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            max-width: 400px;
          }
          .loading-spinner {
            animation: spin 1s linear infinite;
            color: #8b5cf6;
            margin-bottom: 20px;
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .loading-container h2 {
            color: #1e293b;
            margin-bottom: 12px;
          }
          .loading-container p {
            color: #64748b;
            margin-bottom: 20px;
          }
        `}</style>
      </div>
    );
  }

  // Error state
  if (error || !book) {
    return (
      <div className="reading-page-error">
        <div className="error-container">
          <h2>Ops! Algo deu errado</h2>
          <p>{error || 'Livro não encontrado'}</p>
          <button onClick={() => navigate('/books')} className="btn-back">
            <ArrowLeft size={16} />
            Voltar para Biblioteca
          </button>
        </div>
        <style>{`
          .reading-page-error {
            min-height: 100vh;
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 40px;
          }
          .error-container {
            text-align: center;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
            max-width: 400px;
          }
          .error-container h2 {
            color: #1e293b;
            margin-bottom: 12px;
          }
          .error-container p {
            color: #64748b;
            margin-bottom: 20px;
          }
          .btn-back {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: #8b5cf6;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 12px;
            cursor: pointer;
            font-weight: 600;
            transition: all 0.2s ease;
          }
          .btn-back:hover {
            background: #7c3aed;
            transform: translateY(-1px);
          }
        `}</style>
      </div>
    );
  }

  return (
    <div className={`reading-page-modern ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header aprimorado e fixo */}
      <div className="reading-header-modern">
        <div className="header-left">
          <button 
            className="back-button-modern"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft size={20} />
            <span>Voltar</span>
          </button>
        </div>

        <div className="header-center">
          <div className="reading-progress-modern">
            <div className="timer-display">
              <Clock size={16} />
              <span>{formatTime(Date.now() - readingStartTime)}</span>
            </div>
            <div className="progress-bar-header">
              <div 
                className="progress-fill-header" 
                style={{width: `${readingProgress}%`}}
              ></div>
            </div>
            <span className="progress-text">{readingProgress}%</span>
          </div>
        </div>

        <div className="header-right">
          <button 
            className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
            onClick={toggleFavorite}
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="reading-container-modern">
        {/* Cabeçalho do livro com dados reais */}
        <div className="book-header-enhanced">
          <div className="book-cover-large">
            <BookOpen size={56} />
            <div className="cover-overlay">
              <div className="availability-dot-large"></div>
            </div>
          </div>
          
          <div className="book-details-enhanced">
            <div className="book-title-section">
              <h1 className="book-title-large">{book.title}</h1>
              <p className="book-author-large">por {book.author}</p>
            </div>
            
            <div className="book-meta-row">
              <span className="genre-tag">{book.genre}</span>
              <div className="rating-display">
                <Star size={16} fill="currentColor" />
                <span>{book.averageRating}</span>
                <span className="rating-count">({book.reviewsCount.toLocaleString()})</span>
              </div>
            </div>
            
            <div className="book-stats-row">
              <div className="stat-item">
                <Clock size={16} />
                <span>12 min de leitura</span>
              </div>
              <div className="stat-item">
                <Award size={16} />
                <span>R$ {(book.rewardMoney / 100).toFixed(2)} por avaliação</span>
              </div>
            </div>
          </div>
        </div>

        {/* Controles de leitura */}
        <div className="reading-controls-modern">
          <div className="font-controls">
            <span className="controls-label">Tamanho do texto:</span>
            <button 
              className="font-btn"
              onClick={() => adjustFontSize(false)}
              disabled={fontSize <= 12}
            >
              <Minus size={16} />
              <span>A</span>
            </button>
            <span className="font-size-display">{fontSize}px</span>
            <button 
              className="font-btn"
              onClick={() => adjustFontSize(true)}
              disabled={fontSize >= 24}
            >
              <Plus size={16} />
              <span>A</span>
            </button>
          </div>
          
          <div className="reading-mode-toggle">
            <span className="controls-label">Modo:</span>
            <button 
              className={`mode-btn ${!isDarkMode ? 'active' : ''}`}
              onClick={() => setIsDarkMode(false)}
            >
              📖 Padrão
            </button>
            <button 
              className={`mode-btn ${isDarkMode ? 'active' : ''}`}
              onClick={() => setIsDarkMode(true)}
            >
              🌙 Noturno
            </button>
          </div>
        </div>

        {/* Área de leitura com conteúdo real */}
        <div className="reading-area-modern">
          <div className="book-text-container">
            <div className="text-header">
              <BookOpen size={20} />
              <h2>Conteúdo do Livro</h2>
            </div>
            
            <div className="book-text-modern" style={{fontSize: `${fontSize}px`}}>
              {book.content.split('\n\n').map((paragraph, index) => (
                <p key={index} className="reading-paragraph-modern">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>

        {/* Seção de finalização melhorada */}
        <div className="finish-section-modern">
          <div className="completion-card-modern">
            <div className="completion-header">
              <div className="completion-icon">
                <CheckCircle size={40} />
              </div>
              <div className="completion-text">
                <h3>Parabéns! Leitura Concluída</h3>
                <p>Agora avalie o livro e receba sua recompensa</p>
              </div>
            </div>
            
            <div className="completion-rewards">
              <div className="reward-preview">
                <div className="reward-item">
                  <Award size={20} />
                  <span>+{book.rewardPoints} pontos XP</span>
                </div>
                <div className="reward-item">
                  <span className="money-icon">💰</span>
                  <span>+R$ {(book.rewardMoney / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <button 
              className="btn-finish-modern"
              onClick={handleFinishReading}
              disabled={readingProgress < 80 && (Date.now() - readingStartTime) < 5 * 60 * 1000}
            >
              <Star size={20} />
              {readingProgress >= 80 || (Date.now() - readingStartTime) >= 5 * 60 * 1000 
                ? 'Avaliar e Receber Recompensa' 
                : 'Continue lendo para avaliar'
              }
            </button>
          </div>
        </div>
      </div>

      {/* Modal de avaliação */}
      {showReviewModal && (
        <div className="modal-overlay-enhanced">
          <div className="modal-content-enhanced">
            <div className="modal-header-enhanced">
              <div className="modal-book-info">
                <div className="modal-book-cover">
                  <BookOpen size={24} />
                </div>
                <div className="modal-title-section">
                  <h2>Avaliar "{book.title}"</h2>
                  <p>Compartilhe sua opinião e receba sua recompensa!</p>
                </div>
              </div>
            </div>
            
            <div className="modal-body-enhanced">
              {/* Seção de avaliação */}
              <div className="rating-section-enhanced">
                <h3>Como você avalia este livro?</h3>
                <div className="star-rating-enhanced">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      className={`star-button-enhanced ${star <= rating ? 'active' : ''}`}
                      onClick={() => handleRatingClick(star)}
                    >
                      <Star size={32} fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <div className="rating-feedback">
                  {rating === 0 && (
                    <p className="rating-prompt">✨ Clique nas estrelas para avaliar</p>
                  )}
                  {rating === 1 && (
                    <p className="rating-text disappointed">😞 Muito ruim - Que pena que não gostou!</p>
                  )}
                  {rating === 2 && (
                    <p className="rating-text poor">😐 Ruim - Pode melhorar</p>
                  )}
                  {rating === 3 && (
                    <p className="rating-text average">🙂 Regular - Uma leitura ok</p>
                  )}
                  {rating === 4 && (
                    <p className="rating-text good">😊 Bom - Gostou da história!</p>
                  )}
                  {rating === 5 && (
                    <p className="rating-text excellent">🤩 Excelente - Amou este livro!</p>
                  )}
                </div>
              </div>

              {/* Seção de comentário */}
              <div className="comment-section-enhanced">
                <h3>
                  <span className="section-icon">💭</span>
                  Deixe um comentário (opcional)
                </h3>
                <div className="textarea-container">
                  <textarea
                    className="comment-textarea-enhanced"
                    placeholder="O que você achou da história? Compartilhe detalhes sobre personagens, enredo, estilo de escrita..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    maxLength={500}
                  />
                  <div className="textarea-footer">
                    <div className="char-counter">
                      {comment.length}/500 caracteres
                    </div>
                  </div>
                </div>
              </div>

              {/* Seção de doação */}
              <div className="donation-section-enhanced">
                <h3>
                  <span className="section-icon">❤️</span>
                  Apoie o autor (opcional)
                </h3>
                <div className="donation-input-container">
                  <div className="donation-input-wrapper">
                    <span className="currency-symbol">R$</span>
                    <input
                      type="text"
                      className="donation-input-enhanced"
                      placeholder="0,00"
                      value={donationAmount ? (parseInt(donationAmount) / 100).toFixed(2) : ''}
                      onChange={handleDonationChange}
                    />
                  </div>
                  <div className="donation-suggestions">
                    <span className="suggestions-label">Sugestões:</span>
                    {[200, 500, 1000].map(amount => (
                      <button
                        key={amount}
                        className="suggestion-btn"
                        onClick={() => setDonationAmount(amount.toString())}
                      >
                        R$ {(amount / 100).toFixed(2)}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="donation-note">
                  💡 Sua contribuição incentiva o autor a continuar escrevendo histórias incríveis!
                </p>
              </div>

              {/* Resumo das recompensas */}
              <div className="rewards-summary">
                <h4>
                  <span className="section-icon">🎁</span>
                  Suas recompensas por esta avaliação:
                </h4>
                <div className="rewards-grid">
                  <div className="reward-card">
                    <div className="reward-icon">⭐</div>
                    <div className="reward-details">
                      <span className="reward-value">+{book.rewardPoints} pontos</span>
                      <span className="reward-label">XP Ganho</span>
                    </div>
                  </div>
                  <div className="reward-card">
                    <div className="reward-icon">💰</div>
                    <div className="reward-details">
                      <span className="reward-value">+R$ {(book.rewardMoney / 100).toFixed(2)}</span>
                      <span className="reward-label">Dinheiro</span>
                    </div>
                  </div>
                  {donationAmount && parseInt(donationAmount) > 0 && (
                    <div className="reward-card donation-card">
                      <div className="reward-icon">❤️</div>
                      <div className="reward-details">
                        <span className="reward-value">R$ {(parseInt(donationAmount) / 100).toFixed(2)}</span>
                        <span className="reward-label">Doação</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer-enhanced">
              <button 
                className="btn-cancel-enhanced"
                onClick={() => setShowReviewModal(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </button>
              <button 
                className="btn-submit-enhanced"
                onClick={handleSubmitReview}
                disabled={rating === 0 || isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="loading-spinner" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    Finalizar Avaliação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        /* Estilos principais */
        .reading-page-modern {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .reading-header-modern {
          position: sticky;
          top: 0;
          z-index: 100;
          background: white;
          border-bottom: 1px solid #e2e8f0;
          padding: 16px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          backdrop-filter: blur(10px);
        }
        
        .back-button-modern {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          color: #64748b;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          padding: 10px 16px;
          border-radius: 12px;
          transition: all 0.2s ease;
        }
        
        .back-button-modern:hover {
          background: #f1f5f9;
          color: #334155;
          transform: translateX(-2px);
        }
        
        .reading-progress-modern {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .timer-display {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #8b5cf6;
          font-weight: 700;
          font-size: 15px;
          background: rgba(139, 92, 246, 0.1);
          padding: 6px 12px;
          border-radius: 8px;
        }
        
        .progress-bar-header {
          width: 160px;
          height: 8px;
          background: #e2e8f0;
          border-radius: 4px;
          overflow: hidden;
        }
        
        .progress-fill-header {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          transition: width 0.3s ease;
        }
        
        .progress-text {
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
        }
        
        .favorite-button {
          background: none;
          border: 2px solid #e2e8f0;
          padding: 10px;
          border-radius: 12px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
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
        
        .reading-container-modern {
          max-width: 900px;
          margin: 0 auto;
          padding: 40px 24px;
        }
        
        .book-header-enhanced {
          display: flex;
          gap: 32px;
          margin-bottom: 40px;
          background: white;
          padding: 32px;
          border-radius: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        .book-cover-large {
          position: relative;
          width: 140px;
          height: 180px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
          color: white;
        }
        
        .cover-overlay {
          position: absolute;
          top: -8px;
          right: -8px;
        }
        
        .availability-dot-large {
          width: 24px;
          height: 24px;
          background: #10b981;
          border: 4px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
        }
        
        .book-details-enhanced {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        
        .book-title-large {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          line-height: 1.2;
        }
        
        .book-author-large {
          font-size: 18px;
          color: #64748b;
          margin: 0;
          font-weight: 500;
        }
        
        .book-meta-row {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .genre-tag {
          background: #fef3c7;
          color: #d97706;
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .rating-display {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #f59e0b;
          font-weight: 600;
        }
        
        .rating-count {
          color: #64748b;
          font-size: 14px;
        }
        
        .book-stats-row {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .stat-item {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 15px;
          font-weight: 500;
        }
        
        .reading-controls-modern {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: white;
          padding: 20px 24px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        
        .font-controls {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .controls-label {
          font-size: 14px;
          font-weight: 600;
          color: #475569;
        }
        
        .font-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 12px;
          border-radius: 8px;
          cursor: pointer;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .font-btn:hover:not(:disabled) {
          background: #e2e8f0;
          border-color: #cbd5e1;
        }
        
        .font-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .font-size-display {
          background: #8b5cf6;
          color: white;
          padding: 6px 12px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          min-width: 50px;
          text-align: center;
        }
        
        .reading-mode-toggle {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .mode-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .mode-btn.active {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
        }
        
        .mode-btn:hover:not(.active) {
          background: #e2e8f0;
        }
        
        .reading-area-modern {
          margin-bottom: 40px;
        }
        
        .book-text-container {
          background: white;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        .text-header {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #f8fafc;
          padding: 20px 32px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .text-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .book-text-modern {
          padding: 40px;
          line-height: 1.8;
          color: #374151;
          background: white;
        }
        
        .reading-paragraph-modern {
          margin-bottom: 28px;
          text-align: justify;
          text-indent: 2em;
        }
        
        .reading-paragraph-modern:last-child {
          margin-bottom: 0;
        }
        
        .finish-section-modern {
          display: flex;
          justify-content: center;
        }
        
        .completion-card-modern {
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          color: white;
          padding: 40px;
          border-radius: 24px;
          text-align: center;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.3);
        }
        
        .completion-header {
          margin-bottom: 32px;
        }
        
        .completion-icon {
          margin-bottom: 20px;
        }
        
        .completion-text h3 {
          font-size: 24px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        
        .completion-text p {
          opacity: 0.9;
          margin: 0;
          font-size: 16px;
        }
        
        .completion-rewards {
          margin-bottom: 32px;
        }
        
        .reward-preview {
          display: flex;
          justify-content: center;
          gap: 24px;
        }
        
        .reward-preview .reward-item {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.2);
          padding: 12px 16px;
          border-radius: 12px;
          font-weight: 600;
          backdrop-filter: blur(10px);
        }
        
        .money-icon {
          font-size: 18px;
        }
        
        .btn-finish-modern {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          background: white;
          color: #8b5cf6;
          border: none;
          padding: 16px 32px;
          border-radius: 16px;
          font-weight: 700;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          width: 100%;
        }
        
        .btn-finish-modern:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        }
        
        .btn-finish-modern:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        /* Modal styles */
        .modal-overlay-enhanced {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
          backdrop-filter: blur(8px);
        }
        
        .modal-content-enhanced {
          background: white;
          border-radius: 32px;
          max-width: 600px;
          width: 100%;
          max-height: 95vh;
          overflow-y: auto;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
          border: 1px solid #e2e8f0;
        }
        
        .modal-header-enhanced {
          padding: 32px 32px 0;
        }
        
        .modal-book-info {
          display: flex;
          gap: 20px;
          align-items: center;
        }
        
        .modal-book-cover {
          width: 60px;
          height: 75px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          flex-shrink: 0;
        }
        
        .modal-title-section h2 {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 8px 0;
        }
        
        .modal-title-section p {
          color: #64748b;
          margin: 0;
          font-size: 16px;
        }
        
        .modal-body-enhanced {
          padding: 32px;
        }
        
        .rating-section-enhanced {
          text-align: center;
          margin-bottom: 40px;
        }
        
        .rating-section-enhanced h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 24px 0;
        }
        
        .star-rating-enhanced {
          display: flex;
          justify-content: center;
          gap: 12px;
          margin-bottom: 20px;
        }
        
        .star-button-enhanced {
          background: none;
          border: none;
          cursor: pointer;
          color: #e2e8f0;
          transition: all 0.3s ease;
          padding: 8px;
          border-radius: 50%;
        }
        
        .star-button-enhanced.active {
          color: #f59e0b;
        }
        
        .star-button-enhanced:hover {
          color: #f59e0b;
          transform: scale(1.1);
        }
        
        .rating-feedback {
          min-height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .rating-prompt {
          color: #8b5cf6;
          font-weight: 500;
          margin: 0;
        }
        
        .rating-text {
          font-size: 18px;
          font-weight: 600;
          margin: 0;
        }
        
        .rating-text.disappointed { color: #ef4444; }
        .rating-text.poor { color: #f97316; }
        .rating-text.average { color: #eab308; }
        .rating-text.good { color: #22c55e; }
        .rating-text.excellent { color: #8b5cf6; }
        
        .comment-section-enhanced,
        .donation-section-enhanced {
          margin-bottom: 32px;
        }
        
        .comment-section-enhanced h3,
        .donation-section-enhanced h3 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 16px 0;
        }
        
        .section-icon {
          font-size: 20px;
        }
        
        .textarea-container {
          position: relative;
        }
        
        .comment-textarea-enhanced {
          width: 100%;
          min-height: 120px;
          padding: 20px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-family: inherit;
          font-size: 15px;
          line-height: 1.6;
          resize: vertical;
          transition: border-color 0.2s ease;
        }
        
        .comment-textarea-enhanced:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        
        .textarea-footer {
          display: flex;
          justify-content: flex-end;
          margin-top: 8px;
        }
        
        .char-counter {
          font-size: 13px;
          color: #94a3b8;
        }
        
        .donation-input-container {
          margin-bottom: 12px;
        }
        
        .donation-input-wrapper {
          position: relative;
          margin-bottom: 16px;
        }
        
        .currency-symbol {
          position: absolute;
          left: 20px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          font-weight: 700;
          font-size: 18px;
        }
        
        .donation-input-enhanced {
          width: 100%;
          padding: 20px 20px 20px 50px;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          font-size: 18px;
          font-weight: 600;
          transition: border-color 0.2s ease;
        }
        
        .donation-input-enhanced:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        
        .donation-suggestions {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-wrap: wrap;
        }
        
        .suggestions-label {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .suggestion-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .suggestion-btn:hover {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
        }
        
        .donation-note {
          font-size: 14px;
          color: #64748b;
          margin: 0;
          line-height: 1.5;
        }
        
        .rewards-summary {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 24px;
          border-radius: 20px;
          margin-bottom: 32px;
          border: 1px solid #e2e8f0;
        }
        
        .rewards-summary h4 {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #1e293b;
          margin: 0 0 20px 0;
        }
        
        .rewards-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
          gap: 16px;
        }
        
        .reward-card {
          background: white;
          padding: 20px 16px;
          border-radius: 16px;
          text-align: center;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease;
        }
        
        .reward-card:hover {
          transform: translateY(-2px);
        }
        
        .donation-card {
          border-color: #f59e0b;
          background: linear-gradient(135deg, #fef3c7, #fcd34d);
        }
        
        .reward-icon {
          font-size: 24px;
          margin-bottom: 12px;
        }
        
        .reward-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .reward-value {
          font-size: 16px;
          font-weight: 700;
          color: #10b981;
        }
        
        .donation-card .reward-value {
          color: #d97706;
        }
        
        .reward-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        
        .modal-footer-enhanced {
          display: flex;
          gap: 16px;
          padding: 0 32px 32px;
        }
        
        .btn-cancel-enhanced {
          flex: 1;
          padding: 16px 20px;
          border: 2px solid #e2e8f0;
          background: white;
          color: #64748b;
          font-weight: 600;
          font-size: 16px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel-enhanced:hover:not(:disabled) {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        
        .btn-cancel-enhanced:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-submit-enhanced {
          flex: 2;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 16px 20px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          color: white;
          border: none;
          font-weight: 700;
          font-size: 16px;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        
        .btn-submit-enhanced:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }
        
        .btn-submit-enhanced:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }
        
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        
        /* Modo Noturno */
        .reading-page-modern.dark-mode {
          background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
        }
        
        .dark-mode .reading-header-modern {
          background: #1e293b;
          border-bottom-color: #374151;
        }
        
        .dark-mode .back-button-modern {
          color: #94a3b8;
        }
        
        .dark-mode .back-button-modern:hover {
          background: #374151;
          color: #f1f5f9;
        }
        
        .dark-mode .timer-display {
          background: rgba(139, 92, 246, 0.2);
          color: #a78bfa;
        }
        
        .dark-mode .progress-text {
          color: #94a3b8;
        }
        
        .dark-mode .favorite-button {
          border-color: #374151;
          background: #1e293b;
          color: #94a3b8;
        }
        
        .dark-mode .favorite-button:hover {
          border-color: #ef4444;
          color: #ef4444;
        }
        
        .dark-mode .book-header-enhanced {
          background: #1e293b;
          border-color: #374151;
        }
        
        .dark-mode .book-title-large,
        .dark-mode .text-header h2 {
          color: #f1f5f9;
        }
        
        .dark-mode .book-author-large,
        .dark-mode .stat-item {
          color: #94a3b8;
        }
        
        .dark-mode .reading-controls-modern {
          background: #1e293b;
          border-color: #374151;
        }
        
        .dark-mode .controls-label {
          color: #f1f5f9;
        }
        
        .dark-mode .font-btn {
          background: #374151;
          border-color: #4b5563;
          color: #94a3b8;
        }
        
        .dark-mode .font-btn:hover:not(:disabled) {
          background: #4b5563;
          border-color: #6b7280;
        }
        
        .dark-mode .mode-btn {
          background: #374151;
          border-color: #4b5563;
          color: #94a3b8;
        }
        
        .dark-mode .mode-btn.active {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
        }
        
        .dark-mode .mode-btn:hover:not(.active) {
          background: #4b5563;
        }
        
        .dark-mode .book-text-container {
          background: #1e293b;
          border-color: #374151;
        }
        
        .dark-mode .text-header {
          background: #374151;
          border-bottom-color: #4b5563;
        }
        
        .dark-mode .book-text-modern {
          background: #1e293b;
          color: #e2e8f0;
        }
        
        .dark-mode .reading-paragraph-modern {
          color: #d1d5db;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
          .reading-container-modern {
            padding: 24px 16px;
          }
          
          .reading-header-modern {
            padding: 12px 16px;
          }
          
          .header-center {
            display: none;
          }
          
          .book-header-enhanced {
            flex-direction: column;
            align-items: center;
            text-align: center;
            padding: 24px;
          }
          
          .book-title-large {
            font-size: 24px;
          }
          
          .book-stats-row {
            align-items: center;
          }
          
          .reading-controls-modern {
            flex-direction: column;
            gap: 20px;
            align-items: stretch;
          }
          
          .font-controls,
          .reading-mode-toggle {
            justify-content: center;
          }
          
          .book-text-modern {
            padding: 24px;
          }
          
          .completion-card-modern {
            padding: 24px;
          }
          
          .completion-text h3 {
            font-size: 20px;
          }
          
          .reward-preview {
            flex-direction: column;
            gap: 12px;
          }
          
          .modal-content-enhanced {
            margin: 16px;
            max-width: calc(100% - 32px);
            border-radius: 24px;
          }
          
          .modal-header-enhanced,
          .modal-body-enhanced {
            padding: 24px 20px;
          }
          
          .modal-footer-enhanced {
            padding: 0 20px 24px;
            flex-direction: column;
            gap: 12px;
          }
          
          .modal-book-info {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
          
          .star-rating-enhanced {
            gap: 8px;
          }
          
          .star-button-enhanced {
            padding: 4px;
          }
          
          .rewards-grid {
            grid-template-columns: 1fr 1fr;
          }
          
          .donation-suggestions {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
        
        @media (max-width: 480px) {
          .book-title-large {
            font-size: 20px;
          }
          
          .star-rating-enhanced .star-button-enhanced svg {
            width: 24px;
            height: 24px;
          }
          
          .rewards-grid {
            grid-template-columns: 1fr;
          }
        }