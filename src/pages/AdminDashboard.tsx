// src/pages/AdminDashboard.tsx - CORRIGIDO
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import { Navigate } from 'react-router-dom';
import { 
  Users, BookOpen, DollarSign, TrendingUp, Shield, Settings, 
  Eye, Edit, Trash2, Plus, Search, Filter, Download, Upload,
  AlertTriangle, CheckCircle, Clock, X, Star, MessageSquare,
  BarChart3, PieChart, Activity, Wallet, UserPlus, BookPlus,
  RefreshCw, Ban, MoreHorizontal
} from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { 
    isAdmin, loading, error,
    getDashboardStats, getUsers, editUser, deleteUser,
    getWithdrawals, processWithdrawal, getAnalytics, getLogs,
    formatCurrency, formatDate, getStatusColor, translateStatus, translateAction
  } = useAdmin();

  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'books' | 'withdrawals' | 'analytics' | 'settings' | 'logs'>('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Estados para dados
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [logs, setLogs] = useState<any>(null);
  
  // Estados para paginação
  const [usersPage, setUsersPage] = useState(1);
  const [withdrawalsPage, setWithdrawalsPage] = useState(1);
  const [logsPage, setLogsPage] = useState(1);

  // Estados para modais
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [processingWithdrawal, setProcessingWithdrawal] = useState<string | null>(null);

  if (!user || !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  // Carregar dados do dashboard
  const loadDashboard = async () => {
    try {
      const dashboardData = await getDashboardStats();
      setStats(dashboardData);
    } catch (err) {
      console.error('Erro ao carregar dashboard:', err);
    }
  };

  // Carregar usuários
  const loadUsers = async (page = 1) => {
    try {
      const usersData = await getUsers(page, 10, searchTerm, selectedFilter);
      setUsers(usersData);
      setUsersPage(page);
    } catch (err) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  // Carregar saques
  const loadWithdrawals = async (page = 1) => {
    try {
      const withdrawalsData = await getWithdrawals(page, 10, selectedFilter);
      setWithdrawals(withdrawalsData);
      setWithdrawalsPage(page);
    } catch (err) {
      console.error('Erro ao carregar saques:', err);
    }
  };

  // Carregar analytics
  const loadAnalytics = async (period = '30d') => {
    try {
      const analyticsData = await getAnalytics(period);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Erro ao carregar analytics:', err);
    }
  };

  // Carregar logs
  const loadLogs = async (page = 1) => {
    try {
      const logsData = await getLogs(page, 20);
      setLogs(logsData);
      setLogsPage(page);
    } catch (err) {
      console.error('Erro ao carregar logs:', err);
    }
  };

  // Efeitos para carregar dados conforme a aba ativa
  useEffect(() => {
    if (activeTab === 'dashboard' && !stats) {
      loadDashboard();
    } else if (activeTab === 'users' && !users) {
      loadUsers();
    } else if (activeTab === 'withdrawals' && !withdrawals) {
      loadWithdrawals();
    } else if (activeTab === 'analytics' && !analytics) {
      loadAnalytics();
    } else if (activeTab === 'logs' && !logs) {
      loadLogs();
    }
  }, [activeTab]);

  // Recarregar usuários quando filtros mudarem
  useEffect(() => {
    if (activeTab === 'users') {
      loadUsers(1);
    }
  }, [searchTerm, selectedFilter]);

  // Funções de ação
  const handleEditUser = (userData: any) => {
    setEditingUser(userData);
    setShowEditModal(true);
  };

  const handleSaveUser = async (updates: any) => {
    if (!editingUser) return;
    
    try {
      await editUser(editingUser.id, updates);
      setShowEditModal(false);
      setEditingUser(null);
      loadUsers(usersPage); // Recarregar lista
    } catch (err) {
      console.error('Erro ao salvar usuário:', err);
    }
  };

  const handleSuspendUser = async (userId: string, reason?: string) => {
    try {
      await deleteUser(userId);
      loadUsers(usersPage); // Recarregar lista
    } catch (err) {
      console.error('Erro ao suspender usuário:', err);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingWithdrawal(withdrawalId);
    try {
      await processWithdrawal(withdrawalId, action);
      loadWithdrawals(withdrawalsPage); // Recarregar lista
    } catch (err) {
      console.error('Erro ao processar saque:', err);
    } finally {
      setProcessingWithdrawal(null);
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      {loading && <div className="loading-spinner">Carregando...</div>}
      {error && <div className="error-message">Erro: {error}</div>}
      
      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card users-card">
              <div className="stat-icon">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <h3>Usuários</h3>
                <div className="stat-number">{stats.totalUsers?.toLocaleString() || 0}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Ativos:</span>
                    <span className="detail-value">{stats.activeUsers?.toLocaleString() || 0}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Premium:</span>
                    <span className="detail-value">{stats.premiumUsers?.toLocaleString() || 0}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Suspensos:</span>
                    <span className="detail-value">{stats.suspendedUsers?.toLocaleString() || 0}</span>
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
                <div className="stat-number">{stats.totalBooks?.toLocaleString() || 0}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Ativos:</span>
                    <span className="detail-value">{stats.activeBooks?.toLocaleString() || 0}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Leituras:</span>
                    <span className="detail-value">{stats.totalReadings?.toLocaleString() || 0}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card revenue-card">
              <div className="stat-icon">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <h3>Financeiro</h3>
                <div className="stat-number">{formatCurrency(stats.totalRevenue || 0)}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Saques:</span>
                    <span className="detail-value">{formatCurrency(stats.totalWithdrawals || 0)}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Pendentes:</span>
                    <span className="detail-value">{formatCurrency(stats.pendingWithdrawals || 0)}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="stat-card growth-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <h3>Crescimento</h3>
                <div className="stat-number">+{stats.growthPercentage || 0}%</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Novos usuários:</span>
                    <span className="detail-value">{stats.newUsersThisMonth || 0}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Este mês:</span>
                    <span className="detail-value">{stats.monthlyGrowth || 0}%</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="charts-grid">
            <div className="chart-card">
              <h3>Usuários Ativos (Últimos 30 dias)</h3>
              <div className="chart-placeholder">
                Gráfico de usuários ativos
              </div>
            </div>
            
            <div className="chart-card">
              <h3>Receita (Últimos 30 dias)</h3>
              <div className="chart-placeholder">
                Gráfico de receita
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );

  const renderUsers = () => (
    <div className="users-content">
      <div className="content-header">
        <h2>Gerenciar Usuários</h2>
        <div className="header-actions">
          <div className="search-wrapper">
            <Search size={20} />
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
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="suspended">Suspensos</option>
            <option value="premium">Premium</option>
          </select>
          
          <button className="btn btn-primary">
            <UserPlus size={20} />
            Novo Usuário
          </button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Carregando usuários...</div>}
      {error && <div className="error-message">Erro: {error}</div>}
      
      {users && (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Email</th>
                  <th>Plano</th>
                  <th>Level</th>
                  <th>Saldo</th>
                  <th>Status</th>
                  <th>Último Login</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.users?.map((userData: any) => (
                  <tr key={userData.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-avatar">
                          {userData.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="user-name">{userData.name}</div>
                          <div className="user-id">ID: {userData.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td>{userData.email}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(userData.planType || 'free') }}
                      >
                        {translateStatus(userData.planType || 'free')}
                      </span>
                    </td>
                    <td>{userData.level || 0}</td>
                    <td>{formatCurrency(userData.balance || 0)}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ 
                          backgroundColor: userData.isSuspended ? '#ef4444' : '#10b981' 
                        }}
                      >
                        {userData.isSuspended ? 'Suspenso' : 'Ativo'}
                      </span>
                    </td>
                    <td>
                      {userData.lastLoginAt 
                        ? formatDate(userData.lastLoginAt)
                        : 'Nunca'
                      }
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => handleEditUser(userData)}
                          title="Editar"
                        >
                          <Edit size={16} />
                        </button>
                        
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleSuspendUser(userData.id)}
                          title="Suspender"
                        >
                          <Ban size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>

          {users.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => loadUsers(usersPage - 1)}
                disabled={usersPage === 1}
              >
                Anterior
              </button>
              
              <span className="page-info">
                Página {usersPage} de {users.totalPages}
              </span>
              
              <button
                className="btn btn-secondary"
                onClick={() => loadUsers(usersPage + 1)}
                disabled={usersPage === users.totalPages}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderWithdrawals = () => (
    <div className="withdrawals-content">
      <div className="content-header">
        <h2>Gerenciar Saques</h2>
        <div className="header-actions">
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
          
          <button className="btn btn-secondary">
            <Download size={20} />
            Exportar
          </button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Carregando saques...</div>}
      {error && <div className="error-message">Erro: {error}</div>}
      
      {withdrawals && (
        <>
          <div className="table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Valor</th>
                  <th>Método</th>
                  <th>Status</th>
                  <th>Data</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.withdrawals?.map((withdrawal: any) => (
                  <tr key={withdrawal.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{withdrawal.user?.name || 'N/A'}</div>
                        <div className="user-email">{withdrawal.user?.email || 'N/A'}</div>
                      </div>
                    </td>
                    <td>{formatCurrency(withdrawal.amount || 0)}</td>
                    <td>{withdrawal.method || 'PIX'}</td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(withdrawal.status || 'pending') }}
                      >
                        {translateStatus(withdrawal.status || 'pending')}
                      </span>
                    </td>
                    <td>{formatDate(withdrawal.createdAt)}</td>
                    <td>
                      {withdrawal.status === 'pending' && (
                        <div className="action-buttons">
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}
                            disabled={processingWithdrawal === withdrawal.id}
                            title="Aprovar"
                          >
                            <CheckCircle size={16} />
                          </button>
                          
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => handleProcessWithdrawal(withdrawal.id, 'reject')}
                            disabled={processingWithdrawal === withdrawal.id}
                            title="Rejeitar"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                )) || []}
              </tbody>
            </table>
          </div>

          {withdrawals.totalPages > 1 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                onClick={() => loadWithdrawals(withdrawalsPage - 1)}
                disabled={withdrawalsPage === 1}
              >
                Anterior
              </button>
              
              <span className="page-info">
                Página {withdrawalsPage} de {withdrawals.totalPages}
              </span>
              
              <button
                className="btn btn-secondary"
                onClick={() => loadWithdrawals(withdrawalsPage + 1)}
                disabled={withdrawalsPage === withdrawals.totalPages}
              >
                Próxima
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-title">
          <Shield size={24} />
          <h1>Painel Administrativo</h1>
        </div>
        
        <div className="admin-user-info">
          <span>Olá, {user.name}</span>
          <div className="user-avatar">
            {user.name.charAt(0).toUpperCase()}
          </div>
        </div>
      </div>

      <div className="admin-navigation">
        <button
          className={`nav-tab ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={20} />
          Dashboard
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={20} />
          Usuários
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'books' ? 'active' : ''}`}
          onClick={() => setActiveTab('books')}
        >
          <BookOpen size={20} />
          Livros
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'withdrawals' ? 'active' : ''}`}
          onClick={() => setActiveTab('withdrawals')}
        >
          <Wallet size={20} />
          Saques
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <PieChart size={20} />
          Analytics
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={20} />
          Configurações
        </button>
        
        <button
          className={`nav-tab ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={20} />
          Logs
        </button>
      </div>

      <div className="admin-content">
        {activeTab === 'dashboard' && renderDashboard()}
        {activeTab === 'users' && renderUsers()}
        {activeTab === 'withdrawals' && renderWithdrawals()}
        {activeTab === 'analytics' && <div>Analytics em desenvolvimento...</div>}
        {activeTab === 'books' && <div>Gerenciamento de livros em desenvolvimento...</div>}
        {activeTab === 'settings' && <div>Configurações em desenvolvimento...</div>}
        {activeTab === 'logs' && <div>Logs em desenvolvimento...</div>}
      </div>
    </div>
  );
};

export default AdminDashboard;