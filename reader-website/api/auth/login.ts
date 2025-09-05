// api/auth/login.ts - VERSÃO SIMPLIFICADA
export default async function handler(req: any, res: any) {
  // CORS simples
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Method not allowed' 
    });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email e senha são obrigatórios'
      });
    }

    // Credenciais de teste
    const validCredentials = [
      { email: 'arthur@example.com', password: 'password', isAdmin: false },
      { email: 'admin@betareader.com', password: 'admin123', isAdmin: true }
    ];

    const validUser = validCredentials.find(
      u => u.email === email && u.password === password
    );

    if (!validUser) {
      return res.status(401).json({
        success: false,
        error: 'Email ou senha inválidos'
      });
    }

    // Dados do usuário de teste
    const userData = {
      id: validUser.isAdmin ? '2' : '1',
      name: validUser.isAdmin ? 'Admin' : 'Arthur',
      email: validUser.email,
      phone: '(11) 99999-9999',
      level: validUser.isAdmin ? 99 : 0,
      points: validUser.isAdmin ? 10000 : 0,
      balance: validUser.isAdmin ? 100000 : 0,
      planType: validUser.isAdmin ? 'premium' : 'free',
      isAdmin: validUser.isAdmin,
      onboardingCompleted: validUser.isAdmin,
      createdAt: new Date().toISOString(),
    };

    const token = `test-token-${userData.id}-${Date.now()}`;

    return res.status(200).json({
      success: true,
      data: { 
        user: userData, 
        token 
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}