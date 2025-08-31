import jwt from 'jsonwebtoken';
import { VercelRequest } from '@vercel/node';

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!);
  } catch (error) {
    return null;
  }
}

export function generateToken(userId: string) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );
}

export function getTokenFromRequest(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function authenticateRequest(req: VercelRequest) {
  const token = getTokenFromRequest(req);
  if (!token) return null;
  
  const decoded = verifyToken(token);
  if (!decoded || typeof decoded === 'string') return null;
  
  return decoded as { userId: string };
}
