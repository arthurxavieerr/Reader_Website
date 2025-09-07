// src/pages/AdminDashboard.tsx - ATUALIZADO COM API REAL
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
      await deleteUser(userId, 'suspend', reason);
      loadUsers(usersPage); // Recarregar lista
    } catch (err) {
      console.error('Erro ao suspender usuário:', err);
    }
  };

  const handleProcessWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessingWithdrawal(withdrawalId);
    try {
      await processWithdrawal(withdrawalId, action, reason);
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
                <div className="stat-number">{stats.totalUsers.toLocaleString()}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Ativos:</span>
                    <span className="detail-value">{stats.activeUsers.toLocaleString()}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Premium:</span>
                    <span className="detail-value">{stats.premiumUsers.toLocaleString()}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Suspensos:</span>
                    <span className="detail-value">{stats.suspendedUsers.toLocaleString()}</span>
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
                <div className="stat-number">{stats.totalBooks}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Ativos:</span>
                    <span className="detail-value">{stats.activeBooks}</span>
                  </span>
                  <span className="detail-item">
                    <span className="detail-label">Inativos:</span>
                    <span className="detail-value">{stats.totalBooks - stats.activeBooks}</span>
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
                <div className="stat-number">{formatCurrency(stats.totalWithdrawals)}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Pendentes:</span>
                    <span className="detail-value">{stats.pendingWithdrawals}</span>
                  </span>
                  {stats.pendingWithdrawals > 0 && (
                    <span className="detail-item urgent">
                      <AlertTriangle size={12} />
                      <span className="detail-value">Requer atenção</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="stat-card revenue-card">
              <div className="stat-icon">
                <TrendingUp size={24} />
              </div>
              <div className="stat-info">
                <h3>Receita Estimada</h3>
                <div className="stat-number">{formatCurrency(stats.estimatedRevenue)}</div>
                <div className="stat-details">
                  <span className="detail-item">
                    <span className="detail-label">Conversão:</span>
                    <span className="detail-value">{stats.conversionRate.toFixed(1)}%</span>
                  </span>
                  <span className="detail-item positive">
                    <TrendingUp size={12} />
                    <span className="detail-value">Premium: {stats.premiumUsers}</span>
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
              <button className="action-btn" onClick={() => setActiveTab('withdrawals')}>
                <Wallet size={20} />
                <span>Processar Saques ({stats.pendingWithdrawals})</span>
              </button>
              <button className="action-btn" onClick={() => setActiveTab('analytics')}>
                <BarChart3 size={20} />
                <span>Ver Analytics</span>
              </button>
              <button className="action-btn" onClick={() => setActiveTab('logs')}>
                <Eye size={20} />
                <span>Logs do Sistema</span>
              </button>
            </div>
          </div>

          <div className="recent-activity">
            <h3>Estatísticas Rápidas</h3>
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon user-activity">
                  <Activity size={16} />
                </div>
                <div className="activity-content">
                  <span className="activity-text">
                    {stats.recentReadingSessions} sessões de leitura nos últimos 7 dias
                  </span>
                  <span className="activity-time">Atualizado agora</span>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon revenue-activity">
                  <DollarSign size={16} />
                </div>
                <div className="activity-content">
                  <span className="activity-text">
                    {stats.approvedWithdrawals} saques aprovados hoje
                  </span>
                  <span className="activity-time">Sistema automático</span>
                </div>
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
        <h3>Gerenciar Usuários</h3>
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
            <option value="premium">Premium</option>
            <option value="suspended">Suspensos</option>
            <option value="admin">Administradores</option>
          </select>
          <button className="refresh-btn" onClick={() => loadUsers(1)}>
            <RefreshCw size={16} />
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
                {users.users.map((userData: any) => (
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
                        style={{ backgroundColor: getStatusColor(userData.planType) }}
                      >
                        {translateStatus(userData.planType)}
                      </span>
                    </td>
                    <td>{userData.level}</td>
                    <td>{formatCurrency(userData.balance)}</td>
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
                          className="action-btn-small"
                          onClick={() => handleEditUser(userData)}
                          title="Editar"
                        >
                          <Edit size={14} />
                        </button>
                        {!userData.isAdmin && (
                          <button 
                            className="action-btn-small danger"
                            onClick={() => handleSuspendUser(userData.id, 'Suspenso pelo admin')}
                            title="Suspender"
                          >
                            <Ban size={14} />
                          </button>
                        )}
                        <button 
                          className="action-btn-small"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="pagination">
            <button 
              disabled={users.pagination.page === 1}
              onClick={() => loadUsers(users.pagination.page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {users.pagination.page} de {users.pagination.totalPages}
            </span>
            <button 
              disabled={users.pagination.page === users.pagination.totalPages}
              onClick={() => loadUsers(users.pagination.page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderWithdrawals = () => (
    <div className="withdrawals-content">
      <div className="content-header">
        <h3>Gerenciar Saques</h3>
        <div className="header-actions">
          <select 
            value={selectedFilter} 
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
          <button className="refresh-btn" onClick={() => loadWithdrawals(1)}>
            <RefreshCw size={16} />
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
                  <th>PIX</th>
                  <th>Status</th>
                  <th>Solicitado</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.withdrawals.map((withdrawal: any) => (
                  <tr key={withdrawal.id}>
                    <td>
                      <div className="user-info">
                        <div className="user-name">{withdrawal.user.name}</div>
                        <div className="user-email">{withdrawal.user.email}</div>
                      </div>
                    </td>
                    <td className="amount-cell">
                      {formatCurrency(withdrawal.amount)}
                    </td>
                    <td>
                      <div className="pix-info">
                        <div className="pix-key">{withdrawal.pixKey}</div>
                        <div className="pix-type">{withdrawal.pixKeyType}</div>
                      </div>
                    </td>
                    <td>
                      <span 
                        className="status-badge" 
                        style={{ backgroundColor: getStatusColor(withdrawal.status) }}
                      >
                        {translateStatus(withdrawal.status)}
                      </span>
                    </td>
                    <td>{formatDate(withdrawal.requestedAt)}</td>
                    <td>
                      <div className="action-buttons">
                        {withdrawal.status === 'PENDING' && (
                          <>
                            <button 
                              className="action-btn-small success"
                              onClick={() => handleProcessWithdrawal(withdrawal.id, 'approve')}
                              disabled={processingWithdrawal === withdrawal.id}
                              title="Aprovar"
                            >
                              <CheckCircle size={14} />
                            </button>
                            <button 
                              className="action-btn-small danger"
                              onClick={() => handleProcessWithdrawal(withdrawal.id, 'reject', 'Rejeitado pelo admin')}
                              disabled={processingWithdrawal === withdrawal.id}
                              title="Rejeitar"
                            >
                              <X size={14} />
                            </button>
                          </>
                        )}
                        <button 
                          className="action-btn-small"
                          title="Ver detalhes"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="pagination">
            <button 
              disabled={withdrawals.pagination.page === 1}
              onClick={() => loadWithdrawals(withdrawals.pagination.page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {withdrawals.pagination.page} de {withdrawals.pagination.totalPages}
            </span>
            <button 
              disabled={withdrawals.pagination.page === withdrawals.pagination.totalPages}
              onClick={() => loadWithdrawals(withdrawals.pagination.page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderAnalytics = () => (
    <div className="analytics-content">
      <div className="content-header">
        <h3>Analytics e Relatórios</h3>
        <div className="header-actions">
          <select 
            onChange={(e) => loadAnalytics(e.target.value)}
            className="filter-select"
            defaultValue="30d"
          >
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
          </select>
          <button className="refresh-btn" onClick={() => loadAnalytics()}>
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Carregando analytics...</div>}
      {error && <div className="error-message">Erro: {error}</div>}
      
      {analytics && (
        <div className="analytics-grid">
          <div className="chart-card">
            <h4>Novos Usuários ({analytics.period})</h4>
            <div className="chart-placeholder">
              <Users size={48} />
              <div className="chart-number">{analytics.newUsers}</div>
              <span>usuários registrados</span>
            </div>
          </div>
          
          <div className="chart-card">
            <h4>Receita Estimada</h4>
            <div className="chart-placeholder">
              <DollarSign size={48} />
              <div className="chart-number">{formatCurrency(analytics.totalRevenue)}</div>
              <span>em assinaturas premium</span>
            </div>
          </div>
          
          <div className="chart-card">
            <h4>Sessões de Leitura</h4>
            <div className="chart-placeholder">
              <BookOpen size={48} />
              <div className="chart-number">{analytics.readingSessions}</div>
              <span>sessões no período</span>
            </div>
          </div>
          
          <div className="chart-card">
            <h4>Distribuição de Planos</h4>
            <div className="chart-placeholder">
              <PieChart size={48} />
              <div className="plan-distribution">
                {analytics.planDistribution.map((plan: any) => (
                  <div key={plan.planType} className="plan-item">
                    <span className="plan-label">{translateStatus(plan.planType)}:</span>
                    <span className="plan-count">{plan.count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderLogs = () => (
    <div className="logs-content">
      <div className="content-header">
        <h3>Logs do Sistema</h3>
        <div className="header-actions">
          <button className="refresh-btn" onClick={() => loadLogs(1)}>
            <RefreshCw size={16} />
            Atualizar
          </button>
        </div>
      </div>

      {loading && <div className="loading-spinner">Carregando logs...</div>}
      {error && <div className="error-message">Erro: {error}</div>}
      
      {logs && (
        <>
          <div className="table-container">
            <table className="admin-table logs-table">
              <thead>
                <tr>
                  <th>Data/Hora</th>
                  <th>Admin</th>
                  <th>Ação</th>
                  <th>Alvo</th>
                  <th>IP</th>
                  <th>Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {logs.logs.map((log: any) => (
                  <tr key={log.id}>
                    <td className="timestamp-cell">
                      {formatDate(log.timestamp)}
                    </td>
                    <td>
                      <div className="admin-info">
                        <div className="admin-name">{log.adminName}</div>
                        <div className="admin-id">ID: {log.adminId.slice(0, 8)}</div>
                      </div>
                    </td>
                    <td>
                      <span className="action-badge">
                        {translateAction(log.action)}
                      </span>
                    </td>
                    <td>
                      {log.targetId && (
                        <div className="target-info">
                          <div className="target-type">{log.targetType}</div>
                          <div className="target-id">{log.targetId.slice(0, 8)}</div>
                        </div>
                      )}
                    </td>
                    <td className="ip-cell">{log.ipAddress}</td>
                    <td>
                      {log.details && (
                        <button 
                          className="details-btn"
                          title="Ver detalhes"
                        >
                          <MoreHorizontal size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="pagination">
            <button 
              disabled={logs.pagination.page === 1}
              onClick={() => loadLogs(logs.pagination.page - 1)}
            >
              Anterior
            </button>
            <span>
              Página {logs.pagination.page} de {logs.pagination.totalPages}
            </span>
            <button 
              disabled={logs.pagination.page === logs.pagination.totalPages}
              onClick={() => loadLogs(logs.pagination.page + 1)}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );

  const renderBooks = () => (
    <div className="books-content">
      <div className="content-header">
        <h3>Gerenciar Livros</h3>
        <div className="header-actions">
          <button className="action-btn primary">
            <Plus size={16} />
            Adicionar Livro
          </button>
        </div>
      </div>
      <div className="info-message">
        <BookOpen size={20} />
        <span>Os livros estão sendo gerenciados via dados mock. Funcionalidade de administração será implementada na próxima fase.</span>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="settings-content">
      <h3>Configurações do Sistema</h3>
      <div className="info-message">
        <Settings size={20} />
        <span>Painel de configurações será implementado na próxima fase.</span>
      </div>
    </div>
  );

  // Modal de edição de usuário
  const EditUserModal = () => {
    if (!showEditModal || !editingUser) return null;

    const [formData, setFormData] = useState({
      name: editingUser.name,
      phone: editingUser.phone,
      level: editingUser.level,
      points: editingUser.points,
      balance: editingUser.balance,
      planType: editingUser.planType,
      isSuspended: editingUser.isSuspended,
      suspendedReason: editingUser.suspendedReason || ''
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      handleSaveUser(formData);
    };

    return (
      <div className="modal-overlay">
        <div className="modal-content">
          <div className="modal-header">
            <h3>Editar Usuário</h3>
            <button onClick={() => setShowEditModal(false)}>
              <X size={20} />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="modal-form">
            <div className="form-row">
              <div className="form-group">
                <label>Nome</label>
                <input 
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div className="form-group">
                <label>Telefone</label>
                <input 
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Level</label>
                <input 
                  type="number"
                  value={formData.level}
                  onChange={(e) => setFormData({...formData, level: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Pontos</label>
                <input 
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({...formData, points: parseInt(e.target.value)})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Saldo (centavos)</label>
                <input 
                  type="number"
                  value={formData.balance}
                  onChange={(e) => setFormData({...formData, balance: parseInt(e.target.value)})}
                />
              </div>
              <div className="form-group">
                <label>Plano</label>
                <select 
                  value={formData.planType}
                  onChange={(e) => setFormData({...formData, planType: e.target.value})}
                >
                  <option value="free">Gratuito</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>
                <input 
                  type="checkbox"
                  checked={formData.isSuspended}
                  onChange={(e) => setFormData({...formData, isSuspended: e.target.checked})}
                />
                Usuário suspenso
              </label>
            </div>

            {formData.isSuspended && (
              <div className="form-group">
                <label>Motivo da suspensão</label>
                <textarea 
                  value={formData.suspendedReason}
                  onChange={(e) => setFormData({...formData, suspendedReason: e.target.value})}
                />
              </div>
            )}

            <div className="modal-actions">
              <button type="button" onClick={() => setShowEditModal(false)}>
                Cancelar
              </button>
              <button type="submit" className="primary">
                Salvar
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

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
            className={`nav-btn ${activeTab === 'logs' ? 'active' : ''}`}
            onClick={() => setActiveTab('logs')}
          >
            <Activity size={18} />
            Logs
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
          {activeTab === 'logs' && renderLogs()}
          {activeTab === 'settings' && renderSettings()}
        </div>
      </div>

      {/* Modal de edição */}
      <EditUserModal />

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
          font-size: 16px;
        }
        
        /* Navigation */
        .admin-nav {
          display: flex;
          gap: 8px;
          margin-bottom: 32px;
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
          border: none;
          background: transparent;
          color: #64748b;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-size: 14px;
        }
        
        .nav-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }
        
        .nav-btn.active {
          background: #dc2626;
          color: white;
          box-shadow: 0 2px 8px rgba(220, 38, 38, 0.3);
        }
        
        /* Content Area */
        .admin-content {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
          min-height: 600px;
        }
        
        /* Stats Grid */
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 40px;
        }
        
        .stat-card {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          padding: 24px;
          display: flex;
          align-items: center;
          gap: 20px;
          transition: all 0.3s ease;
        }
        
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
        }
        
        .stat-icon {
          width: 60px;
          height: 60px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .users-card .stat-icon { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
        .books-card .stat-icon { background: linear-gradient(135deg, #10b981, #047857); }
        .withdrawals-card .stat-icon { background: linear-gradient(135deg, #f59e0b, #d97706); }
        .revenue-card .stat-icon { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
        
        .stat-info h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .stat-number {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 8px;
        }
        
        .stat-details {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .detail-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
        }
        
        .detail-label {
          color: #64748b;
          font-weight: 500;
        }
        
        .detail-value {
          color: #1e293b;
          font-weight: 600;
        }
        
        .detail-item.urgent {
          color: #dc2626;
        }
        
        .detail-item.positive {
          color: #059669;
        }
        
        /* Quick Actions */
        .quick-actions {
          margin-bottom: 40px;
        }
        
        .quick-actions h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
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
          transition: all 0.2s ease;
          text-decoration: none;
          color: #334155;
          font-weight: 500;
        }
        
        .action-btn:hover {
          background: #f1f5f9;
          border-color: #cbd5e1;
          transform: translateY(-1px);
        }
        
        /* Content Headers */
        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid #e2e8f0;
        }
        
        .content-header h3 {
          margin: 0;
          font-size: 24px;
          font-weight: 600;
          color: #1e293b;
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
          z-index: 1;
        }
        
        .search-box input {
          padding: 8px 12px 8px 40px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          width: 250px;
        }
        
        .filter-select {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          background: white;
        }
        
        .refresh-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .refresh-btn:hover {
          background: #f1f5f9;
        }
        
        /* Tables */
        .table-container {
          overflow-x: auto;
          margin-bottom: 24px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        
        .admin-table {
          width: 100%;
          border-collapse: collapse;
          background: white;
        }
        
        .admin-table th {
          background: #f8fafc;
          padding: 16px;
          text-align: left;
          font-weight: 600;
          color: #374151;
          border-bottom: 1px solid #e2e8f0;
          font-size: 14px;
        }
        
        .admin-table td {
          padding: 16px;
          border-bottom: 1px solid #f1f5f9;
          font-size: 14px;
        }
        
        .admin-table tr:last-child td {
          border-bottom: none;
        }
        
        .admin-table tr:hover {
          background: #f9fafb;
        }
        
        /* User Info */
        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          background: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          color: #64748b;
        }
        
        .user-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        .user-id, .user-email {
          font-size: 12px;
          color: #64748b;
        }
        
        /* Status Badges */
        .status-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          color: white;
        }
        
        .action-badge {
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          background: #f1f5f9;
          color: #64748b;
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
        
        /* Pagination */
        .pagination {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 16px;
          margin-top: 24px;
        }
        
        .pagination button {
          padding: 8px 16px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          background: white;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .pagination button:hover:not(:disabled) {
          background: #f1f5f9;
        }
        
        .pagination button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        /* Loading & Error */
        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px;
          color: #64748b;
          font-size: 16px;
        }
        
        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 16px;
          border: 1px solid #fecaca;
        }
        
        .info-message {
          background: #dbeafe;
          color: #1d4ed8;
          padding: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          border: 1px solid #bfdbfe;
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
          padding: 20px 0;
        }
        
        .chart-number {
          font-size: 24px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .plan-distribution {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: flex-start;
        }
        
        .plan-item {
          display: flex;
          justify-content: space-between;
          width: 100%;
        }
        
        .plan-label {
          color: #64748b;
          font-weight: 500;
        }
        
        .plan-count {
          color: #1e293b;
          font-weight: 600;
        }
        
        /* Logs Table */
        .logs-table .timestamp-cell {
          font-family: monospace;
          font-size: 12px;
          color: #64748b;
        }
        
        .admin-info .admin-name {
          font-weight: 600;
          color: #1e293b;
        }
        
        .admin-info .admin-id {
          font-size: 12px;
          color: #64748b;
          font-family: monospace;
        }
        
        .target-info .target-type {
          font-weight: 500;
          color: #1e293b;
          text-transform: capitalize;
        }
        
        .target-info .target-id {
          font-size: 12px;
          color: #64748b;
          font-family: monospace;
        }
        
        .ip-cell {
          font-family: monospace;
          font-size: 12px;
          color: #64748b;
        }
        
        .details-btn {
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          border-radius: 4px;
          padding: 4px;
          cursor: pointer;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .details-btn:hover {
          background: #e2e8f0;
        }
        
        /* Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        
        .modal-content {
          background: white;
          border-radius: 16px;
          padding: 0;
          max-width: 600px;
          width: 90%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
        }
        
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 24px 24px 0 24px;
          margin-bottom: 24px;
        }
        
        .modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .modal-header button {
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.2s ease;
        }
        
        .modal-header button:hover {
          background: #f1f5f9;
        }
        
        .modal-form {
          padding: 0 24px 24px 24px;
        }
        
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 14px;
        }
        
        .form-group input,
        .form-group select,
        .form-group textarea {
          padding: 8px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          outline: none;
          border-color: #dc2626;
          box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
        }
        
        .form-group textarea {
          resize: vertical;
          min-height: 80px;
        }
        
        .form-group label input[type="checkbox"] {
          width: auto;
          margin-right: 8px;
        }
        
        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid #e2e8f0;
        }
        
        .modal-actions button {
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .modal-actions button[type="button"] {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #64748b;
        }
        
        .modal-actions button[type="button"]:hover {
          background: #f1f5f9;
        }
        
        .modal-actions button.primary {
          background: #dc2626;
          border: 1px solid #dc2626;
          color: white;
        }
        
        .modal-actions button.primary:hover {
          background: #b91c1c;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
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
            grid-template-columns: 1fr;
          }
          
          .content-header {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .header-actions {
            width: 100%;
            justify-content: space-between;
          }
          
          .search-box input {
            width: 200px;
          }
          
          .form-row {
            grid-template-columns: 1fr;
          }
          
          .modal-content {
            width: 95%;
            margin: 20px;
          }
        }
        
        /* Special cells */
        .amount-cell {
          font-weight: 600;
          color: #059669;
        }
        
        .pix-info {
          font-family: monospace;
        }
        
        .pix-key {
          font-weight: 500;
          color: #1e293b;
        }
        
        .pix-type {
          font-size: 12px;
          color: #64748b;
          text-transform: uppercase;
        }
        
        /* Activity items */
        .recent-activity {
          margin-top: 40px;
        }
        
        .recent-activity h3 {
          margin: 0 0 20px 0;
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
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
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }
        
        .activity-icon {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }
        
        .user-activity { background: #3b82f6; }
        .revenue-activity { background: #059669; }
        
        .activity-content {
          flex: 1;
        }
        
        .activity-text {
          display: block;
          font-weight: 500;
          color: #1e293b;
          margin-bottom: 4px;
        }
        
        .activity-time {
          font-size: 12px;
          color: #64748b;
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;