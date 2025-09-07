// src/pages/RegisterPage.tsx - CORRIGIDO
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Eye, EyeOff, Mail, Lock, User, Phone, BookOpen } from 'lucide-react';

const RegisterPage: React.FC = () => {
  const { register, isLoading, error } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpar erro quando usuário começar a digitar
    if (formError) setFormError(null);
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      return 'Nome é obrigatório';
    }
    if (!formData.email.trim()) {
      return 'Email é obrigatório';
    }
    if (!formData.phone.trim()) {
      return 'Telefone é obrigatório';
    }
    if (!formData.password) {
      return 'Senha é obrigatória';
    }
    if (formData.password.length < 6) {
      return 'Senha deve ter pelo menos 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Senhas não coincidem';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      await register({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
      });
      navigate('/onboarding');
    } catch (err: any) {
      setFormError(err.message || 'Erro no cadastro');
    }
  };

  return (
    <div className="register-page">
      <div className="register-container">
        <div className="register-form-wrapper">
          {/* Logo */}
          <div className="logo-section">
            <div className="logo">
              <BookOpen className="w-8 h-8 text-blue-600" />
              <span className="logo-text">BetaReader</span>
            </div>
            <p className="subtitle">Crie sua conta gratuitamente</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="register-form">
            {(formError || error) && (
              <div className="error-message">
                {formError || error}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Nome Completo</label>
              <div className="input-group">
                <User className="w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Seu nome completo"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-group">
                <Mail className="w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="seu@email.com"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="phone">Telefone</label>
              <div className="input-group">
                <Phone className="w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="input-group">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  disabled={isLoading}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirmar Senha</label>
              <div className="input-group">
                <Lock className="w-5 h-5 text-gray-400" />
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  placeholder="Confirme sua senha"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="password-toggle"
                  disabled={isLoading}
                  aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="register-button"
            >
              {isLoading ? 'Criando conta...' : 'Criar Conta'}
            </button>
          </form>

          {/* Footer */}
          <div className="register-footer">
            <p>
              Já tem uma conta?{' '}
              <Link to="/login" className="login-link">
                Faça login aqui
              </Link>
            </p>
            <Link to="/" className="back-home">
              ← Voltar ao início
            </Link>
          </div>
        </div>
      </div>

      <style>{`
        .register-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .register-container {
          width: 100%;
          max-width: 450px;
        }

        .register-form-wrapper {
          background: white;
          border-radius: 16px;
          padding: 32px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
        }

        .logo-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .logo {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .logo-text {
          font-size: 1.5rem;
          font-weight: bold;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .subtitle {
          color: #6b7280;
          font-size: 1rem;
        }

        .register-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .error-message {
          background: #fee2e2;
          color: #dc2626;
          padding: 12px;
          border-radius: 8px;
          font-size: 0.9rem;
          border: 1px solid #fca5a5;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
        }

        .input-group input {
          width: 100%;
          padding: 12px 16px 12px 44px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .input-group input:focus {
          outline: none;
          border-color: #3b82f6;
        }

        .input-group input:disabled {
          background: #f9fafb;
          cursor: not-allowed;
        }

        .input-group svg:first-child {
          position: absolute;
          left: 14px;
          z-index: 1;
        }

        .password-toggle {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          padding: 4px;
          cursor: pointer;
          color: #6b7280;
          transition: color 0.2s;
        }

        .password-toggle:hover:not(:disabled) {
          color: #374151;
        }

        .password-toggle:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .register-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-top: 8px;
        }

        .register-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .register-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .register-footer {
          margin-top: 24px;
          text-align: center;
        }

        .register-footer p {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 16px;
        }

        .login-link {
          color: #3b82f6;
          text-decoration: none;
          font-weight: 500;
        }

        .login-link:hover {
          text-decoration: underline;
        }

        .back-home {
          color: #6b7280;
          text-decoration: none;
          font-size: 0.9rem;
          transition: color 0.2s;
        }

        .back-home:hover {
          color: #374151;
        }

        @media (max-width: 480px) {
          .register-form-wrapper {
            padding: 24px;
          }

          .logo-text {
            font-size: 1.25rem;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;