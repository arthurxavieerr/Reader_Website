import { Router } from 'express';
import { 
  getBooks, 
  getBook, 
  getBookContent, 
  startReading, 
  completeReading 
} from '../controllers/bookController';
import { authenticateToken, optionalAuth } from '../middleware/auth';

const router = Router();

// Rotas públicas (podem ser acessadas sem login)
router.get('/', optionalAuth, getBooks); // Lista livros, mostra mais info se logado
router.get('/:id', optionalAuth, getBook); // Detalhes do livro

// Rotas protegidas (requerem autenticação)
router.get('/:id/content', authenticateToken, getBookContent); // Conteúdo do livro
router.post('/:id/start-reading', authenticateToken, startReading); // Iniciar leitura
router.post('/:id/complete', authenticateToken, completeReading); // Completar e avaliar

export default router;