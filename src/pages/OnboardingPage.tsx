// src/pages/OnboardingPage.tsx
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Target, DollarSign, Sparkles } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const { user, completeOnboarding, isLoading } = useAuth();
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
      try {
        await completeOnboarding({
          commitment: onboardingData.commitment as 'committed' | 'curious',
          incomeRange: onboardingData.incomeRange as 'low' | 'medium' | 'high' | 'unemployed'
        });
      } catch (error) {
        console.error('Erro ao completar onboarding:', error);
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
          className={`option-card ${onboardingData.incomeRange === 'unemployed' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'unemployed' }))}
        >
          <div className="option-icon">💼</div>
          <div className="option-content">
            <h3>Desempregado(a)</h3>
            <p>Sem renda atual</p>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.incomeRange === 'low' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'low' }))}
        >
          <div className="option-icon">💵</div>
          <div className="option-content">
            <h3>Até R$ 2.000</h3>
            <p>Renda baixa</p>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.incomeRange === 'medium' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'medium' }))}
        >
          <div className="option-icon">💶</div>
          <div className="option-content">
            <h3>R$ 2.000 - R$ 8.000</h3>
            <p>Renda média</p>
          </div>
        </button>
        
        <button
          className={`option-card ${onboardingData.incomeRange === 'high' ? 'selected' : ''}`}
          onClick={() => setOnboardingData(prev => ({ ...prev, incomeRange: 'high' }))}
        >
          <div className="option-icon">💰</div>
          <div className="option-content">
            <h3>Acima de R$ 8.000</h3>
            <p>Renda alta</p>
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
          disabled={!onboardingData.incomeRange || isLoading}
        >
          {isLoading ? 'Salvando...' : 'Começar'}
          <Sparkles size={16} />
        </button>
      </div>
    </div>
  );

  return (
    <div className="onboarding-container">
      <div className="onboarding-content">
        <div className="onboarding-header">
          <h1>Bem-vindo ao Beta Reader!</h1>
          <div className="progress-bar">
            <div 
              className="progress-fill"
              style={{ width: `${(currentStep / 2) * 100}%` }}
            />
          </div>
          <p className="step-indicator">Passo {currentStep} de 2</p>
        </div>
        
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
      </div>
    </div>
  );
};

export default OnboardingPage;