// src/components/ConfigModal.tsx - VERSÃO LIMPA
import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { 
  X, User, Mail, Phone, Camera, Save, 
  Eye, EyeOff, Lock, Shield 
} from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const { user, updateUser, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications'>('profile');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    profileImage: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    emailNotifications: true,
    pushNotifications: true,
    weeklyReport: true,
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        profileImage: user.profileImage || '',
      }));
    }
  }, [user]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleProfileSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setMessage(null);

    try {
      const profileData = {
        name: formData.name,
        phone: formData.phone,
        profileImage: formData.profileImage,
      };

      updateUser(profileData);
      
      setMessage({ type: 'success', text: 'Perfil atualizado com sucesso!' });
      
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar perfil' });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!formData.currentPassword || !formData.newPassword) {
      setMessage({ type: 'error', text: 'Preencha todos os campos de senha' });
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'As senhas não coincidem' });
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'A nova senha deve ter pelo menos 6 caracteres' });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      // TODO: Implementar mudança de senha na API
      console.log('Changing password...', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      setMessage({ type: 'success', text: 'Senha alterada com sucesso!' });
      
      // Limpar campos de senha
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
      
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao alterar senha' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleNotificationsSave = async () => {
    setIsSaving(true);
    setMessage(null);

    try {
      // TODO: Implementar salvamento de notificações na API
      console.log('Saving notifications...', {
        emailNotifications: formData.emailNotifications,
        pushNotifications: formData.pushNotifications,
        weeklyReport: formData.weeklyReport
      });
      
      setMessage({ type: 'success', text: 'Preferências de notificação atualizadas!' });
      
      setTimeout(() => {
        setMessage(null);
      }, 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erro ao atualizar notificações' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>Configurações</h2>
            <button onClick={onClose} className="close-button" aria-label="Fechar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="tabs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`tab ${activeTab === 'profile' ? 'active' : ''}`}
            >
              <User className="w-4 h-4" />
              Perfil
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`tab ${activeTab === 'security' ? 'active' : ''}`}
            >
              <Shield className="w-4 h-4" />
              Segurança
            </button>
            <button
              onClick={() => setActiveTab('notifications')}
              className={`tab ${activeTab === 'notifications' ? 'active' : ''}`}
            >
              <Mail className="w-4 h-4" />
              Notificações
            </button>
          </div>

          <div className="modal-body">
            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            {activeTab === 'profile' && (
              <div className="tab-content">
                <h3>Informações Pessoais</h3>
                
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
                      disabled
                      className="disabled"
                    />
                  </div>
                  <span className="help-text">O email não pode ser alterado</span>
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
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="profileImage">URL da Foto de Perfil</label>
                  <div className="input-group">
                    <Camera className="w-5 h-5 text-gray-400" />
                    <input
                      id="profileImage"
                      type="url"
                      value={formData.profileImage}
                      onChange={(e) => handleInputChange('profileImage', e.target.value)}
                      placeholder="https://exemplo.com/foto.jpg"
                    />
                  </div>
                </div>

                <button
                  onClick={handleProfileSave}
                  disabled={isSaving}
                  className="save-button"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
            )}

            {activeTab === 'security' && (
              <div className="tab-content">
                <h3>Alterar Senha</h3>
                
                <div className="form-group">
                  <label htmlFor="currentPassword">Senha Atual</label>
                  <div className="input-group">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={formData.currentPassword}
                      onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                      placeholder="Digite sua senha atual"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="password-toggle"
                      aria-label={showCurrentPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">Nova Senha</label>
                  <div className="input-group">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={formData.newPassword}
                      onChange={(e) => handleInputChange('newPassword', e.target.value)}
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="password-toggle"
                      aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Nova Senha</label>
                  <div className="input-group">
                    <Lock className="w-5 h-5 text-gray-400" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      placeholder="Confirme a nova senha"
                    />
                  </div>
                </div>

                <button
                  onClick={handlePasswordChange}
                  disabled={isSaving}
                  className="save-button"
                >
                  <Shield className="w-4 h-4" />
                  {isSaving ? 'Alterando...' : 'Alterar Senha'}
                </button>
              </div>
            )}

            {activeTab === 'notifications' && (
              <div className="tab-content">
                <h3>Preferências de Notificação</h3>
                
                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.emailNotifications}
                      onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <div className="checkbox-content">
                      <strong>Notificações por Email</strong>
                      <p>Receba atualizações sobre novos livros e recompensas</p>
                    </div>
                  </label>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.pushNotifications}
                      onChange={(e) => handleInputChange('pushNotifications', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <div className="checkbox-content">
                      <strong>Notificações Push</strong>
                      <p>Receba lembretes para continuar lendo</p>
                    </div>
                  </label>
                </div>

                <div className="checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={formData.weeklyReport}
                      onChange={(e) => handleInputChange('weeklyReport', e.target.checked)}
                    />
                    <span className="checkmark"></span>
                    <div className="checkbox-content">
                      <strong>Relatório Semanal</strong>
                      <p>Receba um resumo da sua atividade de leitura</p>
                    </div>
                  </label>
                </div>

                <button
                  onClick={handleNotificationsSave}
                  disabled={isSaving}
                  className="save-button"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Preferências'}
                </button>
              </div>
            )}
          </div>
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
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .modal-content {
          background: white;
          border-radius: 16px;
          width: 100%;
          max-width: 500px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .modal-header {
          padding: 24px;
          border-bottom: 1px solid #e5e7eb;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .modal-header h2 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #1f2937;
          margin: 0;
        }

        .close-button {
          background: none;
          border: none;
          padding: 8px;
          border-radius: 8px;
          cursor: pointer;
          color: #6b7280;
          transition: all 0.2s;
        }

        .close-button:hover {
          background: #f3f4f6;
          color: #374151;
        }

        .tabs {
          display: flex;
          border-bottom: 1px solid #e5e7eb;
        }

        .tab {
          flex: 1;
          padding: 16px;
          background: none;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          color: #6b7280;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border-bottom: 2px solid transparent;
        }

        .tab:hover {
          background: #f9fafb;
          color: #374151;
        }

        .tab.active {
          color: #3b82f6;
          border-bottom-color: #3b82f6;
          background: #eff6ff;
        }

        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }

        .message {
          padding: 12px 16px;
          border-radius: 8px;
          margin-bottom: 24px;
          font-size: 0.9rem;
        }

        .message.success {
          background: #d1fae5;
          color: #065f46;
          border: 1px solid #a7f3d0;
        }

        .message.error {
          background: #fee2e2;
          color: #991b1b;
          border: 1px solid #fca5a5;
        }

        .tab-content h3 {
          font-size: 1.2rem;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 24px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          font-weight: 500;
          color: #374151;
          margin-bottom: 8px;
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

        .input-group input.disabled {
          background: #f9fafb;
          color: #6b7280;
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

        .password-toggle:hover {
          color: #374151;
        }

        .help-text {
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 4px;
          display: block;
        }

        .checkbox-group {
          margin-bottom: 20px;
        }

        .checkbox-label {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          cursor: pointer;
          padding: 16px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          transition: all 0.2s;
        }

        .checkbox-label:hover {
          background: #f9fafb;
          border-color: #d1d5db;
        }

        .checkbox-label input[type="checkbox"] {
          display: none;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          position: relative;
          flex-shrink: 0;
          transition: all 0.2s;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkmark {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .checkbox-label input[type="checkbox"]:checked + .checkmark::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 6px;
          width: 4px;
          height: 8px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
        }

        .checkbox-content {
          flex: 1;
        }

        .checkbox-content strong {
          display: block;
          color: #1f2937;
          margin-bottom: 4px;
        }

        .checkbox-content p {
          color: #6b7280;
          font-size: 0.9rem;
          margin: 0;
          line-height: 1.4;
        }

        .save-button {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: all 0.2s;
          width: 100%;
          justify-content: center;
        }

        .save-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .save-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        @media (max-width: 480px) {
          .modal-content {
            margin: 0;
            border-radius: 0;
            height: 100vh;
            max-height: 100vh;
          }

          .tabs {
            flex-direction: column;
          }

          .tab {
            justify-content: flex-start;
            padding-left: 24px;
          }
        }
      `}</style>
    </>
  );
};

export default ConfigModal;