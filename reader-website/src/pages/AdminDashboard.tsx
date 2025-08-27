import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { 
  Users, BookOpen, DollarSign, TrendingUp, Shield, Settings, 
  Eye, Edit, Trash2, Plus, Search, Filter, Download, Upload,
  AlertTriangle, CheckCircle, Clock, X, Star, MessageSquare,
  BarChart3, PieChart, Activity, Wallet, UserPlus, BookPlus
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'books' | 'withdrawals' | 'analytics' | 'settings'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'user' | 'book' | 'withdrawal' | null>(null);

  if (!user || !user.isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Mock data
  const adminStats = {
    totalUsers: 15420,
    activeUsers: 8965,
    premiumUsers: 2134,
    totalBooks: 156,
    totalWithdrawals: 89450.50,
    pendingWithdrawals: 12,
    totalRevenue: 234567.89,
    conversionRate: 15.6
  };

  const mockUsers = [
    {
      id: '1', name: 'João Silva', email: 'joao@email.com', level: 2, points: 450,
      balance: 25000, planType: 'premium', isAdmin: false, createdAt: '2024-01-15',
      status: 'active'
    },
    {
      id: '2', name: 'Maria Santos', email: 'maria@email.com', level: 1, points: 180,
      balance: 8500, planType: 'free', isAdmin: false, createdAt: '2024-02-20',
      status: 'active'
    },
    {
      id: '3', name: 'Pedro Costa', email: 'pedro@email.com', level: 0, points: 45,
      balance: 1200, planType: 'free', isAdmin: false, createdAt: '2024-03-10',
      status: 'suspended'
    }
  ];

  const mockBooks = [
    {
      id: '1', title: 'As Sombras de Eldoria', author: 'Marina Silvestre',
      genre: 'Fantasia', reviewsCount: 84288, averageRating: 4.8, status: 'active',
      rewardMoney: 100, requiredLevel: 0, createdAt: '2024-01-01'
    },
    {
      id: '2', title: 'Código Vermelho', author: 'Alexandre Ferreira',
      genre: 'Thriller', reviewsCount: 12947, averageRating: 4.6, status: 'active',
      rewardMoney: 150, requiredLevel: 1, createdAt: '2024-02-15'
    },
    {
      id: '3', title: 'Memórias Perdidas', author: 'Clara Monteiro',
      genre: 'Romance', reviewsCount: 11698, averageRating: 4.9, status: 'inactive',
      rewardMoney: 125, requiredLevel: 1, createdAt: '2024-03-01'
    }
  ];

  const mockWithdrawals = [
    {
      id: '1', userId: '1', userName: 'João Silva', amount: 25000,
      status: 'pending', pixKey: '***.456.789-**', requestedAt: '2024-03-20',
      processedAt: null
    },
    {
      id: '2', userId: '2', userName: 'Maria Santos', amount: 15000,
      status: 'completed', pixKey: 'maria***@email.com', requestedAt: '2024-03-18',
      processedAt: '2024-03-19'
    },
    {
      id: '3', userId: '3', userName: 'Pedro Costa', amount: 50000,
      status: 'rejected', pixKey: '(**) ****-5678', requestedAt: '2024-03-15',
      processedAt: '2024-03-16'
    }
  ];

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'suspended': case 'rejected': case 'inactive': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string, type: 'user' | 'book' | 'withdrawal' = 'user') => {
    if (type === 'withdrawal') {
      switch (status) {
        case 'pending': return 'Pendente';
        case 'completed': return 'Concluído';
        case 'rejected': return 'Rejeitado';
        default: return status;
      }
    }
    if (type === 'book') {
      switch (status) {
        case 'active': return 'Ativo';
        case 'inactive': return 'Inativo';
        default: return status;
      }
    }
    switch (status) {
      case 'active': return 'Ativo';
      case 'suspended': return 'Suspenso';
      default: return status;
    }
  };

  const handleAction = (action: string, id: string, type: 'user' | 'book' | 'withdrawal') => {
    console.log(`Ação: ${action} - ID: ${id} - Tipo: ${type}`);
    // Implementar ações administrativas
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="stats-grid">
        <div className="stat-card users-card">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-info">
            <h3>Usuários</h3>
            <div className="stat-number">{adminStats.totalUsers.toLocaleString()}</div>
            <div className="stat-details">
              <span className="detail-item">
                <span className="detail-label">Ativos:</span>
                <span className="detail-value">{adminStats.activeUsers.toLocaleString()}</span>
              </span>
              <span className="detail-item">
                <span className="detail-label">Premium:</span>
                <span className="detail-value">{adminStats.premiumUsers.toLocaleString()}</span>
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card books-card">
          <div className="stat-icon">
            <BookOpen size={24} />
          </div>
          <div className="stat-info">
            <h3>Livros</h3>
            <div className="stat-number">{adminStats.totalBooks}</div>
            <div className="stat-details">
              <span className="detail-item">
                <span className="detail-label">Ativos:</span>
                <span className="detail-value">142</span>
              </span>
              <span className="detail-item">
                <span className="detail-label">Inativos:</span>
                <span className="detail-value">14</span>
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card withdrawals-card">
          <div className="stat-icon">
            <DollarSign size={24} />
          </div>
          <div className="stat-info">
            <h3>Saques</h3>
            <div className="stat-number">R$ {adminStats.totalWithdrawals.toFixed(2).replace('.', ',')}</div>
            <div className="stat-details">
              <span className="detail-item">
                <span className="detail-label">Pendentes:</span>
                <span className="detail-value">{adminStats.pendingWithdrawals}</span>
              </span>
              <span className="detail-item urgent">
                <AlertTriangle size={12} />
                <span className="detail-value">Requer atenção</span>
              </span>
            </div>
          </div>
        </div>

        <div className="stat-card revenue-card">
          <div className="stat-icon">
            <TrendingUp size={24} />
          </div>
          <div className="stat-info">
            <h3>Receita</h3>
            <div className="stat-number">R$ {adminStats.totalRevenue.toFixed(2).replace('.', ',')}</div>
            <div className="stat-details">
              <span className="detail-item">
                <span className="detail-label">Conversão:</span>
                <span className="detail-value">{adminStats.conversionRate}%</span>
              </span>
              <span className="detail-item positive">
                <TrendingUp size={12} />
                <span className="detail-value">+12% mês</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="quick-actions">
        <h3>Ações Rápidas</h3>
        <div className="actions-grid">
          <button className="action-btn" onClick={() => setActiveTab('users')}>
            <UserPlus size={20} />
            <span>Gerenciar Usuários</span>
          </button>
          <button className="action-btn" onClick={() => setActiveTab('books')}>
            <BookPlus size={20} />
            <span>Adicionar Livro</span>
          </button>
          <button className="action-btn" onClick={() => setActiveTab('withdrawals')}>
            <Wallet size={20} />
            <span>Processar Saques</span>
          </button>
          <button className="action-btn" onClick={() => setActiveTab('analytics')}>
            <BarChart3 size={20} />
            <span>Ver Analytics</span>
          </button>
        </div>
      </div>

      <div className="recent-activity">
        <h3>Atividade Recente</h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon user-activity">
              <Users size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">5 novos usuários se cadastraram</span>
              <span className="activity-time">há 2 horas</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon withdrawal-activity">
              <DollarSign size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">12 saques processados (R$ 2.450,00)</span>
              <span className="activity-time">há 4 horas</span>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon book-activity">
              <BookOpen size={16} />
            </div>
            <div className="activity-content">
              <span className="activity-text">Novo livro "Aventura Espacial" foi adicionado</span>
              <span className="activity-time">há 6 horas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="management-content">
      <div className="content-header">
        <h3>Gestão de Usuários</h3>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar usuários..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
            <option value="premium">Premium</option>
          </select>
          <button className="btn-primary">
            <Plus size={16} />
            Novo Usuário
          </button>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Nome</div>
            <div className="table-cell">Email</div>
            <div className="table-cell">Nível</div>
            <div className="table-cell">Pontos</div>
            <div className="table-cell">Saldo</div>
            <div className="table-cell">Plano</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Ações</div>
          </div>
        </div>
        <div className="table-body">
          {mockUsers.map((user) => (
            <div key={user.id} className="table-row">
              <div className="table-cell">
                <div className="user-info">
                  <div className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span>{user.name}</span>
                </div>
              </div>
              <div className="table-cell">{user.email}</div>
              <div className="table-cell">
                <span className="level-badge">Nível {user.level}</span>
              </div>
              <div className="table-cell">{user.points}</div>
              <div className="table-cell">{formatCurrency(user.balance)}</div>
              <div className="table-cell">
                <span className={`plan-badge ${user.planType}`}>
                  {user.planType === 'premium' ? 'Premium' : 'Gratuito'}
                </span>
              </div>
              <div className="table-cell">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(user.status) }}
                >
                  {getStatusText(user.status)}
                </span>
              </div>
              <div className="table-cell">
                <div className="action-buttons">
                  <button 
                    className="action-btn-small"
                    onClick={() => handleAction('view', user.id, 'user')}
                    title="Ver detalhes"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className="action-btn-small"
                    onClick={() => handleAction('edit', user.id, 'user')}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="action-btn-small danger"
                    onClick={() => handleAction('suspend', user.id, 'user')}
                    title="Suspender"
                  >
                    <AlertTriangle size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderBooks = () => (
    <div className="management-content">
      <div className="content-header">
        <h3>Gestão de Livros</h3>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar livros..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
          <button className="btn-primary">
            <Plus size={16} />
            Novo Livro
          </button>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Título</div>
            <div className="table-cell">Autor</div>
            <div className="table-cell">Gênero</div>
            <div className="table-cell">Avaliações</div>
            <div className="table-cell">Rating</div>
            <div className="table-cell">Recompensa</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Ações</div>
          </div>
        </div>
        <div className="table-body">
          {mockBooks.map((book) => (
            <div key={book.id} className="table-row">
              <div className="table-cell">
                <div className="book-info">
                  <div className="book-cover-mini">📚</div>
                  <span>{book.title}</span>
                </div>
              </div>
              <div className="table-cell">{book.author}</div>
              <div className="table-cell">
                <span className="genre-badge">{book.genre}</span>
              </div>
              <div className="table-cell">{book.reviewsCount.toLocaleString()}</div>
              <div className="table-cell">
                <div className="rating-display">
                  <Star size={14} fill="currentColor" />
                  <span>{book.averageRating}</span>
                </div>
              </div>
              <div className="table-cell">{formatCurrency(book.rewardMoney)}</div>
              <div className="table-cell">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(book.status) }}
                >
                  {getStatusText(book.status, 'book')}
                </span>
              </div>
              <div className="table-cell">
                <div className="action-buttons">
                  <button 
                    className="action-btn-small"
                    onClick={() => handleAction('view', book.id, 'book')}
                    title="Ver detalhes"
                  >
                    <Eye size={14} />
                  </button>
                  <button 
                    className="action-btn-small"
                    onClick={() => handleAction('edit', book.id, 'book')}
                    title="Editar"
                  >
                    <Edit size={14} />
                  </button>
                  <button 
                    className="action-btn-small danger"
                    onClick={() => handleAction('deactivate', book.id, 'book')}
                    title="Desativar"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderWithdrawals = () => (
    <div className="management-content">
      <div className="content-header">
        <h3>Gestão de Saques</h3>
        <div className="header-actions">
          <div className="search-box">
            <Search size={16} />
            <input 
              type="text" 
              placeholder="Buscar por usuário..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="completed">Concluídos</option>
            <option value="rejected">Rejeitados</option>
          </select>
          <button className="btn-secondary">
            <Download size={16} />
            Exportar
          </button>
        </div>
      </div>

      <div className="data-table">
        <div className="table-header">
          <div className="table-row">
            <div className="table-cell">Usuário</div>
            <div className="table-cell">Valor</div>
            <div className="table-cell">Chave PIX</div>
            <div className="table-cell">Solicitado</div>
            <div className="table-cell">Processado</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Ações</div>
          </div>
        </div>
        <div className="table-body">
          {mockWithdrawals.map((withdrawal) => (
            <div key={withdrawal.id} className="table-row">
              <div className="table-cell">
                <div className="user-info">
                  <div className="user-avatar">
                    {withdrawal.userName.charAt(0).toUpperCase()}
                  </div>
                  <span>{withdrawal.userName}</span>
                </div>
              </div>
              <div className="table-cell">
                <span className="amount-display">{formatCurrency(withdrawal.amount)}</span>
              </div>
              <div className="table-cell">
                <span className="pix-key">{withdrawal.pixKey}</span>
              </div>
              <div className="table-cell">{withdrawal.requestedAt}</div>
              <div className="table-cell">
                {withdrawal.processedAt || '-'}
              </div>
              <div className="table-cell">
                <span 
                  className="status-badge"
                  style={{ color: getStatusColor(withdrawal.status) }}
                >
                  {getStatusText(withdrawal.status, 'withdrawal')}
                </span>
              </div>
              <div className="table-cell">
                <div className="action-buttons">
                  {withdrawal.status === 'pending' && (
                    <>
                      <button 
                        className="action-btn-small success"
                        onClick={() => handleAction('approve', withdrawal.id, 'withdrawal')}
                        title="Aprovar"
                      >
                        <CheckCircle size={14} />
                      </button>
                      <button 
                        className="action-btn-small danger"
                        onClick={() => handleAction('reject', withdrawal.id, 'withdrawal')}
                        title="Rejeitar"
                      >
                        <X size={14} />
                      </button>
                    </>
                  )}
                  <button 
                    className="action-btn-small"
                    onClick={() => handleAction('view', withdrawal.id, 'withdrawal')}
                    title="Ver detalhes"
                  >
                    <Eye size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <h3>Analytics e Relatórios</h3>
      <div className="analytics-grid">
        <div className="chart-card">
          <h4>Crescimento de Usuários</h4>
          <div className="chart-placeholder">
            <BarChart3 size={48} />
            <span>Gráfico de usuários por mês</span>
          </div>
        </div>
        <div className="chart-card">
          <h4>Distribuição de Planos</h4>
          <div className="chart-placeholder">
            <PieChart size={48} />
            <span>Proporção Free vs Premium</span>
          </div>
        </div>
        <div className="chart-card">
          <h4>Atividade de Leitura</h4>
          <div className="chart-placeholder">
            <Activity size={48} />
            <span>Livros lidos por período</span>
          </div>
        </div>
        <div className="chart-card">
          <h4>Receita Mensal</h4>
          <div className="chart-placeholder">
            <TrendingUp size={48} />
            <span>Evolução da receita</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-content">
      <h3>Configurações do Sistema</h3>
      <div className="settings-sections">
        <div className="settings-card">
          <h4>Configurações Gerais</h4>
          <div className="setting-item">
            <label>Taxa de conversão (pontos para dinheiro)</label>
            <input type="number" defaultValue="10" />
          </div>
          <div className="setting-item">
            <label>Valor mínimo de saque (centavos)</label>
            <input type="number" defaultValue="5000" />
          </div>
          <div className="setting-item">
            <label>Modo de manutenção</label>
            <input type="checkbox" />
          </div>
        </div>

        <div className="settings-card">
          <h4>Notificações</h4>
          <div className="setting-item">
            <label>Email para novos usuários</label>
            <input type="checkbox" defaultChecked />
          </div>
          <div className="setting-item">
            <label>Email para saques pendentes</label>
            <input type="checkbox" defaultChecked />
          </div>
        </div>

        <div className="settings-card">
          <h4>Limites e Restrições</h4>
          <div className="setting-item">
            <label>Máximo de livros por dia (usuários free)</label>
            <input type="number" defaultValue="1" />
          </div>
          <div className="setting-item">
            <label>Máximo de livros por dia (usuários premium)</label>
            <input type="number" defaultValue="3" />
          </div>
        </div>
      </div>
      
      <div className="settings-actions">
        <button className="btn-primary">Salvar Configurações</button>
        <button className="btn-secondary">Resetar para Padrão</button>
      </div>
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-container">
        {/* Header */}
        <div className="admin-header">
          <div className="header-title">
            <Shield size={32} />
            <div>
              <h1>Painel Administrativo</h1>
              <p>Visão geral da plataforma Beta Reader Go</p>
            </div>
          </div>
          <div className="admin-user-info">
            <span>Logado como Admin</span>
            <div className="admin-avatar">
              {user.name.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="admin-nav">
          <button 
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <BarChart3 size={18} />
            Dashboard
          </button>
          <button 
            className={`nav-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={18} />
            Usuários
          </button>
          <button 
            className={`nav-btn ${activeTab === 'books' ? 'active' : ''}`}
            onClick={() => setActiveTab('books')}
          >
            <BookOpen size={18} />
            Livros
          </button>
          <button 
            className={`nav-btn ${activeTab === 'withdrawals' ? 'active' : ''}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            <DollarSign size={18} />
            Saques
          </button>
          <button 
            className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            <TrendingUp size={18} />
            Analytics
          </button>
          <button 
            className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings size={18} />
            Configurações
          </button>
        </div>

        {/* Content */}
        <div className="admin-content">
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'books' && renderBooks()}
          {activeTab === 'withdrawals' && renderWithdrawals()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      <style>{`
        .admin-dashboard {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 24px;
        }
        
        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
        }
        
        /* Header */
        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
          background: white;
          padding: 24px 32px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #dc2626;
        }
        
        .header-title h1 {
          font-size: 28px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          background: linear-gradient(135deg, #dc2626, #991b1b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .header-title p {
          color: #64748b;
          margin: 0;
          font-size: 16px;
        }
        
        .admin-user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .admin-user-info span {
          font-size: 14px;
          color: #64748b;
          font-weight: 500;
        }
        
        .admin-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #dc2626;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          border: 2px solid #fecaca;
        }
        
        /* Navigation */
        .admin-nav {
          display: flex;
          gap: 4px;
          margin-bottom: 24px;
          background: white;
          padding: 8px;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 20px;
          background: none;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .nav-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }
        
        .nav-btn.active {
          background: #dc2626;
          color: white;
        }
        
        /* Content */
        .admin-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        /* Dashboard Stats */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        
        .stat-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          transition: transform 0.2s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
        }
        
        .users-card {
          border-left: 4px solid #8b5cf6;
        }
        
        .books-card {
          border-left: 4px solid #10b981;
        }
        
        .withdrawals-card {
          border-left: 4px solid #f59e0b;
        }
        
        .revenue-card {
          border-left: 4px solid #06b6d4;
        }
        
        .stat-card {
          display: flex;
          align-items: flex-start;
          gap: 20px;
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .users-card .stat-icon {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
        
        .books-card .stat-icon {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .withdrawals-card .stat-icon {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .revenue-card .stat-icon {
          background: rgba(6, 182, 212, 0.1);
          color: #06b6d4;
        }
        
        .stat-info {
          flex: 1;
        }
        
        .stat-info h3 {
          font-size: 14px;
          color: #64748b;
          margin: 0 0 8px 0;
          font-weight: 500;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 12px;
        }
        
        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 13px;
        }
        
        .detail-label {
          color: #64748b;
        }
        
        .detail-value {
          color: #1e293b;
          font-weight: 500;
        }
        
        .detail-item.urgent {
          color: #f59e0b;
        }
        
        .detail-item.positive {
          color: #10b981;
        }
        
        /* Quick Actions */
        .quick-actions {
          margin-bottom: 40px;
        }
        
        .quick-actions h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
        }
        
        .actions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 16px 20px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s ease;
        }
        
        .action-btn:hover {
          background: #dc2626;
          color: white;
          border-color: #dc2626;
          transform: translateY(-1px);
        }
        
        /* Recent Activity */
        .recent-activity h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin-bottom: 20px;
        }
        
        .activity-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .activity-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .user-activity {
          background: rgba(139, 92, 246, 0.1);
          color: #8b5cf6;
        }
        
        .withdrawal-activity {
          background: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
        }
        
        .book-activity {
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
        }
        
        .activity-content {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .activity-text {
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }
        
        .activity-time {
          color: #64748b;
          font-size: 12px;
        }
        
        /* Management Content */
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .content-header h3 {
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .header-actions {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .search-box {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .search-box svg {
          position: absolute;
          left: 12px;
          color: #64748b;
        }
        
        .search-box input {
          padding: 10px 12px 10px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          width: 200px;
        }
        
        .search-box input:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        
        .filter-select {
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        
        .btn-primary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #dc2626;
          color: white;
          border: none;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s ease;
        }
        
        .btn-primary:hover {
          background: #b91c1c;
        }
        
        .btn-secondary {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          color: #374151;
          border: 1px solid #e2e8f0;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover {
          background: #f8fafc;
        }
        
        /* Data Table */
        .data-table {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          overflow: hidden;
        }
        
        .table-header {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr 1fr 1fr 1fr 1fr;
          align-items: center;
          padding: 16px;
        }
        
        .table-cell {
          font-size: 14px;
          color: #374151;
        }
        
        .table-header .table-cell {
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          font-size: 12px;
          letter-spacing: 0.5px;
        }
        
        .table-body .table-row {
          border-bottom: 1px solid #f1f5f9;
        }
        
        .table-body .table-row:last-child {
          border-bottom: none;
        }
        
        .table-body .table-row:hover {
          background: #fafbfc;
        }
        
        /* Table Elements */
        .user-info, .book-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #8b5cf6;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          font-weight: 600;
        }
        
        .book-cover-mini {
          width: 32px;
          height: 32px;
          border-radius: 4px;
          background: #f1f5f9;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }
        
        .level-badge, .plan-badge, .genre-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .level-badge {
          background: #e0e7ff;
          color: #3730a3;
        }
        
        .plan-badge.premium {
          background: #fbbf24;
          color: white;
        }
        
        .plan-badge.free {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .genre-badge {
          background: #dcfce7;
          color: #166534;
        }
        
        .status-badge {
          font-size: 12px;
          font-weight: 600;
        }
        
        .rating-display {
          display: flex;
          align-items: center;
          gap: 4px;
          color: #f59e0b;
        }
        
        .amount-display {
          font-weight: 600;
          color: #10b981;
        }
        
        .pix-key {
          font-family: monospace;
          background: #f1f5f9;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
        }
        
        /* Action Buttons */
        .action-buttons {
          display: flex;
          gap: 8px;
        }
        
        .action-btn-small {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: #f1f5f9;
          color: #64748b;
        }
        
        .action-btn-small:hover {
          background: #e2e8f0;
          transform: scale(1.1);
        }
        
        .action-btn-small.success {
          background: #dcfce7;
          color: #166534;
        }
        
        .action-btn-small.success:hover {
          background: #bbf7d0;
        }
        
        .action-btn-small.danger {
          background: #fee2e2;
          color: #dc2626;
        }
        
        .action-btn-small.danger:hover {
          background: #fecaca;
        }
        
        /* Analytics */
        .analytics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }
        
        .chart-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          text-align: center;
        }
        
        .chart-card h4 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        .chart-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          color: #64748b;
          padding: 40px 0;
        }
        
        /* Settings */
        .settings-sections {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
          margin-bottom: 32px;
        }
        
        .settings-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
        }
        
        .settings-card h4 {
          margin: 0 0 20px 0;
          font-size: 16px;
          font-weight: 600;
          color: #374151;
        }
        
        .setting-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .setting-item:last-child {
          margin-bottom: 0;
        }
        
        .setting-item label {
          font-size: 14px;
          color: #374151;
          font-weight: 500;
        }
        
        .setting-item input[type="number"] {
          width: 80px;
          padding: 6px 8px;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
        }
        
        .settings-actions {
          display: flex;
          gap: 12px;
        }
        
        /* Responsive */
        @media (max-width: 1024px) {
          .admin-dashboard {
            padding: 16px;
          }
          
          .admin-header {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }
          
          .admin-nav {
            flex-wrap: wrap;
          }
          
          .stats-grid {
            grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          }
        }
        
        @media (max-width: 768px) {
          .content-header {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .header-actions {
            flex-direction: column;
            gap: 8px;
          }
          
          .search-box input {
            width: 100%;
          }
          
          .table-row {
            grid-template-columns: 1fr;
            gap: 8px;
          }
          
          .table-cell {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 0;
          }
          
          .table-header {
            display: none;
          }
          
          .actions-grid {
            grid-template-columns: 1fr;
          }
          
          .analytics-grid {
            grid-template-columns: 1fr;
          }
          
          .settings-sections {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;