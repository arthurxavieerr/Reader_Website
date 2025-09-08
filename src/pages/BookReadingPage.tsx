import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Heart, CheckCircle, Clock, Users, BookOpen, Award, Plus, Minus, ChevronLeft, ChevronRight } from 'lucide-react';
import '../styles/BookReadingPage.css';

interface Book {
  id: string;
  title: string;
  author: string;
  content: string;
  genre: string;
  rewardMoney: number;
  synopsis: string;
  reviewsCount: number;
  averageRating: number;
  estimatedReadTime: string;
}

interface Review {
  rating: number;
  comment?: string;
  donationAmount?: number;
}

const BookReadingPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Estados principais
  const [book, setBook] = useState<Book | null>(null);
  const [bookContent, setBookContent] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  
  // Estados de paginação
  const [pages, setPages] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageStartTime, setPageStartTime] = useState(Date.now());
  const [pageTimeRemaining, setPageTimeRemaining] = useState(120); // 2 minutos em segundos
  const [canAdvancePage, setCanAdvancePage] = useState(false);
  const [readPages, setReadPages] = useState<Set<number>>(new Set());
  
  // Estados do modal de avaliação
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [donationAmount, setDonationAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Estados de interface
  const [fontSize, setFontSize] = useState(16);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [readingStartTime] = useState(Date.now());

  // Função para dividir o conteúdo em páginas de ~5000 caracteres
  const paginateContent = (textContent: string) => {
    const maxCharsPerPage = 5000;
    const pagesList: string[] = [];
    
    // Se o conteúdo for menor que o limite, criar apenas uma página
    if (textContent.length <= maxCharsPerPage) {
      return [textContent];
    }

    let currentIndex = 0;
    
    while (currentIndex < textContent.length) {
      let endIndex = Math.min(currentIndex + maxCharsPerPage, textContent.length);
      
      // Se não é a última página, tentar quebrar em um ponto melhor
      if (endIndex < textContent.length) {
        // Procurar por quebra de parágrafo próxima
        const nearbyBreak = textContent.lastIndexOf('\n\n', endIndex);
        if (nearbyBreak > currentIndex + 1000) { // Só usar se a quebra não for muito próxima do início
          endIndex = nearbyBreak + 2; // +2 para incluir as quebras de linha
        } else {
          // Procurar por quebra de frase
          const sentenceBreak = textContent.lastIndexOf('. ', endIndex);
          if (sentenceBreak > currentIndex + 1000) {
            endIndex = sentenceBreak + 2; // +2 para incluir o ponto e espaço
          }
        }
      }
      
      const pageContent = textContent.slice(currentIndex, endIndex).trim();
      if (pageContent) {
        pagesList.push(pageContent);
      }
      
      currentIndex = endIndex;
    }

    return pagesList.length > 0 ? pagesList : [textContent];
  };

  // Timer para controle do tempo mínimo por página
  useEffect(() => {
    if (pages.length === 0 || showReviewModal) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - pageStartTime) / 1000);
      const remaining = Math.max(0, 120 - elapsed); // 2 minutos = 120 segundos
      
      setPageTimeRemaining(remaining);
      
      // Permitir avanço quando tempo acabar OU se já estamos na primeira página após 2 minutos
      const shouldAllowAdvance = remaining === 0;
      setCanAdvancePage(shouldAllowAdvance);
      
      // Debug
      if (remaining % 10 === 0) { // Log a cada 10 segundos
        console.log('Timer - Página:', currentPage + 1, 'Tempo restante:', remaining, 'Pode avançar:', shouldAllowAdvance);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [pageStartTime, pages.length, showReviewModal, currentPage]);

  // Buscar dados do livro e iniciar leitura
  useEffect(() => {
    const fetchBookAndStartReading = async () => {
      if (!id) {
        setError('ID do livro não fornecido');
        setLoading(false);
        return;
      }

      try {
        console.log('Buscando dados do livro:', id);
        
        // Buscar dados da API
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

        if (!response.ok) {
          throw new Error(`Erro ao buscar livro: ${response.status}`);
        }

        const apiData = await response.json();

        if (!apiData.success || !apiData.data?.book) {
          throw new Error('Livro não encontrado na API');
        }

        const apiBook = apiData.data.book;
        const textFromAPI = apiBook.content || 'Conteúdo não disponível para este livro.';
        
        if (!textFromAPI || textFromAPI.trim() === '') {
          throw new Error('Conteúdo do livro não encontrado');
        }

        // Configurar dados do livro
        const processedBookData: Book = {
          id: apiBook.id,
          title: apiBook.title,
          author: apiBook.author,
          genre: apiBook.genre,
          content: textFromAPI,
          rewardMoney: apiBook.rewardMoney || Math.floor((apiBook.baseRewardMoney || 10000) / 100),
          synopsis: apiBook.synopsis,
          reviewsCount: apiBook.reviewsCount || 0,
          averageRating: apiBook.averageRating || 0,
          estimatedReadTime: apiBook.estimatedReadTime || '10 min'
        };

        console.log('✅ Livro carregado da API:', processedBookData.title);
        
        // Configurar dados
        setBook(processedBookData);
        setBookContent(textFromAPI);
        setSessionId(`session-${id}-${Date.now()}`);

        // Paginar conteúdo
        const paginatedPages = paginateContent(textFromAPI);
        console.log('Páginas criadas:', paginatedPages.length, 'caracteres por página:', paginatedPages.map((p: string) => p.length));
        setPages(paginatedPages);
        
        // Marcar primeira página como lida e iniciar timer
        setReadPages(new Set([0]));
        setCurrentPage(0);
        setPageStartTime(Date.now());
        setPageTimeRemaining(120);
        setCanAdvancePage(false);

      } catch (err) {
        console.error('Erro ao carregar livro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido ao carregar livro');
      } finally {
        setLoading(false);
      }
    };

    fetchBookAndStartReading();
  }, [id, navigate]);

  const formatCurrency = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatReadingTime = () => {
    const elapsed = Math.floor((Date.now() - readingStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const getReadingProgress = () => {
    if (pages.length === 0) return 0;
    return Math.round((readPages.size / pages.length) * 100);
  };

  const goToNextPage = () => {
    if (!canAdvancePage || currentPage >= pages.length - 1) return;
    
    const nextPage = currentPage + 1;
    setCurrentPage(nextPage);
    
    // Marcar página como lida
    setReadPages(prev => {
      const newReadPages = new Set([...prev, nextPage]);
      console.log('Páginas lidas:', Array.from(newReadPages), 'de', pages.length);
      return newReadPages;
    });
    
    setPageStartTime(Date.now());
    setPageTimeRemaining(120);
    setCanAdvancePage(false);
  };

  const goToPreviousPage = () => {
    if (currentPage <= 0) return;
    
    const prevPage = currentPage - 1;
    setCurrentPage(prevPage);
    
    // Se página anterior já foi lida, permitir avanço imediato
    if (readPages.has(prevPage)) {
      setCanAdvancePage(true);
      setPageTimeRemaining(0);
    } else {
      // Caso contrário, reiniciar timer (não deveria acontecer normalmente)
      setPageStartTime(Date.now());
      setPageTimeRemaining(120);
      setCanAdvancePage(false);
    }
  };

  const isBookCompleted = () => {
    return pages.length > 0 && readPages.size === pages.length;
  };

  const handleFinishReading = () => {
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (rating === 0 || !book || !id) return;

    setIsSubmitting(true);

    try {
      // Simular delay de envio
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simular resposta de sucesso
      const rewardMessage = `Parabéns! Você ganhou ${formatCurrency(book.rewardMoney)} e 10 pontos XP!`;
      alert(rewardMessage);
      
      // Atualizar saldo do usuário no localStorage
      const userData = localStorage.getItem('beta-reader-user');
      if (userData) {
        const user = JSON.parse(userData);
        user.balance += book.rewardMoney * 100; // Converter para centavos
        user.points += 10;
        localStorage.setItem('beta-reader-user', JSON.stringify(user));
      }
      
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Erro ao completar leitura:', err);
      alert('Erro ao finalizar leitura. Tente novamente.');
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

  const getRatingFeedback = (rating: number) => {
    const feedbacks = {
      0: { text: "✨ Clique nas estrelas para avaliar", className: "rating-prompt" },
      1: { text: "😞 Muito ruim - Que pena que não gostou!", className: "rating-text disappointed" },
      2: { text: "😐 Ruim - Pode melhorar", className: "rating-text poor" },
      3: { text: "🙂 Regular - Uma leitura ok", className: "rating-text average" },
      4: { text: "😊 Bom - Gostou da história!", className: "rating-text good" },
      5: { text: "🤩 Excelente - Amou este livro!", className: "rating-text excellent" }
    };
    return feedbacks[rating as keyof typeof feedbacks];
  };

  // Estados de loading e error
  if (loading) {
    return (
      <div className="reading-page-modern">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div className="loading-text">Carregando livro...</div>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="reading-page-modern">
        <div className="error-container">
          <div className="error-message">
            {error || 'Livro não encontrado'}
          </div>
          <button 
            className="retry-button"
            onClick={() => navigate('/books')}
          >
            Voltar para Livros
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`reading-page-modern ${isDarkMode ? 'dark-mode' : ''}`}>
      {/* Header */}
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
              <span>{formatReadingTime()}</span>
            </div>
            <div className="progress-bar-header">
              <div 
                className="progress-fill-header" 
                style={{width: `${getReadingProgress()}%`}}
              ></div>
            </div>
            <span className="progress-text">{getReadingProgress()}%</span>
          </div>
        </div>

        <div className="header-right">
          <button 
            className={`favorite-button ${isFavorited ? 'favorited' : ''}`}
            onClick={toggleFavorite}
            title={isFavorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          >
            <Heart size={18} fill={isFavorited ? 'currentColor' : 'none'} />
          </button>
        </div>
      </div>

      <div className="reading-container-modern">
        {/* Cabeçalho do livro */}
        <div className="book-header-enhanced">
          <div className="book-cover-large">
            <span className="book-emoji-large">📚</span>
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
                <span>{pages.length} páginas</span>
              </div>
              <div className="stat-item">
                <Award size={16} />
                <span>{formatCurrency(book.rewardMoney)} por avaliação</span>
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
              title="Diminuir fonte"
            >
              <Minus size={16} />
              <span>A</span>
            </button>
            <span className="font-size-display">{fontSize}px</span>
            <button 
              className="font-btn"
              onClick={() => adjustFontSize(true)}
              disabled={fontSize >= 24}
              title="Aumentar fonte"
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

        {/* Área de leitura */}
        <div className="reading-area-modern">
          <div className="book-text-container">
            <div className="text-header">
              <BookOpen size={20} />
              <h2>Página {currentPage + 1}</h2>
            </div>
            
            <div className="book-text-modern" style={{fontSize: `${fontSize}px`}}>
              {pages.length > 0 ? (
                pages[currentPage].split('\n\n').map((paragraph, index) => (
                  <p key={index} className="reading-paragraph-modern">
                    {paragraph}
                  </p>
                ))
              ) : (
                <div className="loading-content">
                  <div className="loading-spinner"></div>
                  <p>Carregando conteúdo do livro...</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Informações da página atual */}
        <div className="page-info">
          <div className="page-counter">
            <span className="page-text">Página {currentPage + 1} de {pages.length}</span>
            <div className="pages-progress">
              <div className="pages-dots">
                {pages.map((_, index) => (
                  <div 
                    key={index}
                    className={`page-dot ${readPages.has(index) ? 'read' : ''} ${index === currentPage ? 'current' : ''}`}
                  />
                ))}
              </div>
            </div>
          </div>
          
          {!canAdvancePage && currentPage < pages.length - 1 && (
            <div className="page-timer">
              <Clock size={14} />
              <span>Aguarde {formatTime(pageTimeRemaining)} para avançar para a próxima página</span>
            </div>
          )}
          
          {canAdvancePage && currentPage < pages.length - 1 && (
            <div className="page-timer" style={{background: '#dcfce7', color: '#16a34a'}}>
              <Clock size={14} />
              <span>Você pode avançar para a próxima página!</span>
            </div>
          )}
        </div>
        
        {/* Controles de navegação */}
        <div className="page-navigation">
          <button 
            className="nav-btn prev-btn"
            onClick={goToPreviousPage}
            disabled={currentPage <= 0}
          >
            <ChevronLeft size={20} />
            <span>Página Anterior</span>
          </button>

          <div className="nav-info">
            <span>{currentPage + 1} / {pages.length}</span>
          </div>

          <button 
            className="nav-btn next-btn"
            onClick={goToNextPage}
            disabled={!canAdvancePage || currentPage >= pages.length - 1}
          >
            <span>Próxima Página</span>
            <ChevronRight size={20} />
          </button>
        </div>
        
        {/* Seção de finalização - só aparece quando todas as páginas foram lidas */}
        {isBookCompleted() && (
          <div className="finish-section-modern">
            <div className="completion-card-modern">
              <div className="completion-header">
                <div className="completion-icon">
                  <CheckCircle size={40} />
                </div>
                <div className="completion-text">
                  <h3>Parabéns! Leitura Concluída</h3>
                  <p>Você leu todas as {pages.length} páginas. Agora avalie o livro e receba sua recompensa!</p>
                </div>
              </div>
              
              <div className="completion-rewards">
                <div className="reward-preview">
                  <div className="reward-item">
                    <Award size={20} />
                    <span>+10 pontos XP</span>
                  </div>
                  <div className="reward-item">
                    <span className="money-icon">💰</span>
                    <span>+{formatCurrency(book.rewardMoney)}</span>
                  </div>
                </div>
              </div>
              
              <button 
                className="btn-finish-modern"
                onClick={handleFinishReading}
              >
                <Star size={20} />
                Avaliar e Receber Recompensa
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal de avaliação */}
      {showReviewModal && (
        <div className="modal-overlay-enhanced">
          <div className="modal-content-enhanced">
            <div className="modal-header-enhanced">
              <div className="modal-book-info">
                <div className="modal-book-cover">
                  <span>📚</span>
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
                      title={`Avaliar com ${star} estrela${star > 1 ? 's' : ''}`}
                    >
                      <Star size={32} fill={star <= rating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
                </div>
                <div className="rating-feedback">
                  <p className={getRatingFeedback(rating).className}>
                    {getRatingFeedback(rating).text}
                  </p>
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
                      <span className="reward-value">+10 pontos</span>
                      <span className="reward-label">XP Ganho</span>
                    </div>
                  </div>
                  <div className="reward-card">
                    <div className="reward-icon">💰</div>
                    <div className="reward-details">
                      <span className="reward-value">+{formatCurrency(book.rewardMoney)}</span>
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
                    <div className="modal-loading-spinner"></div>
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
    </div>
  );
};

export default BookReadingPage;