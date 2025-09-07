// server.js - AJUSTADO PARA RENDER
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

// Configuração do Express
const app = express();

// Configuração do Prisma com pooling
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Middlewares
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-app.onrender.com'] // Substitua pelo seu domínio do Render
    : ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Servir arquivos estáticos (React build)
app.use(express.static(path.join(__dirname, 'dist')));

// ============================================
// ROTAS DA API
// ============================================

// GET /api/test - Rota de teste
app.get('/api/test', async (req, res) => {
  try {
    console.log('=== TESTE DE CONFIGURAÇÃO ===');
    console.log('NODE_ENV:', process.env.NODE_ENV);
    console.log('DATABASE_URL existe:', !!process.env.DATABASE_URL);
    console.log('DATABASE_URL length:', process.env.DATABASE_URL?.length);
    console.log('JWT_SECRET existe:', !!process.env.JWT_SECRET);
    console.log('PORT:', process.env.PORT);
    
    // Teste de conexão com banco
    await prisma.$connect();
    console.log('✅ Conexão com banco OK');
    
    // Teste uma query simples
    const userCount = await prisma.user.count();
    console.log('✅ Query OK - Usuários:', userCount);
    
    res.json({ 
      success: true, 
      message: 'API funcionando!',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasJwtSecret: !!process.env.JWT_SECRET,
        userCount,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    console.error('Erro completo:', error.stack);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      details: error.stack
    });
  }
});

// GET /api/books - Listar livros
app.get('/api/books', async (req, res) => {
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
    
    // Tenta reconectar em caso de erro
    isConnected = false;
    try {
      await connectPrisma();
      const book = await prisma.book.findFirst({
        where: { 
          id: req.params.id,
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
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar livro' 
      });
    }
  }
});

// GET /api/books/:id/content - Buscar conteúdo do livro
app.get('/api/books/:id/content', async (req, res) => {
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
        content: true
      }
    });

    if (!book) {
      return res.status(404).json({ 
        success: false, 
        error: 'Livro não encontrado' 
      });
    }

    if (!book.content) {
      return res.status(404).json({ 
        success: false, 
        error: 'Conteúdo do livro não encontrado' 
      });
    }

    res.json({ 
      success: true, 
      data: { 
        content: book.content,
        title: book.title,
        author: book.author
      } 
    });
  } catch (error) {
    console.error('Book content error:', error);
    
    // Tenta reconectar em caso de erro
    isConnected = false;
    try {
      await connectPrisma();
      const book = await prisma.book.findFirst({
        where: { 
          id: req.params.id,
          active: true 
        },
        select: {
          id: true,
          title: true,
          author: true,
          content: true
        }
      });
      
      if (!book) {
        return res.status(404).json({ 
          success: false, 
          error: 'Livro não encontrado' 
        });
      }

      if (!book.content) {
        return res.status(404).json({ 
          success: false, 
          error: 'Conteúdo do livro não encontrado' 
        });
      }
      
      res.json({ 
        success: true, 
        data: { 
          content: book.content,
          title: book.title,
          author: book.author
        } 
      });
    } catch (retryError) {
      console.error('Retry failed:', retryError);
      res.status(500).json({ 
        success: false, 
        error: 'Erro ao buscar conteúdo do livro' 
      });
    }
  }
});

// Funções utilitárias
function generateToken(userId, email, isAdmin) {
  return jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

function authenticateRequest(req) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded || typeof decoded === 'string') return null;
  
  return decoded;
}

const toPublicUser = (user) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  level: user.level,
  points: user.points,
  balance: user.balance,
  planType: user.planType.toLowerCase(),
  isAdmin: user.isAdmin,
  onboardingCompleted: user.onboardingCompleted,
  commitment: user.commitment?.toLowerCase(),
  incomeRange: user.incomeRange?.toLowerCase(),
  profileImage: user.profileImage,
  isSuspended: user.isSuspended,
  suspendedReason: user.suspendedReason,
  createdAt: user.createdAt.toISOString(),
  lastLoginAt: user.lastLoginAt?.toISOString(),
});

// POST /api/auth/register - Registrar usuário
app.post('/api/auth/register', async (req, res) => {
  try {
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
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor' 
    });
  }
});

// POST /api/auth/login - Login usuário
app.post('/api/auth/login', async (req, res) => {
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
  console.log(`🔗 API Test: http://localhost:${PORT}/api/test`);
  
  // Conectar ao banco na inicialização
  await connectPrisma();
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