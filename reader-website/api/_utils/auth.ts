import jwt from 'jsonwebtoken';
import { VercelRequest } from '@vercel/node';

/**
 * Interface para o payload do JWT
 */
export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
}

/**
 * Verifica se um token JWT é válido
 * @param token - Token JWT a ser verificado
 * @returns Payload decodificado ou null se inválido
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('Token inválido:', error);
    return null;
  }
}

/**
 * Gera um novo token JWT para um usuário
 * @param userId - ID do usuário
 * @param email - Email do usuário
 * @param isAdmin - Se o usuário é admin
 * @returns Token JWT válido por 7 dias
 */
export function generateToken(userId: string, email: string, isAdmin: boolean = false): string {
  return jwt.sign(
    { userId, email, isAdmin },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

/**
 * Extrai o token do header Authorization da requisição
 * @param req - Request object do Vercel
 * @returns Token ou null se não encontrado
 */
export function getTokenFromRequest(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7); // Remove "Bearer "
  }
  
  return null;
}

/**
 * Autentica uma requisição verificando o token JWT
 * @param req - Request object do Vercel
 * @returns Payload do usuário ou null se não autenticado
 */
export async function authenticateRequest(req: VercelRequest): Promise<JWTPayload | null> {
  const token = getTokenFromRequest(req);
  
  if (!token) {
    return null;
  }
  
  return verifyToken(token);
}