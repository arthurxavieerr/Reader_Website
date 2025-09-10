// server.js - VERSÃO COMPLETA CORRIGIDA COM NIVUSPAY OFICIAL
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configuração do Express
const app = express();
const isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

// Debug de inicialização
console.log('🔍 Debug inicial:');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('DEBUG:', process.env.DEBUG);
console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);

// Configuração Prisma - CORRIGIDA PARA EVITAR PREPARED STATEMENTS
let client;
let isConnecting = false;

async function initializePrisma() {
  if (isConnecting) {
    console.log('⏳ Conexão já em andamento...');
    return client;
  }

  try {
    isConnecting = true;

    if (client) {
      try {
        await client.$disconnect();
        console.log('🔄 Cliente anterior desconectado');
      } catch (disconnectError) {
        console.log('⚠️ Erro ao desconectar cliente anterior:', disconnectError.message);
      }
    }

    client = new PrismaClient({
      datasources: { 
        db: { url: process.env.DATABASE_URL }
      },
      log: isDebug ? ['warn', 'error'] : ['error'],
      __internal: {
        engine: {
          allowTriggerPanic: false
        }
      }
    });

    // Conectar com retry automático
    let connected = false;
    let attempts = 0;
    const maxAttempts = 3;

    while (!connected && attempts < maxAttempts) {
      try {
        await client.$connect();
        connected = true;
        console.log('✅ Prisma conectado ao Supabase');
      } catch (connectError) {
        attempts++;
        console.log(`⚠️ Tentativa ${attempts}/${maxAttempts} falhou:`, connectError.message);
        
        if (attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        } else {
          throw connectError;
        }
      }
    }

    // Teste básico usando executeRaw ao invés de queryRaw
    try {
      await client.$executeRaw`SELECT 1`;
      console.log('✅ Teste de conexão bem-sucedido');
    } catch (testError) {
      console.log('⚠️ Teste de conexão falhou, mas continuando:', testError.message);
    }

    isConnecting = false;
    return client;
    
  } catch (error) {
    isConnecting = false;
    console.error('❌ Erro na inicialização do Prisma:', error);
    
    if (client) {
      try {
        await client.$disconnect();
      } catch (disconnectError) {
        console.log('⚠️ Erro ao desconectar após falha:', disconnectError.message);
      }
      client = null;
    }
    
    throw error;
  }
}

// Middleware de conexão - CORRIGIDO
async function ensureConnection(req, res, next) {
  try {
    if (!client || isConnecting) {
      console.log('🔄 Inicializando conexão...');
      await initializePrisma();
    }

    // Teste simples de conexão sem prepared statements problemáticos
    try {
      await client.user.findFirst({ take: 1 });
      console.log('✅ Conexão Prisma verificada');
    } catch (testError) {
      console.log('⚠️ Teste de conexão falhou, tentando reconectar...');
      await initializePrisma();
    }

    next();
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Serviço temporariamente indisponível. Erro de banco de dados.',
      code: 'DATABASE_CONNECTION_ERROR',
      details: isDebug ? error.message : undefined
    });
  }
}

// Configurações da Nivuspay - CORRIGIDA CONFORME DOCUMENTAÇÃO
const NIVUSPAY_CONFIG = {
  BASE_URL: 'https://pay.nivuspay.com.br/api/v1',
  SECRET_KEY: process.env.NIVUSPAY_SECRET_KEY || '58466d2b-7365-498f-9038-01fe2f537d1a'
};

