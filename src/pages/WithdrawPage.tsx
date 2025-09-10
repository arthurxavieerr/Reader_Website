import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Clock, 
  AlertCircle, 
  DollarSign, 
  Check, 
  X, 
  Copy, 
  Eye, 
  EyeOff, 
  ArrowUpRight, 
  History, 
  Wallet,
  ArrowDownRight,
  QrCode,
  RefreshCw,
  CheckCircle
} from 'lucide-react';

interface DepositData {
  qrCode: string;
  qrCodeBase64: string;
  pixCopiaECola: string;
  transactionId: string;
  amount: number;
  expiresAt: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://beta-review-website.onrender.com/api';

const WithdrawPage: React.FC = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // States para controle de abas
  const [activeTab, setActiveTab] = useState<'withdraw' | 'deposit'>('withdraw');
  
  // States para saque
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [pixKeyType, setPixKeyType] = useState('cpf');
  const [showPixKey, setShowPixKey] = useState(false);
  const [isProcessingWithdraw, setIsProcessingWithdraw] = useState(false);
  
  // States para depósito
  const [depositAmount, setDepositAmount] = useState('39.90');
  const [depositData, setDepositData] = useState<DepositData | null>(null);
  const [isProcessingDeposit, setIsProcessingDeposit] = useState(false);
  const [depositStatus, setDepositStatus] = useState<'idle' | 'pending' | 'completed' | 'failed'>('idle');
  const [showQrCode, setShowQrCode] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // State para histórico
  const [showHistory, setShowHistory] = useState(false);

