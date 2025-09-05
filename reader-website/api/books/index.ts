// api/books/index.ts - VERSÃO ULTRA SIMPLES
export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const books = [
    { id: '1', title: 'A Caixa de Pandora', author: 'Hesíodo' },
    { id: '2', title: 'O Príncipe e a Gata', author: 'Charles Perrault' }
  ];

  res.status(200).json({ success: true, data: { books } });
}