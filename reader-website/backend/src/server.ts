import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';

// Importar configurações e middleware
import { errorHandler } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';
import logger from './config/logger';

// Importar rotas
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';

// Carregar variáveis de ambiente
dotenv.config();

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Configurar Socket.io para tracking em tempo real
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// ==================================
// MIDDLEWARE BÁSICOS
// ==================================

// Segurança
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS - permitir requests do frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate limiting - proteger contra spam
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // máximo 100 requests
  message: {
    error: 'Muitas tentativas. Tente novamente em 15 minutos.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

// Logs de requisições
app.use(morgan('combined', {
  stream: { write: (message) => logger.info(message.trim()) }
}));

// Parser de JSON
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ==================================
// ROTAS PRINCIPAIS
// ==================================

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);

// ==================================
// SOCKET.IO - TRACKING EM TEMPO REAL
// ==================================

io.on('connection', (socket) => {
  logger.info(`Cliente conectado: ${socket.id}`);

  // Eventos de leitura (vamos implementar na Fase 4)
  socket.on('reading:start', (data) => {
    logger.info(`Usuário ${data.userId} iniciou leitura do livro ${data.bookId}`);
    // Lógica de tracking será implementada depois
  });

  socket.on('reading:track', (data) => {
    // Tracking em tempo real da leitura
    // Será implementado na Fase 4 - Sistema Anti-Fraude
  });

  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
  });
});

// ==================================
// MIDDLEWARE DE ERRO E 404
// ==================================

// Middleware 404 - rota não encontrada
app.use(notFoundHandler);

// Middleware de erro global
app.use(errorHandler);

// ==================================
// INICIALIZAÇÃO DO SERVIDOR
// ==================================

async function startServer() {
  try {
    // Conectar ao banco de dados (vamos implementar depois)
    // await connectDatabase();
    
    server.listen(PORT, () => {
      logger.info(`🚀 Servidor rodando em http://localhost:${PORT}`);
      logger.info(`📊 Health check: http://localhost:${PORT}/health`);
      logger.info(`🔌 Socket.io ativo para tracking`);
      logger.info(`🌍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      
      // Log das configurações importantes
      logger.info(`💰 Premium: R$ ${(parseInt(process.env.PREMIUM_PRICE || '2990') / 100).toFixed(2)}`);
      logger.info(`🚫 Free trava em: R$ ${(parseInt(process.env.FREE_BALANCE_LIMIT || '1500') / 100).toFixed(2)}`);
      logger.info(`💸 Saque mín Free: R$ ${(parseInt(process.env.FREE_MIN_WITHDRAWAL || '5000') / 100).toFixed(2)}`);
      logger.info(`💸 Saque mín Premium: R$ ${(parseInt(process.env.PREMIUM_MIN_WITHDRAWAL || '1500') / 100).toFixed(2)}`);
    });
  } catch (error) {
    logger.error('❌ Erro ao inicializar servidor:', error);
    process.exit(1);
  }
}

// Tratamento de erros não capturados
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('🛑 Recebido SIGTERM, encerrando servidor...');
  server.close(() => {
    logger.info('✅ Servidor encerrado gracefully');
    process.exit(0);
  });
});

startServer();