  // Função para fazer requisições autenticadas
  const makeAuthRequest = async (endpoint: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('token');
    
    if (!token) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('beta-reader-user');
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Erro ${response.status}`);
    }

    return response.json();
  };

  useEffect(() => {
    // Verificar se veio de um redirecionamento específico
    const action = searchParams.get('action');
    const amount = searchParams.get('amount');
    
    if (action === 'deposit') {
      setActiveTab('deposit');
      if (amount) {
        setDepositAmount(amount);
      }
    } else if (action === 'withdraw_fee') {
      setActiveTab('deposit');
      setDepositAmount('19.90');
    } else if (action === 'plan') {
      setActiveTab('deposit');
      setDepositAmount('39.90');
    }
  }, [searchParams]);

  if (!user) return null;

  const formatCurrency = (value: number) => {
    return `R$ ${(value / 100).toFixed(2).replace('.', ',')}`;
  };

  const formatCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formatted = (parseFloat(numericValue) / 100).toFixed(2);
    return formatted.replace('.', ',');
  };

  const minWithdrawal = user.planType === 'premium' ? 5000 : 12000; // em centavos
  const maxWithdrawal = user.balance;
  const canWithdraw = user.balance >= minWithdrawal;

  // Mock histórico de transações
  const transactionHistory = [
    { id: 1, type: 'withdrawal', amount: 5000, status: 'completed', date: '2024-03-15', pixKey: '***.456.789-**' },
    { id: 2, type: 'deposit', amount: 3990, status: 'completed', date: '2024-03-20', pixKey: null },
    { id: 3, type: 'withdrawal', amount: 10000, status: 'pending', date: '2024-03-20', pixKey: '***.456.789-**' },
    { id: 4, type: 'deposit', amount: 1990, status: 'failed', date: '2024-03-10', pixKey: null },
  ];

  // Função para criar depósito PIX
  const handleCreateDeposit = async () => {
    setIsProcessingDeposit(true);
    
    try {
      // Converter valor para centavos
      const amountInCents = Math.round(parseFloat(depositAmount.replace(',', '.')) * 100);
      
      const response = await makeAuthRequest('/payments/deposit', {
        method: 'POST',
        body: JSON.stringify({
          amount: amountInCents
        })
      });

      if (response.success) {
        setDepositData(response.data);
        setDepositStatus('pending');
        setShowQrCode(true);
        
        // Iniciar polling para verificar status
        startDepositStatusPolling(response.data.transactionId);
      } else {
        alert('Erro ao criar depósito: ' + response.error);
      }
    } catch (error) {
      console.error('Erro ao criar depósito:', error);
      alert('Erro ao processar depósito. Tente novamente.');
    } finally {
      setIsProcessingDeposit(false);
    }
  };

  // Polling para verificar status do depósito
  const startDepositStatusPolling = (transactionId: string) => {
    const interval = setInterval(async () => {
      try {
        const response = await makeAuthRequest(`/payments/deposit/${transactionId}/status`);
        
        if (response.success) {
          const status = response.data.status;
          
          if (status === 'COMPLETED') {
            setDepositStatus('completed');
            clearInterval(interval);
            // Atualizar dados do usuário
            window.location.reload();
          } else if (status === 'FAILED' || status === 'CANCELLED') {
            setDepositStatus('failed');
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar status:', error);
      }
    }, 3000); // Verificar a cada 3 segundos

    // Parar polling após 15 minutos
    setTimeout(() => clearInterval(interval), 15 * 60 * 1000);
  };

  // Função para solicitar saque
  const handleWithdrawSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificar se precisa pagar taxa
    if (user.planType !== 'PREMIUM') {
      const confirmPayFee = window.confirm(
        'Para realizar saques, você precisa pagar uma taxa de R$ 19,90. Deseja prosseguir para o pagamento?'
      );
      
      if (confirmPayFee) {
        navigate('/withdraw?action=withdraw_fee&amount=19.90');
        setActiveTab('deposit');
        setDepositAmount('19.90');
        return;
      } else {
        return;
      }
    }

    if (!withdrawAmount || !pixKey) return;

    const amountInCents = Math.round(parseFloat(withdrawAmount.replace(',', '.')) * 100);
    if (amountInCents < minWithdrawal || amountInCents > maxWithdrawal) return;

    setIsProcessingWithdraw(true);
    
    try {
      const response = await makeAuthRequest('/payments/withdrawal', {
        method: 'POST',
        body: JSON.stringify({
          amount: amountInCents,
          pixKey,
          pixKeyType
        })
      });

      if (response.success) {
        alert('Solicitação de saque enviada! Será processada em até 48 horas.');
        setShowWithdrawForm(false);
        setWithdrawAmount('');
        setPixKey('');
      } else {
        alert('Erro ao solicitar saque: ' + response.error);
      }
    } catch (error: any) {
      console.error('Erro ao solicitar saque:', error);
      
      // Verificar se é erro de taxa necessária
      if (error.message && error.message.includes('Premium')) {
        const confirmPayFee = window.confirm(
          'Para realizar saques, você precisa ser Premium ou pagar a taxa de R$ 19,90. Deseja prosseguir para o pagamento?'
        );
        
        if (confirmPayFee) {
          navigate('/withdraw?action=withdraw_fee&amount=19.90');
          setActiveTab('deposit');
          setDepositAmount('19.90');
          return;
        }
      } else {
        alert('Erro ao processar saque. Tente novamente.');
      }
    } finally {
      setIsProcessingWithdraw(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
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
      case 'failed':
      case 'cancelled': return '#ef4444';
      default: return '#64748b';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'pending': return 'Processando';
      case 'failed': return 'Falhou';
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
              <h1 className="page-title">Área Financeira</h1>
            </div>
            <button 
              className="history-btn"
              onClick={() => setShowHistory(!showHistory)}
              aria-label="Mostrar histórico de transações"
            >
              <History size={16} />
              Histórico
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="tabs-container">
          <div className="tabs">
            <button 
              className={`tab ${activeTab === 'withdraw' ? 'active' : ''}`}
              onClick={() => setActiveTab('withdraw')}
            >
              <ArrowUpRight size={16} />
              Saque
            </button>
            <button 
              className={`tab ${activeTab === 'deposit' ? 'active' : ''}`}
              onClick={() => setActiveTab('deposit')}
            >
              <ArrowDownRight size={16} />
              Depósito
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
              <p className="balance-subtitle">
                Plano: {user.planType === 'PREMIUM' ? 'Premium' : 'Gratuito'}
              </p>
            </div>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        {activeTab === 'withdraw' && (
          <div className="tab-content">
            {/* Status do Saque */}
            <div className={`withdraw-status ${canWithdraw ? 'available' : 'unavailable'}`}>
              <div className="status-icon">
                {canWithdraw ? <Check size={20} /> : <AlertCircle size={20} />}
              </div>
              <div className="status-content">
                <h3>{canWithdraw ? 'Saque Disponível' : 'Saque Indisponível'}</h3>
                <p>
                  {canWithdraw 
                    ? user.planType === 'PREMIUM' 
                      ? 'Você pode solicitar um saque agora'
                      : 'Taxa de R$ 19,90 será cobrada para processar o saque'
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

            {/* Limites de Saque */}
            <div className="limits-info">
              <div className="limit-item">
                <span className="limit-label">Saque mínimo:</span>
                <span className="limit-value">{formatCurrency(minWithdrawal)}</span>
              </div>
              <div className="limit-item">
                <span className="limit-label">Saque máximo:</span>
                <span className="limit-value">{formatCurrency(maxWithdrawal)}</span>
              </div>
              {user.planType !== 'PREMIUM' && (
                <div className="limit-item">
                  <span className="limit-label">Taxa de processamento:</span>
                  <span className="limit-value">R$ 19,90</span>
                </div>
              )}
            </div>

            {/* Formulário de Saque */}
            {showWithdrawForm && (
              <div className="form-modal">
                <div className="form-modal-content">
                  <div className="form-header">
                    <h3>Solicitar Saque</h3>
                    <button 
                      className="close-btn"
                      onClick={() => setShowWithdrawForm(false)}
                      aria-label="Fechar formulário"
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
                          onChange={(e) => setWithdrawAmount(formatCurrencyInput(e.target.value))}
                          placeholder="0,00"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label htmlFor="pixKeyType">Tipo da Chave PIX</label>
                      <select
                        id="pixKeyType"
                        value={pixKeyType}
                        onChange={(e) => setPixKeyType(e.target.value)}
                        required
                      >
                        <option value="cpf">CPF</option>
                        <option value="email">Email</option>
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
                          placeholder="Digite sua chave PIX"
                          required
                        />
                        <button
                          type="button"
                          className="toggle-visibility"
                          onClick={() => setShowPixKey(!showPixKey)}
                          aria-label={showPixKey ? "Ocultar chave PIX" : "Mostrar chave PIX"}
                        >
                          {showPixKey ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="submit-btn"
                      disabled={isProcessingWithdraw}
                    >
                      {isProcessingWithdraw ? (
                        <>
                          <RefreshCw size={16} className="spin" />
                          Processando...
                        </>
                      ) : (
                        'Solicitar Saque'
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'deposit' && (
          <div className="tab-content">
            {/* Informações do Depósito */}
            <div className="deposit-info">
              <div className="deposit-header">
                <h3>Fazer Depósito via PIX</h3>
                <p>Adicione saldo à sua conta de forma rápida e segura</p>
              </div>

              {!showQrCode ? (
                <div className="deposit-form">
                  <div className="form-group">
                    <label htmlFor="depositAmount">Valor do Depósito</label>
                    <div className="amount-input">
                      <span className="currency">R$</span>
                      <input
                        type="text"
                        id="depositAmount"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(formatCurrencyInput(e.target.value))}
                        placeholder="0,00"
                        title="Valor do depósito"
                        required
                      />
                    </div>
                  </div>

                  <div className="deposit-suggestions">
                    <p>Valores sugeridos:</p>
                    <div className="suggestion-buttons">
                      <button
                        type="button"
                        className="suggestion-btn"
                        onClick={() => setDepositAmount('19,90')}
                      >
                        R$ 19,90 (Taxa de Saque)
                      </button>
                      <button
                        type="button"
                        className="suggestion-btn"
                        onClick={() => setDepositAmount('39,90')}
                      >
                        R$ 39,90 (Plano Premium)
                      </button>
                    </div>
                  </div>

                  <button 
                    className="generate-qr-btn"
                    onClick={handleCreateDeposit}
                    disabled={isProcessingDeposit}
                  >
                    {isProcessingDeposit ? (
                      <>
                        <RefreshCw size={16} className="spin" />
                        Gerando QR Code...
                      </>
                    ) : (
                      <>
                        <QrCode size={16} />
                        Gerar QR Code PIX
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="qr-code-section">
                  {depositStatus === 'completed' ? (
                    <div className="success-message">
                      <CheckCircle size={48} color="#10b981" />
                      <h3>Pagamento Confirmado!</h3>
                      <p>Seu depósito foi processado com sucesso.</p>
                      <button 
                        className="new-deposit-btn"
                        onClick={() => {
                          setShowQrCode(false);
                          setDepositData(null);
                          setDepositStatus('idle');
                        }}
                      >
                        Fazer Novo Depósito
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="qr-code-container">
                        <h4>Escaneie o QR Code ou copie o código PIX</h4>
                        
                        {depositData && (
                          <div className="qr-code-display">
                            <img 
                              src={depositData.qrCodeBase64} 
                              alt="QR Code PIX" 
                              className="qr-code-image"
                            />
                            
                            <div className="pix-code-section">
                              <p>Ou copie o código PIX:</p>
                              <div className="pix-code-container">
                                <input
                                  type="text"
                                  value={depositData.pixCopiaECola}
                                  readOnly
                                  className="pix-code-input"
                                  title="Código PIX para copiar"
                                />
                                <button
                                  className="copy-btn"
                                  onClick={() => copyToClipboard(depositData.pixCopiaECola)}
                                >
                                  {copied ? <Check size={16} /> : <Copy size={16} />}
                                  {copied ? 'Copiado!' : 'Copiar'}
                                </button>
                              </div>
                            </div>

                            <div className="payment-info">
                              <p><strong>Valor:</strong> R$ {depositAmount}</p>
                              <p><strong>Status:</strong> Aguardando pagamento</p>
                              <p><strong>Expira em:</strong> 15 minutos</p>
                            </div>

                            <div className="payment-status">
                              <div className="status-indicator">
                                <Clock size={16} />
                                <span>Aguardando confirmação do pagamento...</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="qr-actions">
                        <button 
                          className="cancel-btn"
                          onClick={() => {
                            setShowQrCode(false);
                            setDepositData(null);
                            setDepositStatus('idle');
                          }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Histórico */}
        {showHistory && (
          <div className="history-section">
            <h3>Histórico de Transações</h3>
            <div className="history-list">
              {transactionHistory.map((transaction) => (
                <div key={transaction.id} className="history-item">
                  <div className="transaction-icon">
                    {transaction.type === 'deposit' ? 
                      <ArrowDownRight size={16} style={{color: '#10b981'}} /> : 
                      <ArrowUpRight size={16} style={{color: '#ef4444'}} />
                    }
                  </div>
                  <div className="transaction-info">
                    <span className="transaction-type">
                      {transaction.type === 'deposit' ? 'Depósito' : 'Saque'}
                    </span>
                    <span className="transaction-amount">
                      {formatCurrency(transaction.amount)}
                    </span>
                    <span className="transaction-date">{transaction.date}</span>
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
      </div>

      <style>{`
        .withdraw-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
          padding: 20px 0;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
          padding: 0 20px;
        }

