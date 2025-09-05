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
  isSuspended: user.isSuspended,
  suspendedReason: user.suspendedReason,
  createdAt: user.createdAt.toISOString(),
  lastLoginAt: user.lastLoginAt?.toISOString(),
});

// Middleware para verificar se é admin
const requireAdmin = async (req, res, next) => {
  try {
    const authUser = authenticateRequest(req);
    if (!authUser) {
      return res.status(401).json({ success: false, error: 'Usuário não autenticado' });
    }

    const user = await prisma.user.findUnique({
      where: { id: authUser.userId }
    });

    if (!user || !user.isAdmin) {
      return res.status(403).json({ success: false, error: 'Acesso negado - apenas administradores' });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error('Erro ao verificar admin:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
};

// Função para log de ações administrativas
const logAdminAction = async (adminId, adminName, action, targetId = null, targetType = null, details = null, req) => {
  try {
    await prisma.adminLog.create({
      data: {
        adminId,
        adminName,
        action,
        targetId,
        targetType,
        details: details ? JSON.stringify(details) : null,
        ipAddress: req.ip || 'unknown',
        userAgent: req.get('User-Agent') || null,
      }
    });
  } catch (error) {
    console.error('Erro ao criar log administrativo:', error);
  }
};

// ============================================
// ROTAS PÚBLICAS
// ============================================

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

// ============================================
// ROTAS DE AUTENTICAÇÃO
// ============================================

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

// ============================================
// ROTAS ADMINISTRATIVAS
// ============================================

// GET /api/admin/dashboard - Estatísticas gerais
app.get('/api/admin/dashboard', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    
    // Log da ação
    await logAdminAction(admin.id, admin.name, 'VIEW_ANALYTICS', null, 'dashboard', null, req);

    // Buscar estatísticas em paralelo
    const [
      totalUsers,
      activeUsers,
      premiumUsers,
      suspendedUsers,
      totalWithdrawals,
      pendingWithdrawals,
      approvedWithdrawals,
      rejectedWithdrawals,
      totalReadingSessions,
      recentReadingSessions,
      totalBooks,
      activeBooks
    ] = await Promise.all([
      // Usuários
      prisma.user.count(),
      prisma.user.count({ 
        where: { 
          lastLoginAt: { 
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) 
          } 
        } 
      }),
      prisma.user.count({ where: { planType: 'PREMIUM' } }),
      prisma.user.count({ where: { isSuspended: true } }),
      
      // Saques (só se a tabela existir)
      prisma.withdrawal ? prisma.withdrawal.aggregate({ _sum: { amount: true } }).catch(() => ({ _sum: { amount: 0 } })) : Promise.resolve({ _sum: { amount: 0 } }),
      prisma.withdrawal ? prisma.withdrawal.count({ where: { status: 'PENDING' } }).catch(() => 0) : Promise.resolve(0),
      prisma.withdrawal ? prisma.withdrawal.count({ where: { status: 'APPROVED' } }).catch(() => 0) : Promise.resolve(0),
      prisma.withdrawal ? prisma.withdrawal.count({ where: { status: 'REJECTED' } }).catch(() => 0) : Promise.resolve(0),
      
      // Sessões de leitura (só se a tabela existir)
      prisma.readingSession ? prisma.readingSession.count().catch(() => 0) : Promise.resolve(0),
      prisma.readingSession ? prisma.readingSession.count({
        where: {
          startedAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }
      }).catch(() => 0) : Promise.resolve(0),
      
      // Livros
      prisma.book.count(),
      prisma.book.count({ where: { active: true } })
    ]);

    // Calcular receita estimada (premium users * preço)
    const premiumPrice = 2990; // R$ 29,90 em centavos
    const estimatedRevenue = premiumUsers * premiumPrice;

    // Taxa de conversão
    const conversionRate = totalUsers > 0 ? ((premiumUsers / totalUsers) * 100).toFixed(1) : '0.0';

    const stats = {
      totalUsers,
      activeUsers,
      premiumUsers,
      suspendedUsers,
      totalBooks,
      activeBooks,
      totalWithdrawals: totalWithdrawals._sum?.amount || 0,
      pendingWithdrawals,
      approvedWithdrawals,
      rejectedWithdrawals,
      totalReadingSessions,
      recentReadingSessions,
      estimatedRevenue,
      conversionRate: parseFloat(conversionRate)
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/users - Listar usuários com filtros
app.get('/api/admin/users', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { page = 1, limit = 10, search = '', filter = 'all' } = req.query;
    
    await logAdminAction(admin.id, admin.name, 'VIEW_USER', null, 'user_list', { search, filter }, req);

    // Construir filtros
    const where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (filter === 'premium') {
      where.planType = 'PREMIUM';
    } else if (filter === 'suspended') {
      where.isSuspended = true;
    } else if (filter === 'admin') {
      where.isAdmin = true;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          level: true,
          points: true,
          balance: true,
          planType: true,
          isAdmin: true,
          isSuspended: true,
          suspendedReason: true,
          onboardingCompleted: true,
          lastLoginAt: true,
          createdAt: true
        }
      }),
      prisma.user.count({ where })
    ]);

    const publicUsers = users.map(user => ({
      ...user,
      planType: user.planType.toLowerCase(),
      createdAt: user.createdAt.toISOString(),
      lastLoginAt: user.lastLoginAt?.toISOString()
    }));

    res.json({
      success: true,
      data: {
        users: publicUsers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Admin users error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/users/:id - Editar usuário
app.patch('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { id } = req.params;
    const updates = req.body;

    // Verificar se o usuário existe
    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    // Não permitir edição de outros admins (exceto por super admin)
    if (existingUser.isAdmin && existingUser.id !== admin.id) {
      return res.status(403).json({ success: false, error: 'Não é possível editar outros administradores' });
    }

    // Campos permitidos para atualização
    const allowedFields = ['name', 'phone', 'level', 'points', 'balance', 'planType', 'isSuspended', 'suspendedReason'];
    const updateData = {};

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateData[field] = updates[field];
      }
    }

    // Converter planType para maiúsculo se fornecido
    if (updateData.planType) {
      updateData.planType = updateData.planType.toUpperCase();
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData
    });

    await logAdminAction(admin.id, admin.name, 'EDIT_USER', id, 'user', updateData, req);

    const publicUser = toPublicUser(updatedUser);
    res.json({ success: true, data: { user: publicUser } });
  } catch (error) {
    console.error('Admin edit user error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// DELETE /api/admin/users/:id - Suspender/deletar usuário
app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { id } = req.params;
    const { action = 'suspend', reason } = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { id }
    });

    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    if (existingUser.isAdmin) {
      return res.status(403).json({ success: false, error: 'Não é possível suspender administradores' });
    }

    if (action === 'suspend') {
      const updatedUser = await prisma.user.update({
        where: { id },
        data: {
          isSuspended: true,
          suspendedReason: reason || 'Suspenso pelo administrador'
        }
      });

      await logAdminAction(admin.id, admin.name, 'SUSPEND_USER', id, 'user', { reason }, req);

      const publicUser = toPublicUser(updatedUser);
      res.json({ success: true, data: { user: publicUser } });
    } else if (action === 'delete') {
      await prisma.user.delete({
        where: { id }
      });

      await logAdminAction(admin.id, admin.name, 'DELETE_USER', id, 'user', { reason }, req);

      res.json({ success: true, message: 'Usuário deletado com sucesso' });
    } else {
      res.status(400).json({ success: false, error: 'Ação inválida' });
    }
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/withdrawals - Listar saques
app.get('/api/admin/withdrawals', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { page = 1, limit = 10, status = 'all' } = req.query;
    
    await logAdminAction(admin.id, admin.name, 'VIEW_WITHDRAWAL', null, 'withdrawal_list', { status }, req);

    // Se a tabela withdrawal não existir, retornar lista vazia
    if (!prisma.withdrawal) {
      return res.json({
        success: true,
        data: {
          withdrawals: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    const where = {};
    if (status !== 'all') {
      where.status = status.toUpperCase();
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [withdrawals, total] = await Promise.all([
      prisma.withdrawal.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { requestedAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              planType: true
            }
          }
        }
      }),
      prisma.withdrawal.count({ where })
    ]);

    res.json({
      success: true,
      data: {
        withdrawals,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Admin withdrawals error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// PATCH /api/admin/withdrawals/:id - Aprovar/rejeitar saque
app.patch('/api/admin/withdrawals/:id', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { id } = req.params;
    const { action, reason } = req.body;

    if (!prisma.withdrawal) {
      return res.status(404).json({ success: false, error: 'Sistema de saques não disponível' });
    }

    const withdrawal = await prisma.withdrawal.findUnique({
      where: { id },
      include: { user: true }
    });

    if (!withdrawal) {
      return res.status(404).json({ success: false, error: 'Saque não encontrado' });
    }

    if (withdrawal.status !== 'PENDING') {
      return res.status(400).json({ success: false, error: 'Saque já foi processado' });
    }

    let updateData = {
      processedAt: new Date(),
      processedBy: admin.id
    };

    if (action === 'approve') {
      updateData.status = 'APPROVED';
      await logAdminAction(admin.id, admin.name, 'APPROVE_WITHDRAWAL', id, 'withdrawal', null, req);
    } else if (action === 'reject') {
      updateData.status = 'REJECTED';
      updateData.rejectionReason = reason;
      
      // Devolver o dinheiro para o usuário
      await prisma.user.update({
        where: { id: withdrawal.userId },
        data: {
          balance: { increment: withdrawal.amount }
        }
      });

      await logAdminAction(admin.id, admin.name, 'REJECT_WITHDRAWAL', id, 'withdrawal', { reason }, req);
    } else {
      return res.status(400).json({ success: false, error: 'Ação inválida' });
    }

    const updatedWithdrawal = await prisma.withdrawal.update({
      where: { id },
      data: updateData,
      include: { user: true }
    });

    res.json({ success: true, data: { withdrawal: updatedWithdrawal } });
  } catch (error) {
    console.error('Admin withdrawal action error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/analytics - Analytics detalhados
app.get('/api/admin/analytics', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { period = '30d' } = req.query;
    
    await logAdminAction(admin.id, admin.name, 'VIEW_ANALYTICS', null, 'analytics', { period }, req);

    // Calcular data de início baseada no período
    let startDate;
    switch (period) {
      case '7d':
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    // Buscar dados para analytics
    const [
      newUsers,
      totalRevenue,
      readingStats,
      userGrowth,
      planDistribution
    ] = await Promise.all([
      // Novos usuários no período
      prisma.user.count({
        where: {
          createdAt: { gte: startDate }
        }
      }),
      
      // Receita estimada (premium users)
      prisma.user.count({ where: { planType: 'PREMIUM' } }).then(count => count * 2990),
      
      // Estatísticas de leitura (se existir)
      prisma.readingSession ? prisma.readingSession.count({
        where: {
          startedAt: { gte: startDate }
        }
      }).catch(() => 0) : Promise.resolve(0),
      
      // Crescimento de usuários (últimos 7 dias)
      prisma.user.groupBy({
        by: ['createdAt'],
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        _count: true
      }).catch(() => []),
      
      // Distribuição de planos
      prisma.user.groupBy({
        by: ['planType'],
        _count: true
      })
    ]);

    const analytics = {
      period,
      newUsers,
      totalRevenue,
      readingSessions: readingStats,
      userGrowth,
      planDistribution: planDistribution.map(item => ({
        planType: item.planType.toLowerCase(),
        count: item._count
      }))
    };

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Admin analytics error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// GET /api/admin/logs - Logs de ações administrativas
app.get('/api/admin/logs', requireAdmin, async (req, res) => {
  try {
    const admin = req.adminUser;
    const { page = 1, limit = 20 } = req.query;
    
    // Se a tabela adminLog não existir, retornar lista vazia
    if (!prisma.adminLog) {
      return res.json({
        success: true,
        data: {
          logs: [],
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: 0,
            totalPages: 0
          }
        }
      });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.adminLog.findMany({
        skip,
        take: parseInt(limit),
        orderBy: { timestamp: 'desc' }
      }),
      prisma.adminLog.count()
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Admin logs error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// ============================================
// INICIALIZAÇÃO DO SERVIDOR
// ============================================

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API rodando em http://localhost:${PORT}`);
  console.log(`📚 Teste: http://localhost:${PORT}/api/books`);
  console.log(`👑 Admin: http://localhost:${PORT}/api/admin/dashboard`);
});

// Lidar com shutdown graceful
process.on('SIGINT', async () => {
  console.log('Desconectando do banco...');
  await prisma.$disconnect();
  process.exit(0);
});