const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

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
  createdAt: user.createdAt.toISOString(),
});

// Rotas da API

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
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/register - Registrar usuário
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !phone || !password) {
      return res.status(400).json({ success: false, error: 'Todos os campos são obrigatórios' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, error: 'Senha deve ter pelo menos 6 caracteres' });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ success: false, error: 'Email já está em uso' });
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
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// POST /api/auth/login - Login usuário
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Email e senha são obrigatórios' });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }

    if (user.isSuspended) {
      return res.status(403).json({ 
        success: false, 
        error: `Conta suspensa: ${user.suspendedReason || 'Violação dos termos de uso'}` 
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
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
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/auth/me - Dados do usuário autenticado
app.get('/api/auth/me', async (req, res) => {
  try {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const publicUser = toPublicUser(user);
    res.json({ success: true, data: { user: publicUser } });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log(`📚 Teste: http://localhost:${PORT}/api/books`);
});

// Lidar com shutdown graceful
process.on('SIGINT', async () => {
  console.log('Desconectando do banco...');
  await prisma.$disconnect();
  process.exit(0);
});