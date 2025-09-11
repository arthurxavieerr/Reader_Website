// server.js - VERSÃO COMPLETA CORRIGIDA SEM PREPARED STATEMENTS + CPF IMPLEMENTADO
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

// FUNÇÕES DE VALIDAÇÃO DE CPF
function validateCPF(cpf) {
  const cleanCPF = cpf.replace(/\D/g, '');
  if (cleanCPF.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cleanCPF)) return false;
  
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

function cleanCPF(cpf) {
  return cpf.replace(/\D/g, '');
}

// Configuração Prisma - VERSÃO DEFINITIVA SEM PREPARED STATEMENTS
let client;
let connectionCount = 0;

async function createFreshPrismaClient() {
  connectionCount++;
  console.log(`🔄 Criando cliente Prisma #${connectionCount}`);
  
  return new PrismaClient({
    datasources: { 
      db: { url: process.env.DATABASE_URL }
    },
    log: isDebug ? ['warn', 'error'] : ['error']
  });
}

async function ensureFreshConnection() {
  // Sempre desconectar o cliente atual se existir
  if (client) {
    try {
      await client.$disconnect();
      console.log('🔄 Cliente anterior desconectado');
    } catch (e) {
      console.log('⚠️ Erro ao desconectar cliente anterior:', e.message);
    }
    client = null;
  }

  // Criar novo cliente
  client = await createFreshPrismaClient();
  
  // Conectar
  await client.$connect();
  console.log('✅ Novo cliente Prisma conectado');
  
  return client;
}

// Middleware de conexão SIMPLIFICADO - SEM TESTES QUE CAUSAM PREPARED STATEMENTS
async function ensureConnection(req, res, next) {
  try {
    // Se não há cliente, criar novo
    if (!client) {
      console.log('🔄 Inicializando nova conexão Prisma...');
      await ensureFreshConnection();
    }
    
    next();
  } catch (error) {
    console.error('❌ Erro de conexão:', error);
    
    try {
      console.log('⚠️ Tentando reconectar...');
      await ensureFreshConnection();
      next();
    } catch (retryError) {
      console.error('❌ Erro na reconexão:', retryError);
      res.status(503).json({ 
        success: false, 
        error: 'Serviço temporariamente indisponível',
        code: 'DATABASE_CONNECTION_ERROR'
      });
    }
  }
}

// Configurações da Nivuspay
const NIVUSPAY_CONFIG = {
  BASE_URL: 'https://pay.nivuspay.com.br/api/v1',
  SECRET_KEY: process.env.NIVUSPAY_SECRET_KEY || '58466d2b-7365-498f-9038-01fe2f537d1a'
};

