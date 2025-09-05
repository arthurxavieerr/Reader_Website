module.exports = function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const books = [
    {
      id: '1',
      title: 'A Caixa de Pandora',
      author: 'Hesíodo',
      genre: 'Mitologia grega',
      baseRewardMoney: 10000,
      requiredLevel: 0
    },
    {
      id: '2', 
      title: 'O Príncipe e a Gata',
      author: 'Charles Perrault',
      genre: 'Conto de fadas',
      baseRewardMoney: 20000,
      requiredLevel: 0
    }
  ];

  return res.status(200).json({
    success: true,
    data: { books }
  });
};