        .page-header {
          margin-bottom: 30px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .header-title {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #1e293b;
        }

        .page-title {
          font-size: 1.8rem;
          font-weight: 600;
          margin: 0;
          color: #1e293b;
        }

        .history-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(255, 255, 255, 0.2);
          color: #1e293b;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .history-btn:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        .tabs-container {
          margin-bottom: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
        }

        .tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 4px;
        }

        .tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 20px;
          background: transparent;
          color: #white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }

        .tab.active {
          background: white;
          color: #667eea;
        }

        .tab:hover:not(.active) {
          background: rgba(255, 255, 255, 0.1);
          color: white;
        }

        .balance-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .balance-header {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .balance-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .balance-info h2 {
          margin: 0 0 8px 0;
          font-size: 1.1rem;
          color: #64748b;
        }

        .balance-amount {
          font-size: 2rem;
          font-weight: 700;
          color: #1e293b;
          margin-bottom: 4px;
        }

        .balance-subtitle {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .tab-content {
          margin-top: 20px;
        }

        .withdraw-status {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .withdraw-status.available {
          border-left: 4px solid #10b981;
        }

        .withdraw-status.unavailable {
          border-left: 4px solid #ef4444;
        }

        .status-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .withdraw-status.available .status-icon {
          background: #10b981;
        }

        .withdraw-status.unavailable .status-icon {
          background: #ef4444;
        }

        .status-content {
          flex: 1;
        }

        .status-content h3 {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          color: #1e293b;
        }

        .status-content p {
          margin: 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .withdraw-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 20px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .withdraw-btn:hover {
          background: #059669;
        }

        .limits-info {
          background: white;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }

        .limit-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
        }

        .limit-item:last-child {
          border-bottom: none;
        }

        .limit-label {
          color: #64748b;
          font-size: 0.9rem;
        }

        .limit-value {
          color: #1e293b;
          font-weight: 600;
        }

        .form-modal {
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
        }

        .form-modal-content {
          background: white;
          border-radius: 16px;
          padding: 24px;
          width: 90%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
        }

        .form-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .form-header h3 {
          margin: 0;
          color: #1e293b;
        }

        .close-btn {
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px;
          color: #64748b;
        }

        .close-btn:hover {
          color: #ef4444;
        }

        .withdraw-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .form-group label {
          font-weight: 500;
          color: #374151;
          font-size: 0.9rem;
        }

        .amount-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .currency {
          position: absolute;
          left: 12px;
          color: #64748b;
          font-weight: 500;
          z-index: 1;
        }

        .amount-input input {
          width: 100%;
          padding: 12px 12px 12px 40px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .amount-input input:focus {
          outline: none;
          border-color: #667eea;
        }

        .pix-input {
          position: relative;
          display: flex;
          align-items: center;
        }

        .pix-input input {
          width: 100%;
          padding: 12px 40px 12px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          transition: border-color 0.2s;
        }

        .pix-input input:focus {
          outline: none;
          border-color: #667eea;
        }

        .toggle-visibility {
          position: absolute;
          right: 12px;
          background: none;
          border: none;
          cursor: pointer;
          color: #64748b;
          padding: 4px;
        }

        select {
          width: 100%;
          padding: 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 1rem;
          background: white;
          cursor: pointer;
          transition: border-color 0.2s;
        }

        select:focus {
          outline: none;
          border-color: #667eea;
        }

        .submit-btn {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .submit-btn:hover:not(:disabled) {
          background: #5a67d8;
        }

        .submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .deposit-info {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .deposit-header {
          text-align: center;
          margin-bottom: 24px;
        }

        .deposit-header h3 {
          margin: 0 0 8px 0;
          color: #1e293b;
          font-size: 1.3rem;
        }

        .deposit-header p {
          margin: 0;
          color: #64748b;
        }

        .deposit-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .deposit-suggestions {
          text-align: center;
        }

        .deposit-suggestions p {
          margin: 0 0 12px 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .suggestion-buttons {
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
        }

        .suggestion-btn {
          padding: 8px 16px;
          background: #f8fafc;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 0.9rem;
          color: #374151;
        }

        .suggestion-btn:hover {
          background: #667eea;
          color: white;
          border-color: #667eea;
        }

        .generate-qr-btn {
          padding: 16px 24px;
          background: #10b981;
          color: white;
          border: none;
          border-radius: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 1rem;
        }

        .generate-qr-btn:hover:not(:disabled) {
          background: #059669;
        }

        .generate-qr-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .qr-code-section {
          text-align: center;
        }

        .success-message {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
          padding: 40px 20px;
        }

        .success-message h3 {
          margin: 0;
          color: #10b981;
          font-size: 1.3rem;
        }

        .success-message p {
          margin: 0;
          color: #64748b;
        }

        .new-deposit-btn {
          padding: 12px 24px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .new-deposit-btn:hover {
          background: #5a67d8;
        }

        .qr-code-container h4 {
          margin: 0 0 20px 0;
          color: #1e293b;
        }

        .qr-code-display {
          display: flex;
          flex-direction: column;
          gap: 20px;
          align-items: center;
        }

        .qr-code-image {
          width: 200px;
          height: 200px;
          border: 2px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px;
          background: white;
        }

        .pix-code-section {
          width: 100%;
        }

        .pix-code-section p {
          margin: 0 0 8px 0;
          color: #64748b;
          font-size: 0.9rem;
        }

        .pix-code-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .pix-code-input {
          flex: 1;
          padding: 8px 12px;
          border: 2px solid #e2e8f0;
          border-radius: 8px;
          font-size: 0.8rem;
          background: #f8fafc;
          font-family: monospace;
        }

        .copy-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          background: #667eea;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 500;
          transition: all 0.2s;
          white-space: nowrap;
        }

        .copy-btn:hover {
          background: #5a67d8;
        }

        .payment-info {
          background: #f8fafc;
          border-radius: 8px;
          padding: 16px;
          text-align: left;
        }

        .payment-info p {
          margin: 4px 0;
          color: #374151;
          font-size: 0.9rem;
        }

        .payment-status {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        .status-indicator {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #f59e0b;
          font-size: 0.9rem;
        }

        .qr-actions {
          margin-top: 20px;
          display: flex;
          justify-content: center;
        }

        .cancel-btn {
          padding: 10px 20px;
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.2s;
        }

        .cancel-btn:hover {
          background: #dc2626;
        }

        .history-section {
          background: white;
          border-radius: 16px;
          padding: 24px;
          margin-top: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
        }

        .history-section h3 {
          margin: 0 0 20px 0;
          color: #1e293b;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }

        .transaction-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: white;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #e2e8f0;
        }

        .transaction-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .transaction-type {
          font-weight: 600;
          color: #1e293b;
        }

        .transaction-amount {
          font-weight: 700;
          color: #374151;
        }

        .transaction-date {
          font-size: 0.8rem;
          color: #64748b;
        }

        .transaction-status {
          font-weight: 600;
          font-size: 0.9rem;
        }

        .deposit-icon {
          color: #10b981;
        }

        .withdrawal-icon {
          color: #ef4444;
        }

        .spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .container {
            padding: 0 16px;
          }

          .header-content {
            flex-direction: column;
            gap: 16px;
            text-align: center;
          }

          .tabs {
            flex-direction: column;
          }

          .balance-header {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .withdraw-status {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .suggestion-buttons {
            flex-direction: column;
          }

          .pix-code-container {
            flex-direction: column;
          }

          .pix-code-input {
            word-break: break-all;
          }

          .form-modal-content {
            margin: 20px;
            width: calc(100% - 40px);
          }

          .history-item {
            flex-direction: column;
            text-align: center;
          }

          .transaction-info {
            align-items: center;
          }
        }
      `}</style>
    </div>
  );
};

export default WithdrawPage;