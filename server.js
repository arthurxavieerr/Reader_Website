// server.js - VERSÃO COMPLETA COM SISTEMA DE PAGAMENTOS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const nivusPayService = require('./src/services/nivusPayService');

// Configuração do Express
const app = express();
const isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

// Configuração Prisma
let prisma;
function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: { db: { url: process.env.DATABASE_URL } },
      log: isDebug ? ['info', 'warn', 'error'] : ['error', 'warn'],
    });
    prisma.$connect()
      .then(() => console.log('✅ Prisma conectado ao banco'))
      .catch((error) => console.error('❌ Erro na conexão inicial do Prisma:', error));
  }
  return prisma;
}

const client = getPrismaClient();

// Middleware de conexão
async function ensureConnection(req, res, next) {
  try {
    await client.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    try {
      await client.$disconnect();
      await client.$connect();
      next();
    } catch (reconnectError) {
      console.error('❌ Erro na reconexão:', reconnectError.message);
      res.status(503).json({ 
        success: false, 
        error: 'Serviço temporariamente indisponível.',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
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

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: 'Token de acesso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, error: 'Token inválido' });
    }
    req.user = decoded;
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
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'API Online - LOCALHOST',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT,
    database: 'Connected'
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
// ROTAS DE AUTENTICAÇÃO (MANTIDAS)
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
// ROTAS DE LIVROS (MANTIDAS)
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
  try {
    const { amount } = req.body; // valor em centavos
    const userId = req.user.userId;

    if (!amount || amount < 100) { // mínimo R$ 1,00
      return res.status(400).json({ success: false, error: 'Valor mínimo para depósito é R$ 1,00' });
    }

    if (amount > 100000) { // máximo R$ 1.000,00
      return res.status(400).json({ success: false, error: 'Valor máximo para depósito é R$ 1.000,00' });
    }

    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Criar transação no banco
    const transaction = await client.transaction.create({
      data: {
        userId,
        type: 'DEPOSIT',
        status: 'PENDING',
        amount,
        currency: 'BRL'
      }
    });

    // Criar pagamento no NivusPay
    const paymentResult = await nivusPayService.createPixPayment({
      amount,
      userId,
      transactionId: transaction.id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerDocument: user.phone, // Ajustar conforme necessário
      description: `Depósito de R$ ${(amount / 100).toFixed(2)}`
    });

    if (!paymentResult.success) {
      // Marcar transação como falhou
      await client.transaction.update({
        where: { id: transaction.id },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({
        success: false,
        error: 'Erro ao criar pagamento: ' + paymentResult.error
      });
    }

    // Atualizar transação com dados do NivusPay
    await client.transaction.update({
      where: { id: transaction.id },
      data: {
        nivusPayId: paymentResult.data.id,
        pixQrCode: paymentResult.data.qrCode,
        pixTxId: paymentResult.data.qrCodeText,
        nivusPayResponse: paymentResult.data
      }
    });

    res.json({
      success: true,
      data: {
        transactionId: transaction.id,
        qrCode: paymentResult.data.qrCode,
        qrCodeText: paymentResult.data.qrCodeText,
        amount,
        expiresAt: paymentResult.data.expiresAt,
        pixKey: paymentResult.data.pixKey
      }
    });

  } catch (error) {
    console.error('❌ Deposit error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/payments/deposit/:id - Consultar status do depósito
app.get('/api/payments/deposit/:id', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    const transaction = await client.transaction.findFirst({
      where: { id, userId, type: 'DEPOSIT' }
    });

    if (!transaction) {
      return res.status(404).json({ success: false, error: 'Transação não encontrada' });
    }

    // Consultar status no NivusPay se necessário
    if (transaction.nivusPayId && transaction.status === 'PENDING') {
      const statusResult = await nivusPayService.getPaymentStatus(transaction.nivusPayId);
      
      if (statusResult.success) {
        const nivusStatus = statusResult.data.status;
        let newStatus = transaction.status;

        // Mapear status do NivusPay para nosso sistema
        if (nivusStatus === 'paid' || nivusStatus === 'completed') {
          newStatus = 'COMPLETED';
          
          // Adicionar valor ao saldo do usuário
          await client.user.update({
            where: { id: userId },
            data: { balance: { increment: transaction.amount } }
          });
        } else if (nivusStatus === 'failed' || nivusStatus === 'cancelled') {
          newStatus = 'FAILED';
        }

        // Atualizar status da transação
        if (newStatus !== transaction.status) {
          await client.transaction.update({
            where: { id: transaction.id },
            data: { 
              status: newStatus,
              nivusPayStatus: nivusStatus,
              processedAt: new Date()
            }
          });
          transaction.status = newStatus;
        }
      }
    }

    res.json({
      success: true,
      data: {
        id: transaction.id,
        status: transaction.status,
        amount: transaction.amount,
        createdAt: transaction.createdAt,
        processedAt: transaction.processedAt
      }
    });

  } catch (error) {
    console.error('❌ Deposit status error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
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
// ROTAS DE PAGAMENTO - PLANOS
// ============================================

// POST /api/payments/plan - Comprar plano premium
app.post('/api/payments/plan', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const { planType } = req.body;
    const userId = req.user.userId;

    if (planType !== 'PREMIUM') {
      return res.status(400).json({ success: false, error: 'Tipo de plano inválido' });
    }

    const user = await client.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    if (user.planType === 'PREMIUM') {
      return res.status(400).json({ success: false, error: 'Usuário já possui plano premium' });
    }

    // Verificar se há compra pendente
    const pendingPurchase = await client.planPurchase.findFirst({
      where: {
        userId,
        status: { in: ['PENDING', 'PROCESSING'] }
      }
    });

    if (pendingPurchase) {
      return res.status(400).json({
        success: false,
        error: 'Você já possui uma compra de plano pendente'
      });
    }

    const amount = 2990; // R$ 29,90

    // Criar compra de plano
    const planPurchase = await client.planPurchase.create({
      data: {
        userId,
        planType,
        amount,
        status: 'PENDING'
      }
    });

    // Criar pagamento no NivusPay
    const paymentResult = await nivusPayService.createPlanPayment({
      planType,
      userId,
      planPurchaseId: planPurchase.id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: user.phone,
      customerDocument: user.phone // Ajustar conforme necessário
    });

    if (!paymentResult.success) {
      await client.planPurchase.update({
        where: { id: planPurchase.id },
        data: { status: 'FAILED' }
      });

      return res.status(400).json({
        success: false,
        error: 'Erro ao criar pagamento: ' + paymentResult.error
      });
    }

    // Atualizar compra com dados do NivusPay
    await client.planPurchase.update({
      where: { id: planPurchase.id },
      data: {
        nivusPayId: paymentResult.data.id,
        pixQrCode: paymentResult.data.qrCode,
        nivusPayResponse: paymentResult.data
      }
    });

    res.json({
      success: true,
      data: {
        purchaseId: planPurchase.id,
        qrCode: paymentResult.data.qrCode,
        qrCodeText: paymentResult.data.qrCodeText,
        amount,
        expiresAt: paymentResult.data.expiresAt,
        message: 'Após o pagamento, o plano será ativado manualmente pelo administrador.'
      }
    });

  } catch (error) {
    console.error('❌ Plan purchase error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
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

// GET /api/admin/plan-purchases - Listar compras de plano para admin
app.get('/api/admin/plan-purchases', ensureConnection, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const whereCondition = {};
    if (status !== 'all') {
      whereCondition.status = status.toUpperCase();
    }

    const [purchases, total] = await Promise.all([
      client.planPurchase.findMany({
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
      client.planPurchase.count({ where: whereCondition })
    ]);

    res.json({
      success: true,
      data: {
        purchases,
        total,
        page: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('❌ Admin plan purchases error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/plan-purchases/:id - Ativar plano manualmente
app.patch('/api/admin/plan-purchases/:id', ensureConnection, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body; // action: 'activate' | 'reject'
    const adminId = req.user.userId;

    if (!['activate', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: 'Ação inválida' });
    }

    const purchase = await client.planPurchase.findFirst({
      where: { id },
      include: { user: true }
    });

    if (!purchase) {
      return res.status(404).json({ success: false, error: 'Compra não encontrada' });
    }

    if (purchase.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Compra já foi processada' });
    }

    let newStatus;
    if (action === 'activate') {
      newStatus = 'COMPLETED';
      
      // Ativar plano premium no usuário
      await client.user.update({
        where: { id: purchase.userId },
        data: { planType: purchase.planType }
      });
    } else {
      newStatus = 'REJECTED';
    }

    await client.planPurchase.update({
      where: { id },
      data: {
        status: newStatus,
        adminNotes: notes,
        activatedBy: adminId,
        activatedAt: new Date()
      }
    });

    res.json({
      success: true,
      data: {
        purchaseId: id,
        status: newStatus,
        message: action === 'activate' ? 'Plano ativado com sucesso' : 'Compra rejeitada'
      }
    });

  } catch (error) {
    console.error('❌ Activate plan error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ============================================
// WEBHOOK NIVUSPAY
// ============================================
app.post('/api/webhooks/nivuspay', express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-nivuspay-signature'];
    const payload = req.body.toString();

    // Validar webhook
    if (!nivusPayService.validateWebhook(payload, signature)) {
      return res.status(401).json({ success: false, error: 'Webhook inválido' });
    }

    // Processar webhook
    const webhookResult = nivusPayService.processWebhook(payload);
    if (!webhookResult.success) {
      return res.status(400).json({ success: false, error: 'Erro ao processar webhook' });
    }

    const { eventType, paymentId, status, metadata } = webhookResult.data;

    console.log(`📞 Webhook NivusPay: ${eventType} - ${paymentId} - ${status}`);

    // Processar evento baseado no tipo
    if (eventType === 'payment.status_changed' && status === 'paid') {
      
      if (metadata.type === 'deposit') {
        // Processar depósito
        const transaction = await client.transaction.findFirst({
          where: { nivusPayId: paymentId, type: 'DEPOSIT' }
        });

        if (transaction && transaction.status === 'PENDING') {
          await client.transaction.update({
            where: { id: transaction.id },
            data: { status: 'COMPLETED', processedAt: new Date() }
          });

          await client.user.update({
            where: { id: transaction.userId },
            data: { balance: { increment: transaction.amount } }
          });

          console.log(`✅ Depósito confirmado: ${transaction.id}`);
        }
      }
      
      else if (metadata.type === 'plan_purchase') {
        // Marcar compra de plano como paga (ainda precisa ativação manual)
        const purchase = await client.planPurchase.findFirst({
          where: { nivusPayId: paymentId }
        });

        if (purchase && purchase.status === 'PENDING') {
          await client.planPurchase.update({
            where: { id: purchase.id },
            data: { status: 'PROCESSING' } // Aguardando ativação manual
          });

          console.log(`✅ Pagamento de plano confirmado: ${purchase.id}`);
        }
      }
    }

    res.json({ success: true, message: 'Webhook processado' });

  } catch (error) {
    console.error('❌ Webhook error:', error);
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
          'POST /api/payments/deposit', 'GET /api/payments/deposit/:id',
          'POST /api/payments/withdrawal', 'GET /api/payments/withdrawals',
          'POST /api/payments/plan',
          'GET /api/admin/withdrawals', 'PATCH /api/admin/withdrawals/:id',
          'GET /api/admin/plan-purchases', 'PATCH /api/admin/plan-purchases/:id',
          'POST /api/webhooks/nivuspay'
        ]
      });
    }
  } catch (error) {
    res.status(404).json({ success: false, error: 'SPA não disponível - apenas API' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🎯 ====================================');
  console.log(`🚀 SERVIDOR LOCALHOST INICIADO`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
  console.log(`💰 Depósitos: POST http://localhost:${PORT}/api/payments/deposit`);
  console.log(`💸 Saques: POST http://localhost:${PORT}/api/payments/withdrawal`);
  console.log(`⭐ Planos: POST http://localhost:${PORT}/api/payments/plan`);
  console.log(`🔗 Frontend URL: ${process.env.VITE_API_URL || 'N/A'}`);
  console.log('🎯 ====================================');
  console.log('🎉 Servidor iniciado! Sistema de pagamentos NivusPay ativo.');
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Encerrando servidor graciosamente...');
  try {
    await client.$disconnect();
    console.log('✅ Banco desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Encerrando servidor (SIGTERM)...');
  try {
    await client.$disconnect();
    console.log('✅ Banco desconectado');
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('💥 Erro não capturado:', error);
  try {
    await client.$disconnect();
  } catch (e) {
    console.error('❌ Erro ao desconectar após exceção:', e);
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  try {
    await client.$disconnect();
  } catch (e) {
    console.error('❌ Erro ao desconectar após rejeição:', e);
  }
  process.exit(1);
});