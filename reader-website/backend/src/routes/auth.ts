import { Router } from 'express';
import { register, login, completeOnboarding, getMe } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Rotas públicas (sem autenticação)
router.post('/register', register);
router.post('/login', login);

// Rotas protegidas (requerem autenticação)
router.post('/onboarding', authenticateToken, completeOnboarding);
router.get('/me', authenticateToken, getMe);

export default router;