// Função CORRETA para criar transação PIX na Nivuspay (SEM AUTENTICAÇÃO SEPARADA)
async function createNivusPayPixTransaction(amount, description, userId, userInfo = {}) {
  try {
    console.log('💰 Criando transação PIX na NivusPay...');
    
    // Gerar ID único para a transação
    const customId = `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Dados obrigatórios conforme documentação oficial
    const transactionData = {
      name: userInfo.name || 'Cliente',
      email: userInfo.email || 'cliente@betareader.com',
      cpf: userInfo.cpf || '12345678901', // CPF deve ter 11 dígitos
      phone: userInfo.phone || '16999999999', // 8-12 dígitos
      paymentMethod: 'PIX',
      amount: amount, // Valor em centavos
      traceable: true,
      items: [
        {
          unitPrice: amount,
          title: description,
          quantity: 1,
          tangible: false
        }
      ],
      externalId: customId,
      postbackUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/webhooks/nivuspay`
    };

    console.log('📤 Enviando dados para NivusPay:', JSON.stringify(transactionData, null, 2));

    const response = await fetch(`${NIVUSPAY_CONFIG.BASE_URL}/transaction.purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': NIVUSPAY_CONFIG.SECRET_KEY // Autenticação direta no header
      },
      body: JSON.stringify(transactionData)
    });

    console.log('📊 Status da resposta NivusPay:', response.status);
    console.log('📊 Headers da resposta:', Object.fromEntries(response.headers));

    const responseText = await response.text();
    console.log('📄 Resposta NivusPay (texto):', responseText);

    if (!response.ok) {
      throw new Error(`NivusPay API Error: ${response.status} - ${responseText}`);
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Erro ao fazer parse da resposta NivusPay: ${parseError.message}`);
    }

    console.log('📋 Resposta NivusPay (JSON):', JSON.stringify(data, null, 2));

    // Extrair dados conforme documentação
    return {
      transactionId: data.id || data.transactionId,
      customId: data.customId || customId,
      qrCode: data.pixCode || data.pixQrCode,
      qrCodeBase64: data.pixQrCode ? `data:image/png;base64,${data.pixQrCode}` : null,
      pixCopiaECola: data.pixCode,
      amount: amount,
      expiresAt: data.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      status: data.status || 'PENDING'
    };

  } catch (error) {
    console.error('❌ Erro na criação da transação NivusPay:', error);
    throw error;
  }
}

