// src/components/Layout.tsx
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import BottomNavigation from './BottomNavigation';
import ConfigModal from './ConfigModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="layout">
      <Header onOpenConfig={() => setIsConfigModalOpen(true)} />
      
      <main className="main-content">
        {children}
      </main>
      
      <BottomNavigation currentPath={location.pathname} />
      
      {isConfigModalOpen && (
        <ConfigModal onClose={() => setIsConfigModalOpen(false)} />
      )}
      
      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        .main-content {
          flex: 1;
          padding-bottom: 80px;
          background-color: var(--color-surface);
        }
      `}</style>
    </div>
  );
};

export default Layout;