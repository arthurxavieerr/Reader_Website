// src/pages/RegisterPage.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, BookOpen, AlertCircle, Check } from 'lucide-react';
import fundo from '../assets/fundo.png';

const RegisterPage: React.FC = () => {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    // Validação
    const errors: {[key: string]: string} = {};
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (!formData.email) errors.email = 'Email é obrigatório';
    if (!formData.phone) errors.phone = 'Telefone é obrigatório';
    if (!formData.password) errors.password = 'Senha é obrigatória';
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    await register(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setFormData(prev => ({ ...prev, phone: formatted }));
    
    if (fieldErrors.phone) {
      setFieldErrors(prev => ({ ...prev, phone: '' }));
    }
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: '' };
    if (password.length < 6) return { strength: 1, label: 'Fraca' };
    if (password.length < 8) return { strength: 2, label: 'Média' };
    if (password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
      return { strength: 3, label: 'Forte' };
    }
    return { strength: 2, label: 'Média' };
  };

  const passwordStrength = getPasswordStrength(formData.password);

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="bg-pattern" style={{
                backgroundImage: `url(${fundo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: 'contain' // opcional
            }}></div>
        <div className="bg-gradient"></div>
      </div>

      <div className="auth-container">
        <div className="auth-header">
          <Link to="/" className="back-button">
            <ArrowLeft size={18} />
            <span>Voltar</span>
          </Link>
        </div>

        <div className="auth-card">
          <div className="brand-section">
            <div className="brand-icon">
              <BookOpen size={32} />
            </div>
            <h1 className="brand-title">BETA REVIEW</h1>
            <p className="brand-subtitle">Comece a ganhar dinheiro lendo livros</p>
          </div>

          <div className="form-section">
            <div className="form-header">
              <h2 className="form-title">Criar Conta</h2>
              <p className="form-subtitle">Junte-se a milhares de leitores que já ganham dinheiro</p>
            </div>

            {error && (
              <div className="error-banner">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="input-group">
                <label className="input-label">Nome completo</label>
                <div className={`input-container ${fieldErrors.name ? 'error' : ''} ${formData.name ? 'filled' : ''}`}>
                  <User className="input-icon" size={18} />
                  <input
                    type="text"
                    name="name"
                    placeholder="Digite seu nome completo"
                    value={formData.name}
                    onChange={handleChange}
                    className="form-input"
                    autoComplete="name"
                  />
                </div>
                {fieldErrors.name && (
                  <span className="field-error">{fieldErrors.name}</span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Email</label>
                <div className={`input-container ${fieldErrors.email ? 'error' : ''} ${formData.email ? 'filled' : ''}`}>
                  <Mail className="input-icon" size={18} />
                  <input
                    type="email"
                    name="email"
                    placeholder="seu@email.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="form-input"
                    autoComplete="email"
                  />
                </div>
                {fieldErrors.email && (
                  <span className="field-error">{fieldErrors.email}</span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Telefone</label>
                <div className={`input-container ${fieldErrors.phone ? 'error' : ''} ${formData.phone ? 'filled' : ''}`}>
                  <Phone className="input-icon" size={18} />
                  <input
                    type="tel"
                    name="phone"
                    placeholder="(11) 99999-9999"
                    value={formData.phone}
                    onChange={handlePhoneChange}
                    className="form-input"
                    autoComplete="tel"
                  />
                </div>
                {fieldErrors.phone && (
                  <span className="field-error">{fieldErrors.phone}</span>
                )}
              </div>

              <div className="input-group">
                <label className="input-label">Senha</label>
                <div className={`input-container ${fieldErrors.password ? 'error' : ''} ${formData.password ? 'filled' : ''}`}>
                  <Lock className="input-icon" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Crie uma senha segura"
                    value={formData.password}
                    onChange={handleChange}
                    className="form-input"
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                
                {formData.password && (
                  <div className="password-strength">
                    <div className="strength-bar">
                      <div 
                        className={`strength-fill strength-${passwordStrength.strength}`}
                        style={{ width: `${(passwordStrength.strength / 3) * 100}%` }}
                      />
                    </div>
                    <span className="strength-label">
                      Força da senha: {passwordStrength.label}
                    </span>
                  </div>
                )}
                
                {fieldErrors.password && (
                  <span className="field-error">{fieldErrors.password}</span>
                )}
              </div>

              <button 
                type="submit" 
                className={`submit-button ${loading ? 'loading' : ''}`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <span>Criar Conta Gratuita</span>
                )}
              </button>
            </form>

            <div className="form-footer">
              <p className="footer-text">
                Já tem uma conta?{' '}
                <Link to="/login" className="footer-link">
                  Fazer login
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="trust-section">
          <p className="trust-text">
            <span className="trust-icon">🔒</span>
            Seus dados estão seguros e protegidos
          </p>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: hidden;
        }

        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }

        .bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        .bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(135deg, rgba(137, 90, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
        }

        .auth-container {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: 480px;
          margin: 0 auto;
        }

        .auth-header {
          margin-bottom: 32px;
        }
        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--color-primary);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 12px;
          border-radius: 8px;
          transition: all 0.2s ease;
          background-color: rgba(137, 90, 237, 0.1);
          backdrop-filter: blur(10px);
        }

        .back-button:hover {
          color: #fff;
          background: var(--color-primary);
          transform: translateY(-1px);
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 
                      0 10px 10px -5px rgba(0, 0, 0, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin-bottom: 24px;
        }

        .brand-section {
          text-align: center;
          margin-bottom: 40px;
        }

        .brand-icon {
          width: 64px;
          height: 64px;
          background: linear-gradient(135deg, #895aed 0%, #667eea 100%);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: white;
        }

        .brand-title {
          font-size: 24px;
          font-weight: 700;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .brand-subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .form-section {
          width: 100%;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 8px 0;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 24px;
          border: 1px solid #fecaca;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: #f9fafb;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .input-container:focus-within {
          border-color: #895aed;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(137, 90, 237, 0.1);
        }

        .input-container.filled {
          background: #ffffff;
          border-color: #d1d5db;
        }

        .input-container.error {
          border-color: #dc2626;
          background: #fef2f2;
        }

        .input-icon {
          position: absolute;
          left: 16px;
          color: #9ca3af;
          z-index: 1;
          transition: color 0.2s ease;
        }

        .input-container:focus-within .input-icon,
        .input-container.filled .input-icon {
          color: #895aed;
        }

        .form-input {
          width: 100%;
          padding: 16px 16px 16px 48px;
          border: none;
          background: transparent;
          font-size: 16px;
          color: #111827;
          outline: none;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .password-toggle {
          position: absolute;
          right: 16px;
          background: none;
          border: none;
          color: #9ca3af;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: color 0.2s ease;
        }

        .password-toggle:hover {
          color: #6b7280;
        }

        .password-strength {
          margin-top: 8px;
        }

        .strength-bar {
          width: 100%;
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .strength-fill {
          height: 100%;
          border-radius: 2px;
          transition: all 0.3s ease;
        }

        .strength-fill.strength-1 {
          background: #dc2626;
        }

        .strength-fill.strength-2 {
          background: #f59e0b;
        }

        .strength-fill.strength-3 {
          background: #10b981;
        }

        .strength-label {
          font-size: 12px;
          color: #6b7280;
        }

        .field-error {
          font-size: 12px;
          color: #dc2626;
          margin-top: 4px;
        }

        .benefits-section {
          background: linear-gradient(135deg, rgba(137, 90, 237, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%);
          border: 1px solid rgba(137, 90, 237, 0.1);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
        }

        .benefits-title {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
          margin: 0 0 12px 0;
        }

        .benefits-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .benefit-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 14px;
          color: #374151;
        }

        .benefit-item svg {
          color: #10b981;
          flex-shrink: 0;
        }

        .submit-button {
          background: linear-gradient(135deg, #895aed 0%, #667eea 100%);
          color: white;
          border: none;
          border-radius: 12px;
          padding: 16px 24px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }

        .submit-button:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 10px 15px -3px rgba(137, 90, 237, 0.3);
        }

        .submit-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .form-footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .footer-text {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .footer-link {
          color: #895aed;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.2s ease;
        }

        .footer-link:hover {
          color: #7c3aed;
          text-decoration: underline;
        }

        .trust-section {
          text-align: center;
        }

        .trust-text {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(10px);
          padding: 12px 20px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 500;
          color: var(--color-primary);
          border: 1px solid rgba(255, 255, 255, 0.2);
          margin: 0;
        }

        .trust-icon {
          font-size: 16px;
        }

        @media (max-width: 640px) {
          .auth-page {
            padding: 16px;
          }

          .auth-card {
            padding: 32px 24px;
            border-radius: 20px;
          }

          .form-title {
            font-size: 24px;
          }

          .benefits-section {
            padding: 16px;
          }

          .trust-text {
            font-size: 13px;
            padding: 10px 16px;
          }
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;