// Função para criar transação PIX na Nivuspay usando CPF real - VERSÃO CORRIGIDA COM MÚLTIPLOS FORMATOS
async function createNivusPayPixTransaction(amount, description, userId, customerData) {
  try {
    console.log('🔄 Criando transação PIX na NivusPay...');

    if (!customerData.cpf || !validateCPF(customerData.cpf)) {
      throw new Error('CPF do cliente é obrigatório e deve ser válido');
    }

    const cleanedCPF = cleanCPF(customerData.cpf);
    
    // FORMATAÇÃO ESPECÍFICA PARA NIVUSPAY - TESTANDO DIFERENTES FORMATOS
    let formattedPhone = '+5516999999999'; // Telefone padrão com + como fallback
    
    if (customerData.phone) {
      const cleanedPhone = customerData.phone.replace(/\D/g, '');
      console.log('🔍 Telefone original:', customerData.phone);
      console.log('🔍 Telefone limpo:', cleanedPhone);
      
      // Tenta diferentes formatos que a NivusPay pode aceitar
      if (cleanedPhone.length >= 10) {
        // Pega os últimos 11 dígitos se tiver mais que isso
        const phoneDigits = cleanedPhone.length > 11 ? cleanedPhone.slice(-11) : cleanedPhone;
        
        // Tenta formato com +55 (formato internacional padrão)
        if (phoneDigits.length === 11) {
          formattedPhone = `+55${phoneDigits}`;
        } else if (phoneDigits.length === 10) {
          // Adiciona o 9 para celular se tiver só 10 dígitos
          const ddd = phoneDigits.substring(0, 2);
          const number = phoneDigits.substring(2);
          formattedPhone = `+55${ddd}9${number}`;
        } else {
          // Usa o que tiver
          formattedPhone = `+55${phoneDigits}`;
        }
      }
    }
    
    console.log('📱 Telefone formatado final:', formattedPhone);
    
    // Validar se tem o formato +55XXXXXXXXXXX (14 caracteres total)
    if (!formattedPhone.match(/^\+55\d{10,11}$/)) {
      console.log('⚠️ Formato inválido, testando sem +');
      // Tenta sem o +
      formattedPhone = formattedPhone.replace('+', '');
      
      if (!formattedPhone.match(/^55\d{10,11}$/)) {
        console.log('⚠️ Ainda inválido, usando fallback');
        formattedPhone = '+5516999999999';
      }
    }
    
    const customId = `deposit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Testa primeiro sem o + para ver se a API aceita
    const phoneToSend = formattedPhone.startsWith('+') ? formattedPhone.substring(1) : formattedPhone;
    
    const requestData = {
      name: customerData.name,
      email: customerData.email,
      cpf: cleanedCPF,
      phone: phoneToSend, // Enviando sem o +
      paymentMethod: "PIX",
      amount: amount,
      traceable: true,
      items: [{
        unitPrice: amount,
        title: description,
        quantity: 1,
        tangible: false
      }],
      externalId: customId,
      postbackUrl: `${process.env.APP_URL || 'http://localhost:3001'}/api/webhooks/nivuspay`
    };

    console.log('📤 Enviando para NivusPay (dados mascarados):', {
      ...requestData,
      cpf: `${cleanedCPF.substring(0, 3)}***${cleanedCPF.substring(8)}`,
      phone: `${phoneToSend.substring(0, 4)}***${phoneToSend.substring(9)}`
    });

    console.log('🔍 Testando com telefone sem +:', phoneToSend);

    const response = await fetch(`${NIVUSPAY_CONFIG.BASE_URL}/transaction.purchase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': NIVUSPAY_CONFIG.SECRET_KEY
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.log('❌ NivusPay Response Error:', errorText);
      
      // Se ainda der erro, tenta com formato diferente
      if (errorText.includes('phone') && phoneToSend.startsWith('55')) {
        console.log('🔄 Tentando formato alternativo...');
        
        // Tenta formato brasileiro puro (sem código do país)
        const brazilianPhone = phoneToSend.substring(2); // Remove o 55
        const alternativeData = {
          ...requestData,
          phone: brazilianPhone
        };
        
        console.log('🔍 Tentando telefone brasileiro puro:', brazilianPhone);
        
        const retryResponse = await fetch(`${NIVUSPAY_CONFIG.BASE_URL}/transaction.purchase`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': NIVUSPAY_CONFIG.SECRET_KEY
          },
          body: JSON.stringify(alternativeData)
        });
        
        if (!retryResponse.ok) {
          const retryErrorText = await retryResponse.text();
          console.log('❌ Erro na segunda tentativa:', retryErrorText);
          throw new Error(`NivusPay API Error: ${retryResponse.status} - ${retryErrorText}`);
        }
        
        const retryData = JSON.parse(await retryResponse.text());
        console.log('✅ Transação criada na segunda tentativa:', retryData.id);
        
        return {
          transactionId: retryData.id,
          customId: retryData.customId || customId,
          qrCode: retryData.pixCode || retryData.pixQrCode,
          qrCodeBase64: retryData.pixQrCode ? `data:image/png;base64,${retryData.pixQrCode}` : null,
          pixCopiaECola: retryData.pixCode,
          amount: amount,
          expiresAt: retryData.expiresAt || new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          status: retryData.status || 'PENDING'
        };
      }
      
      throw new Error(`NivusPay API Error: ${response.status} - ${errorText}`);
    }

    const data = JSON.parse(await response.text());
    console.log('✅ Transação criada na NivusPay:', data.id);

    return {
      transactionId: data.id,
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

// Função para verificar status do pagamento na Nivuspay
async function checkNivusPayPaymentStatus(transactionId) {
  try {
    console.log('🔍 Verificando status do pagamento na NivusPay:', transactionId);
    
    const response = await fetch(`${NIVUSPAY_CONFIG.BASE_URL}/transaction.getPayment?id=${transactionId}`, {
      method: 'GET',
      headers: {
        'Authorization': NIVUSPAY_CONFIG.SECRET_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`NivusPay Status API Error: ${response.status}`);
    }

    const data = JSON.parse(await response.text());
    console.log('📋 Status retornado:', data.status);

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

// Middleware de autenticação
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      error: 'Token de acesso requerido',
      code: 'NO_TOKEN'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        error: 'Token inválido ou expirado',
        code: 'INVALID_TOKEN'
      });
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
app.get('/health', async (req, res) => {
  res.json({ 
    success: true, 
    status: 'API Online - CPF Implementado',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 3001
  });
});

app.get('/api/test', ensureConnection, async (req, res) => {
  try {
    // Usar queryRaw para evitar prepared statements
    const result = await client.$queryRaw`SELECT COUNT(*) as count FROM users`;
    const userCount = parseInt(result[0].count);
    
    res.json({ 
      success: true, 
      message: 'API funcionando com CPF!',
      data: { userCount, timestamp: new Date().toISOString() }
    });
  } catch (error) {
    console.error('❌ Erro no teste:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============================================
// ROTAS DE AUTENTICAÇÃO COM CPF
// ============================================
app.post('/api/auth/register', ensureConnection, async (req, res) => {
  try {
    const { name, email, phone, cpf, password } = req.body;

    if (!name || !email || !cpf || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Nome, email, CPF e senha são obrigatórios' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Senha deve ter pelo menos 6 caracteres' 
      });
    }

    const cleanedCPF = cleanCPF(cpf);
    if (!validateCPF(cleanedCPF)) {
      return res.status(400).json({ 
        success: false, 
        error: 'CPF inválido' 
      });
    }

    // Verificar duplicatas usando queryRaw para evitar prepared statements
    const existingByEmail = await client.$queryRaw`
      SELECT id FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `;
    
    if (existingByEmail.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'Email já está em uso' 
      });
    }

    const existingByCPF = await client.$queryRaw`
      SELECT id FROM users WHERE cpf = ${cleanedCPF} LIMIT 1
    `;

    if (existingByCPF.length > 0) {
      return res.status(409).json({ 
        success: false, 
        error: 'CPF já está em uso' 
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await client.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone?.trim() || null,
        cpf: cleanedCPF,
        passwordHash,
        isAdmin: false,
        level: 1,
        balance: 0,
        onboardingCompleted: false
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

    // Buscar usuário usando queryRaw
    const users = await client.$queryRaw`
      SELECT * FROM users WHERE email = ${email.toLowerCase()} LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }

    const user = users[0];

    if (user.isSuspended) {
      return res.status(401).json({ success: false, error: 'Conta suspensa' });
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    
    if (!isValidPassword) {
      return res.status(401).json({ success: false, error: 'Email ou senha inválidos' });
    }

    // Atualizar último login usando executeRaw
    await client.$executeRaw`
      UPDATE users 
      SET "lastLoginAt" = NOW(), "lastLoginIP" = ${req.ip || 'localhost'} 
      WHERE id = ${user.id}
    `;

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
    // Buscar usuário usando queryRaw
    const users = await client.$queryRaw`
      SELECT * FROM users WHERE id = ${req.user.userId} LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const user = users[0];

    if (user.isSuspended) {
      return res.status(404).json({ success: false, error: 'Conta suspensa' });
    }

    const publicUser = toPublicUser(user);
    res.json({ success: true, data: { user: publicUser } });

  } catch (error) {
    console.error('❌ Auth check error:', error);
    res.status(500).json({ success: false, error: 'Erro interno do servidor' });
  }
});

// Atualização de perfil com CPF - VERSÃO CORRIGIDA
app.patch('/api/auth/update-profile', ensureConnection, authenticateToken, async (req, res) => {
  try {
    console.log('🔄 Update profile request started');
    console.log('🔍 Request body:', { ...req.body, cpf: req.body.cpf ? '[CPF_PROVIDED]' : undefined });
    
    const { name, phone, cpf } = req.body;
    const userId = req.user.userId;

    console.log('🔍 User ID from token:', userId);

    // Validação de nome
    if (name !== undefined && (!name || !name.trim())) {
      console.log('❌ Nome vazio rejeitado');
      return res.status(400).json({ 
        success: false, 
        error: 'Nome não pode estar vazio' 
      });
    }

    // Validação de CPF se fornecido
    let cleanedCPF = null;
    if (cpf !== undefined && cpf && cpf.trim()) {
      cleanedCPF = cleanCPF(cpf);
      console.log('🔍 CPF processado');
      
      if (!validateCPF(cleanedCPF)) {
        console.log('❌ CPF inválido');
        return res.status(400).json({ 
          success: false, 
          error: 'CPF inválido' 
        });
      }

      // Verificar se CPF já está em uso por outro usuário
      console.log('🔍 Verificando duplicata de CPF...');
      const existingCPF = await client.user.findFirst({
        where: { 
          cpf: cleanedCPF,
          NOT: { id: userId }
        }
      });

      if (existingCPF) {
        console.log('❌ CPF já em uso');
        return res.status(409).json({ 
          success: false, 
          error: 'CPF já está em uso por outro usuário' 
        });
      }
    }

    // Preparar dados para update usando Prisma client normal (mais confiável)
    const updateData = {
      updatedAt: new Date()
    };

    if (name !== undefined) {
      updateData.name = name.trim();
    }

    if (phone !== undefined) {
      updateData.phone = phone && phone.trim() ? phone.trim() : null;
    }

    if (cpf !== undefined) {
      updateData.cpf = cleanedCPF;
    }

    console.log('🔄 Executando update com dados:', { 
      ...updateData, 
      cpf: updateData.cpf ? '[CPF_UPDATED]' : updateData.cpf 
    });

    // Executar update usando Prisma client normal (mais estável que queryRaw)
    const updatedUser = await client.user.update({
      where: { id: userId },
      data: updateData
    });

    console.log('✅ Update executado com sucesso');

    const publicUser = toPublicUser(updatedUser);
    console.log('✅ Profile updated successfully for user:', userId);
    
    res.json({ success: true, data: { user: publicUser } });

  } catch (error) {
    console.error('❌ Update profile error:', error);
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });

    // Tratamento específico para erros do Prisma
    if (error.code === 'P2025') {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }
    
    if (error.code === 'P2002') {
      const target = error.meta?.target;
      if (target && target.includes('cpf')) {
        return res.status(409).json({ success: false, error: 'CPF já está em uso por outro usuário' });
      }
      if (target && target.includes('email')) {
        return res.status(409).json({ success: false, error: 'Email já está em uso por outro usuário' });
      }
      return res.status(409).json({ success: false, error: 'Dados já em uso por outro usuário' });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor',
      details: isDebug ? error.message : undefined
    });
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
// ROTAS DE DEPÓSITO COM CPF
// ============================================
app.post('/api/payments/deposit', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const userId = req.user.userId;

    if (amount !== 1990 && amount !== 3990) {
      return res.status(400).json({ 
        success: false, 
        error: 'Apenas os valores R$ 19,90 ou R$ 39,90 são permitidos' 
      });
    }

    // Buscar usuário usando queryRaw
    const users = await client.$queryRaw`
      SELECT * FROM users WHERE id = ${userId} LIMIT 1
    `;

    if (users.length === 0) {
      return res.status(404).json({ success: false, error: 'Usuário não encontrado' });
    }

    const user = users[0];

    if (!user.cpf) {
      return res.status(400).json({ 
        success: false, 
        error: 'CPF é obrigatório para realizar depósitos. Atualize seu perfil.' 
      });
    }

    // Verificar depósitos pendentes usando queryRaw
    const pendingDeposits = await client.$queryRaw`
      SELECT id FROM transactions 
      WHERE "userId" = ${userId} AND type = 'DEPOSIT' AND status = 'PENDING' 
      LIMIT 1
    `;

    if (pendingDeposits.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Você já possui um depósito pendente'
      });
    }

    const depositType = amount === 1990 ? 'Taxa de Saque' : 'Plano Premium';
    const description = `${depositType} - ${user.name || 'Cliente'}`;

    // Criar transação PIX na Nivuspay
    const nivusPayData = await createNivusPayPixTransaction(amount, description, userId, {
      name: user.name,
      email: user.email,
      cpf: user.cpf,
      phone: user.phone || '16999999999'
    });

    // Salvar transação
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

    console.log('✅ Depósito criado:', transaction.id);

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
    console.error('❌ Erro no depósito:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro interno do servidor: ' + error.message 
    });
  }
});

