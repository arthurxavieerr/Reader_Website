// src/pages/RegisterPage.tsx - ATUALIZADO COM CAMPO CPF OBRIGATÓRIO
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ArrowLeft, Eye, EyeOff, Mail, Lock, User, Phone, BookOpen, AlertCircle, Check, CreditCard } from 'lucide-react';
import { validateCPF, formatCPF, cleanCPF } from '../types/index';
import fundo from '../assets/fundo.png';

const RegisterPage: React.FC = () => {
  const { register, loading, error } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cpf: '',
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
    if (!formData.cpf) {
      errors.cpf = 'CPF é obrigatório';
    } else if (!validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }
    if (!formData.password) errors.password = 'Senha é obrigatória';
    if (formData.password && formData.password.length < 6) {
      errors.password = 'Senha deve ter pelo menos 6 caracteres';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    // Preparar dados para envio (CPF sem formatação)
    const submitData = {
      ...formData,
      cpf: cleanCPF(formData.cpf)
    };
    
    await register(submitData);
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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const formattedCPF = formatCPF(value);
    
    // Limitar a 14 caracteres (formato: 000.000.000-00)
    if (formattedCPF.length <= 14) {
      setFormData(prev => ({ ...prev, cpf: formattedCPF }));
    }
    
    if (fieldErrors.cpf) {
      setFieldErrors(prev => ({ ...prev, cpf: '' }));
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
  const isCPFValid = formData.cpf && validateCPF(formData.cpf);

  return (
    <div className="auth-page">
      <div className="auth-background">
        <div className="bg-pattern" style={{
          backgroundImage: `url(${fundo})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          width: '100%',
          height: 'contain'
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
                <label className="input-label">CPF</label>
                <div className={`input-container ${fieldErrors.cpf ? 'error' : ''} ${formData.cpf ? 'filled' : ''} ${isCPFValid ? 'valid' : ''}`}>
                  <CreditCard className="input-icon" size={18} />
                  <input
                    type="text"
                    name="cpf"
                    placeholder="000.000.000-00"
                    value={formData.cpf}
                    onChange={handleCPFChange}
                    className="form-input"
                    autoComplete="off"
                    maxLength={14}
                  />
                  {isCPFValid && (
                    <Check className="validation-icon valid" size={16} />
                  )}
                </div>
                {fieldErrors.cpf && (
                  <span className="field-error">{fieldErrors.cpf}</span>
                )}
                {formData.cpf && !fieldErrors.cpf && isCPFValid && (
                  <span className="field-success">CPF válido</span>
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
                  Faça login
                </Link>
              </p>
            </div>
          </div>

          <div className="benefits-section">
            <div className="trust-section">
              <p className="trust-text">
                <span className="trust-icon">🔒</span>
                Seus dados estão seguros e protegidos
              </p>
            </div>
          </div>
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .auth-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 1;
        }

        .bg-pattern {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0.1;
        }

        .bg-gradient {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            135deg,
            rgba(102, 126, 234, 0.9) 0%,
            rgba(118, 75, 162, 0.9) 100%
          );
        }

        .auth-container {
          position: relative;
          z-index: 2;
          width: 100%;
          max-width: 480px;
        }

        .auth-header {
          margin-bottom: 24px;
        }

        .back-button {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          padding: 8px 16px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          transition: all 0.2s ease;
        }

        .back-button:hover {
          background: rgba(255, 255, 255, 0.2);
          transform: translateY(-1px);
        }

        .auth-card {
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(20px);
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }

        .brand-section {
          text-align: center;
          margin-bottom: 32px;
        }

        .brand-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: linear-gradient(135deg, var(--color-primary), #7c3aed);
          color: white;
          margin-bottom: 16px;
        }

        .brand-title {
          font-size: 24px;
          font-weight: 800;
          color: var(--color-primary);
          margin: 0 0 8px 0;
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
          font-weight: 500;
        }

        .form-section {
          margin-bottom: 24px;
        }

        .form-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .form-title {
          font-size: 28px;
          font-weight: 700;
          color: #1f2937;
          margin: 0 0 8px 0;
          letter-spacing: -0.025em;
        }

        .form-subtitle {
          font-size: 16px;
          color: #6b7280;
          margin: 0;
          line-height: 1.5;
        }

        .error-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fef2f2;
          border: 1px solid #fecaca;
          color: #dc2626;
          padding: 12px 16px;
          border-radius: 12px;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .input-label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 4px;
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: #f9fafb;
          border: 2px solid #e5e7eb;
          border-radius: 12px;
          transition: all 0.2s ease;
        }

        .input-container:focus-within {
          border-color: var(--color-primary);
          background: white;
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .input-container.filled {
          background: white;
          border-color: #d1d5db;
        }

        .input-container.error {
          border-color: #ef4444;
          background: #fef2f2;
        }

        .input-container.valid {
          border-color: #10b981;
          background: #f0fdf4;
        }

        .input-icon {
          color: #9ca3af;
          margin-left: 16px;
          flex-shrink: 0;
        }

        .input-container:focus-within .input-icon {
          color: var(--color-primary);
        }

        .input-container.error .input-icon {
          color: #ef4444;
        }

        .input-container.valid .input-icon {
          color: #10b981;
        }

        .form-input {
          flex: 1;
          border: none;
          background: transparent;
          padding: 16px 12px;
          font-size: 16px;
          color: #1f2937;
          outline: none;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .validation-icon {
          margin-right: 16px;
          flex-shrink: 0;
        }

        .validation-icon.valid {
          color: #10b981;
        }

        .password-toggle {
          background: none;
          border: none;
          color: #9ca3af;
          margin-right: 16px;
          padding: 4px;
          cursor: pointer;
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
          height: 4px;
          background: #e5e7eb;
          border-radius: 2px;
          overflow: hidden;
          margin-bottom: 4px;
        }

        .strength-fill {
          height: 100%;
          transition: all 0.3s ease;
          border-radius: 2px;
        }

        .strength-fill.strength-1 {
          background: #ef4444;
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
          font-weight: 500;
        }

        .field-error {
          font-size: 13px;
          color: #ef4444;
          font-weight: 500;
          margin-top: 4px;
        }

        .field-success {
          font-size: 13px;
          color: #10b981;
          font-weight: 500;
          margin-top: 4px;
        }

        .submit-button {
          background: linear-gradient(135deg, var(--color-primary), #7c3aed);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
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

        .submit-button:hover:not(.loading) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(139, 92, 246, 0.3);
        }

        .submit-button.loading {
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