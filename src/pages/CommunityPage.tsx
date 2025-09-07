// src/pages/CommunityPage.tsx
import React, { useState } from 'react';
import { Heart, MessageCircle, Share, RefreshCw, Award } from 'lucide-react';

const MOCK_POSTS = [
  {
    id: '1',
    user: { name: 'Gabriel Negrini', level: 2 },
    content: 'Boa rapaziada, já avaliei tudo aqui e fiz uns 900, só amanhã pra liberar mais né',
    likes: 5465,
    comments: 3,
    timestamp: '35d',
    isLiked: false
  },
  {
    id: '2',
    user: { name: 'Zenaide Leite', level: 3 },
    content: 'A vida tá cheia de surpresas, né? Essa semana peguei um livro incrível na plataforma! O enredo me prendeu de tal forma que eu não conseguia parar até a última página. É o melhor: só avaliei, já finalizei minha leitura e ganhei R$ 150! Pensando em pegar mais três livros essa semana e quem sabe, galera? Quais são os livros que vocês estão avaliando?',
    likes: 5160,
    comments: 1,
    timestamp: '35d',
    isLiked: false
  },
  {
    id: '3',
    user: { name: 'Edna Dos Santos Garcia', level: 1 },
    content: 'Oi gente, acabei de pegar 5000 pontos aqui e liberei os',
    likes: 892,
    comments: 0,
    timestamp: '35d',
    isLiked: false
  }
];

