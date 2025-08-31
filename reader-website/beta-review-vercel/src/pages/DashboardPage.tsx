// src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/UseDashboard';
import { DollarSign, Star, BookOpen, Users, ChevronRight, Zap, TrendingUp, Award, Clock, Lock, RefreshCw, AlertCircle } from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { stats, progress, availableBooks, lockedBooks, isLoading, error, refetch } = useDashboard();

  if (!user) return null;

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;

  };

  const formatCurrencyFromReais = (value: number) => {
    return `R$ ${value.toFixed(2).replace('.', ',')}`;
  };

  // Estados de carregamento e erro
  if (isLoading) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="loading-state">
            <div className="loading-spinner">
              <RefreshCw size={40} />
            </div>
            <h3>Carregando seu dashboard...</h3>
            <p>Buscando seus dados mais recentes</p>
          </div>
        </div>
        
        <style>{getStyles()}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="container">
          <div className="error-state">
            <AlertCircle size={40} />
            <h3>Ops! Algo deu errado</h3>
            <p>{error}</p>
            <button onClick={refetch} className="retry-btn">
              <RefreshCw size={18} />
              Tentar Novamente
            </button>
          </div>
        </div>
        
        <style>{getStyles()}</style>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header personalizado */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="welcome-text">
              <h1>Olá, {user.name}!</h1>
              <p>Transforme sua paixão por livros em renda extra</p>
            </div>
            
            <div className="hero-stats">
              <div className="hero-stat">
                <span className="stat-number">{stats.booksRead}</span>
                <span className="stat-label">Livros Lidos</span>
              </div>
              <div className="hero-stat">
                <span className="stat-number">{formatCurrencyFromReais(stats.weeklyEarnings)}</span>
                <span className="stat-label">Esta Semana</span>
              </div>
            </div>
          </div>
        </div>

        {/* Cards de saldo modernizados */}
        <div className="balance-cards">
          <div className="balance-card main-balance">
            <div className="card-header">
              <div className="card-icon balance-icon">
                <DollarSign size={24} />
              </div>
              <div className="card-trend">
                <TrendingUp size={14} />
                <span>+{stats.weeklyEarnings > 0 ? '12' : '0'}%</span>
              </div>
            </div>
            
            <div className="card-content">
              <div className="main-value">{formatCurrency(user.balance)}</div>
              <div className="card-title">Saldo Disponível</div>
              <div className="card-subtitle">
                Total sacado: {formatCurrencyFromReais(stats.totalWithdrawn)}
              </div>
            </div>
            
            <Link to="/withdraw" className="card-action">
              Sacar via PIX
              <ChevronRight size={16} />
            </Link>
          </div>
          
          <div className="balance-card points-card">
            <div className="card-header">
              <div className="card-icon points-icon">
                <Star size={24} />
              </div>
              <div className="level-badge">
                <Award size={12} />
                <span>Nível {user.level}</span>
              </div>
            </div>
            
            <div className="card-content">
              <div className="main-value">{user.points.toLocaleString()}</div>
              <div className="card-title">Pontos XP</div>
              <div className="card-subtitle">10 pontos = R$ 1,00</div>
            </div>
          </div>
        </div>

        {/* Progresso diário reformulado */}
        <div className="daily-progress">
          <div className="progress-header">
            <div>
              <h2>Seu Progresso Hoje</h2>
              <p>Continue lendo para atingir sua meta diária</p>
            </div>
            <div className="progress-percentage-display">
              <span className="percentage">{Math.round((progress.dailyBooks / 3) * 100)}%</span>
              <span className="percentage-label">concluído</span>
            </div>
          </div>
          
          <div className="progress-metrics">
            <div className="metric-item">
              <div className="metric-icon reading">
                <BookOpen size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{progress.dailyBooks}/3</span>
                <span className="metric-label">Livros</span>
              </div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon reviews">
                <Star size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{progress.dailyReviews}/3</span>
                <span className="metric-label">Avaliações</span>
              </div>
            </div>
            
            <div className="metric-item">
              <div className="metric-icon earnings">
                <DollarSign size={20} />
              </div>
              <div className="metric-data">
                <span className="metric-value">{formatCurrencyFromReais(progress.dailyEarnings)}</span>
                <span className="metric-label">Ganhos</span>
              </div>
            </div>
          </div>
          
          <div className="progress-bar-section">
            <div className="progress-track">
              <div 
                className="progress-fill"
                style={{ width: `${Math.min(100, (progress.dailyBooks / 3) * 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Livros disponíveis reformulados */}
        {availableBooks.length > 0 && (
          <div className="books-section">
            <div className="section-header">
              <div className="section-title">
                <Zap size={22} />
                <span>Livros Disponíveis</span>
              </div>
              <Link to="/books" className="view-all-link">
                Ver Todos <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="books-grid">
              {availableBooks.map((book) => (
                <div key={book.id} className="book-card">
                  <div 
                    className="book-cover"
                    style={{ backgroundColor: book.coverColor }}
                  >
                    <BookOpen size={32} />
                    <div className="availability-badge">Disponível</div>
                  </div>
                  
                  <div className="book-info">
                    <div className="book-meta">
                      <span className="genre-badge">{book.genre}</span>
                      <div className="read-time">
                        <Clock size={12} />
                        {book.estimatedTime}
                      </div>
                    </div>
                    
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">por {book.author}</p>
                    
                    <div className="book-stats">
                      <div className="reward-info">
                        <DollarSign size={16} />
                        <span className="reward-value">
                          {formatCurrencyFromReais(book.rewardMoney)}
                        </span>
                      </div>
                      <div className="readers-info">
                        <Users size={12} />
                        <span>{Math.floor(book.reviewsCount / 1000)}k leitores</span>
                      </div>
                    </div>
                    
                    <Link to={`/books/${book.id}`} className="read-button">
                      Começar Leitura
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Próximos livros */}
        {lockedBooks.length > 0 && (
          <div className="locked-books-section">
            <div className="section-header">
              <div className="section-title">
                <Lock size={22} />
                <span>Próximos Livros</span>
              </div>
              <span className="unlock-info">Suba de nível para desbloquear</span>
            </div>
            
            <div className="locked-books-preview">
              {lockedBooks.slice(0, 2).map((book) => (
                <div key={book.id} className="locked-book-card">
                  <div className="locked-cover">
                    <Lock size={24} />
                  </div>
                  
                  <div className="locked-book-info">
                    <h4>{book.title}</h4>
                    <p>por {book.author}</p>
                    <div className="locked-reward">
                      <DollarSign size={14} />
                      {formatCurrencyFromReais(book.rewardMoney)}
                    </div>
                    <div className="unlock-requirement">
                      Nível {book.requiredLevel || 1} necessário
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick actions simplificadas */}
        <div className="quick-actions">
          <Link to="/books" className="action-item">
            <div className="action-icon books">
              <BookOpen size={20} />
            </div>
            <div className="action-content">
              <span className="action-title">Explorar Biblioteca</span>
              <span className="action-subtitle">Todos os livros disponíveis</span>
            </div>
            <ChevronRight size={16} />
          </Link>
          
          <Link to="/community" className="action-item">
            <div className="action-icon community">
              <Users size={20} />
            </div>
            <div className="action-content">
              <span className="action-title">Comunidade</span>
              <span className="action-subtitle">Conecte-se com leitores</span>
            </div>
            <ChevronRight size={16} />
          </Link>
          
          <Link to="/withdraw" className="action-item">
            <div className="action-icon withdraw">
              <DollarSign size={20} />
            </div>
            <div className="action-content">
              <span className="action-title">Sacar Dinheiro</span>
              <span className="action-subtitle">Gerencie seus ganhos</span>
            </div>
            <ChevronRight size={16} />
          </Link>
        </div>
      </div>
      
      <style>{getStyles()}</style>
    </div>
  );
};

const getStyles = () => `
  .dashboard {
    min-height: calc(100vh - 140px);
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    padding: 32px 0 80px 0;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
  }
  
  /* Estados de loading e erro */
  .loading-state, .error-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 400px;
    text-align: center;
    background: white;
    border-radius: 20px;
    padding: 60px 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  }
  
  .loading-spinner {
    animation: spin 1.5s linear infinite;
    color: #8b5cf6;
    margin-bottom: 24px;
  }
  
  .error-state svg {
    color: #ef4444;
    margin-bottom: 24px;
  }
  
  .loading-state h3, .error-state h3 {
    font-size: 24px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
  }
  
  .loading-state p, .error-state p {
    color: #64748b;
    margin: 0 0 24px 0;
  }
  
  .retry-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #8b5cf6;
    color: white;
    border: none;
    padding: 12px 24px;
    border-radius: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .retry-btn:hover {
    background: #7c3aed;
    transform: translateY(-2px);
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Hero section */
  .hero-section {
    margin-bottom: 40px;
  }
  
  .hero-content {
    background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
    border-radius: 24px;
    padding: 40px;
    color: white;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 10px 40px rgba(139, 92, 246, 0.3);
  }
  
  .welcome-text h1 {
    font-size: 36px;
    font-weight: 700;
    margin: 0 0 8px 0;
  }
  
  .welcome-text p {
    font-size: 18px;
    opacity: 0.9;
    margin: 0;
  }
  
  .hero-stats {
    display: flex;
    gap: 40px;
  }
  
  .hero-stat {
    text-align: center;
  }
  
  .stat-number {
    display: block;
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 4px;
  }
  
  .stat-label {
    font-size: 14px;
    opacity: 0.8;
  }
  
  /* Balance cards */
  .balance-cards {
    display: grid;
    grid-template-columns: 2fr 1fr;
    gap: 24px;
    margin-bottom: 40px;
  }
  
  .balance-card {
    background: white;
    border-radius: 20px;
    padding: 32px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }
  
  .main-balance {
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
    color: white;
  }
  
  .points-card {
    background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
    color: white;
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .card-icon {
    width: 56px;
    height: 56px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.2);
  }
  
  .card-trend {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
  }
  
  .level-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    opacity: 0.9;
  }
  
  .main-value {
    font-size: 42px;
    font-weight: 800;
    margin-bottom: 8px;
    line-height: 1;
  }
  
  .card-title {
    font-size: 18px;
    font-weight: 600;
    margin-bottom: 4px;
    opacity: 0.95;
  }
  
  .card-subtitle {
    font-size: 14px;
    opacity: 0.8;
  }
  
  .card-action {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    color: white;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    background: rgba(255, 255, 255, 0.2);
    padding: 12px 20px;
    border-radius: 12px;
    margin-top: 20px;
    transition: all 0.2s ease;
  }
  
  .card-action:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
  
  /* Daily progress */
  .daily-progress {
    background: white;
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 40px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
  }
  
  .progress-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
  }
  
  .progress-header h2 {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 4px 0;
  }
  
  .progress-header p {
    color: #64748b;
    margin: 0;
  }
  
  .progress-percentage-display {
    text-align: center;
  }
  
  .percentage {
    display: block;
    font-size: 48px;
    font-weight: 800;
    background: linear-gradient(135deg, #8b5cf6, #06b6d4);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    line-height: 1;
  }
  
  .percentage-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
  
  .progress-metrics {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 24px;
    margin-bottom: 32px;
  }
  
  .metric-item {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
    background: #f8fafc;
    border-radius: 16px;
    border: 1px solid #e2e8f0;
  }
  
  .metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
  }
  
  .metric-icon.reading {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  }
  
  .metric-icon.reviews {
    background: linear-gradient(135deg, #f59e0b, #d97706);
  }
  
  .metric-icon.earnings {
    background: linear-gradient(135deg, #10b981, #059669);
  }
  
  .metric-data {
    display: flex;
    flex-direction: column;
  }
  
  .metric-value {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin-bottom: 2px;
  }
  
  .metric-label {
    font-size: 14px;
    color: #64748b;
    font-weight: 500;
  }
  
  .progress-bar-section {
    position: relative;
  }
  
  .progress-track {
    height: 12px;
    background: #e2e8f0;
    border-radius: 6px;
    overflow: hidden;
  }
  
  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #8b5cf6, #06b6d4);
    border-radius: 6px;
    transition: width 0.6s ease;
    position: relative;
  }
  
  /* Books section */
  .books-section, .locked-books-section {
    margin-bottom: 40px;
  }
  
  .section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
  }
  
  .view-all-link {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #8b5cf6;
    text-decoration: none;
    font-weight: 600;
    font-size: 16px;
    transition: all 0.2s ease;
  }
  
  .view-all-link:hover {
    color: #7c3aed;
    transform: translateX(4px);
  }
  
  .unlock-info {
    font-size: 14px;
    color: #64748b;
    background: #f1f5f9;
    padding: 8px 16px;
    border-radius: 20px;
  }
  
  .books-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 24px;
  }
  
  .book-card {
    background: white;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }
  
  .book-card:hover {
    transform: translateY(-8px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
  }
  
  .book-cover {
    height: 140px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    position: relative;
  }
  
  .availability-badge {
    position: absolute;
    top: 12px;
    right: 12px;
    background: rgba(255, 255, 255, 0.95);
    color: #059669;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .book-info {
    padding: 24px;
  }
  
  .book-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
  }
  
  .genre-badge {
    background: #f1f5f9;
    color: #8b5cf6;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
  }
  
  .read-time {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    font-size: 12px;
    font-weight: 500;
  }
  
  .book-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0 0 8px 0;
    line-height: 1.3;
  }
  
  .book-author {
    color: #64748b;
    margin: 0 0 20px 0;
    font-size: 14px;
    font-weight: 500;
  }
  
  .book-stats {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .reward-info {
    display: flex;
    align-items: center;
    gap: 6px;
    font-weight: 700;
    font-size: 18px;
    color: #10b981;
  }
  
  .readers-info {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #64748b;
    font-size: 13px;
    font-weight: 500;
  }
  
  .read-button {
    width: 100%;
    background: linear-gradient(135deg, #8b5cf6 0%, #06b6d4 100%);
    color: white;
    text-decoration: none;
    text-align: center;
    padding: 16px 24px;
    border-radius: 12px;
    font-weight: 600;
    font-size: 16px;
    display: block;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(139, 92, 246, 0.3);
  }
  
  .read-button:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 30px rgba(139, 92, 246, 0.4);
  }
  
  /* Locked books */
  .locked-books-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 20px;
  }
  
  .locked-book-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    opacity: 0.8;
  }
  
  .locked-cover {
    width: 60px;
    height: 75px;
    background: #94a3b8;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  
  .locked-book-info h4 {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
  }
  
  .locked-book-info p {
    color: #64748b;
    font-size: 14px;
    margin: 0 0 8px 0;
  }
  
  .locked-reward {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #10b981;
    font-weight: 600;
    font-size: 14px;
    margin-bottom: 8px;
  }
  
  .unlock-requirement {
    background: #fef3c7;
    color: #92400e;
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    display: inline-block;
  }
  
  /* Quick actions */
  .quick-actions {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }
  
  .action-item {
    display: flex;
    align-items: center;
    gap: 16px;
    background: white;
    border-radius: 16px;
    padding: 24px;
    text-decoration: none;
    color: inherit;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
    border: 1px solid #e2e8f0;
    transition: all 0.3s ease;
  }
  
  .action-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
  }
  
  .action-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }
  
  .action-icon.books {
    background: linear-gradient(135deg, #8b5cf6, #7c3aed);
  }
  
  .action-icon.community {
    background: linear-gradient(135deg, #06b6d4, #0891b2);
  }
  
  .action-icon.withdraw {
    background: linear-gradient(135deg, #10b981, #059669);
  }
  
  .action-content {
    flex: 1;
  }
  
  .action-title {
    display: block;
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
  }
  
  .action-subtitle {
    font-size: 14px;
    color: #64748b;
  }
  
  /* Responsive design */
  @media (max-width: 768px) {
    .container {
      padding: 0 16px;
    }
    
    .hero-content {
      flex-direction: column;
      gap: 24px;
      text-align: center;
      padding: 32px 24px;
    }
    
    .hero-stats {
      justify-content: center;
      gap: 32px;
    }
    
    .balance-cards {
      grid-template-columns: 1fr;
      gap: 20px;
    }
    
    .progress-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 16px;
    }
    
    .progress-percentage-display {
      align-self: flex-end;
    }
    
    .progress-metrics {
      grid-template-columns: 1fr;
      gap: 16px;
    }
    
    .books-grid {
      grid-template-columns: 1fr;
    }
    
    .locked-books-preview {
      grid-template-columns: 1fr;
    }
    
    .locked-book-card {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }
    
    .quick-actions {
      grid-template-columns: 1fr;
    }
    
    .section-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 8px;
    }
    
    .hero-content h1 {
      font-size: 28px;
    }
    
    .main-value {
      font-size: 32px;
    }
    
    .percentage {
      font-size: 36px;
    }
  }
  
  @media (max-width: 480px) {
    .hero-stats {
      flex-direction: column;
      gap: 20px;
    }
    
    .card-action {
      width: 100%;
      justify-content: center;
    }
    
    .metric-item {
      padding: 16px;
    }
    
    .book-info {
      padding: 20px;
    }
  }
`;

export default DashboardPage;