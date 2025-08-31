import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { CreditCard, Clock, AlertCircle, DollarSign, Check, X, Copy, Eye, EyeOff, ArrowUpRight, History, Wallet } from 'lucide-react';

const WithdrawPage: React.FC = () => {
  const { user } = useAuth();
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [showPixKey, setShowPixKey] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  if (!user) return null;

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const minWithdrawal = user.planType === 'premium' ? 5000 : 12000; // em centavos
  const maxWithdrawal = user.balance;
  const canWithdraw = user.balance >= minWithdrawal;

  // Mock histórico de saques
  const withdrawHistory = [
    { id: 1, amount: 5000, status: 'completed', date: '2024-03-15', pixKey: '***.456.789-**' },
    { id: 2, amount: 10000, status: 'pending', date: '2024-03-20', pixKey: '***.456.789-**' },
    { id: 3, amount: 7500, status: 'cancelled', date: '2024-03-10', pixKey: '***.456.789-**' },
  ];

  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || !pixKey) return;

    const amountInCents = Math.round(parseFloat(withdrawAmount.replace(',', '.')) * 100);
    if (amountInCents < minWithdrawal || amountInCents > maxWithdrawal) return;

    setIsProcessing(true);
    
    // Simular processamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsProcessing(false);
    setShowWithdrawForm(false);
    setWithdrawAmount('');
    setPixKey('');
  };

  const formatPixKey = (key: string, type: string) => {
    if (type === 'cpf' && key.length >= 6) {
      return `***${key.slice(-6, -3)}.***-${key.slice(-2)}`;
    }
    if (type === 'email' && key.includes('@')) {
      const [user, domain] = key.split('@');
      return `${user.slice(0, 2)}***@${domain}`;
    }
    if (type === 'phone' && key.length >= 6) {
      return `(**) ****-${key.slice(-4)}`;
    }
    return key;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'pending': return '#f59e0b';
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Processando';
      case 'cancelled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  return (
    <div className="withdraw-page">
      <div className="container">
        {/* Header */}
        <div className="page-header">
          <div className="header-content">
            <div className="header-title">
              <Wallet size={28} />
              <h1 className="page-title">Área de Saque</h1>
            </div>
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
            >
              <History size={16} />
              Histórico
            </button>
          </div>
        </div>

        {/* Card de Saldo */}
        <div className="balance-card">
          <div className="balance-header">
            <div className="balance-icon">
              <DollarSign size={28} />
            </div>
            <div className="balance-info">
              <h2>Saldo Disponível</h2>
              <div className="balance-amount">{formatCurrency(user.balance)}</div>
              <p className="balance-subtitle">Total sacado: {formatCurrency(25000)}</p>
            </div>
          </div>
          
          <div className="balance-actions">
            <div className="balance-limits">
              <span className="limit-text">Saque mín: {formatCurrency(minWithdrawal)}</span>
              <span className="limit-text">Saque máx: {formatCurrency(maxWithdrawal)}</span>
            </div>
          </div>
        </div>

        {/* Status do Saque */}
        <div className={`withdraw-status ${canWithdraw ? 'available' : 'unavailable'}`}>
          <div className="status-icon">
            {canWithdraw ? <Check size={20} /> : <AlertCircle size={20} />}
          </div>
          <div className="status-content">
            <h3>{canWithdraw ? 'Saque Disponível' : 'Saque Indisponível'}</h3>
            <p>
              {canWithdraw 
                ? 'Você pode solicitar um saque agora'
                : `Saldo insuficiente para saque (mínimo ${formatCurrency(minWithdrawal)})`
              }
            </p>
          </div>
          {canWithdraw && (
            <button 
              className="withdraw-btn"
              onClick={() => setShowWithdrawForm(true)}
            >
              <ArrowUpRight size={16} />
              Solicitar Saque
            </button>
          )}
        </div>

        {/* Formulário de Saque */}
        {showWithdrawForm && (
          <div className="withdraw-form-card">
            <div className="form-header">
              <h3>Solicitar Saque</h3>
              <button 
                className="close-btn"
                onClick={() => setShowWithdrawForm(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleWithdrawSubmit} className="withdraw-form">
              <div className="form-group">
                <label htmlFor="amount">Valor do Saque</label>
                <div className="amount-input">
                  <span className="currency">R$</span>
                  <input
                    type="text"
                    id="amount"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="0,00"
                    required
                  />
                </div>
                <div className="amount-suggestions">
                  {[minWithdrawal, Math.floor(maxWithdrawal/2), maxWithdrawal].map((amount, index) => (
                    <button
                      key={index}
                      type="button"
                      className="suggestion-btn"
                      onClick={() => setWithdrawAmount((amount/100).toFixed(2).replace('.', ','))}
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="pixType">Tipo de Chave PIX</label>
                <select 
                  value={pixKeyType} 
                  onChange={(e) => setPixKeyType(e.target.value)}
                  className="pix-type-select"
                >
                  <option value="cpf">CPF</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="pixKey">Chave PIX</label>
                <div className="pix-input">
                  <input
                    type={showPixKey ? "text" : "password"}
                    id="pixKey"
                    value={pixKey}
                    onChange={(e) => setPixKey(e.target.value)}
                    placeholder={`Digite sua chave PIX (${pixKeyType.toUpperCase()})`}
                    required
                  />
                  <button
                    type="button"
                    className="toggle-visibility"
                    onClick={() => setShowPixKey(!showPixKey)}
                  >
                    {showPixKey ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-info">
                <div className="info-item">
                  <span className="info-label">Taxa:</span>
                  <span className="info-value">Gratuita</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Prazo:</span>
                  <span className="info-value">Até 48 horas</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Método:</span>
                  <span className="info-value">PIX</span>
                </div>
              </div>

              <button 
                type="submit" 
                className="submit-btn"
                disabled={isProcessing || !withdrawAmount || !pixKey}
              >
                {isProcessing ? (
                  <>
                    <div className="loading-spinner"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    Confirmar Saque
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Histórico */}
        {showHistory && (
          <div className="history-card">
            <div className="history-header">
              <h3>Histórico de Saques</h3>
              <span className="history-count">{withdrawHistory.length} transações</span>
            </div>
            
            <div className="history-list">
              {withdrawHistory.map((transaction) => (
                <div key={transaction.id} className="history-item">
                  <div className="transaction-info">
                    <div className="transaction-amount">
                      {formatCurrency(transaction.amount)}
                    </div>
                    <div className="transaction-details">
                      <span className="transaction-date">{transaction.date}</span>
                      <span className="transaction-pix">PIX: {transaction.pixKey}</span>
                    </div>
                  </div>
                  <div 
                    className="transaction-status"
                    style={{ color: getStatusColor(transaction.status) }}
                  >
                    {getStatusText(transaction.status)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações do Plano */}
        <div className="plan-info-enhanced">
          <div className="plan-header">
            <h3>Seu plano: {user.planType === 'free' ? 'Gratuito' : 'Premium'}</h3>
            <span className={`plan-badge ${user.planType}`}>
              {user.planType === 'premium' ? '⭐ Premium' : '🆓 Gratuito'}
            </span>
          </div>
          
          <div className="plan-benefits">
            {user.planType === 'free' ? (
              <div className="benefits-grid">
                <div className="benefit-item">
                  <span className="benefit-value">10 pontos</span>
                  <span className="benefit-label">por livro lido</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-value">3 pontos</span>
                  <span className="benefit-label">por avaliação</span>
                </div>
                <div className="benefit-item">
                  <span className="benefit-value">R$ 120,00</span>
                  <span className="benefit-label">saque mínimo</span>
                </div>
              </div>
            ) : (
              <div className="benefits-grid">
                <div className="benefit-item premium">
                  <span className="benefit-value">30 pontos</span>
                  <span className="benefit-label">por livro lido (3x)</span>
                </div>
                <div className="benefit-item premium">
                  <span className="benefit-value">9 pontos</span>
                  <span className="benefit-label">por avaliação (3x)</span>
                </div>
                <div className="benefit-item premium">
                  <span className="benefit-value">R$ 50,00</span>
                  <span className="benefit-label">saque mínimo</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      <style>{`
        .withdraw-page {
          padding: 32px 0;
          min-height: calc(100vh - 140px);
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 24px;
        }
        
        /* Header */
        .page-header {
          margin-bottom: 32px;
        }
        
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .header-title {
          display: flex;
          align-items: center;
          gap: 16px;
          color: #8b5cf6;
        }
        
        .page-title {
          font-size: 32px;
          font-weight: 700;
          color: #1e293b;
          margin: 0;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .history-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: white;
          border: 2px solid #e2e8f0;
          padding: 12px 20px;
          border-radius: 12px;
          cursor: pointer;
          color: #64748b;
          font-weight: 500;
          transition: all 0.2s ease;
        }
        
        .history-btn:hover {
          border-color: #8b5cf6;
          color: #8b5cf6;
        }
        
        /* Balance Card */
        .balance-card {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
        }
        
        .balance-header {
          display: flex;
          align-items: center;
          gap: 24px;
          margin-bottom: 20px;
        }
        
        .balance-icon {
          width: 70px;
          height: 70px;
          border-radius: 16px;
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .balance-info {
          flex: 1;
        }
        
        .balance-info h2 {
          font-size: 20px;
          margin: 0 0 8px 0;
          opacity: 0.9;
        }
        
        .balance-amount {
          font-size: 48px;
          font-weight: 700;
          margin-bottom: 8px;
        }
        
        .balance-subtitle {
          font-size: 16px;
          opacity: 0.8;
          margin: 0;
        }
        
        .balance-actions {
          border-top: 1px solid rgba(255, 255, 255, 0.2);
          padding-top: 20px;
        }
        
        .balance-limits {
          display: flex;
          justify-content: space-between;
          opacity: 0.9;
        }
        
        .limit-text {
          font-size: 14px;
        }
        
        /* Withdraw Status */
        .withdraw-status {
          display: flex;
          align-items: center;
          gap: 20px;
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 2px solid #e2e8f0;
          transition: all 0.2s ease;
        }
        
        .withdraw-status.available {
          border-color: #10b981;
          background: linear-gradient(135deg, #ecfdf5, #f0fdf4);
        }
        
        .withdraw-status.unavailable {
          border-color: #ef4444;
          background: linear-gradient(135deg, #fef2f2, #fef2f2);
        }
        
        .status-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .available .status-icon {
          background: #10b981;
          color: white;
        }
        
        .unavailable .status-icon {
          background: #ef4444;
          color: white;
        }
        
        .status-content {
          flex: 1;
        }
        
        .status-content h3 {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #1e293b;
        }
        
        .status-content p {
          color: #64748b;
          margin: 0;
          font-size: 15px;
        }
        
        .withdraw-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          color: white;
          border: none;
          padding: 14px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        
        .withdraw-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }
        
        /* Withdraw Form */
        .withdraw-form-card {
          background: white;
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
          border: 1px solid #e2e8f0;
        }
        
        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .form-header h3 {
          font-size: 20px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background: #f1f5f9;
          color: #334155;
        }
        
        .withdraw-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #374151;
        }
        
        .amount-input {
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .currency {
          position: absolute;
          left: 16px;
          color: #64748b;
          font-weight: 600;
          font-size: 18px;
        }
        
        .amount-input input {
          width: 100%;
          padding: 16px 16px 16px 50px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 18px;
          font-weight: 600;
          transition: border-color 0.2s ease;
        }
        
        .amount-input input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        
        .amount-suggestions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        
        .suggestion-btn {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 8px 16px;
          border-radius: 8px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          transition: all 0.2s ease;
        }
        
        .suggestion-btn:hover {
          background: #8b5cf6;
          color: white;
          border-color: #8b5cf6;
        }
        
        .pix-type-select {
          width: 100%;
          padding: 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          background: white;
          transition: border-color 0.2s ease;
        }
        
        .pix-type-select:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        
        .pix-input {
          position: relative;
        }
        
        .pix-input input {
          width: 100%;
          padding: 14px 50px 14px 16px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }
        
        .pix-input input:focus {
          outline: none;
          border-color: #8b5cf6;
          box-shadow: 0 0 0 4px rgba(139, 92, 246, 0.1);
        }
        
        .toggle-visibility {
          position: absolute;
          right: 16px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
        }
        
        .form-info {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          display: flex;
          justify-content: space-between;
        }
        
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .info-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        
        .info-value {
          font-size: 14px;
          color: #1e293b;
          font-weight: 600;
        }
        
        .submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: linear-gradient(135deg, #8b5cf6, #06b6d4);
          color: white;
          border: none;
          padding: 16px 24px;
          border-radius: 12px;
          font-weight: 600;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.3);
        }
        
        .submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(139, 92, 246, 0.4);
        }
        
        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }
        
        .loading-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        /* History */
        .history-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        
        .history-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .history-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .history-count {
          font-size: 14px;
          color: #64748b;
          background: #f1f5f9;
          padding: 4px 12px;
          border-radius: 12px;
        }
        
        .history-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .transaction-info {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .transaction-amount {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
        }
        
        .transaction-details {
          display: flex;
          gap: 16px;
          font-size: 14px;
          color: #64748b;
        }
        
        .transaction-status {
          font-size: 14px;
          font-weight: 600;
          padding: 6px 12px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.05);
        }
        
        /* Plan Info Enhanced */
        .plan-info-enhanced {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          border: 1px solid #e2e8f0;
        }
        
        .plan-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }
        
        .plan-header h3 {
          font-size: 18px;
          font-weight: 600;
          color: #1e293b;
          margin: 0;
        }
        
        .plan-badge {
          padding: 8px 16px;
          border-radius: 12px;
          font-size: 14px;
          font-weight: 600;
        }
        
        .plan-badge.free {
          background: #f1f5f9;
          color: #64748b;
        }
        
        .plan-badge.premium {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          color: white;
        }
        
        .benefits-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        
        .benefit-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          text-align: center;
          border: 1px solid #e2e8f0;
        }
        
        .benefit-item.premium {
          border-color: #f59e0b;
        }
        
        .benefit-value {
          font-size: 18px;
          font-weight: 700;
          color: #1e293b;
        }
        
        .benefit-label {
          font-size: 12px;
          color: #64748b;
          font-weight: 500;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }
          
          .header-content {
            flex-direction: column;
            gap: 16px;
            align-items: stretch;
          }
          
          .balance-header {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
          
          .balance-amount {
            font-size: 36px;
          }
          
          .balance-limits {
            flex-direction: column;
            gap: 8px;
            text-align: center;
          }
          
          .withdraw-status {
            flex-direction: column;
            text-align: center;
            gap: 16px;
          }
          
          .form-info {
            flex-direction: column;
            gap: 12px;
          }
          
          .amount-suggestions {
            flex-direction: column;
          }
          
          .benefits-grid {
            grid-template-columns: 1fr;
          }
          
          .history-item {
            flex-direction: column;
            gap: 8px;
            align-items: flex-start;
          }
          
          .transaction-details {
            flex-direction: column;
            gap: 4px;
          }
        }
      `}</style>
    </div>
  );
};

export default WithdrawPage;