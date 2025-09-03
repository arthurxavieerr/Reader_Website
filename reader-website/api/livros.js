export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const books = [
      {
        id: "1",
        title: "A Caixa de Pandora",
        author: "Hesíodo",
        genre: "Mitologia grega",
        synopsis: "Descubra o conto mitológico de Pandora...",
        baseRewardMoney: 10000,
        rewardPoints: 500,
        averageRating: 4.5,
        reviewsCount: 84288
      },
      {
        id: "2",
        title: "O Príncipe e a Gata", 
        author: "Charles Perrault",
        genre: "Conto de fadas",
        synopsis: "Era uma vez um rei...",
        baseRewardMoney: 20000,
        rewardPoints: 750,
        averageRating: 4.3,
        reviewsCount: 12947
      }
    ];

    return res.status(200).json({
      success: true,
      data: { books }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: "Erro interno"
    });
  }
}