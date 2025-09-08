// server.js - CORRIGIDO PARA EVITAR ERRO DE PREPARED STATEMENTS
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configuração do Express
const app = express();

// Debug mode
const isDebug = process.env.DEBUG === 'true' || process.env.NODE_ENV === 'development';

if (isDebug) {
  console.log('🔧 Modo DEBUG ativado');
  console.log('📍 NODE_ENV:', process.env.NODE_ENV);
  console.log('📍 VITE_API_URL:', process.env.VITE_API_URL);
  console.log('📍 PORT:', process.env.PORT);
}

// ============================================
// CONFIGURAÇÃO PRISMA CORRIGIDA
// ============================================

// Singleton para evitar múltiplas instâncias
let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL,
        },
      },
      log: isDebug ? ['info', 'warn', 'error'] : ['error', 'warn'],
    });

    // Conectar imediatamente e gerenciar erros
    prisma.$connect()
      .then(() => {
        console.log('✅ Prisma conectado ao banco');
      })
      .catch((error) => {
        console.error('❌ Erro na conexão inicial do Prisma:', error);
      });
  }
  return prisma;
}

// Usar o singleton
const client = getPrismaClient();

// Middleware de conexão simplificado - SEM FLAG DE ESTADO
async function ensureConnection(req, res, next) {
  try {
    // Teste simples de conexão sem queries complexas
    await client.$queryRaw`SELECT 1`;
    next();
  } catch (error) {
    console.error('❌ Erro de conexão:', error.message);
    
    // Em caso de erro, tentar reconectar
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

// ============================================
// MIDDLEWARES BÁSICOS
// ============================================

// CORS configurado para LOCALHOST
app.use(cors({
  origin: process.env.NODE_ENV === 'development' 
    ? [
        'http://localhost:3000', 
        'http://localhost:5173', 
        'http://127.0.0.1:5173',
        'http://localhost:4173'
      ] 
    : ['https://beta-review-website.onrender.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log de requisições em desenvolvimento
if (isDebug) {
  app.use((req, res, next) => {
    console.log(`📞 ${req.method} ${req.path} - Origin: ${req.get('Origin')}`);
    next();
  });
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos apenas se existir a pasta dist
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

// ============================================
// HELPER FUNCTIONS
// ============================================

function generateToken(userId, email, isAdmin = false) {
  return jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function toPublicUser(user) {
  const { passwordHash, salt, ...publicUser } = user;
  return publicUser;
}

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de acesso requerido' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }
    req.user = decoded;
    next();
  });
}

// ============================================
// ROTAS DA API
// ============================================

// Health Check
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

// Diagnóstico simplificado
app.get('/api/test', ensureConnection, async (req, res) => {
  try {
    console.log('=== TESTE DE CONEXÃO ===');
    
    const userCount = await client.user.count();
    console.log('✅ Teste realizado - Usuários:', userCount);
    
    res.json({ 
      success: true, 
      message: 'API funcionando!',
      data: {
        userCount,
        connectionStatus: 'OK',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// POST /api/create-test-user
app.post('/api/create-test-user', ensureConnection, async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(403).json({
        success: false,
        error: 'Disponível apenas em desenvolvimento'
      });
    }

    const existingUser = await client.user.findUnique({
      where: { email: 'test@exemplo.com' }
    });
    
    if (existingUser) {
      return res.json({
        success: true,
        message: 'Usuário de teste já existe',
        data: {
          email: 'test@exemplo.com',
          password: '123456'
        }
      });
    }

    const password = '123456';
    const passwordHash = await bcrypt.hash(password, 12);
    
    const user = await client.user.create({
      data: {
        name: 'Usuário Teste',
        email: 'test@exemplo.com',
        phone: '(11) 99999-9999',
        passwordHash,
        isAdmin: false,
        level: 1,
        balance: 0,
        onboardingCompleted: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    console.log('✅ Usuário de teste criado:', user.email);

    res.json({
      success: true,
      message: 'Usuário de teste criado com sucesso!',
      data: {
        email: 'test@exemplo.com',
        password: '123456',
        id: user.id
      }
    });

  } catch (error) {
    console.error('❌ Erro ao criar usuário de teste:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao criar usuário de teste'
    });
  }
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// POST /api/auth/register
app.post('/api/auth/register', ensureConnection, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (isDebug) {
      console.log('📝 Tentativa de registro:', { name, email, phone: !!phone });
    }

    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome, email e senha são obrigatórios' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }

    const existingUser = await client.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email já está em uso' 
      });
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

    if (isDebug) {
      console.log('✅ Usuário criado:', { id: user.id, email: user.email });
    }

    res.status(201).json({ 
      success: true, 
      data: { user: publicUser, token } 
    });

  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/auth/login  
app.post('/api/auth/login', ensureConnection, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (isDebug) {
      console.log('🔐 Tentativa de login:', { email });
    }

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const user = await client.user.findUnique({
      where: { 
        email: email.toLowerCase()
      }
    });

    if (!user || user.isSuspended) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou senha inválidos' 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou senha inválidos' 
      });
    }

    await client.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIP: req.ip || 'localhost'
      }
    });

    const token = generateToken(user.id, user.email, user.isAdmin);
    const publicUser = toPublicUser(user);

    if (isDebug) {
      console.log('✅ Login realizado:', { id: user.id, email: user.email });
    }

    res.json({ success: true, data: { user: publicUser, token } });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/auth/me
app.get('/api/auth/me', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const user = await client.user.findUnique({
      where: { 
        id: req.user.userId
      }
    });

    if (!user || user.isSuspended) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuário não encontrado' 
      });
    }

    const publicUser = toPublicUser(user);
    res.json({ success: true, data: { user: publicUser } });

  } catch (error) {
    console.error('❌ Auth check error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// ============================================
// ROTAS DE LIVROS
// ============================================

// GET /api/books - Listar todos os livros
app.get('/api/books', ensureConnection, async (req, res) => {
  try {
    const books = await client.book.findMany({
      where: { active: true },
      select: {
        id: true,
        title: true,
        author: true,
        genre: true,
        synopsis: true,
        baseRewardMoney: true,
        requiredLevel: true,
        reviewsCount: true,
        averageRating: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    if (isDebug) {
      console.log(`📚 Retornando ${books.length} livros da API`);
    }

    res.json({ success: true, data: { books } });
  } catch (error) {
    console.error('❌ Books error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar livros'
    });
  }
});

// GET /api/books/:id - Buscar livro específico
app.get('/api/books/:id', ensureConnection, async (req, res) => {
  try {
    const { id } = req.params;
    
    if (isDebug) {
      console.log(`📖 Buscando livro com ID: ${id}`);
    }
    
    // Mapear IDs simples para títulos dos livros do banco
    const bookMapping = {
      '1': 'A Caixa de Pandora',
      '2': 'O Príncipe e a Gata', 
      '3': 'O Banqueiro Anarquista',
      '4': 'De Quanta Terra um Homem Precisa?',
      'book-1': 'A Caixa de Pandora',
      'book-2': 'O Príncipe e a Gata',
      'book-3': 'O Banqueiro Anarquista', 
      'book-4': 'De Quanta Terra um Homem Precisa?'
    };
    
    const bookTitle = bookMapping[id];
    
    if (!bookTitle) {
      return res.status(404).json({
        success: false,
        error: 'Livro não encontrado'
      });
    }
    
    const book = await client.book.findFirst({
      where: { 
        title: bookTitle,
        active: true 
      },
      select: {
        id: true,
        title: true,
        author: true,
        genre: true,
        synopsis: true,
        content: true, // Incluir conteúdo para leitura
        baseRewardMoney: true,
        requiredLevel: true,
        reviewsCount: true,
        averageRating: true,
        estimatedReadTime: true,
        wordCount: true,
        pageCount: true,
        createdAt: true
      }
    });

    if (!book) {
      return res.status(404).json({
        success: false,
        error: 'Livro não encontrado no banco de dados'
      });
    }

    // Converter para formato esperado pelo frontend
    const bookFormatted = {
      ...book,
      id: id, // Usar o ID simples que veio da URL
      rewardMoney: Math.floor((book.baseRewardMoney || 10000) / 100), // Converter centavos para reais
      estimatedReadTime: book.estimatedReadTime ? 
        `${Math.ceil(book.estimatedReadTime / 60)} min` : '10 min'
    };

    if (isDebug) {
      console.log(`📖 Retornando livro ${id}: ${book.title}`);
    }

    res.json({ success: true, data: { book: bookFormatted } });
    
  } catch (error) {
    console.error('❌ Book detail error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar livro'
    });
  }
});

// ============================================
// FALLBACK PARA SPA
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
          'GET /health',
          'GET /api/test',
          'POST /api/auth/register',
          'POST /api/auth/login',
          'GET /api/auth/me',
          'GET /api/books',
          'GET /api/books/:id',
          'POST /api/create-test-user'
        ]
      });
    }
  } catch (error) {
    res.status(404).json({
      success: false,
      error: 'SPA não disponível - apenas API'
    });
  }
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log('🎯 ====================================');
  console.log(`🚀 SERVIDOR LOCALHOST INICIADO`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Create Test User: http://localhost:${PORT}/api/create-test-user`);
  console.log(`🔗 Books: http://localhost:${PORT}/api/books`);
  console.log(`🔗 Book Detail: http://localhost:${PORT}/api/books/:id`);
  console.log(`🔗 Frontend URL: ${process.env.VITE_API_URL || 'N/A'}`);
  console.log('🎯 ====================================');
  console.log('🎉 Servidor iniciado! Conexão com BD gerenciada automaticamente.');
});

// ============================================
// GRACEFUL SHUTDOWN APRIMORADO
// ============================================
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

// Capturar erros não tratados
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