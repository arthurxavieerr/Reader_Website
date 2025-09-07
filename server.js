// server.js - VERSÃO COMPLETA COM AUTENTICAÇÃO
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configuração do Express
const app = express();

// Configuração melhorada do Prisma para Render
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
  errorFormat: 'minimal',
});

// Estado de conexão
let isConnected = false;

// Função para conectar ao Prisma com retry
async function connectPrisma(retries = 3) {
  if (!isConnected) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔄 Tentativa de conexão ${attempt}/${retries}...`);
        await prisma.$connect();
        console.log('✅ Conectado ao banco de dados');
        isConnected = true;
        return;
      } catch (error) {
        console.error(`❌ Erro na tentativa ${attempt}:`, error.message);
        
        if (attempt === retries) {
          console.error('❌ Todas as tentativas de conexão falharam');
          throw error;
        }
        
        console.log(`⏳ Aguardando ${attempt * 2} segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
}

// Middlewares
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
// FUNÇÕES UTILITÁRIAS
// ============================================

// Função para gerar JWT
function generateToken(userId, email, isAdmin = false) {
  return jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// Função para autenticar requests
function authenticateRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Função para remover dados sensíveis do usuário
function toPublicUser(user) {
  const { passwordHash, salt, ...publicUser } = user;
  return {
    ...publicUser,
    createdAt: user.createdAt?.toISOString?.() || user.createdAt,
    lastLoginAt: user.lastLoginAt?.toISOString?.() || user.lastLoginAt,
  };
}

// ============================================
// ROTAS DA API
// ============================================

// GET /api/test - Rota de teste
app.get('/api/test', async (req, res) => {
  try {
    console.log('=== TESTE DE CONFIGURAÇÃO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
    console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
    console.log('PORT:', process.env.PORT);
    
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      port: process.env.PORT,
      timestamp: new Date().toISOString()
    };

    // Teste de conexão com banco (sem falhar se não conectar)
    try {
      await connectPrisma();
      const userCount = await prisma.user.count();
      environmentInfo.databaseConnection = 'success';
      environmentInfo.userCount = userCount;
    } catch (dbError) {
      environmentInfo.databaseConnection = 'failed';
      environmentInfo.databaseError = dbError.message;
    }
    
    res.json({ 
      success: true, 
      message: 'API funcionando!',
      environment: environmentInfo
    });
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

// POST /api/auth/register - Registrar usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    await connectPrisma();
    
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Todos os campos são obrigatórios' 
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
        phone: phone.trim(),
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
    
    // Resetar conexão em caso de erro
    isConnected = false;
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/auth/login - Login usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    await connectPrisma();
    
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
        lastLoginIP: req.ip || 'unknown'
      }
    });

    const token = generateToken(user.id, user.email, user.isAdmin);
    const publicUser = toPublicUser(user);

    res.json({ success: true, data: { user: publicUser, token } });
  } catch (error) {
    console.error('Login error:', error);
    
    // Resetar conexão em caso de erro
    isConnected = false;
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// GET /api/auth/me - Verificar usuário autenticado
app.get('/api/auth/me', async (req, res) => {
  try {
    const decoded = authenticateRequest(req);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    await connectPrisma();

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
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
    console.error('Me error:', error);
    
    // Resetar conexão em caso de erro
    isConnected = false;
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/auth/complete-onboarding - Completar onboarding
app.post('/api/auth/complete-onboarding', async (req, res) => {
  try {
    const decoded = authenticateRequest(req);
    
    if (!decoded) {
      return res.status(401).json({ 
        success: false, 
        error: 'Token inválido' 
      });
    }

    await connectPrisma();
    
    const { commitment, incomeRange } = req.body;

    if (!commitment || !incomeRange) {
      return res.status(400).json({ 
        success: false, 
        error: 'Commitment e incomeRange são obrigatórios' 
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: decoded.userId },
      data: {
        commitment: commitment.toUpperCase(),
        incomeRange: incomeRange.toUpperCase(),
        onboardingCompleted: true
      }
    });

    const publicUser = toPublicUser(updatedUser);
    res.json({ success: true, data: { user: publicUser } });
  } catch (error) {
    console.error('Complete onboarding error:', error);
    
    // Resetar conexão em caso de erro
    isConnected = false;
    
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
app.get('/api/books', async (req, res) => {
  try {
    await connectPrisma();
    
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
    
    // Resetar conexão em caso de erro
    isConnected = false;
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar livros' 
    });
  }
});

// GET /api/books/:id - Buscar livro individual
app.get('/api/books/:id', async (req, res) => {
  try {
    await connectPrisma();
    
    const { id } = req.params;
    
    const book = await prisma.book.findFirst({
      where: { 
        id: id,
        active: true 
      },
      select: {
        id: true,
        title: true,
        author: true,
        genre: true,
        synopsis: true,
        baseRewardMoney: true,
        rewardPoints: true,
        requiredLevel: true,
        reviewsCount: true,
        averageRating: true,
        estimatedReadTime: true,
        wordCount: true,
        pageCount: true,
        isInitialBook: true,
        createdAt: true
      }
    });

    if (!book) {
      return res.status(404).json({ 
        success: false, 
        error: 'Livro não encontrado' 
      });
    }

    res.json({ success: true, data: { book } });
  } catch (error) {
    console.error('Book by ID error:', error);
    
    // Resetar conexão em caso de erro
    isConnected = false;
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// ============================================
// CATCH-ALL PARA REACT APP
// ============================================

// Todas as outras rotas retornam o React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================
const PORT = process.env.PORT || 3001;

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
  console.error('Erro não capturado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Iniciar servidor
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Test: https://beta-review-website.onrender.com/api/test`);
  console.log(`🏥 Health Check: https://beta-review-website.onrender.com/health`);
  
  // Tentar conectar ao banco APÓS o servidor estar rodando
  setTimeout(async () => {
    console.log('🔄 Iniciando conexão com banco...');
    try {
      await connectPrisma();
    } catch (error) {
      console.error('⚠️ Conexão inicial com banco falhou, tentará reconectar nas próximas requisições');
    }
  }, 1000);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`🔔 Recebido sinal ${signal}, iniciando shutdown graceful...`);
  
  server.close(async () => {
    console.log('🔌 Fechando conexões de rede...');
    
    try {
      await prisma.$disconnect();
      console.log('🔌 Desconectado do banco');
    } catch (error) {
      console.error('❌ Erro ao desconectar do banco:', error);
    }
    
    console.log('✅ Shutdown completo');
    process.exit(0);
  });
  
  // Forçar saída após 10 segundos
  setTimeout(() => {
    console.error('❌ Forçando saída após timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Capturar erros não tratados
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  if (reason?.message?.includes('database') || reason?.message?.includes('Prisma')) {
    isConnected = false;
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});