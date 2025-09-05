// api/auth/login.ts - VERSÃO SIMPLIFICADA
export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    // Por enquanto, aceitar apenas usuários mock até resolver o Prisma
    const mockUsers = [
      { email: 'arthur@example.com', password: 'password', name: 'Arthur', id: '1' },
      { email: 'admin@betareader.com', password: 'admin123', name: 'Admin', id: '2' }
    ];

    const user = mockUsers.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: '(11) 99999-9999',
      level: 0,
      points: 0,
      balance: 0,
      planType: 'free',
      isAdmin: user.email === 'admin@betareader.com',
      onboardingCompleted: false,
      createdAt: new Date().toISOString(),
    };

    const token = `auth-token-${user.id}-${Date.now()}`;

    return res.status(200).json({
      success: true,
      data: { user: userData, token }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}
