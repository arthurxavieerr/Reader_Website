// src/pages/OnboardingPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Target, DollarSign, Sparkles } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding, loading } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [onboardingData, setOnboardingData] = useState({
    commitment: '' as 'committed' | 'curious' | '',
    incomeRange: '' as 'low' | 'medium' | 'high' | 'unemployed' | ''
  });

  if (!user) return null;

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    if (onboardingData.commitment && onboardingData.incomeRange) {
      if (onboardingData.commitment && onboardingData.incomeRange) {
        await completeOnboarding({
            commitment: onboardingData.commitment,
            incomeRange: onboardingData.incomeRange
        });
        }
    }
  };

  const renderStep1 = () => (
    <div className="onboarding-step">
      <div className="step-icon">
        <Target size={32} />
      </div>
      
      <h2 className="step-title">
        Sua intenção é se comprometer e realmente trabalhar como um beta-reader?
      </h2>
      
      <p className="step-description">
        Queremos entender seu nível de dedicação
      </p>
      
      <div className="options-container">
        <button
          className={`option-card ${onboardingData.commitment === 'committed' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, commitment: 'committed' }))}
        >
          <div className="option-icon">✓</div>
          <div className="option-content">
            <h3>Sim, estou comprometido(a)</h3>
            <p>Quero trabalhar seriamente como beta reader</p>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.commitment === 'curious' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, commitment: 'curious' }))}
        >
          <div className="option-icon">👀</div>
          <div className="option-content">
            <h3>Não, apenas curiosidade</h3>
            <p>Quero explorar a plataforma primeiro</p>
          </div>
        </button>
      </div>
      
      <div className="step-actions">
        <button 
          className="btn btn-primary btn-lg"
          onClick={handleNext}
          disabled={!onboardingData.commitment}
        >
          Continuar
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="onboarding-step">
      <div className="step-icon">
        <DollarSign size={32} />
      </div>
      
      <h2 className="step-title">
        Qual sua faixa de renda mensal?
      </h2>
      
      <p className="step-description">
        Isso nos ajuda a personalizar sua experiência
      </p>
      
      <div className="options-container">
        <button
          className={`option-card ${onboardingData.incomeRange === 'low' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'low' }))}
        >
          <div className="option-icon">📊</div>
          <div className="option-content">
            <h3>R$ 1.000 - R$ 10.000</h3>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.incomeRange === 'medium' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'medium' }))}
        >
          <div className="option-icon">📈</div>
          <div className="option-content">
            <h3>R$ 10.000 - R$ 50.000</h3>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.incomeRange === 'high' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'high' }))}
        >
          <div className="option-icon">💎</div>
          <div className="option-content">
            <h3>R$ 100.000+</h3>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.incomeRange === 'unemployed' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'unemployed' }))}
        >
          <div className="option-icon">🔍</div>
          <div className="option-content">
            <h3>Desempregado(a)</h3>
          </div>
        </button>
      </div>
      
      <div className="step-actions">
        <button 
          className="btn btn-secondary"
          onClick={handleBack}
        >
          Voltar
        </button>
        <button 
          className="btn btn-primary btn-lg"
          onClick={handleFinish}
          disabled={!onboardingData.incomeRange || loading}
        >
          {loading ? 'Finalizando...' : 'Finalizar'}
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="onboarding-page">
      <div className="onboarding-background" />
      
      <div className="onboarding-container">
        <div className="onboarding-header">
          <h1 className="welcome-title">
            📚 Bem-vindo, {user.name}! ✨
          </h1>
          <p className="welcome-subtitle">
            Vamos configurar seu perfil de beta reader
          </p>
        </div>
        
        <div className="progress-indicator">
          <div className="progress-dots">
            <div className={`progress-dot ${currentStep >= 1 ? 'active' : ''}`} />
            <div className={`progress-dot ${currentStep >= 2 ? 'active' : ''}`} />
          </div>
        </div>
        
        <div className="onboarding-content">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
        </div>
        
        <div className="onboarding-footer">
          <p className="footer-text">
            🔒 Aguarde ser liberado para sua conta
          </p>
        </div>
      </div>
      
      <style>{`
        .onboarding-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          position: relative;
          overflow: hidden;
        }
        
        .onboarding-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="50" cy="50" r="1" fill="white" opacity="0.1"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
          pointer-events: none;
        }
        
        .onboarding-container {
          background-color: var(--color-background);
          border-radius: var(--radius-xl);
          padding: var(--spacing-2xl);
          max-width: 500px;
          width: 100%;
          box-shadow: var(--shadow-xl);
          position: relative;
          z-index: 1;
        }
        
        .onboarding-header {
          text-align: center;
          margin-bottom: var(--spacing-xl);
        }
        
        .welcome-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          margin-bottom: var(--spacing-sm);
          color: var(--color-text-primary);
        }
        
        .welcome-subtitle {
          color: var(--color-text-secondary);
          margin: 0;
        }
        
        .progress-indicator {
          margin-bottom: var(--spacing-xl);
        }
        
        .onboarding-content {
          margin-bottom: var(--spacing-xl);
        }
        
        .onboarding-step {
          text-align: center;
        }
        
        .step-icon {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto var(--spacing-lg);
        }
        
        .step-title {
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          margin-bottom: var(--spacing-md);
          color: var(--color-text-primary);
          line-height: 1.3;
        }
        
        .step-description {
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xl);
        }
        
        .options-container {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        
        .option-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background: none;
          border: 2px solid var(--color-border);
          border-radius: var(--radius-lg);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
        }
        
        .option-card:hover {
          border-color: var(--color-primary);
          background-color: rgba(137, 90, 237, 0.05);
        }
        
        .option-card.selected {
          border-color: var(--color-primary);
          background-color: rgba(137, 90, 237, 0.1);
        }
        
        .option-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-xl);
          flex-shrink: 0;
        }
        
        .option-content h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          color: var(--color-text-primary);
        }
        
        .option-content p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .step-actions {
          display: flex;
          gap: var(--spacing-md);
          justify-content: center;
        }
        
        .step-actions .btn {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
        }
        
        .onboarding-footer {
          text-align: center;
          padding-top: var(--spacing-lg);
          border-top: 1px solid var(--color-border-light);
        }
        
        .footer-text {
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .onboarding-page {
            padding: var(--spacing-md);
          }
          
          .onboarding-container {
            padding: var(--spacing-xl);
          }
          
          .step-title {
            font-size: var(--text-lg);
          }
          
          .step-actions {
            flex-direction: column;
          }
          
          .option-card {
            padding: var(--spacing-md);
          }
          
          .option-icon {
            width: 40px;
            height: 40px;
            font-size: var(--text-lg);
          }
        }
      `}</style>
    </div>
  );
};

export default OnboardingPage;