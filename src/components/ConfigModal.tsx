import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { Link } from 'react-router-dom';
import { User, Edit, Eye, Star, Zap, X, Camera, Upload, Shield, Settings } from 'lucide-react';

interface ConfigModalProps {
  onClose: () => void;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ onClose }) => {
  const { user, logout, updateProfile, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<'main' | 'profile' | 'viewProfile'>('main');
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    commitment: user?.commitment || 'committed',
    incomeRange: user?.incomeRange || 'medium'
  });
  const [profileImage, setProfileImage] = useState<string | null>(user?.profileImage || null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!user) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileImage(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async () => {
    setIsSubmitting(true);
    try {
      await updateProfile({
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        commitment: profileData.commitment as 'committed' | 'curious',
        incomeRange: profileData.incomeRange as 'low' | 'medium' | 'high' | 'unemployed',
        profileImage: profileImage
      });
      setActiveTab('main');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMainConfig = () => (
    <div className="config-content">
      <div className="config-header">
        <h2>Configurações</h2>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
      
      <div className="config-options">
        {/* Botão Admin - só aparece para admins */}
        {user.isAdmin && (
          <Link to="/admin" className="config-option admin-option" onClick={onClose}>
            <div className="option-icon admin-icon">
              <Shield size={20} />
            </div>
            <div className="option-content">
              <h3>Painel Administrativo</h3>
              <p>Acesso completo ao sistema de gestão</p>
            </div>
            <div className="admin-badge">ADMIN</div>
          </Link>
        )}

        <button 
          className="config-option"
          onClick={() => setActiveTab('profile')}
        >
          <div className="option-icon">
            <Edit size={20} />
          </div>
          <div className="option-content">
            <h3>Editar Perfil Beta Reader</h3>
            <p>Alterar preferências de onboarding</p>
          </div>
        </button>
        
        <button 
          className="config-option"
          onClick={() => setActiveTab('viewProfile')}
        >
          <div className="option-icon">
            <Eye size={20} />
          </div>
          <div className="option-content">
            <h3>Ver Perfil</h3>
            <p>Visualizar dados do usuário</p>
          </div>
        </button>
        
        <button className="config-option">
          <div className="option-icon">
            <Star size={20} />
          </div>
          <div className="option-content">
            <h3>Modo de Avaliador</h3>
            <p>Avaliador Nacional</p>
          </div>
        </button>
        
        <div className="premium-banner">
          <div className="banner-content">
            <div className="banner-icon">
              <Zap size={20} />
            </div>
            <div className="banner-text">
              <h3>Novidades em Breve</h3>
              <p>Muitas funções e áreas ainda serão desbloqueadas conforme você sobe de pontuação!</p>
            </div>
          </div>
        </div>
        
        <button className="close-config-btn" onClick={onClose}>
          Fechar
        </button>
      </div>
    </div>
  );

  const renderEditProfile = () => (
    <div className="config-content">
      <div className="config-header">
        <button className="back-button" onClick={() => setActiveTab('main')}>
          ←
        </button>
        <h2>Editar Perfil</h2>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
      
      <div className="profile-edit">
        {/* Upload de Foto */}
        <div className="photo-upload-section">
          <div className="current-photo">
            {profileImage ? (
              <img src={profileImage} alt="Foto do perfil" className="profile-photo" />
            ) : (
              <div className="profile-avatar-large">
                {user.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          
          <div className="photo-upload-controls">
            <label htmlFor="photo-upload" className="upload-button">
              <Camera size={16} />
              Alterar Foto
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
            {profileImage && (
              <button 
                className="remove-photo-btn"
                onClick={() => setProfileImage(null)}
              >
                Remover
              </button>
            )}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Nome completo</label>
          <input 
            type="text" 
            name="name"
            className="form-input" 
            value={profileData.name}
            onChange={handleInputChange}
            placeholder="Seu nome completo"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Email</label>
          <input 
            type="email" 
            name="email"
            className="form-input" 
            value={profileData.email}
            onChange={handleInputChange}
            placeholder="seu@email.com"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Telefone</label>
          <input 
            type="tel" 
            name="phone"
            className="form-input" 
            value={profileData.phone}
            onChange={handleInputChange}
            placeholder="(11) 99999-9999"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Nível de comprometimento</label>
          <div className="radio-group">
            <label className="radio-option">
              <input 
                type="radio" 
                name="commitment" 
                value="committed"
                checked={profileData.commitment === 'committed'}
                onChange={handleInputChange}
              />
              <span>Sim, estou comprometido(a)</span>
            </label>
            <label className="radio-option">
              <input 
                type="radio" 
                name="commitment" 
                value="curious"
                checked={profileData.commitment === 'curious'}
                onChange={handleInputChange}
              />
              <span>Não, apenas curiosidade</span>
            </label>
          </div>
        </div>
        
        <div className="form-group">
          <label className="form-label">Faixa de renda mensal</label>
          <div className="radio-group">
            <label className="radio-option">
              <input 
                type="radio" 
                name="incomeRange" 
                value="low"
                checked={profileData.incomeRange === 'low'}
                onChange={handleInputChange}
              />
              <span>R$ 1.000 - R$ 10.000</span>
            </label>
            <label className="radio-option">
              <input 
                type="radio" 
                name="incomeRange" 
                value="medium"
                checked={profileData.incomeRange === 'medium'}
                onChange={handleInputChange}
              />
              <span>R$ 10.000 - R$ 50.000</span>
            </label>
            <label className="radio-option">
              <input 
                type="radio" 
                name="incomeRange" 
                value="high"
                checked={profileData.incomeRange === 'high'}
                onChange={handleInputChange}
              />
              <span>R$ 100.000+</span>
            </label>
            <label className="radio-option">
              <input 
                type="radio" 
                name="incomeRange" 
                value="unemployed"
                checked={profileData.incomeRange === 'unemployed'}
                onChange={handleInputChange}
              />
              <span>Desempregado(a)</span>
            </label>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            className="btn btn-secondary" 
            onClick={() => setActiveTab('main')}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleSaveProfile}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );

  const renderViewProfile = () => (
    <div className="config-content">
      <div className="config-header">
        <button className="back-button" onClick={() => setActiveTab('main')}>
          ←
        </button>
        <h2>Meu Perfil</h2>
        <button className="close-button" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
      
      <div className="profile-view">
        <div className="profile-summary">
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
            <span className="stat-value">{user.planType === 'free' ? 'Gratuito' : 'Premium'}</span>
          </div>
        </div>
        
        <div className="profile-details">
          <div className="detail-item">
            <strong>Telefone:</strong>
            <span>{user.phone}</span>
          </div>
          <div className="detail-item">
            <strong>Comprometimento:</strong>
            <span>
              {user.commitment === 'committed' ? 'Comprometido(a)' : 'Apenas curiosidade'}
            </span>
          </div>
          <div className="detail-item">
            <strong>Faixa de renda:</strong>
            <span>
              {user.incomeRange === 'low' && 'R$ 1.000 - R$ 10.000'}
              {user.incomeRange === 'medium' && 'R$ 10.000 - R$ 50.000'}
              {user.incomeRange === 'high' && 'R$ 100.000+'}
              {user.incomeRange === 'unemployed' && 'Desempregado(a)'}
            </span>
          </div>
          <div className="detail-item">
            <strong>Membro desde:</strong>
            <span>{new Date(user.createdAt).toLocaleDateString('pt-BR')}</span>
          </div>
          {user.isAdmin && (
            <div className="detail-item admin-detail">
              <strong>Permissões:</strong>
              <span>Administrador do Sistema</span>
            </div>
          )}
        </div>
        
        <button className="btn btn-error btn-full" onClick={logout}>
          Sair da Conta
        </button>
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content config-modal">
        {activeTab === 'main' && renderMainConfig()}
        {activeTab === 'profile' && renderEditProfile()}
        {activeTab === 'viewProfile' && renderViewProfile()}
      </div>
      
      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--spacing-lg);
          z-index: 1000;
        }
        
        .config-modal {
          max-width: 600px;
          width: 100%;
          background-color: var(--color-background);
          border-radius: var(--radius-xl);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          max-height: 90vh;
          overflow-y: auto;
        }
        
        .config-content {
          padding: 0;
        }
        
        .config-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border-light);
        }
        
        .config-header h2 {
          margin: 0;
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
        }
        
        .back-button {
          background: none;
          border: none;
          font-size: var(--text-xl);
          cursor: pointer;
          padding: var(--spacing-xs);
          color: var(--color-text-secondary);
        }
        
        .close-button {
          background: none;
          border: none;
          cursor: pointer;
          padding: var(--spacing-xs);
          color: var(--color-text-secondary);
          border-radius: var(--radius-md);
        }
        
        .close-button:hover {
          background-color: var(--color-surface);
        }
        
        .config-options {
          padding: var(--spacing-lg);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-md);
        }
        
        .config-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background: none;
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--transition-fast);
          text-align: left;
          text-decoration: none;
          color: inherit;
          position: relative;
        }
        
        .config-option:hover {
          border-color: var(--color-primary);
          background-color: rgba(137, 90, 237, 0.05);
        }
        
        /* Admin Option Styling */
        .admin-option {
          border-color: #dc2626;
          background: linear-gradient(135deg, #fee2e2, #fef2f2);
        }
        
        .admin-option:hover {
          border-color: #dc2626;
          background: linear-gradient(135deg, #fecaca, #fee2e2);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(220, 38, 38, 0.2);
        }
        
        .admin-icon {
          background: linear-gradient(135deg, #dc2626, #b91c1c) !important;
          color: white !important;
        }
        
        .admin-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 12px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .option-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
        }
        
        .option-content {
          flex: 1;
        }
        
        .option-content h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--text-base);
          font-weight: var(--font-medium);
        }
        
        .option-content p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .premium-banner {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          color: white;
        }
        
        .banner-content {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
        }
        
        .banner-icon {
          width: 32px;
          height: 32px;
          border-radius: var(--radius-md);
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .banner-text h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
        }
        
        .banner-text p {
          margin: 0;
          font-size: var(--text-sm);
          opacity: 0.9;
          line-height: 1.4;
        }
        
        .close-config-btn {
          width: 100%;
          padding: var(--spacing-md);
          background-color: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
          transition: background-color var(--transition-fast);
        }
        
        .close-config-btn:hover {
          background-color: var(--color-surface-dark);
        }
        
        .profile-edit {
          padding: var(--spacing-lg);
        }
        
        .photo-upload-section {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-lg);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
        }
        
        .current-photo {
          margin-bottom: var(--spacing-md);
        }
        
        .profile-photo {
          width: 120px;
          height: 120px;
          border-radius: var(--radius-full);
          object-fit: cover;
          border: 4px solid var(--color-primary);
        }
        
        .profile-avatar-large {
          width: 120px;
          height: 120px;
          border-radius: var(--radius-full);
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-4xl);
          font-weight: var(--font-bold);
        }
        
        .photo-upload-controls {
          display: flex;
          gap: var(--spacing-sm);
          align-items: center;
        }
        
        .upload-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-lg);
          background-color: var(--color-primary);
          color: white;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
          transition: background-color var(--transition-fast);
        }
        
        .upload-button:hover {
          background-color: var(--color-primary-dark);
        }
        
        .remove-photo-btn {
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: transparent;
          color: var(--color-error);
          border: 1px solid var(--color-error);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-sm);
          transition: all var(--transition-fast);
        }
        
        .remove-photo-btn:hover {
          background-color: var(--color-error);
          color: white;
        }
        
        .radio-group {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
        
        .radio-option {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
          padding: var(--spacing-sm);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: border-color var(--transition-fast);
        }
        
        .radio-option:hover {
          border-color: var(--color-primary);
        }
        
        .radio-option input[type="radio"] {
          margin: 0;
        }
        
        .form-actions {
          display: flex;
          gap: var(--spacing-sm);
          margin-top: var(--spacing-xl);
        }
        
        .profile-view {
          padding: var(--spacing-lg);
        }
        
        .profile-summary {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          padding: var(--spacing-lg);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
        }
        
        .profile-avatar {
          width: 80px;
          height: 80px;
          border-radius: var(--radius-full);
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
        }
        
        .profile-title {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .profile-info h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
        }
        
        .admin-badge-small {
          background: #dc2626;
          color: white;
          font-size: 10px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .profile-email {
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-sm) 0;
        }
        
        .profile-stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        
        .stat-item {
          text-align: center;
          padding: var(--spacing-lg);
          background-color: var(--color-surface);
          border-radius: var(--radius-lg);
        }
        
        .stat-label {
          display: block;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          margin-bottom: var(--spacing-xs);
        }
        
        .stat-value {
          display: block;
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          color: var(--color-primary);
        }
        
        .profile-details {
          margin-bottom: var(--spacing-xl);
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--spacing-md) 0;
          border-bottom: 1px solid var(--color-border-light);
        }
        
        .detail-item:last-child {
          border-bottom: none;
        }
        
        .detail-item strong {
          color: var(--color-text-primary);
          font-weight: var(--font-medium);
        }
        
        .detail-item span {
          color: var(--color-text-secondary);
        }
        
        .admin-detail {
          background: linear-gradient(135deg, #fee2e2, #fef2f2);
          padding: var(--spacing-md);
          border-radius: var(--radius-md);
          border: 1px solid #fecaca;
        }
        
        .admin-detail strong,
        .admin-detail span {
          color: #dc2626;
          font-weight: var(--font-semibold);
        }
        
        @media (max-width: 768px) {
          .config-modal {
            margin: var(--spacing-md);
            max-height: calc(100vh - 2rem);
          }
          
          .profile-summary {
            flex-direction: column;
            text-align: center;
          }
          
          .profile-stats {
            grid-template-columns: 1fr;
          }
          
          .detail-item {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-xs);
          }
          
          .form-actions {
            flex-direction: column;
          }
          
          .profile-title {
            flex-direction: column;
            gap: var(--spacing-xs);
          }
        }
      `}</style>
    </div>
  );
};

export default ConfigModal;