// src/pages/DashboardPage.tsx - VERSÃO SIMPLIFICADA FINAL
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDashboard } from '../hooks/useDashboard';
import { 
  BookOpen, Star, Clock, Award, Zap, TrendingUp, 
  Target, Users, DollarSign, Calendar, ArrowRight,
  Trophy, Gift, Flame
} from 'lucide-react';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { stats, progress, availableBooks, lockedBooks, isLoading, error, refetch } = useDashboard();

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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  if (isLoading) {
    return (
      <div className="dashboard-page">
        <div className="loading-state">
          <div className="loading-spinner" />
          <h2>Carregando seu dashboard...</h2>
          <p>Preparando suas estatísticas e livros</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-state">
          <h2>Erro ao carregar dashboard</h2>
          <p>{error}</p>
          <button onClick={refetch} className="retry-button">
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-container">
        {/* Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-content">
            <h1>{getGreeting()}, {user?.name?.split(' ')[0]}!</h1>
            <p className="welcome-message">Continue lendo e conquistando seus objetivos!</p>
            <div className="quick-stats">
              <div className="quick-stat">
                <Zap className="w-5 h-5 text-blue-500" />
                <span>{user?.points || 0} pontos</span>
              </div>
              <div className="quick-stat">
                <Trophy className="w-5 h-5 text-yellow-500" />
                <span>Nível {user?.level || 0}</span>
              </div>
              <div className="quick-stat">
                <DollarSign className="w-5 h-5 text-green-500" />
                <span>{formatCurrency((user?.balance || 0) / 100)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-header">
              <BookOpen className="w-6 h-6 text-blue-500" />
              <span className="stat-title">Livros Lidos</span>
            </div>
            <div className="stat-value">{stats.booksRead}</div>
            <div className="stat-trend">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Ótimo progresso!</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <DollarSign className="w-6 h-6 text-green-500" />
              <span className="stat-title">Ganhos Semanais</span>
            </div>
            <div className="stat-value">{formatCurrency(stats.weeklyEarnings / 100)}</div>
            <div className="stat-trend">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span>Continue assim!</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Gift className="w-6 h-6 text-purple-500" />
              <span className="stat-title">Total Sacado</span>
            </div>
            <div className="stat-value">{formatCurrency(stats.totalWithdrawn / 100)}</div>
            <div className="stat-trend">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>Histórico</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-header">
              <Target className="w-6 h-6 text-orange-500" />
              <span className="stat-title">Livros Disponíveis</span>
            </div>
            <div className="stat-value">{availableBooks.length}</div>
            <div className="stat-trend">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>Explore agora!</span>
            </div>
          </div>
        </div>

        {/* Progress Section */}
        <div className="progress-section">
          <div className="progress-card">
            <h3>Seu Progresso</h3>
            <div className="level-info">
              <div className="level-badge">
                <Trophy className="w-5 h-5" />
                <span>Nível {progress.currentLevel}</span>
              </div>
              <div className="points-info">
                <span className="points-current">{user?.points || 0} pontos</span>
                <span className="points-next">Próximo nível: {progress.pointsToNextLevel} pontos</span>
              </div>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress.progressPercentage}%` }}
              />
            </div>
            <div className="progress-percentage">{progress.progressPercentage}%</div>
          </div>

          <div className="daily-goals">
            <h3>Seus Livros</h3>
            <div className="goals-list">
              <div className="goal-item">
                <div className="goal-icon">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div className="goal-content">
                  <span className="goal-label">Disponíveis</span>
                  <span className="goal-progress">{availableBooks.length} livros</span>
                </div>
                <div className="goal-status">📚</div>
              </div>

              <div className="goal-item">
                <div className="goal-icon">
                  <Target className="w-4 h-4" />
                </div>
                <div className="goal-content">
                  <span className="goal-label">Bloqueados</span>
                  <span className="goal-progress">{lockedBooks.length} livros</span>
                </div>
                <div className="goal-status">🔒</div>
              </div>

              <div className="goal-item">
                <div className="goal-icon">
                  <Award className="w-4 h-4" />
                </div>
                <div className="goal-content">
                  <span className="goal-label">Seu Nível</span>
                  <span className="goal-progress">Nível {user?.level || 0}</span>
                </div>
                <div className="goal-status">⭐</div>
              </div>
            </div>
          </div>
        </div>

        {/* Available Books */}
        <div className="books-section">
          <div className="section-header">
            <h2>Livros Disponíveis</h2>
            <Link to="/books" className="view-all-link">
              Ver todos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="books-grid">
            {availableBooks.slice(0, 6).map(book => (
              <div key={book.id} className="book-card">
                <div className="book-cover">
                  <div 
                    className="cover-placeholder"
                    style={{ backgroundColor: book.coverColor || '#3b82f6' }}
                  >
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div className="book-info">
                  <h4 className="book-title">{book.title}</h4>
                  <p className="book-author">{book.author}</p>
                  
                  <div className="book-stats">
                    <div className="book-rating">
                      {renderStars(book.averageRating)}
                      <span className="rating-text">{book.averageRating.toFixed(1)}</span>
                    </div>
                    <div className="book-time">
                      <Clock className="w-3 h-3" />
                      <span>{book.estimatedTime || formatTime(book.estimatedReadTime || 300)}</span>
                    </div>
                  </div>

                  <div className="book-reward">
                    <Award className="w-4 h-4 text-yellow-500" />
                    <span>{formatCurrency(book.rewardMoney || (book.baseRewardMoney || 1000) / 100)}</span>
                  </div>

                  <Link to={`/book/${book.id}`} className="read-button">
                    Ler Agora
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <Link to="/books" className="action-button primary">
            <BookOpen className="w-5 h-5" />
            Explorar Livros
          </Link>
          <Link to="/wallet" className="action-button secondary">
            <DollarSign className="w-5 h-5" />
            Ver Carteira
          </Link>
          <Link to="/profile" className="action-button secondary">
            <Users className="w-5 h-5" />
            Meu Perfil
          </Link>
        </div>
      </div>

      <style>{`
        .dashboard-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          padding: 40px 0;
        }

        .page-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .loading-state, .error-state {
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

        .welcome-section {
          text-align: center;
          margin-bottom: 40px;
          color: white;
        }

        .welcome-content h1 {
          font-size: 2.5rem;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .welcome-message {
          font-size: 1.1rem;
          opacity: 0.9;
          margin-bottom: 24px;
        }

        .quick-stats {
          display: flex;
          gap: 24px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .quick-stat {
          display: flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.1);
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 500;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }

        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
        }

        .stat-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
        }

        .stat-title {
          font-weight: 500;
          color: #6b7280;
        }

        .stat-value {
          font-size: 2rem;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }

        .stat-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #059669;
          font-size: 0.9rem;
        }

        .progress-section {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
          margin-bottom: 40px;
        }

        .progress-card, .daily-goals {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .progress-card h3, .daily-goals h3 {
          font-size: 1.25rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .level-info {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .level-badge {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          color: white;
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: 600;
        }

        .points-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .points-current {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1f2937;
        }

        .points-next {
          font-size: 0.9rem;
          color: #6b7280;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #f3f4f6;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }

        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #3b82f6, #8b5cf6);
          transition: width 0.5s ease;
        }

        .progress-percentage {
          text-align: right;
          font-size: 0.9rem;
          color: #6b7280;
          font-weight: 500;
        }

        .goals-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .goal-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: #f9fafb;
          border-radius: 8px;
        }

        .goal-icon {
          width: 32px;
          height: 32px;
          background: #eff6ff;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #3b82f6;
        }

        .goal-content {
          flex: 1;
          display: flex;
          flex-direction: column;
        }

        .goal-label {
          font-size: 0.9rem;
          color: #374151;
        }

        .goal-progress {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .goal-status {
          font-size: 1.2rem;
        }

        .books-section {
          margin-bottom: 40px;
        }

        .section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 24px;
          color: white;
        }

        .section-header h2 {
          font-size: 1.5rem;
          font-weight: 600;
        }

        .view-all-link {
          display: flex;
          align-items: center;
          gap: 4px;
          color: white;
          text-decoration: none;
          opacity: 0.9;
          transition: opacity 0.2s;
        }

        .view-all-link:hover {
          opacity: 1;
        }

        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }

        .book-card {
          background: white;
          border-radius: 12px;
          padding: 16px;
          display: flex;
          gap: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
        }

        .book-card:hover {
          transform: translateY(-2px);
        }

        .book-cover {
          flex-shrink: 0;
        }

        .cover-placeholder {
          width: 60px;
          height: 90px;
          border-radius: 6px;
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
          font-size: 0.9rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 4px;
          line-height: 1.3;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .book-author {
          font-size: 0.8rem;
          color: #6b7280;
          margin-bottom: 8px;
        }

        .book-stats {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 8px;
        }

        .book-rating {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .rating-text {
          font-size: 0.8rem;
          color: #6b7280;
        }

        .book-time {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.8rem;
          color: #6b7280;
        }

        .book-reward {
          display: flex;
          align-items: center;
          gap: 4px;
          margin-bottom: 12px;
          color: #059669;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .read-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.8rem;
          font-weight: 500;
          text-align: center;
          transition: transform 0.2s;
          margin-top: auto;
        }

        .read-button:hover {
          transform: translateY(-1px);
        }

        .quick-actions {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .action-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: transform 0.2s;
        }

        .action-button:hover {
          transform: translateY(-2px);
        }

        .action-button.primary {
          background: white;
          color: #3b82f6;
          box-shadow: 0 4px 12px rgba(255, 255, 255, 0.3);
        }

        .action-button.secondary {
          background: rgba(255, 255, 255, 0.1);
          color: white;
          backdrop-filter: blur(10px);
        }

        @media (max-width: 768px) {
          .welcome-content h1 {
            font-size: 2rem;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .progress-section {
            grid-template-columns: 1fr;
          }

          .books-grid {
            grid-template-columns: 1fr;
          }

          .book-card {
            flex-direction: column;
            text-align: center;
          }

          .cover-placeholder {
            margin: 0 auto;
          }

          .quick-actions {
            flex-direction: column;
            align-items: stretch;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;