// src/pages/DashboardPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DollarSign, Star, BookOpen, Users, ChevronRight, Zap, TrendingUp, Award, Clock, Lock } from 'lucide-react';

// Mock data para demonstração
const MOCK_BOOKS = [
  {
    id: '1',
    title: 'As Sombras de Eldoria',
    author: 'Marina Silvestre',
    genre: 'Fantasia Épica',
    rewardMoney: 100,
    reviewsCount: 84288,
    coverColor: '#895aed',
    isAvailable: true,
    estimatedTime: '2-3h'
  },
  {
    id: '2',
    title: 'Código Vermelho',
    author: 'Alexandre Ferreira',
    genre: 'Thriller Tecnológico',
    rewardMoney: 75,
    reviewsCount: 12947,
    coverColor: '#dc2626',
    isAvailable: false,
    estimatedTime: '1-2h'
  },
  {
    id: '3',
    title: 'O Jardim das Memórias Perdidas',
    author: 'Clara Monteiro',
    genre: 'Romance Contemporâneo',
    rewardMoney: 125,
    reviewsCount: 11698,
    coverColor: '#059669',
    isAvailable: false,
    estimatedTime: '3-4h'
  }
];

const DashboardPage: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const availableBooks = MOCK_BOOKS.filter(book => book.isAvailable);
  const lockedBooks = MOCK_BOOKS.filter(book => !book.isAvailable);

  return (
    <div className="dashboard">
      <div className="container">
        {/* Header Section */}
        <div className="dashboard-header">
          <div className="welcome-section">
            <h1 className="welcome-title">Olá, {user.name}! 👋</h1>
            <p className="welcome-subtitle">Pronto para ganhar dinheiro lendo livros incríveis?</p>
          </div>
          
          <div className="stats-quick">
            <div className="stat-item">
              <span className="stat-label">Livros lidos</span>
              <span className="stat-value">0</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Esta semana</span>
              <span className="stat-value">R$ 0,00</span>
            </div>
          </div>
        </div>

        {/* Balance Cards */}
        <div className="balance-section">
          <div className="balance-grid">
            <div className="balance-card primary">
              <div className="balance-header">
                <div className="balance-icon">
                  <DollarSign size={24} />
                </div>
                <div className="balance-trend">
                  <TrendingUp size={16} />
                  <span>+0%</span>
                </div>
              </div>
              <div className="balance-content">
                <div className="balance-amount">{formatCurrency(user.balance)}</div>
                <div className="balance-label">Saldo Disponível</div>
                <div className="balance-subtitle">Total sacado: {formatCurrency(0)}</div>
              </div>
              <Link to="/withdraw" className="balance-action">
                Sacar via PIX →
              </Link>
            </div>
            
            <div className="balance-card secondary">
              <div className="balance-header">
                <div className="balance-icon">
                  <Star size={24} />
                </div>
                <div className="balance-trend positive">
                  <Award size={16} />
                  <span>Nível {user.level}</span>
                </div>
              </div>
              <div className="balance-content">
                <div className="balance-amount">{user.points}</div>
                <div className="balance-label">Pontos Acumulados</div>
                <div className="balance-subtitle">10 pontos = R$ 1,00</div>
              </div>
            </div>
          </div>
        </div>

        {/* Daily Progress */}
        <div className="progress-section">
          <div className="progress-card">
            <div className="progress-header">
              <h3>Progresso de Hoje</h3>
              <span className="progress-date">{new Date().toLocaleDateString('pt-BR', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}</span>
            </div>
            
            <div className="progress-stats">
              <div className="progress-item">
                <div className="progress-circle">
                  <BookOpen size={20} />
                </div>
                <div className="progress-info">
                  <span className="progress-value">0/3</span>
                  <span className="progress-label">Livros lidos</span>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-circle">
                  <Star size={20} />
                </div>
                <div className="progress-info">
                  <span className="progress-value">0/3</span>
                  <span className="progress-label">Avaliações</span>
                </div>
              </div>
              
              <div className="progress-item">
                <div className="progress-circle">
                  <DollarSign size={20} />
                </div>
                <div className="progress-info">
                  <span className="progress-value">R$ 0,00</span>
                  <span className="progress-label">Ganhos do dia</span>
                </div>
              </div>
            </div>
            
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '0%' }}></div>
              </div>
              <span className="progress-percentage">0% do objetivo diário</span>
            </div>
          </div>
        </div>

        {/* Available Books */}
        {availableBooks.length > 0 && (
          <div className="books-section">
            <div className="section-header">
              <h2 className="section-title">
                <Zap size={20} />
                Livros Disponíveis para Você
              </h2>
              <Link to="/books" className="section-action">
                Ver todos <ChevronRight size={16} />
              </Link>
            </div>
            
            <div className="books-grid">
              {availableBooks.map((book) => (
                <div key={book.id} className="book-card available">
                  <div className="book-cover" style={{ background: `linear-gradient(135deg, ${book.coverColor}, ${book.coverColor}dd)` }}>
                    <BookOpen size={28} />
                    <div className="book-badge">Disponível</div>
                  </div>
                  
                  <div className="book-content">
                    <div className="book-meta">
                      <span className="book-genre">{book.genre}</span>
                      <div className="book-time">
                        <Clock size={12} />
                        <span>{book.estimatedTime}</span>
                      </div>
                    </div>
                    
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">por {book.author}</p>
                    
                    <div className="book-stats">
                      <div className="book-reward">
                        <DollarSign size={16} />
                        <span>{formatCurrency(book.rewardMoney * 100)}</span>
                      </div>
                      <div className="book-reviews">
                        <Users size={12} />
                        <span>{(book.reviewsCount / 1000).toFixed(0)}k leitores</span>
                      </div>
                    </div>
                    
                    <Link to={`/books/${book.id}`} className="book-button">
                      Começar Leitura
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Locked Books Preview */}
        {lockedBooks.length > 0 && (
          <div className="locked-section">
            <div className="section-header">
              <h2 className="section-title">
                <Lock size={20} />
                Próximos Livros
              </h2>
              <span className="section-subtitle">Desbloqueie subindo de nível</span>
            </div>
            
            <div className="locked-books-grid">
              {lockedBooks.slice(0, 2).map((book) => (
                <div key={book.id} className="book-card locked">
                  <div className="book-cover locked-cover">
                    <Lock size={24} />
                  </div>
                  
                  <div className="book-content">
                    <h3 className="book-title">{book.title}</h3>
                    <p className="book-author">por {book.author}</p>
                    <div className="book-reward">
                      <DollarSign size={14} />
                      <span>{formatCurrency(book.rewardMoney * 100)}</span>
                    </div>
                    <div className="unlock-info">
                      <span>Desbloqueie no nível 1</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="actions-section">
          <div className="actions-grid">
            <Link to="/books" className="action-card">
              <div className="action-icon books">
                <BookOpen size={24} />
              </div>
              <div className="action-content">
                <h3>Biblioteca</h3>
                <p>Explore todos os livros disponíveis</p>
              </div>
              <ChevronRight size={18} />
            </Link>
            
            <Link to="/community" className="action-card">
              <div className="action-icon community">
                <Users size={24} />
              </div>
              <div className="action-content">
                <h3>Comunidade</h3>
                <p>Conecte-se com outros leitores</p>
              </div>
              <ChevronRight size={18} />
            </Link>
            
            <Link to="/withdraw" className="action-card">
              <div className="action-icon withdraw">
                <DollarSign size={24} />
              </div>
              <div className="action-content">
                <h3>Saques</h3>
                <p>Gerencie seus ganhos</p>
              </div>
              <ChevronRight size={18} />
            </Link>
          </div>
        </div>
      </div>
      
      <style>{`
        .dashboard {
          min-height: calc(100vh - 140px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 24px 0;
        }
        
        .container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
        }
        
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 32px;
          padding: 24px 32px;
          background: linear-gradient(135deg, #895aed 0%, #667eea 100%);
          border-radius: 20px;
          color: white;
          box-shadow: 0 10px 25px rgba(137, 90, 237, 0.2);
        }
        
        .welcome-section h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
        }
        
        .welcome-subtitle {
          font-size: 16px;
          opacity: 0.9;
          margin: 0;
        }
        
        .stats-quick {
          display: flex;
          gap: 32px;
        }
        
        .stat-item {
          text-align: right;
        }
        
        .stat-label {
          display: block;
          font-size: 14px;
          opacity: 0.8;
          margin-bottom: 4px;
        }
        
        .stat-value {
          display: block;
          font-size: 24px;
          font-weight: 700;
        }
        
        .balance-section {
          margin-bottom: 32px;
        }
        
        .balance-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 24px;
        }
        
        .balance-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          position: relative;
          overflow: hidden;
        }
        
        .balance-card.primary {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
        }
        
        .balance-card.secondary {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
        }
        
        .balance-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .balance-icon {
          width: 48px;
          height: 48px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .balance-trend {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 600;
          opacity: 0.9;
        }
        
        .balance-content {
          margin-bottom: 20px;
        }
        
        .balance-amount {
          font-size: 36px;
          font-weight: 800;
          margin-bottom: 4px;
          line-height: 1;
        }
        
        .balance-label {
          font-size: 16px;
          font-weight: 600;
          margin-bottom: 4px;
          opacity: 0.9;
        }
        
        .balance-subtitle {
          font-size: 14px;
          opacity: 0.7;
        }
        
        .balance-action {
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          display: inline-flex;
          align-items: center;
          padding: 12px 20px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 10px;
          transition: background-color 0.2s;
        }
        
        .balance-action:hover {
          background: rgba(255, 255, 255, 0.3);
        }
        
        .progress-section {
          margin-bottom: 32px;
        }
        
        .progress-card {
          background: white;
          border-radius: 20px;
          padding: 28px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
        }
        
        .progress-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .progress-header h3 {
          font-size: 20px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        
        .progress-date {
          font-size: 14px;
          color: #64748b;
          text-transform: capitalize;
        }
        
        .progress-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px;
          margin-bottom: 24px;
        }
        
        .progress-item {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        
        .progress-circle {
          width: 48px;
          height: 48px;
          background: #f1f5f9;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #895aed;
        }
        
        .progress-info {
          display: flex;
          flex-direction: column;
        }
        
        .progress-value {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .progress-label {
          font-size: 14px;
          color: #64748b;
        }
        
        .progress-bar-container {
          text-align: center;
        }
        
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #f1f5f9;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 8px;
        }
        
        .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #895aed, #667eea);
          border-radius: 4px;
          transition: width 0.3s ease;
        }
        
        .progress-percentage {
          font-size: 14px;
          color: #64748b;
          font-weight: 600;
        }
        
        .books-section, .locked-section {
          margin-bottom: 32px;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .section-title {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        
        .section-subtitle {
          font-size: 14px;
          color: #64748b;
        }
        
        .section-action {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #895aed;
          text-decoration: none;
          font-weight: 600;
          font-size: 14px;
          transition: color 0.2s;
        }
        
        .section-action:hover {
          color: #7c3aed;
        }
        
        .books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
        }
        
        .locked-books-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        
        .book-card {
          background: white;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
        }
        
        .book-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .book-card.locked {
          opacity: 0.7;
        }
        
        .book-cover {
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          position: relative;
        }
        
        .locked-cover {
          background: #94a3b8;
          color: white;
        }
        
        .book-badge {
          position: absolute;
          top: 12px;
          right: 12px;
          background: rgba(255, 255, 255, 0.9);
          color: #059669;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .book-content {
          padding: 20px;
        }
        
        .book-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        
        .book-genre {
          background: #f1f5f9;
          color: #895aed;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        
        .book-time {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #64748b;
          font-size: 12px;
        }
        
        .book-title {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
          line-height: 1.3;
        }
        
        .book-author {
          color: #64748b;
          margin: 0 0 16px 0;
          font-size: 14px;
        }
        
        .book-stats {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .book-reward {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #059669;
          font-weight: 700;
          font-size: 16px;
        }
        
        .book-reviews {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #64748b;
          font-size: 12px;
        }
        
        .book-button {
          width: 100%;
          background: linear-gradient(135deg, #895aed 0%, #667eea 100%);
          color: white;
          border: none;
          border-radius: 10px;
          padding: 12px;
          font-weight: 600;
          text-decoration: none;
          text-align: center;
          display: block;
          transition: all 0.2s;
        }
        
        .book-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 6px rgba(137, 90, 237, 0.3);
        }
        
        .unlock-info {
          background: #fef3c7;
          color: #92400e;
          padding: 8px 12px;
          border-radius: 8px;
          font-size: 12px;
          font-weight: 600;
          text-align: center;
          margin-top: 12px;
        }
        
        .actions-section {
          margin-bottom: 32px;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
        }
        
        .action-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 16px;
          text-decoration: none;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          transition: all 0.2s;
        }
        
        .action-card:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }
        
        .action-icon {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .action-icon.books {
          background: linear-gradient(135deg, #895aed, #667eea);
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
        
        .action-content h3 {
          font-size: 16px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 4px 0;
        }
        
        .action-content p {
          font-size: 14px;
          color: #64748b;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
          
          .dashboard-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
            padding: 20px;
          }
          
          .stats-quick {
            gap: 16px;
          }
          
          .balance-grid {
            grid-template-columns: 1fr;
          }
          
          .progress-stats {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          
          .books-grid, .actions-grid {
            grid-template-columns: 1fr;
          }
          
          .section-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }
        }
      `}</style>
    </div>
  );
};

export default DashboardPage;