// Verificar status do depósito
app.get('/api/payments/deposit/:id/status', ensureConnection, authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

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
    let newStatus = transaction.status;

    if (transaction.nivusPayTransactionId) {
      try {
        const nivusStatus = await checkNivusPayPaymentStatus(transaction.nivusPayTransactionId);
        
        if (nivusStatus === 'approved') {
          newStatus = 'COMPLETED';
          
          if (transaction.amount === 1990) {
            await client.user.update({
              where: { id: userId },
              data: { balance: { increment: transaction.amount } }
            });
          } else if (transaction.amount === 3990) {
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
        console.error('❌ Erro ao verificar status:', statusError);
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

// Listar depósitos
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
// ROTAS DE SAQUE
// ============================================
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

    if (user.planType !== 'PREMIUM') {
      return res.status(400).json({
        success: false,
        error: 'Para realizar saques, você precisa ser Premium ou pagar a taxa de R$ 19,90',
        requiresPayment: true,
        feeAmount: 1990
      });
    }

    const minWithdrawal = user.planType === 'PREMIUM' ? 5000 : 12000;
    
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
          pixKey: w.pixKey ? `***${w.pixKey.slice(-4)}` : null
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

    if (!payload.paymentId && !payload.customId) {
      console.log('❌ Invalid webhook payload');
      return res.status(400).json({ error: 'Invalid payload' });
    }

    const { paymentId, customId, status } = payload;

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

    if (transaction.status !== 'PENDING') {
      console.log('✅ Transaction already processed:', transaction.id);
      return res.json({ success: true, message: 'Already processed' });
    }

    let newStatus = 'PENDING';
    let shouldUpdateUser = false;

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

    await client.transaction.update({
      where: { id: transaction.id },
      data: {
        status: newStatus,
        nivusPayStatus: status,
        processedAt: new Date()
      }
    });

    if (shouldUpdateUser) {
      if (transaction.amount === 1990) {
        await client.user.update({
          where: { id: transaction.userId },
          data: { 
            balance: { increment: transaction.amount }
          }
        });
        console.log(`✅ Taxa de saque paga: R$ ${(transaction.amount / 100).toFixed(2)} for user ${transaction.user.email}`);
      } else if (transaction.amount === 3990) {
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
// ROTAS ADMIN
// ============================================
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

app.patch('/api/admin/withdrawals/:id', ensureConnection, authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body;
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
// FALLBACK
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
          'PATCH /api/auth/update-profile',
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
    res.status(404).json({ success: false, error: 'SPA não disponível' });
  }
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, async () => {
  console.log('🎯 ====================================');
  console.log(`🚀 SERVIDOR INICIADO - CPF IMPLEMENTADO (SEM PREPARED STATEMENTS)`);
  console.log(`📍 Porta: ${PORT}`);
  console.log(`🌍 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🆔 CPF: Obrigatório e funcional`);
  console.log(`🔗 Health: http://localhost:${PORT}/health`);
  console.log(`🔗 Test: http://localhost:${PORT}/api/test`);
  console.log('🎯 ====================================');
  
  // Inicializar Prisma
  try {
    await ensureFreshConnection();
    console.log('🎉 Servidor pronto! CPF funcionando sem prepared statements.');
  } catch (error) {
    console.error('❌ Erro na inicialização:', error);
  }
});

// Graceful Shutdown
process.on('SIGINT', async () => {
  console.log('🔌 Encerrando servidor...');
  try {
    if (client) await client.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔌 Encerrando servidor (SIGTERM)...');
  try {
    if (client) await client.$disconnect();
  } catch (error) {
    console.error('❌ Erro ao desconectar:', error);
  }
  process.exit(0);
});

process.on('uncaughtException', async (error) => {
  console.error('💥 Erro não capturado:', error);
  try {
    if (client) await client.$disconnect();
  } catch (e) {
    console.error('❌ Erro ao desconectar após exceção:', e);
  }
  process.exit(1);
});

process.on('unhandledRejection', async (reason, promise) => {
  console.error('💥 Promise rejeitada não tratada:', reason);
  try {
    if (client) await client.$disconnect();
  } catch (e) {
    console.error('❌ Erro ao desconectar após rejeição:', e);
  }
  process.exit(1);
});

module.exports = { validateCPF, cleanCPF };