// Função CORRETA para verificar status do pagamento na Nivuspay
async function checkNivusPayPaymentStatus(transactionId) {
  try {
    console.log('🔍 Verificando status do pagamento na NivusPay:', transactionId);
    
    const response = await fetch(`${NIVUSPAY_CONFIG.BASE_URL}/transaction.getPayment?id=${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': NIVUSPAY_CONFIG.SECRET_KEY
      }
    });

    console.log('📊 Status da consulta NivusPay:', response.status);

    if (!response.ok) {
      throw new Error(`NivusPay Status API Error: ${response.status}`);
    }

    const responseText = await response.text();
    let data;
    
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(`Erro ao fazer parse da resposta de status: ${parseError.message}`);
    }

    console.log('📋 Status retornado:', data.status);

    // Mapear status da NivusPay para nosso sistema
    const statusMap = {
      'PENDING': 'pending',
      'APPROVED': 'approved', 
      'REJECTED': 'rejected',
      'CANCELLED': 'cancelled',
      'REFUNDED': 'refunded'
    };

    return statusMap[data.status] || 'pending';

  } catch (error) {
    console.error('❌ Erro ao verificar status na NivusPay:', error);
    throw error;
  }
}

// Middlewares básicos
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'] 
    : ['https://beta-review-website.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

if (isDebug) {
  app.use((req, res, next) => {
    console.log(`📞 ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos
const distPath = path.join(__dirname, 'dist');
try {
  if (require('fs').existsSync(distPath)) {
    app.use(express.static(distPath));
    console.log('📁 Servindo arquivos estáticos da pasta dist');
  } else {
    console.log('📁 Pasta dist não encontrada - apenas API');
  }
} catch (error) {
  console.log('📁 Apenas API - sem arquivos estáticos');
}

// Helper Functions
function generateToken(userId, email, isAdmin = false) {
  return jwt.sign({ userId, email, isAdmin }, process.env.JWT_SECRET, { expiresIn: '7d' });
}

function toPublicUser(user) {
  const { passwordHash, salt, ...publicUser } = user;
  return publicUser;
}

// Middleware de autenticação CORRIGIDO
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('❌ Token não encontrado no header Authorization');
    return res.status(401).json({ 
      success: false, 
      error: 'Token de acesso requerido',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('❌ Token inválido:', err.message);
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
    }
    req.user = decoded;
    console.log('✅ Token válido para usuário:', decoded.userId);
    next();
  });
}

function requireAdmin(req, res, next) {
  if (!req.user.isAdmin) {
    return res.status(403).json({ success: false, error: 'Acesso negado: apenas administradores' });
  }
  next();
}

// ============================================
// ROTAS BÁSICAS
// ============================================
app.get('/health', async (req, res) => {
  let dbStatus = 'Unknown';
  try {
    if (client) {
      await client.user.findFirst({ take: 1 });
      dbStatus = 'Connected';
    } else {
      dbStatus = 'Not Initialized';
    }
  } catch (error) {
    dbStatus = 'Error: ' + error.message;
  }

  res.json({ 
    success: true, 
    status: 'API Online - LOCALHOST',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 3001,
    database: dbStatus
  });
});

app.get('/api/test', ensureConnection, async (req, res) => {
  try {
    const userCount = await client.user.count();
    res.json({ 
      success: true, 
      message: 'API funcionando!',
      data: { userCount, connectionStatus: 'OK', timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================
app.post('/api/auth/register', ensureConnection, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, error: 'Nome, email e senha são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const existingUser = await client.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email já está em uso' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await client.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash,
        isAdmin: false,
        level: 1,
        balance: 0,
        onboardingCompleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    const token = generateToken(user.id, user.email, user.isAdmin);
    const publicUser = toPublicUser(user);

    res.status(201).json({ success: true, data: { user: publicUser, token } });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.post('/api/auth/login', ensureConnection, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }

    const user = await client.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user || user.isSuspended) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }

    await client.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIP: req.ip || 'localhost' }
    });

    const token = generateToken(user.id, user.email, user.isAdmin);
    const publicUser = toPublicUser(user);

    console.log('✅ Login realizado com sucesso para:', user.email);
    res.json({ success: true, data: { user: publicUser, token } });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

app.get('/api/auth/me', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const user = await client.user.findUnique({
      where: { id: req.user.userId }
    });

    if (!user || user.isSuspended) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const publicUser = toPublicUser(user);
    res.json({ success: true, data: { user: publicUser } });

  } catch (error) {
    console.error('❌ Auth check error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ============================================
// ROTAS DE LIVROS
// ============================================
app.get('/api/books', ensureConnection, async (req, res) => {
  try {
    const books = await client.book.findMany({
      where: { active: true },
      select: {
        id: true, title: true, author: true, genre: true, synopsis: true,
        baseRewardMoney: true, requiredLevel: true, reviewsCount: true,
        averageRating: true, createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: { books } });
  } catch (error) {
    console.error('❌ Books error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar livros' });
  }
});

app.get('/api/books/:id', ensureConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    const bookMapping = {
      '1': 'A Caixa de Pandora', '2': 'O Príncipe e a Gata', 
      '3': 'O Banqueiro Anarquista', '4': 'De Quanta Terra um Homem Precisa?',
      'book-1': 'A Caixa de Pandora', 'book-2': 'O Príncipe e a Gata',
      'book-3': 'O Banqueiro Anarquista', 'book-4': 'De Quanta Terra um Homem Precisa?'
    };
    
    const bookTitle = bookMapping[id];
    
    if (!bookTitle) {
      return res.status(404).json({ success: false, error: 'Livro não encontrado' });
    }
    
    const book = await client.book.findFirst({
      where: { title: bookTitle, active: true },
      select: {
        id: true, title: true, author: true, genre: true, synopsis: true,
        content: true, baseRewardMoney: true, requiredLevel: true,
        reviewsCount: true, averageRating: true, estimatedReadTime: true,
        wordCount: true, pageCount: true, createdAt: true
      }
    });

    if (!book) {
      return res.status(404).json({ success: false, error: 'Livro não encontrado no banco de dados' });
    }

    const bookFormatted = {
      ...book,
      id: id,
      rewardMoney: Math.floor((book.baseRewardMoney || 10000) / 100),
      estimatedReadTime: book.estimatedReadTime ? `${Math.ceil(book.estimatedReadTime / 60)} min` : '10 min'
    };

    res.json({ success: true, data: { book: bookFormatted } });
    
  } catch (error) {
    console.error('❌ Book detail error:', error);
    res.status(500).json({ success: false, error: 'Erro ao buscar livro' });
  }
});

// ============================================
// ROTAS DE PAGAMENTO - DEPÓSITOS
// ============================================

// POST /api/payments/deposit - Criar depósito via PIX
app.post('/api/payments/deposit', ensureConnection, authenticateToken, async (req, res) => {
  console.log('📥 Iniciando criação de depósito...');
  console.log('User ID:', req.user?.userId);
  console.log('Request body:', req.body);
  
  try {
    const { amount } = req.body; // valor em centavos
    const userId = req.user.userId;

    console.log('🔍 Validando parâmetros:', { amount, userId });

    // Validar valores específicos: R$ 19,90 ou R$ 39,90
    if (amount !== 1990 && amount !== 3990) {
      console.log('❌ Valor inválido:', amount);
      return res.status(400).json({ 
        success: false, 
        error: 'Apenas os valores R$ 19,90 (taxa de saque) ou R$ 39,90 (plano premium) são permitidos' 
      });
    }

    console.log('🔍 Buscando usuário...');
    const user = await client.user.findUnique({ where: { id: userId } });
    console.log('👤 Usuário encontrado:', !!user);
    
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Verificar se há depósito pendente
    console.log('🔍 Verificando depósitos pendentes...');
    const pendingDeposit = await client.transaction.findFirst({
      where: {
        userId,
        type: 'DEPOSIT',
        status: 'PENDING'
      }
    });

    if (pendingDeposit) {
      console.log('⚠️ Depósito pendente encontrado:', pendingDeposit.id);
      return res.status(400).json({
        success: false,
        error: 'Você já possui um depósito pendente'
      });
    }

    console.log('✅ Nenhum depósito pendente encontrado');

    // Determinar o tipo de depósito
    const depositType = amount === 1990 ? 'Taxa de Saque' : 'Plano Premium';
    const description = `${depositType} - ${user.name || 'Cliente'}`;

    console.log('💰 Criando transação PIX na Nivuspay...');
    
    // Criar transação PIX na Nivuspay - CHAMADA CORRIGIDA
    const nivusPayData = await createNivusPayPixTransaction(amount, description, userId, {
      name: user.name,
      email: user.email,
      cpf: '12345678901', // Você pode adicionar CPF ao modelo User se quiser
      phone: user.phone || '16999999999'
    });

    console.log('💾 Salvando transação no banco...');
    
    // Salvar transação no banco
    const transaction = await client.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount,
        currency: 'BRL',
        nivusPayTransactionId: nivusPayData.transactionId,
        nivusPayCustomId: nivusPayData.customId,
        pixData: {
          qrCode: nivusPayData.qrCode,
          qrCodeBase64: nivusPayData.qrCodeBase64,
          pixCopiaECola: nivusPayData.pixCopiaECola,
          expiresAt: nivusPayData.expiresAt,
          depositType: depositType
        }
      }
    });

    console.log('✅ Depósito criado com sucesso:', transaction.id);

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        qrCode: nivusPayData.qrCode,
        qrCodeBase64: nivusPayData.qrCodeBase64,
        pixCopiaECola: nivusPayData.pixCopiaECola,
        amount: amount,
        expiresAt: nivusPayData.expiresAt,
        status: 'PENDING'
      }
    });

  } catch (error) {
    console.error('❌ Erro detalhado na criação de depósito:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// GET /api/payments/deposit/:id/status - Verificar status do depósito
app.get('/api/payments/deposit/:id/status', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Buscar transação no banco
    const transaction = await client.transaction.findFirst({
      where: { 
        id, 
        userId, 
        type: 'DEPOSIT' 
      }
    });

    if (!transaction) {
      return res.status(404).json({ 
        success: false, 
        error: 'Transação não encontrada' 
      });
    }

    // Se já está processada, retornar status atual
    if (transaction.status !== 'PENDING') {
      return res.json({
        success: true,
        data: {
          id: transaction.id,
          status: transaction.status,
          amount: transaction.amount,
          createdAt: transaction.createdAt,
          processedAt: transaction.processedAt
        }
      });
    }

    // Verificar status na Nivuspay
    let nivusStatus = 'pending';
    let newStatus = transaction.status;

    if (transaction.nivusPayTransactionId) {
      try {
        nivusStatus = await checkNivusPayPaymentStatus(transaction.nivusPayTransactionId);
        
        // Mapear status da Nivuspay para nosso sistema
        if (nivusStatus === 'approved') {
          newStatus = 'COMPLETED';
          
          // Processar pagamento baseado no valor
          if (transaction.amount === 1990) {
            // Taxa de saque - adicionar ao saldo
            await client.user.update({
              where: { id: userId },
              data: { balance: { increment: transaction.amount } }
            });
          } else if (transaction.amount === 3990) {
            // Plano premium - upgradar usuário
            await client.user.update({
              where: { id: userId },
              data: { 
                planType: 'PREMIUM',
                balance: { increment: transaction.amount }
              }
            });
          }
        } else if (nivusStatus === 'rejected' || nivusStatus === 'cancelled') {
          newStatus = 'FAILED';
        }

        // Atualizar status da transação se mudou
        if (newStatus !== transaction.status) {
          await client.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: newStatus,
              nivusPayStatus: nivusStatus,
              processedAt: new Date()
            }
          });
        }
      } catch (statusError) {
        console.error('❌ Error checking Nivuspay status:', statusError);
        // Continue sem falhar a requisição
      }
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        status: newStatus,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        processedAt: newStatus !== 'PENDING' ? new Date() : null
      }
    });

  } catch (error) {
    console.error('❌ Deposit status error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/payments/deposits - Listar depósitos do usuário
app.get('/api/payments/deposits', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [deposits, total] = await Promise.all([
      client.transaction.findMany({
        where: { userId, type: 'DEPOSIT' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          amount: true,
          status: true,
          nivusPayStatus: true,
          pixData: true,
          createdAt: true,
          processedAt: true
        }
      }),
      client.transaction.count({
        where: { userId, type: 'DEPOSIT' }
      })
    ]);

    res.json({
      success: true,
      data: {
        deposits,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ List deposits error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// ============================================
// ROTAS DE PAGAMENTO - SAQUES
// ============================================

// POST /api/payments/withdrawal - Solicitar saque
app.post('/api/payments/withdrawal', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const { amount, pixKey, pixKeyType } = req.body;
    const userId = req.user.userId;

    if (!amount || !pixKey || !pixKeyType) {
      return res.status(400).json({ 
        success: false, 
        error: 'Valor, chave PIX e tipo da chave são obrigatórios' 
      });
    }

    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Verificar se usuário é premium ou se precisa pagar taxa
    if (user.planType !== 'PREMIUM') {
      return res.status(400).json({
        success: false,
        error: 'Para realizar saques, você precisa ser Premium ou pagar a taxa de R$ 19,90',
        requiresPayment: true,
        feeAmount: 1990
      });
    }

    // Verificar limites baseados no plano
    const minWithdrawal = user.planType === 'PREMIUM' ? 5000 : 12000; // R$ 50 ou R$ 120
    
    if (amount < minWithdrawal) {
      return res.status(400).json({
        success: false,
        error: `Valor mínimo para saque é R$ ${(minWithdrawal / 100).toFixed(2)}`
      });
    }

    if (amount > user.balance) {
      return res.status(400).json({
        success: false,
        error: 'Saldo insuficiente'
      });
    }

    // Verificar se há saques pendentes
    const pendingWithdrawal = await client.transaction.findFirst({
      where: {
        userId,
        type: 'WITHDRAWAL',
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingWithdrawal) {
      return res.status(400).json({
        success: false,
        error: 'Você já possui um saque pendente'
      });
    }

    // Criar transação de saque
    const transaction = await client.transaction.create({
      data: {
        userId,
        type: 'WITHDRAWAL',
        status: 'PENDING',
        amount,
        currency: 'BRL',
        pixKey,
        pixKeyType,
        bankAccount: {
          pixKey,
          pixKeyType,
          requestedAt: new Date().toISOString()
        }
      }
    });

    // Debitar do saldo imediatamente (reservar valor)
    await client.user.update({
      where: { id: userId },
      data: { balance: { decrement: amount } }
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        amount,
        status: 'PENDING',
        message: 'Solicitação de saque criada. Será processada pelo administrador em até 48 horas.'
      }
    });

  } catch (error) {
    console.error('❌ Withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/payments/withdrawals - Listar saques do usuário
app.get('/api/payments/withdrawals', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { page = 1, limit = 10 } = req.query;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      client.transaction.findMany({
        where: { userId, type: 'WITHDRAWAL' },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          amount: true,
          status: true,
          pixKey: true,
          pixKeyType: true,
          adminNotes: true,
          createdAt: true,
          processedAt: true
        }
      }),
      client.transaction.count({
        where: { userId, type: 'WITHDRAWAL' }
      })
    ]);

    res.json({
      success: true,
      data: {
        withdrawals: withdrawals.map(w => ({
          ...w,
          pixKey: w.pixKey ? `***${w.pixKey.slice(-4)}` : null // Mascarar chave PIX
        })),
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Withdrawals list error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ============================================
// WEBHOOK NIVUSPAY
// ============================================
app.post('/api/webhooks/nivuspay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const payload = JSON.parse(req.body.toString());
    
    console.log('📥 Nivuspay Webhook received:', payload);

    // Validar payload básico
    if (!payload.paymentId && !payload.customId) {
      console.log('❌ Invalid webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { paymentId, customId, status } = payload;

    // Buscar transação pelo customId ou paymentId
    const transaction = await client.transaction.findFirst({
      where: { 
        OR: [
          { nivusPayCustomId: customId },
          { nivusPayTransactionId: paymentId },
          { nivusPayTransactionId: payload.externalId }
        ],
        type: 'DEPOSIT'
      },
      include: { user: true }
    });

    if (!transaction) {
      console.log('❌ Transaction not found for webhook data:', { paymentId, customId });
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verificar se já foi processada
    if (transaction.status !== 'PENDING') {
      console.log('✅ Transaction already processed:', transaction.id);
      return res.json({ success: true, message: 'Already processed' });
    }

    let newStatus = 'PENDING';
    let shouldUpdateUser = false;

    // Mapear status da Nivuspay conforme documentação
    switch (status) {
      case 'APPROVED':
        newStatus = 'COMPLETED';
        shouldUpdateUser = true;
        break;
      case 'REJECTED':
      case 'CANCELLED':
        newStatus = 'FAILED';
        break;
      default:
        newStatus = 'PENDING';
    }

    // Atualizar transação
    await client.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        nivusPayStatus: status,
        processedAt: new Date()
      }
    });

    // Processar pagamento se aprovado
    if (shouldUpdateUser) {
      if (transaction.amount === 1990) {
        // Taxa de saque - adicionar ao saldo
        await client.user.update({
          where: { id: transaction.userId },
          data: { 
            balance: { increment: transaction.amount }
          }
        });
        console.log(`✅ Taxa de saque paga: R$ ${(transaction.amount / 100).toFixed(2)} for user ${transaction.user.email}`);
      } else if (transaction.amount === 3990) {
        // Plano premium - upgradar usuário e adicionar saldo
        await client.user.update({
          where: { id: transaction.userId },
          data: { 
            planType: 'PREMIUM',
            balance: { increment: transaction.amount }
          }
        });
        console.log(`✅ Plano Premium ativado: R$ ${(transaction.amount / 100).toFixed(2)} for user ${transaction.user.email}`);
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('❌ Nivuspay webhook error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ============================================
// ROTAS ADMIN - GERENCIAR TRANSAÇÕES
// ============================================

// GET /api/admin/withdrawals - Listar todos os saques para admin
app.get('/api/admin/withdrawals', ensureConnection, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = { type: 'WITHDRAWAL' };
    if (status !== 'all') {
      whereCondition.status = status.toUpperCase();
    }

    const [withdrawals, total] = await Promise.all([
      client.transaction.findMany({
        where: whereCondition,
        include: {
          user: {
            select: { id: true, name: true, email: true, planType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      client.transaction.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: {
        withdrawals,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Admin withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/withdrawals/:id - Processar saque
app.patch('/api/admin/withdrawals/:id', ensureConnection, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'approve' | 'reject'
    const adminId = req.user.userId;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Ação inválida' });
    }

    const transaction = await client.transaction.findFirst({
      where: { id, type: 'WITHDRAWAL' },
      include: { user: true }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Saque não encontrado' });
    }

    if (transaction.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Saque já foi processado' });
    }

    let newStatus;
    if (action === 'approve') {
      newStatus = 'COMPLETED';
    } else {
      newStatus = 'REJECTED';
      // Devolver valor ao saldo do usuário
      await client.user.update({
        where: { id: transaction.userId },
        data: { balance: { increment: transaction.amount } }
      });
    }

    await client.transaction.update({
      where: { id },
      data: {
        status: newStatus,
        adminNotes: notes,
        processedBy: adminId,
        processedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        transactionId: id,
        status: newStatus,
        message: action === 'approve' ? 'Saque aprovado' : 'Saque rejeitado'
      }
    });

  } catch (error) {
    console.error('❌ Process withdrawal error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/deposits - Listar todos os depósitos para admin
app.get('/api/admin/deposits', ensureConnection, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = { type: 'DEPOSIT' };
    if (status !== 'all') {
      whereCondition.status = status.toUpperCase();
    }

    const [deposits, total] = await Promise.all([
      client.transaction.findMany({
        where: whereCondition,
        include: {
          user: {
            select: { id: true, name: true, email: true, planType: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      client.transaction.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: {
        deposits,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Admin deposits error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ============================================
// FALLBACK E INICIALIZAÇÃO
// ============================================
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, 'dist', 'index.html');
  try {
    if (require('fs').existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({
        success: false,
        error: 'SPA não encontrado - apenas API disponível',
        availableEndpoints: [
          'GET /health', 'GET /api/test',
          'POST /api/auth/register', 'POST /api/auth/login', 'GET /api/auth/me',
          'GET /api/books', 'GET /api/books/:id',
          'POST /api/payments/deposit', 'GET /api/payments/deposit/:id/status',
          'GET /api/payments/deposits',
          'POST /api/payments/withdrawal', 'GET /api/payments/withdrawals',
          'GET /api/admin/withdrawals', 'PATCH /api/admin/withdrawals/:id',
          'GET /api/admin/deposits',
          'POST /api/webhooks/nivuspay'
        ]
      });
    }
  } catch (error) {
    res.status(404).json({ success: false, error: 'SPA não disponível - apenas API' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log('🎯 ====================================');
  console.log(`🚀 SERVIDOR INICIADO`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
  console.log(`💰 Depósitos: POST http://localhost:${PORT}/api/payments/deposit`);
  console.log(`💸 Saques: POST http://localhost:${PORT}/api/payments/withdrawal`);
  console.log(`🔗 Frontend URL: ${process.env.VITE_API_URL || 'N/A'}`);
  console.log('🎯 ====================================');
  
  // Tentar inicializar Prisma se ainda não foi
  if (!client) {
    console.log('🔄 Inicializando Prisma...');
    try {
      await initializePrisma();
      console.log('✅ Prisma inicializado no startup');
    } catch (error) {
      console.error('❌ Erro na inicialização do Prisma no startup:', error);
    }
  }
  
  console.log('🎉 Servidor iniciado! Sistema de pagamentos NivusPay ativo.');
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Encerrando servidor graciosamente...');
  try {
    if (client) {
      await client.$disconnect();
    }
    console.log('✅ Banco desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Encerrando servidor (SIGTERM)...');
  try {
    if (client) {
      await client.$disconnect();
    }
    console.log('✅ Banco desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('💥 Erro não capturado:', error);
  try {
    if (client) {
      await client.$disconnect();
    }
  } catch (e) {
    console.error('❌ Erro ao desconectar após exceção:', e);
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  try {
    if (client) {
      await client.$disconnect();
    }
  } catch (e) {
    console.error('❌ Erro ao desconectar após rejeição:', e);
  }
  process.exit(1);
});