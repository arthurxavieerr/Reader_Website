// api/books.js
export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Dados mock baseados no seu banco
    const books = [
      {
        id: "book-1",
        title: "A Caixa de Pandora",
        author: "Hesíodo",
        genre: "Mitologia grega",
        synopsis: "Descubra o conto mitológico de Pandora...",
        baseRewardMoney: 10000,
        rewardPoints: 500,
        requiredLevel: 0,
        reviewsCount: 84288,
        averageRating: 4.5,
        createdAt: new Date().toISOString()
      },
      {
        id: "book-2", 
        title: "O Príncipe e a Gata",
        author: "Charles Perrault",
        genre: "Conto de fadas",
        synopsis: "Era uma vez um rei, pai de três corajosos príncipes...",
        baseRewardMoney: 20000,
        rewardPoints: 750,
        requiredLevel: 0,
        reviewsCount: 12947,
        averageRating: 4.3,
        createdAt: new Date().toISOString()
      }
    ];

    return res.status(200).json({
      success: true,
      data: { books }
    });

  } catch (error) {
    console.error('Books error:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
}