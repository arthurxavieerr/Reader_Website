// src/pages/LandingPage.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Users, BookOpen, DollarSign, Star, ChevronRight } from 'lucide-react';
import cadastroIcon from '../assets/icons/cadastro.png';
import livroIcon from '../assets/icons/livro.png';
import estrelaIcon from '../assets/icons/estrela.png';
import dinheiroIcon from '../assets/icons/dinheiro.png';
import fundo from '../assets/fundo.png';
import logo from '../assets/icons/logo.png'


const LandingPage: React.FC = () => {
  const stats = [
    { icon: DollarSign, value: 'R$ 900.000+', label: 'Pagos aos leitores' },
    { icon: Users, value: '3.500+', label: 'Leitores ativos' },
    { icon: BookOpen, value: '15.000+', label: 'Livros avaliados' },
    { icon: Star, value: 'R$ 50-900', label: 'Por livro lido' },
  ];

  const testimonials = [
    {
      name: 'Alex Xalis',
      role: 'Estudante',
      rating: 5,
      comment: 'Consegui pagar até 250 reais lendo uns 30 livros que eu encontraram aqui. A plataforma é confiável e realmente paga.',
      avatar: 'A'
    },
    {
      name: 'Leonardo Santagru',
      role: 'Professor',
      rating: 5,
      comment: 'Gosto muito dessa forma diferente. Consigo pagar minhas contas facilmente e amo ler mesmo quando não há vista.',
      avatar: 'L'
    },
    {
      name: 'Michele Sabremski',
      role: 'Bibliotecária',
      rating: 5,
      comment: 'Plataforma incrível, ganha dinheiro e ainda ganha conhecimento mesmo quando viajo, consegui 3 anos de vida financeira e nunca mais precisei de outro emprego.',
      avatar: 'M'
    }
  ];

    const howItWorks = [
    {
        step: '01',
        title: 'Cadastre-se Grátis',
        description: 'Crie sua conta em menos de 2 minutos. Sem taxas, sem complicação.',
        icon: cadastroIcon,
        color: '#111'
    },
    {
        step: '02',
        title: 'Escolha um Livro',
        description: 'Navegue por nossa biblioteca e comece a ler no próprio aplicativo.',
        icon: livroIcon,
        color: '#111'
    },
    {
        step: '03',
        title: 'Leia e Avalie',
        description: 'Termine sua leitura e ganhe pontos ao deixar sua avaliação honesta.',
        icon: estrelaIcon,
        color: '#111'
    },
    {
        step: '04',
        title: 'Receba Pagamentos',
        description: 'Ganhe R$ 5 em prêmios. Saque a partir de R$ 50 via PIX.',
        icon: dinheiroIcon,
        color: '#111'
    }
    ];

  return (
    <div className="landing-page">
      {/* Header */}
      <div className='container_all'
              style={{
                backgroundImage: `url(${fundo})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                width: '100%',
                height: '100vh' // opcional
            }}>
        <header className="landing-header">
            <div className="container">
            <div className="header-content">
                <div className="logo">
                    <img src={logo} alt="Logo do site" className="logo-img" />
                </div>
                <nav className="nav-links">
                <Link to="/login" className="nav-link">Entrar</Link>
                <Link to="/register" className="btn btn-primary">Começar agora</Link>
                </nav>
            </div>
            </div>
        </header>

        {/* Hero Section */}
        <section className="hero">
            <div className="container">
            <div className="hero-content">
                <div className="hero-text">
                <div className="hero-badge">
                    <CheckCircle size={16} />
                    <span>Avaliações 100% Seguras • Pagamentos Garantidos</span>
                </div>
                
                <h1 className="hero-title">
                    Transforme sua <span className="text-primary">paixão por livros</span><br />
                    em renda extra
                </h1>
                
                <p className="hero-description">
                    Seja pago para ler e avaliar livros incrívitos. Mais de <strong>R$ 900.000</strong> já foram 
                    pagos aos nossos leitores. Junte-se à maior comunidade de Readers do Brasil.
                </p>
                
                <div className="hero-actions">
                    <Link to="/register" className="btn btn-primary btn-lg">
                    Começar agora • É grátis
                    </Link>
                    <button className="btn btn-outline btn-lg">
                    Sem taxas de inscrição
                    </button>
                </div>
                
                <div className="hero-features">
                    <div className="feature-item">
                    <CheckCircle size={16} />
                    <span>Cadastro 100% gratuito</span>
                    </div>
                    <div className="feature-item">
                    <CheckCircle size={16} />
                    <span>R$ 1 até milhões</span>
                    </div>
                    <div className="feature-item">
                    <CheckCircle size={16} />
                    <span>Saque rápido</span>
                    </div>
                </div>
                </div>
            </div>
            </div>
        </section>
      </div>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-card">
                <div className="stat-icon">
                  <stat.icon size={24} />
                </div>
                <div className="stat-content">
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>O que nossos leitores dizem</h2>
            <p>Histórias reais de pessoas que transformaram sua paixão por livros em renda extra</p>
          </div>
          
          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-header">
                  <div className="testimonial-avatar">
                    {testimonial.avatar}
                  </div>
                  <div className="testimonial-info">
                    <h4>{testimonial.name}</h4>
                    <p>{testimonial.role}</p>
                    <div className="rating">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} size={16} fill="currentColor" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="testimonial-comment">"{testimonial.comment}"</p>
                <div className="testimonial-footer">
                  <span>Leia mais: R$ {(Math.random() * 500 + 100).toFixed(0)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2>Como funciona? É simples!</h2>
            <p>Processo transparente e fácil para você começar a ganhar dinheiro hoje mesmo</p>
          </div>
          
          <div className="steps-grid">
            {howItWorks.map((step, index) => (
              <div key={index} className="step-card">
                <div className="step-number" style={{ backgroundColor: step.color }}>
                  {step.step}
                </div>
                <img
                className="step-icon"
                src={step.icon}
                alt={step.title}
                style={{ width: '64px', height: '64px', objectFit: 'contain', marginBottom: '1rem' }}
                />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            ))}
          </div>
          
          <div className="cta-section">
            <Link to="/register" className="btn btn-primary btn-lg">
              Começar Agora
              <ChevronRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <div className="logo">
                <img src={logo} alt="Logo do site" className="logo-img" />
              </div>
              <p>A maior plataforma de reading do Brasil. Transforme sua paixão por livros em uma fonte de renda através da nossa rede segura e confiável.</p>
            </div>
            
            <div className="footer-links">
              <div className="link-group">
                <h3>Pagamentos Seguros</h3>
                <a href="#">Como funciona o PIX</a>
                <a href="#">Política de Segurança</a>
              </div>
              <div className="link-group">
                <h3>Suporte 24/7</h3>
                <a href="#">Central de Ajuda</a>
                <a href="#">Certificado de Qualidade</a>
              </div>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p>&copy; 2024 BETA REVIEW. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>

      <style>{`
        .logo-img {
        width: 150px;   /* ajuste conforme necessário */
        height: auto;  /* mantém proporção */
        }

        .landing-page {
          min-height: 100vh;
        }
        
        .landing-header {
          padding: var(--spacing-md) 0;
          position: sticky;
          top: 0;
          z-index: 100;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        
        .logo {
          display: flex;
          align-items: center;
          gap: var(--spacing-sm);
        }
        
        .logo-icon {
          color: var(--color-primary);
        }
        
        .logo-text {
          font-size: var(--text-xl);
          font-weight: var(--font-bold);
          color: #fff;
        }
        
        .nav-links {
          display: flex;
          align-items: center;
          gap: var(--spacing-lg);
        }
        
        .nav-link {
          text-decoration: none;
          color: #fff;
          font-weight: var(--font-medium);
          transition: color var(--transition-fast);
        }
        
        .nav-link:hover {
          color: var(--color-primary);
        }
        
        .hero {
          padding: var(--spacing-2xl) 0;
        }
        
        .hero-content {
          text-align: center;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm) var(--spacing-md);
          background-color: rgba(137, 90, 237, 0.1);
          color: var(--color-primary);
          border-radius: var(--radius-full);
          font-size: var(--text-lg);
          font-weight: var(--font-medium);
          margin-bottom: var(--spacing-lg);
        }
        
        .hero-title {
          font-size: 4.25rem;
          font-weight: var(--font-bold);
          line-height: 1.2;
          margin-bottom: 6.25rem;
          color: #fff;
        }
        
        .hero-description {
          font-size: var(--text-lg);
          color: #ccc;
          margin-bottom: var(--spacing-xl);
          line-height: 1.6;
        }
        
        .hero-actions {
          display: flex;
          justify-content: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-xl);
        }
        
        .hero-features {
          display: flex;
          justify-content: center;
          gap: var(--spacing-lg);
          flex-wrap: wrap;
        }
        
        .feature-item {
          display: flex;
          align-items: center;
          gap: var(--spacing-xs);
          color: #fff;
          font-size: var(--text-lg);
        }
        
        .feature-item svg {
          color: var(--color-success);
        }
        
        .stats-section {
          padding: var(--spacing-2xl) 0;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .stat-card {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          padding: var(--spacing-lg);
          background-color: var(--color-background);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border-light);
        }
        
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-md);
          background-color: var(--color-surface);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-primary);
        }
        
        .stat-value {
          font-size: var(--text-2xl);
          font-weight: var(--font-bold);
          color: var(--color-primary);
        }
        
        .stat-label {
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .testimonials-section {
          padding: var(--spacing-2xl) 0;
          background-color: var(--color-surface);
        }
        
        .section-header {
          text-align: center;
          margin-bottom: var(--spacing-2xl);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
        }
        
        .section-header h2 {
          font-size: var(--text-3xl);
          font-weight: var(--font-bold);
          margin-bottom: var(--spacing-md);
        }
        
        .section-header p {
          font-size: var(--text-lg);
          color: var(--color-text-secondary);
        }
        
        .testimonials-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: var(--spacing-lg);
        }
        
        .testimonial-card {
          background-color: var(--color-background);
          padding: var(--spacing-lg);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-sm);
          border: 1px solid var(--color-border-light);
        }
        
        .testimonial-header {
          display: flex;
          align-items: center;
          gap: var(--spacing-md);
          margin-bottom: var(--spacing-md);
        }
        
        .testimonial-avatar {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-full);
          background-color: var(--color-primary);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
        }
        
        .testimonial-info h4 {
          margin: 0;
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
        }
        
        .testimonial-info p {
          margin: 0;
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
        }
        
        .rating {
          display: flex;
          gap: 2px;
          color: var(--color-warning);
          margin-top: var(--spacing-xs);
        }
        
        .testimonial-comment {
          color: var(--color-text-primary);
          line-height: 1.6;
          margin-bottom: var(--spacing-md);
        }
        
        .testimonial-footer {
          color: var(--color-text-secondary);
          font-size: var(--text-sm);
          font-weight: var(--font-medium);
        }
        
        .how-it-works {
          padding: var(--spacing-2xl) 0;
        }
        
        .steps-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
          margin-bottom: var(--spacing-2xl);
        }
        
        .step-card {
          text-align: center;
          padding: var(--spacing-lg);
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: var(--radius-full);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--font-semibold);
          margin: 0 auto var(--spacing-md);
        }
        
        .step-icon {
          font-size: 3rem;
          margin-bottom: var(--spacing-md);
        }
        
        .step-card h3 {
          font-size: var(--text-xl);
          font-weight: var(--font-semibold);
          margin-bottom: var(--spacing-sm);
        }
        
        .step-card p {
          color: var(--color-text-secondary);
          line-height: 1.6;
        }
        
        .cta-section {
          text-align: center;
        }
        
        .landing-footer {
          background-color: #1a1a1a;
          color: white;
          padding: var(--spacing-2xl) 0 var(--spacing-lg);
        }
        
        .footer-content {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr;
          gap: var(--spacing-2xl);
          margin-bottom: var(--spacing-2xl);
        }
        
        .footer-brand p {
          color: #adb5bd;
          line-height: 1.6;
          margin-top: var(--spacing-md);
        }
        
        .link-group h3 {
          font-size: var(--text-base);
          font-weight: var(--font-semibold);
          margin-bottom: var(--spacing-md);
        }
        
        .link-group a {
          display: block;
          color: #adb5bd;
          text-decoration: none;
          margin-bottom: var(--spacing-sm);
          transition: color var(--transition-fast);
        }
        
        .link-group a:hover {
          color: white;
        }
        
        .footer-bottom {
          text-align: center;
          padding-top: var(--spacing-lg);
          border-top: 1px solid #333;
          color: #adb5bd;
        }
        
        @media (max-width: 768px) {
          .hero-title {
            font-size: var(--text-3xl);
          }
          
          .hero-actions {
            flex-direction: column;
            align-items: center;
          }
          
          .hero-features {
            flex-direction: column;
            align-items: center;
          }
          
          .nav-links {
            gap: var(--spacing-md);
          }
          
          .footer-content {
            grid-template-columns: 1fr;
            gap: var(--spacing-lg);
          }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;