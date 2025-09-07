// src/components/Header.tsx
import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { LEVELS } from '../types';
import { Settings } from 'lucide-react';

interface HeaderProps {
  onOpenConfig: () => void;
}

const Header: React.FC<HeaderProps> = ({ onOpenConfig }) => {
  const { user } = useAuth();

  if (!user) return null;

  const currentLevel = LEVELS.find(level => level.level === user.level) || LEVELS[0];
  const nextLevel = LEVELS.find(level => level.level === user.level + 1);
  const progressPercentage = nextLevel 
    ? ((user.points - currentLevel.pointsRequired) / (nextLevel.pointsRequired - currentLevel.pointsRequired)) * 100
    : 100;

  return (
    <header className="header">
      <div className="header-content">
        <div className="user-info">
          <div className="avatar">
            {user.profileImage ? (
              <img 
                src={user.profileImage} 
                alt={user.name} 
                style={{ 
                  width: '100%', 
                  height: '100%', 
                  borderRadius: '50%', 
                  objectFit: 'cover' 
                }} 
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div className="user-details">
            <h3 className="user-name">{user.name}</h3>
            <div className="level-info">
              <span className={`level-badge level-${currentLevel.name.toLowerCase()}`}>
                {currentLevel.name}
              </span>
              {nextLevel && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${Math.max(0, Math.min(100, progressPercentage))}%` }}
                    />
                  </div>
                  <span className="progress-text">
                    {user.points}/{nextLevel.pointsRequired}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="icon-button"
            onClick={onOpenConfig}
            aria-label="Configurações"
          >
            <Settings size={20} />
          </button>
        </div>
      </div>
      
      <style>{`
        .header {
          background-color: var(--color-background);
          border-bottom: 1px solid var(--color-border-light);
          padding: var(--spacing-md) var(--spacing-lg);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          font-size: var(--text-lg);
          overflow: hidden;
        }
        
        .user-details {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .user-name {
          font-size: var(--text-lg);
          font-weight: var(--font-semibold);
          margin: 0;
        }
        
        .level-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .progress-container {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .progress-bar {
          width: 80px;
          height: 4px;
          background-color: var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        
        .progress-fill {
          height: 100%;
          background-color: var(--color-primary);
          transition: width var(--transition-normal);
        }
        
        .progress-text {
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          white-space: nowrap;
        }
        
        .header-actions {
          display: flex;
          gap: var(--spacing-sm);
        }
        
        .icon-button {
          background: none;
          border: none;
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: background-color var(--transition-fast);
          color: var(--color-text-secondary);
        }
        
        .icon-button:hover {
          background-color: var(--color-surface);
          color: var(--color-text-primary);
        }
        
        @media (max-width: 768px) {
          .header {
            padding: var(--spacing-sm) var(--spacing-md);
          }
          
          .progress-bar {
            width: 60px;
          }
          
          .user-name {
            font-size: var(--text-base);
          }
          
          .avatar {
            width: 40px;
            height: 40px;
            font-size: var(--text-base);
          }
        }
      `}</style>
    </header>
  );
};

export default Header;