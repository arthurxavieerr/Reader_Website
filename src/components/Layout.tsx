// src/components/Layout.tsx - CORRIGIDO
import React, { useState } from 'react';
import Header from './Header';
import ConfigModal from './ConfigModal';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  const handleOpenConfig = () => {
    setIsConfigModalOpen(true);
  };

  const handleCloseConfig = () => {
    setIsConfigModalOpen(false);
  };

  return (
    <div className="layout">
      <Header />
      
      <main className="main-content">
        {children}
      </main>
      
      <ConfigModal 
        isOpen={isConfigModalOpen}
        onClose={handleCloseConfig}
      />

      <style>{`
        .layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .main-content {
          flex: 1;
        }
      `}</style>
    </div>
  );
};

export default Layout;