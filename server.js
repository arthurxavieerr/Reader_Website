// server.js - VERSÃO MELHORADA COM RETRY E TIMEOUT
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configuração do Express
const app = express();

// Configuração do Prisma com timeout e retry
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  // Configurações de conexão mais robustas
  __internal: {
    engine: {
      connectionTimeout: 10000, // 10 segundos
      queryTimeout: 10000,      // 10 segundos
    }
  }
});

// Função de conexão com retry
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

// Middlewares básicos
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://beta-review-website.onrender.com'] 
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (React build)
app.use(express.static(path.join(__dirname, 'dist')));

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

// ============================================
// ROTAS DA API
// ============================================

// Health Check - SEM middleware de conexão
app.get('/health', (req, res) => {
  res.json({ 
    success: true, 
    status: 'API Online',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// GET /api/test - Diagnóstico completo
app.get('/api/test', async (req, res) => {
  try {
    console.log('=== DIAGNÓSTICO COMPLETO ===');
    
    // 1. Verificar variáveis de ambiente
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV,
      hasDATABASE_URL: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length,
      hasJWT_SECRET: !!process.env.JWT_SECRET,
      PORT: process.env.PORT
    };
    console.log('ENV:', envCheck);
    
    // 2. Testar conexão forçada
    console.log('🔄 Forçando nova conexão...');
    isConnected = false;
    await connectPrisma();
    
    // 3. Teste de query
    console.log('🔄 Testando query...');
    const userCount = await prisma.user.count();
    console.log('✅ Query OK - Usuários:', userCount);
    
    // 4. Teste de conexão raw
    const rawTest = await prisma.$queryRaw`SELECT NOW() as current_time`;
    console.log('✅ Raw query OK:', rawTest);
    
    res.json({ 
      success: true, 
      message: 'Todos os testes passaram!',
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
    
    // Log detalhado do erro
    console.error('Tipo do erro:', error.constructor.name);
    console.error('Código do erro:', error.code);
    console.error('Stack:', error.stack);
    
    res.status(500).json({ 
      success: false, 
      error: error.message,
      errorType: error.constructor.name,
      errorCode: error.code,
      details: error.stack,
      environment: {
        NODE_ENV: process.env.NODE_ENV,
        hasDatabase: !!process.env.DATABASE_URL
      }
    });
  }
});

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
    console.error('Books error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar livros'
    });
  }
});

// POST /api/auth/register - Registro de usuário
app.post('/api/auth/register', ensureConnection, async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

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

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim(),
        passwordHash,
        salt,
        lastLoginIP: req.ip || 'unknown'
      }
    });

    const token = generateToken(newUser.id, newUser.email, newUser.isAdmin);
    const publicUser = toPublicUser(newUser);

    res.json({ success: true, data: { user: publicUser, token } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/auth/login - Login usuário
app.post('/api/auth/login', ensureConnection, async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Email e senha são obrigatórios' 
      });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Email ou senha inválidos' 
      });
    }

    if (user.isSuspended) {
      return res.status(403).json({ 
        success: false, 
        error: `Conta suspensa: ${user.suspendedReason || 'Violação dos termos de uso'}` 
      });
    }

    if (!user.passwordHash) {
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

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIP: req.ip || 'unknown'
      }
    });

    const token = generateToken(user.id, user.email, user.isAdmin);
    const publicUser = toPublicUser(user);

    res.json({ success: true, data: { user: publicUser, token } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// Todas as outras rotas retornam o React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/health`);
  console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
  
  // Tentativa inicial de conexão
  try {
    await connectPrisma();
    console.log('🎉 Servidor inicializado com sucesso!');
  } catch (error) {
    console.error('⚠️  Servidor iniciado, mas sem conexão com BD. Tentativas serão feitas nas requisições.');
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