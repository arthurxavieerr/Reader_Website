// src/components/BottomNavigation.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Book, Users, CreditCard } from 'lucide-react';

interface BottomNavigationProps {
  currentPath: string;
}

const BottomNavigation: React.FC<BottomNavigationProps> = ({ currentPath }) => {
  const navItems = [
    {
      path: '/dashboard',
      icon: Home,
      label: 'Home',
    },
    {
      path: '/books',
      icon: Book,
      label: 'Livros',
    },
    {
      path: '/community',
      icon: Users,
      label: 'Comunidade',
    },
    {
      path: '/withdraw',
      icon: CreditCard,
      label: 'Saque',
    },
  ];

  return (
    <nav className="bottom-navigation">
      <div className="nav-content">
        {navItems.map(({ path, icon: Icon, label }) => (
          <Link
            key={path}
            to={path}
            className={`nav-item ${currentPath === path ? 'active' : ''}`}
          >
            <Icon size={20} />
            <span className="nav-label">{label}</span>
          </Link>
        ))}
      </div>
      
      <style>{`
        .bottom-navigation {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          background-color: var(--color-background);
          border-top: 1px solid var(--color-border-light);
          padding: var(--spacing-sm) 0;
          z-index: 100;
        }
        
        .nav-content {
          display: flex;
          justify-content: space-around;
          align-items: center;
          max-width: 1200px;
          margin: 0 auto;
        }
        
        .nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          text-decoration: none;
          color: var(--color-text-secondary);
          transition: color var(--transition-fast);
          min-height: 48px;
          min-width: 64px;
          border-radius: var(--radius-md);
        }
        
        .nav-item.active {
          color: var(--color-primary);
          background-color: rgba(137, 90, 237, 0.1);
        }
        
        .nav-item:hover {
          color: var(--color-primary);
        }
        
        .nav-label {
          font-size: var(--text-xs);
          font-weight: var(--font-medium);
        }
      `}</style>
    </nav>
  );
};

export default BottomNavigation;