// src/components/Header.tsx - VERSÃO LIMPA
import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { 
  User, Settings, LogOut, Menu, X, Bell, 
  Star, Zap, Award, BookOpen, TrendingUp 
} from 'lucide-react';

// Constantes de níveis locais
const LEVELS = [
  { level: 0, name: 'Iniciante', color: '#94a3b8', minPoints: 0 },
  { level: 1, name: 'Leitor', color: '#3b82f6', minPoints: 1000 },
  { level: 2, name: 'Avaliador', color: '#10b981', minPoints: 2500 },
  { level: 3, name: 'Crítico', color: '#f59e0b', minPoints: 5000 },
  { level: 4, name: 'Especialista', color: '#ef4444', minPoints: 10000 },
  { level: 5, name: 'Mestre', color: '#8b5cf6', minPoints: 20000 },
];

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const getLevelInfoSafe = (level: number) => {
    return LEVELS.find(l => l.level === level) || LEVELS[0];
  };

  const getNextLevelInfoSafe = (level: number) => {
    return LEVELS.find(l => l.level === level + 1) || LEVELS[LEVELS.length - 1];
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  if (!user) return null;

  const currentLevel = getLevelInfoSafe(user.level);
  const nextLevel = getNextLevelInfoSafe(user.level);
  const progressToNext = user.level < LEVELS.length - 1 
    ? ((user.points % 1000) / 1000) * 100 
    : 100;

  return (
    <>
      <header className="header">
        <div className="header-container">
          <div className="header-left">
            <Link to="/dashboard" className="header-logo">
              <BookOpen className="w-8 h-8" />
              <span className="logo-text">BetaReader</span>
            </Link>

            <nav className="desktop-nav">
              <Link 
                to="/dashboard" 
                className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
              >
                Dashboard
              </Link>
              <Link 
                to="/books" 
                className={`nav-link ${isActive('/books') ? 'active' : ''}`}
              >
                Livros
              </Link>
              <Link 
                to="/wallet" 
                className={`nav-link ${isActive('/wallet') ? 'active' : ''}`}
              >
                Carteira
              </Link>
            </nav>
          </div>

          <div className="header-right">
            <div className="user-stats">
              <div className="stat-item">
                <Zap className="w-4 h-4 text-blue-500" />
                <span>{user.points}</span>
              </div>
              <div className="stat-item">
                <Award className="w-4 h-4 text-yellow-500" />
                <span 
                  className="level-badge" 
                  style={{ backgroundColor: currentLevel.color }}
                >
                  Nv. {user.level}
                </span>
              </div>
              <div className="stat-item">
                <span className="balance">{formatCurrency(user.balance)}</span>
              </div>
            </div>

            <button className="notification-btn" aria-label="Notificações">
              <Bell className="w-5 h-5" />
              <span className="notification-badge">3</span>
            </button>

            <div className="user-menu">
              <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="user-avatar"
                aria-label="Menu do usuário"
              >
                {user.profileImage ? (
                  <img src={user.profileImage} alt={user.name} />
                ) : (
                  <User className="w-5 h-5" />
                )}
              </button>

              {isProfileOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-header">
                    <div className="user-info">
                      <strong>{user.name}</strong>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <div className="level-progress">
                      <div className="level-info">
                        <span style={{ color: currentLevel.color }}>
                          {currentLevel.name}
                        </span>
                        {user.level < LEVELS.length - 1 && (
                          <span className="next-level">
                            → {nextLevel.name}
                          </span>
                        )}
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${progressToNext}%`,
                            backgroundColor: currentLevel.color 
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <Link to="/profile" className="dropdown-item">
                    <User className="w-4 h-4" />
                    Perfil
                  </Link>
                  <Link to="/settings" className="dropdown-item">
                    <Settings className="w-4 h-4" />
                    Configurações
                  </Link>
                  
                  {user.isAdmin && (
                    <>
                      <div className="dropdown-divider" />
                      <Link to="/admin" className="dropdown-item admin">
                        <TrendingUp className="w-4 h-4" />
                        Painel Admin
                      </Link>
                    </>
                  )}

                  <div className="dropdown-divider" />
                  <button onClick={handleLogout} className="dropdown-item logout">
                    <LogOut className="w-4 h-4" />
                    Sair
                  </button>
                </div>
              )}
            </div>

            <button 
              className="mobile-menu-btn"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Menu"
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="mobile-menu">
            <Link to="/dashboard" className="mobile-nav-link">Dashboard</Link>
            <Link to="/books" className="mobile-nav-link">Livros</Link>
            <Link to="/wallet" className="mobile-nav-link">Carteira</Link>
            <Link to="/profile" className="mobile-nav-link">Perfil</Link>
            <Link to="/settings" className="mobile-nav-link">Configurações</Link>
            {user.isAdmin && (
              <Link to="/admin" className="mobile-nav-link">Painel Admin</Link>
            )}
            <button onClick={handleLogout} className="mobile-nav-link logout">
              Sair
            </button>
          </div>
        )}
      </header>

      <style>{`
        .header {
          background: white;
          border-bottom: 1px solid #e5e7eb;
          position: sticky;
          top: 0;
          z-index: 50;
        }

        .header-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 32px;
        }

        .header-logo {
          display: flex;
          align-items: center;
          gap: 8px;
          text-decoration: none;
          color: #1f2937;
          font-weight: bold;
          font-size: 1.25rem;
        }

        .logo-text {
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .desktop-nav {
          display: flex;
          gap: 24px;
        }

        .nav-link {
          text-decoration: none;
          color: #6b7280;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: 6px;
          transition: all 0.2s;
        }

        .nav-link:hover {
          color: #3b82f6;
          background: #eff6ff;
        }

        .nav-link.active {
          color: #3b82f6;
          background: #eff6ff;
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .user-stats {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .stat-item {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 0.9rem;
          font-weight: 500;
        }

        .level-badge {
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
        }

        .balance {
          color: #059669;
          font-weight: 600;
        }

        .notification-btn {
          position: relative;
          background: none;
          border: none;
          padding: 8px;
          border-radius: 50%;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .notification-btn:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .notification-badge {
          position: absolute;
          top: 4px;
          right: 4px;
          background: #ef4444;
          color: white;
          font-size: 0.7rem;
          padding: 2px 5px;
          border-radius: 10px;
          min-width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .user-menu {
          position: relative;
        }

        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: #f3f4f6;
          border: 2px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .user-avatar:hover {
          border-color: #3b82f6;
        }

        .user-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          margin-top: 8px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          min-width: 250px;
          z-index: 50;
        }

        .dropdown-header {
          padding: 16px;
          border-bottom: 1px solid #f3f4f6;
        }

        .user-info strong {
          display: block;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .user-email {
          color: #6b7280;
          font-size: 0.9rem;
        }

        .level-progress {
          margin-top: 12px;
        }

        .level-info {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
          font-size: 0.9rem;
        }

        .next-level {
          color: #6b7280;
        }

        .progress-bar {
          width: 100%;
          height: 4px;
          background: #f3f4f6;
          border-radius: 2px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          transition: width 0.3s ease;
        }

        .dropdown-divider {
          height: 1px;
          background: #f3f4f6;
          margin: 8px 0;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          text-decoration: none;
          color: #374151;
          transition: all 0.2s;
          background: none;
          border: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
          font-size: 0.9rem;
        }

        .dropdown-item:hover {
          background: #f9fafb;
        }

        .dropdown-item.admin {
          color: #7c3aed;
        }

        .dropdown-item.logout {
          color: #dc2626;
        }

        .mobile-menu-btn {
          display: none;
          background: none;
          border: none;
          padding: 8px;
          cursor: pointer;
          color: #6b7280;
        }

        .mobile-menu {
          display: none;
          background: white;
          border-top: 1px solid #e5e7eb;
          padding: 16px;
        }

        .mobile-nav-link {
          display: block;
          padding: 12px 0;
          text-decoration: none;
          color: #374151;
          border-bottom: 1px solid #f3f4f6;
          background: none;
          border-left: none;
          border-right: none;
          border-top: none;
          width: 100%;
          text-align: left;
          cursor: pointer;
        }

        .mobile-nav-link.logout {
          color: #dc2626;
        }

        @media (max-width: 768px) {
          .desktop-nav,
          .user-stats {
            display: none;
          }

          .mobile-menu-btn {
            display: block;
          }

          .mobile-menu {
            display: block;
          }

          .header-container {
            padding: 0 16px;
          }
        }
      `}</style>
    </>
  );
};

export default Header;