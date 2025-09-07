// server.js - CONFIGURAÇÃO MELHORADA PARA RENDER + SUPABASE
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
  // Configurações específicas para produção no Render
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
        
        // Aguarda antes da próxima tentativa
        console.log(`⏳ Aguardando ${attempt * 2} segundos antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, attempt * 2000));
      }
    }
  }
}

// Middlewares
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://beta-review-website.onrender.com', 'https://your-app.onrender.com'] 
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

// GET /api/test - Rota de teste melhorada
app.get('/api/test', async (req, res) => {
  try {
    console.log('=== TESTE DE CONFIGURAÇÃO DETALHADO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL primeiros 50 chars:', process.env.DATABASE_URL?.substring(0, 50) + '...');
    console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
    console.log('PORT:', process.env.PORT);
    
    // Informações sobre o ambiente
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      port: process.env.PORT,
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      platform: process.platform
    };

    // Teste de conexão com banco
    try {
      await connectPrisma();
      console.log('✅ Conexão com banco OK');
      
      // Teste uma query simples
      const userCount = await prisma.user.count();
      console.log('✅ Query OK - Usuários:', userCount);
      
      environmentInfo.databaseConnection = 'success';
      environmentInfo.userCount = userCount;
      
    } catch (dbError) {
      console.error('❌ Erro de banco específico:', dbError);
      environmentInfo.databaseConnection = 'failed';
      environmentInfo.databaseError = dbError.message;
    }
    
    res.json({ 
      success: true, 
      message: 'API funcionando!',
      environment: environmentInfo
    });
    
  } catch (error) {
    console.error('❌ Erro geral no teste:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Health check para o Render
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// GET /api/books - Listar livros com tratamento de erro melhorado
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
      error: 'Erro ao buscar livros',
      retryable: true
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

// Middleware de tratamento de erros global
app.use((error, req, res, next) => {
  console.error('Erro não capturado:', error);
  res.status(500).json({
    success: false,
    error: 'Erro interno do servidor'
  });
});

// Iniciar servidor SEM conectar ao banco imediatamente
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📱 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🔗 API Test: https://beta-review-website.onrender.com/api/test`);
  console.log(`🏥 Health Check: https://beta-review-website.onrender.com/health`);
  
  // Conectar ao banco APÓS o servidor estar rodando
  setTimeout(async () => {
    console.log('🔄 Iniciando conexão com banco...');
    try {
      await connectPrisma();
    } catch (error) {
      console.error('⚠️ Conexão inicial com banco falhou, tentará reconectar nas próximas requisições');
    }
  }, 1000);
});

// Graceful shutdown melhorado
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
  // Reset conexão em caso de erro de banco
  if (reason?.message?.includes('database') || reason?.message?.includes('Prisma')) {
    isConnected = false;
  }
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});