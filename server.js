// server.js - CONFIGURADO PARA LOCALHOST
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

// Configuração do Prisma
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: isDebug ? ['query', 'info', 'warn', 'error'] : ['error', 'warn'],
});

// Função de conexão
let isConnected = false;
async function connectPrisma(retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      if (!isConnected) {
        console.log(`🔄 Tentativa de conexão ${i + 1}/${retries}...`);
        await prisma.$connect();
        
        // Teste simples para verificar conexão
        await prisma.$queryRaw`SELECT 1`;
        
        isConnected = true;
        console.log('✅ Prisma conectado com sucesso');
        return true;
      }
      return true;
    } catch (error) {
      console.error(`❌ Erro na tentativa ${i + 1}:`, error.message);
      isConnected = false;
      
      if (i === retries - 1) {
        console.error('🚨 Falha em todas as tentativas de conexão');
        throw error;
      }
      
      // Aguarda antes da próxima tentativa
      await new Promise(resolve => setTimeout(resolve, 2000 * (i + 1)));
    }
  }
}

// Middleware para garantir conexão
async function ensureConnection(req, res, next) {
  try {
    if (!isConnected) {
      await connectPrisma();
    }
    next();
  } catch (error) {
    console.error('❌ Falha na conexão middleware:', error);
    res.status(503).json({ 
      success: false, 
      error: 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.',
      code: 'DATABASE_CONNECTION_ERROR'
    });
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
    port: process.env.PORT
  });
});

// Diagnóstico completo
app.get('/api/test', async (req, res) => {
  try {
    console.log('=== DIAGNÓSTICO LOCALHOST ===');
    
    // 1. Verificar variáveis de ambiente
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_preview: process.env.DATABASE_URL?.substring(0, 30) + '...',
      hasJWT_SECRET: !!process.env.JWT_SECRET,
      PORT: process.env.PORT,
      VITE_API_URL: process.env.VITE_API_URL
    };
    console.log('📋 ENV:', envCheck);
    
    // 2. Testar conexão
    console.log('🔄 Testando conexão...');
    isConnected = false;
    await connectPrisma();
    
    // 3. Teste de query
    console.log('🔄 Testando query...');
    const userCount = await prisma.user.count();
    console.log('✅ Query OK - Usuários:', userCount);
    
    // 4. Teste de tempo
    const rawTest = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Raw query OK:', rawTest);
    
    res.json({ 
      success: true, 
      message: 'API Localhost funcionando!',
      data: {
        environment: envCheck,
        userCount,
        databaseTime: rawTest,
        connectionStatus: 'OK',
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Erro no diagnóstico:', error);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      errorType: error.constructor.name,
      details: isDebug ? error.stack : undefined
    });
  }
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// POST /api/auth/register - Registro de usuário
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

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email já está em uso' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        passwordHash,
        isAdmin: false,
        level: 1,
        balance: 0,
        reviewsCount: 0,
        averageRating: 0,
        onboardingCompleted: false,
        isActive: true,
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

// POST /api/auth/login - Login de usuário
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

    const user = await prisma.user.findUnique({
      where: { 
        email: email.toLowerCase(),
        isActive: true 
      }
    });

    if (!user) {
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

    // Atualizar último login
    await prisma.user.update({
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

// GET /api/auth/me - Verificar usuário autenticado
app.get('/api/auth/me', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { 
        id: req.user.userId,
        isActive: true 
      }
    });

    if (!user) {
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

// GET /api/books - Listar livros
app.get('/api/books', ensureConnection, async (req, res) => {
  try {
    const books = await prisma.book.findMany({
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

    res.json({ success: true, data: { books } });
  } catch (error) {
    console.error('❌ Books error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar livros'
    });
  }
});

// ============================================
// FALLBACK PARA SPA
// ============================================

// Todas as outras rotas retornam o React app (se dist existir)
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
          'GET /api/books'
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

app.listen(PORT, async () => {
  console.log('🎯 ====================================');
  console.log(`🚀 SERVIDOR LOCALHOST INICIADO`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
  console.log(`🔗 Frontend URL: ${process.env.VITE_API_URL || 'N/A'}`);
  console.log('🎯 ====================================');
  
  // Tentativa inicial de conexão
  try {
    await connectPrisma();
    console.log('🎉 Servidor e banco conectados com sucesso!');
  } catch (error) {
    console.error('⚠️  Servidor iniciado, mas sem conexão com BD.');
    console.error('💡 As tentativas de conexão serão feitas nas requisições.');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Desconectando do banco...');
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Desconectando do banco...');
  await prisma.$disconnect();
  process.exit(0);
});