const CommunityPage: React.FC = () => {
  const [posts, setPosts] = useState(MOCK_POSTS);
  const [newPost, setNewPost] = useState('');

  const handleLike = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return (num / 1000).toFixed(1).replace('.0', '') + 'k';
    }
    return num.toString();
  };

  return (
    <div className="community-page">
      <div className="container">
        {/* Header */}
        <div className="community-header">
          <div className="header-content">
            <h1 className="page-title">Comunidade</h1>
            <p className="page-subtitle">Compartilhe suas experiências</p>
          </div>
          <button className="refresh-button" aria-label="Recarregar">
            <RefreshCw size={20} />
          </button>
        </div>

        {/* Engagement Banner */}
        <div className="engagement-banner">
          <div className="banner-icon">
            <Award size={20} />
          </div>
          <div className="banner-content">
            <h3>Comente coisas inspiradoras e ganhe 25 pontos!</h3>
            <p>Sua experiência pode motivar outros leitores</p>
          </div>
        </div>

        {/* User Status */}
        <div className="user-status">
          <div className="status-info">
            <div className="user-avatar">A</div>
            <div className="status-text">
              <span className="user-name">Arthur xavier de oliveira</span>
              <span className="status-action">Continue avaliando livros para publicar</span>
            </div>
          </div>
        </div>

        {/* Posts Section */}
        <div className="posts-section">
          <h2 className="section-title">Posts da comunidade</h2>
          
          <div className="posts-list">
            {posts.map((post) => (
              <div key={post.id} className="post-card">
                <div className="post-header">
                  <div className="post-user">
                    <div className="post-avatar">
                      {post.user.name.charAt(0)}
                    </div>
                    <div className="post-user-info">
                      <h4 className="post-username">{post.user.name}</h4>
                      <span className="post-timestamp">{post.timestamp}</span>
                    </div>
                  </div>
                </div>
                
                <div className="post-content">
                  <p>{post.content}</p>
                </div>
                
                <div className="post-actions">
                  <button 
                    className={`action-button ${post.isLiked ? 'liked' : ''}`}
                    onClick={() => handleLike(post.id)}
                  >
                    <Heart size={16} fill={post.isLiked ? 'currentColor' : 'none'} />
                    <span>{formatNumber(post.likes)}</span>
                  </button>
                  
                  <button className="action-button">
                    <MessageCircle size={16} />
                    <span>{post.comments} resposta{post.comments !== 1 ? 's' : ''}</span>
                  </button>
                  
                  <button className="action-button" aria-label="Compartilhar">
                    <Share size={16} />
                  </button>
                </div>
                
                <div className="engagement-prompt">
                  <div className="prompt-icon">👤</div>
                  <p>Compartilhe sua experiência com a comunidade...</p>
                  <span className="prompt-reward">Continue avaliando livros para desbloquear a participação na comunidade</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <style>{`
        .community-page {
          padding: var(--spacing-lg) 0;
          min-height: calc(100vh - 140px);
          background-color: var(--color-surface);
        }
        
        .community-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-xl);
          background-color: var(--color-background);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
        }
        
        .header-content {
          flex: 1;
        }
        
        .page-title {
          font-size: var(--text-2xl);
          font-weight: var(--font-semibold);
          margin-bottom: var(--spacing-xs);
          color: var(--color-text-primary);
        }
        
        .page-subtitle {
          color: var(--color-text-secondary);
          margin: 0;
        }
        
        .refresh-button {
          background: none;
          border: none;
          color: var(--color-primary);
          cursor: pointer;
          padding: var(--spacing-sm);
          border-radius: var(--radius-md);
          transition: background-color var(--transition-fast);
        }
        
        .refresh-button:hover {
          background-color: var(--color-surface);
        }
        
        .engagement-banner {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
          color: white;
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
        }
        
        .banner-icon {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-md);
          background-color: rgba(255, 255, 255, 0.2);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        
        .banner-content h3 {
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
        }
        
        .banner-content p {
          margin: 0;
          font-size: var(--text-sm);
          opacity: 0.9;
        }
        
        .user-status {
          background-color: var(--color-background);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          margin-bottom: var(--spacing-xl);
          box-shadow: var(--shadow-sm);
        }
        
        .status-info {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .user-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          flex-shrink: 0;
        }
        
        .status-text {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-xs);
        }
        
        .user-name {
          font-weight: var(--font-medium);
          color: var(--color-text-primary);
        }
        
        .status-action {
          font-size: var(--text-sm);
          color: var(--color-warning);
          background-color: rgba(245, 158, 11, 0.1);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          align-self: flex-start;
        }
        
        .posts-section {
          margin-bottom: var(--spacing-xl);
        }
        
        .section-title {
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          margin-bottom: var(--spacing-lg);
          color: var(--color-text-primary);
        }
        
        .posts-list {
          display: flex;
          flex-direction: column;
          gap: var(--spacing-lg);
        }
        
        .post-card {
          background-color: var(--color-background);
          border-radius: var(--radius-lg);
          padding: var(--spacing-lg);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border-light);
        }
        
        .post-header {
          margin-bottom: var(--spacing-md);
        }
        
        .post-user {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
        }
        
        .post-avatar {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          font-size: var(--text-sm);
        }
        
        .post-user-info {
          flex: 1;
        }
        
        .post-username {
          font-size: var(--text-base);
          font-weight: var(--font-medium);
          margin: 0 0 var(--spacing-xs) 0;
          color: var(--color-text-primary);
        }
        
        .post-timestamp {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }
        
        .post-content {
          margin-bottom: var(--spacing-lg);
        }
        
        .post-content p {
          color: var(--color-text-primary);
          line-height: 1.6;
          margin: 0;
        }
        
        .post-actions {
          display: flex;
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-lg);
          padding-bottom: var(--spacing-lg);
          border-bottom: 1px solid var(--color-border-light);
        }
        
        .action-button {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          background: none;
          border: none;
          color: var(--color-text-secondary);
          cursor: pointer;
          font-size: var(--text-sm);
          padding: var(--spacing-xs);
          border-radius: var(--radius-md);
          transition: color var(--transition-fast);
        }
        
        .action-button:hover {
          color: var(--color-text-primary);
        }
        
        .action-button.liked {
          color: var(--color-error);
        }
        
        .engagement-prompt {
          display: flex;
          align-items: flex-start;
          gap: var(--spacing-md);
          padding: var(--spacing-md);
          background-color: var(--color-surface);
          border-radius: var(--radius-md);
        }
        
        .prompt-icon {
          font-size: var(--text-lg);
          flex-shrink: 0;
        }
        
        .engagement-prompt p {
          color: var(--color-text-secondary);
          margin: 0 0 var(--spacing-xs) 0;
          font-size: var(--text-sm);
        }
        
        .prompt-reward {
          color: var(--color-warning);
          font-size: var(--text-xs);
          background-color: rgba(245, 158, 11, 0.1);
          padding: var(--spacing-xs) var(--spacing-sm);
          border-radius: var(--radius-sm);
          display: inline-block;
        }
        
        @media (max-width: 768px) {
          .community-header {
            flex-direction: column;
            align-items: flex-start;
            gap: var(--spacing-md);
          }
          
          .engagement-banner {
            flex-direction: column;
            text-align: center;
          }
          
          .status-info {
            flex-direction: column;
            align-items: flex-start;
            text-align: center;
          }
          
          .post-actions {
            flex-wrap: wrap;
            gap: var(--spacing-md);
          }
        }
      `}</style>
    </div>
  );
};

export default CommunityPage;