// src/components/ConfigModal.tsx - ATUALIZADO COM CAMPO CPF
import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Phone, 
  CreditCard,
  Shield,
  Check,
  AlertCircle,
  Save
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { validateCPF, formatCPF, cleanCPF } from '../types/index';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, loading } = useAuth();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    cpf: user?.cpf || ''
  });
  const [fieldErrors, setFieldErrors] = useState<{[key: string]: string}>({});
  const [isEditing, setIsEditing] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        cpf: user.cpf ? formatCPF(user.cpf) : ''
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    
    // Validação
    const errors: {[key: string]: string} = {};
    if (!formData.name.trim()) errors.name = 'Nome é obrigatório';
    if (formData.cpf && !validateCPF(formData.cpf)) {
      errors.cpf = 'CPF inválido';
    }
    
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    
    try {
      // Preparar dados para envio (CPF sem formatação)
      const updateData = {
        name: formData.name.trim(),
        phone: formData.phone || undefined,
        cpf: formData.cpf ? cleanCPF(formData.cpf) : undefined
      };
      
      await updateProfile(updateData);
      setIsEditing(false);
      setSaveSuccess(true);
      
      // Remover mensagem de sucesso após 3 segundos
      setTimeout(() => setSaveSuccess(false), 3000);
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
    }
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

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        cpf: user.cpf ? formatCPF(user.cpf) : ''
      });
    }
    setFieldErrors({});
    setIsEditing(false);
  };

  const isCPFValid = formData.cpf && validateCPF(formData.cpf);

  if (!isOpen || !user) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Configurações da Conta</h2>
          <button 
            className="close-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-tabs">
          <button
            className={`tab-button ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            <User size={16} />
            Perfil
          </button>
          <button
            className={`tab-button ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Shield size={16} />
            Segurança
          </button>
        </div>

        <div className="modal-content">
          {activeTab === 'profile' && (
            <div className="profile-section">
              {saveSuccess && (
                <div className="success-banner">
                  <Check size={16} />
                  <span>Perfil atualizado com sucesso!</span>
                </div>
              )}

              <div className="profile-header">
                <div className="profile-avatar">
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
                <div className="profile-info">
                  <div className="profile-title">
                    <h3>{user.name}</h3>
                    {user.isAdmin && <span className="admin-badge-small">ADMIN</span>}
                  </div>
                  <p className="profile-email">{user.email}</p>
                  <span className={`level-badge level-${user.level === 0 ? 'bronze' : 'silver'}`}>
                    Nível {user.level === 0 ? 'Bronze' : 'Prata'}
                  </span>
                </div>
              </div>

              <div className="profile-stats">
                <div className="stat-item">
                  <span className="stat-label">Pontos</span>
                  <span className="stat-value">{user.points}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Saldo</span>
                  <span className="stat-value">R$ {(user.balance / 100).toFixed(2)}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Plano</span>
                  <span className="stat-value">{user.planType === 'FREE' ? 'Gratuito' : 'Premium'}</span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Nome Completo</label>
                    <div className={`input-container ${fieldErrors.name ? 'error' : ''} ${!isEditing ? 'disabled' : ''}`}>
                      <User className="input-icon" size={18} />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="form-input"
                        disabled={!isEditing}
                        placeholder="Digite seu nome completo"
                      />
                    </div>
                    {fieldErrors.name && (
                      <span className="field-error">{fieldErrors.name}</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Email</label>
                    <div className="input-container disabled">
                      <Mail className="input-icon" size={18} />
                      <input
                        type="email"
                        value={user.email}
                        className="form-input"
                        disabled
                      />
                    </div>
                    <span className="field-note">O email não pode ser alterado</span>
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">CPF</label>
                    <div className={`input-container ${fieldErrors.cpf ? 'error' : ''} ${!isEditing ? 'disabled' : ''} ${isCPFValid ? 'valid' : ''}`}>
                      <CreditCard className="input-icon" size={18} />
                      <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleCPFChange}
                        className="form-input"
                        disabled={!isEditing}
                        placeholder="000.000.000-00"
                        maxLength={14}
                      />
                      {isCPFValid && isEditing && (
                        <Check className="validation-icon valid" size={16} />
                      )}
                    </div>
                    {fieldErrors.cpf && (
                      <span className="field-error">{fieldErrors.cpf}</span>
                    )}
                    {formData.cpf && !fieldErrors.cpf && isCPFValid && isEditing && (
                      <span className="field-success">CPF válido</span>
                    )}
                  </div>
                </div>

                <div className="form-row">
                  <div className="input-group">
                    <label className="input-label">Telefone (Opcional)</label>
                    <div className={`input-container ${!isEditing ? 'disabled' : ''}`}>
                      <Phone className="input-icon" size={18} />
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        className="form-input"
                        disabled={!isEditing}
                        placeholder="(11) 99999-9999"
                      />
                    </div>
                  </div>
                </div>

                <div className="profile-details">
                  <div className="detail-item">
                    <strong>Comprometimento:</strong>
                    <span>
                      {user.commitment === 'COMMITTED' ? 'Comprometido' : 'Curioso'}
                    </span>
                  </div>
                  <div className="detail-item">
                    <strong>Faixa de Renda:</strong>
                    <span>
                      {user.incomeRange === 'LOW' && 'Baixa'}
                      {user.incomeRange === 'MEDIUM' && 'Média'}
                      {user.incomeRange === 'HIGH' && 'Alta'}
                      {user.incomeRange === 'UNEMPLOYED' && 'Desempregado'}
                    </span>
                  </div>
                </div>

                <div className="form-actions">
                  {!isEditing ? (
                    <button
                      type="button"
                      className="edit-button"
                      onClick={() => setIsEditing(true)}
                    >
                      Editar Perfil
                    </button>
                  ) : (
                    <div className="action-buttons">
                      <button
                        type="button"
                        className="cancel-button"
                        onClick={handleCancel}
                        disabled={loading}
                      >
                        Cancelar
                      </button>
                      <button
                        type="submit"
                        className={`save-button ${loading ? 'loading' : ''}`}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <div className="spinner"></div>
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save size={16} />
                            Salvar Alterações
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </form>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="security-section">
              <div className="security-info">
                <AlertCircle size={48} color="#f59e0b" />
                <h3>Configurações de Segurança</h3>
                <p>
                  Para alterar sua senha ou outras configurações de segurança, 
                  entre em contato com nosso suporte.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-container {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
        }

        .modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 24px 32px;
          border-bottom: 1px solid #e5e7eb;
        }

        .modal-header h2 {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          color: #6b7280;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .modal-tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab-button {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 16px 24px;
          background: none;
          border: none;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          border-bottom: 2px solid transparent;
        }

        .tab-button:hover {
          color: #374151;
          background: #f9fafb;
        }

        .tab-button.active {
          color: var(--color-primary);
          border-bottom-color: var(--color-primary);
          background: #faf5ff;
        }

        .modal-content {
          padding: 32px;
        }

        .success-banner {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          color: #16a34a;
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          margin-bottom: 24px;
        }

        .profile-header {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 24px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 12px;
        }

        .profile-avatar {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, var(--color-primary), #7c3aed);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: 600;
          flex-shrink: 0;
        }

        .profile-info {
          flex: 1;
        }

        .profile-title {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 4px;
        }

        .profile-title h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .admin-badge-small {
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 12px;
          letter-spacing: 0.5px;
        }

        .profile-email {
          color: #6b7280;
          margin: 0 0 8px 0;
          font-size: 14px;
        }

        .level-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .level-badge.level-bronze {
          background: #fef3c7;
          color: #92400e;
        }

        .level-badge.level-silver {
          background: #e5e7eb;
          color: #374151;
        }

        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .stat-item {
          text-align: center;
          padding: 16px;
          background: white;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
        }

        .stat-label {
          display: block;
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }

        .profile-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 16px;
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
        }

        .input-container {
          position: relative;
          display: flex;
          align-items: center;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s ease;
        }

        .input-container:focus-within {
          border-color: var(--color-primary);
          box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.1);
        }

        .input-container.disabled {
          background: #f9fafb;
          border-color: #e5e7eb;
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
          margin-left: 12px;
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
          padding: 12px;
          font-size: 14px;
          color: #1f2937;
          outline: none;
        }

        .form-input:disabled {
          color: #9ca3af;
        }

        .form-input::placeholder {
          color: #9ca3af;
        }

        .validation-icon {
          margin-right: 12px;
          flex-shrink: 0;
        }

        .validation-icon.valid {
          color: #10b981;
        }

        .field-error {
          font-size: 13px;
          color: #ef4444;
          font-weight: 500;
        }

        .field-success {
          font-size: 13px;
          color: #10b981;
          font-weight: 500;
        }

        .field-note {
          font-size: 12px;
          color: #6b7280;
          font-style: italic;
        }

        .profile-details {
          background: #f9fafb;
          border-radius: 8px;
          padding: 16px;
          margin-bottom: 24px;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #e5e7eb;
        }

        .detail-item:last-child {
          border-bottom: none;
        }

        .detail-item strong {
          color: #374151;
          font-size: 14px;
        }

        .detail-item span {
          color: #6b7280;
          font-size: 14px;
        }

        .form-actions {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .edit-button {
          width: 100%;
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .edit-button:hover {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .action-buttons {
          display: flex;
          gap: 12px;
        }

        .cancel-button {
          flex: 1;
          background: #f3f4f6;
          color: #374151;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .cancel-button:hover {
          background: #e5e7eb;
        }

        .save-button {
          flex: 2;
          background: var(--color-primary);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .save-button:hover:not(.loading) {
          background: #7c3aed;
          transform: translateY(-1px);
        }

        .save-button.loading {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .security-section {
          text-align: center;
          padding: 40px 20px;
        }

        .security-info {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .security-info h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
          margin: 0;
        }

        .security-info p {
          color: #6b7280;
          line-height: 1.6;
          max-width: 400px;
          margin: 0;
        }

        @media (max-width: 640px) {
          .modal-container {
            margin: 0;
            border-radius: 16px 16px 0 0;
            max-height: 95vh;
          }

          .modal-header {
            padding: 20px 24px;
          }

          .modal-content {
            padding: 24px 20px;
          }

          .profile-header {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }

          .profile-stats {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .action-buttons {
            flex-direction: column;
          }

          .cancel-button,
          .save-button {
            flex: none;
          }
        }
      `}</style>
    </div>
  );
};

export default ConfigModal;