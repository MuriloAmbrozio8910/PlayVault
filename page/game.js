// game.js - Mostra detalhes do jogo selecionado

function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) return 'Indisponível';
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

function getGameFromStorage() {
  const game = localStorage.getItem('selectedGame');
  return game ? JSON.parse(game) : null;
}

async function renderGameDetail() {
  // Obter id ou slug do jogo salvo no localStorage (apenas identificador)
  const selectedGame = JSON.parse(localStorage.getItem('selectedGame'));
  const detailDiv = document.getElementById('gameDetail');

  if (!selectedGame || !selectedGame.id) {
    detailDiv.innerHTML = '<p>Jogo não encontrado.</p>';
    return;
  }

  // Mostrar loading
  detailDiv.innerHTML = '<div class="loading-spinner">Carregando detalhes do jogo...</div>';

  // Executar todas as chamadas de API em paralelo para melhor performance
  const [gameData, rawgData, twitchData] = await Promise.allSettled([
    // 1. Buscar detalhes do jogo na ITAD API
    fetch(`/api/game/${encodeURIComponent(selectedGame.id)}`)
      .then(res => res.ok ? res.json() : null)
      .catch(() => null),

    // 2. Buscar dados do RAWG (screenshots + descrição)
    fetch(`https://api.rawg.io/api/games?search=${encodeURIComponent(selectedGame.title)}&key=2b3176a6c1ce44c285efe009fd14c59e`)
      .then(res => res.json())
      .then(async (data) => {
        if (data?.results?.length > 0) {
          const gameSlug = data.results[0].slug;
          const [shotsRes, detailRes] = await Promise.all([
            fetch(`https://api.rawg.io/api/games/${gameSlug}/screenshots?key=2b3176a6c1ce44c285efe009fd14c59e`),
            fetch(`https://api.rawg.io/api/games/${gameSlug}?key=2b3176a6c1ce44c285efe009fd14c59e`)
          ]);
          return {
            screenshots: shotsRes.ok ? await shotsRes.json() : null,
            detail: detailRes.ok ? await detailRes.json() : null
          };
        }
        return null;
      })
      .catch(() => null),

    // 3. Buscar transmissões Twitch
    fetch(`https://api.twitch.tv/helix/search/categories?query=${encodeURIComponent(selectedGame.title)}`, {
      headers: {
        'Client-ID': 'frcr4513nhdhxx07n93se8s3snouzg',
        'Authorization': 'Bearer ttynaqnkwpose5m7hv1id7x8vhf6in'
      }
    })
      .then(res => res.status === 401 ? { error: 'unauthorized' } : res.json())
      .then(async (data) => {
        if (data.error === 'unauthorized') return { error: 'unauthorized' };
        if (data?.data?.length > 0) {
          const category = data.data[0];
          const streamsRes = await fetch(`https://api.twitch.tv/helix/streams?game_id=${category.id}`, {
            headers: {
              'Client-ID': 'frcr4513nhdhxx07n93se8s3snouzg',
              'Authorization': 'Bearer ttynaqnkwpose5m7hv1id7x8vhf6in'
            }
          });
          const streams = await streamsRes.json();
          return { category, streams };
        }
        return null;
      })
      .catch(() => null)
  ]);

  // Combinar dados
  let game = { ...selectedGame };
  if (gameData.status === 'fulfilled' && gameData.value) {
    game = {
      ...selectedGame,
      ...gameData.value,
      // Preservar dados do localStorage
      originalPrice: selectedGame.originalPrice,
      discountedPrice: selectedGame.discountedPrice,
      discountPercentage: selectedGame.discountPercentage,
      shop: selectedGame.shop,
      platform: selectedGame.platform,
      dealUrl: selectedGame.dealUrl,
      // Usar tags da ITAD API se disponíveis, senão do localStorage
      tags: gameData.value.tags || selectedGame.tags,
      earlyAccess: gameData.value.earlyAccess, 
      reviews: gameData.value.reviews || selectedGame.reviews,
      releaseDate: gameData.value.releaseDate || selectedGame.releaseDate,
    };
  }

  if (!game || !game.title) {
    detailDiv.innerHTML = '<p>Não foi possível carregar os detalhes do jogo.</p>';
    return;
  }

  // Processar dados das APIs em paralelo
  let mainImage = '';
  // Detectar se está em mobile
  const isMobile = window.innerWidth <= 768;
  if (game.assets) {
    if (isMobile && game.assets.boxart) {
      mainImage = game.assets.boxart;
    } else if (game.assets.banner600) {
      mainImage = game.assets.banner600;
    } else if (game.assets.boxart) {
      mainImage = game.assets.boxart;
    }
  }
  if (!mainImage && game.image) {
    mainImage = game.image;
  }

  const images = [];
  if (mainImage) images.push(mainImage);

  // Processar screenshots do RAWG
  if (rawgData.status === 'fulfilled' && rawgData.value?.screenshots?.results) {
    rawgData.value.screenshots.results.forEach(s => {
      if (s.image && s.image !== mainImage && !images.includes(s.image)) {
        images.push(s.image);
      }
    });
  }

  // Processar descrição do RAWG
  let description = '';
  if (rawgData.status === 'fulfilled' && rawgData.value?.detail) {
    description = rawgData.value.detail.description_raw || rawgData.value.detail.description || '';
  }

  // Processar transmissões Twitch
  let twitchEmbed = '';
  if (twitchData.status === 'fulfilled' && twitchData.value) {
    const twitch = twitchData.value;
    if (twitch.error === 'unauthorized') {
      twitchEmbed = '<div class="game-twitch-error">Transmissões ao vivo não disponíveis no momento.</div>';
    } else if (twitch.streams?.data?.length > 0) {
      // Priorizar lives brasileiras (pt)
      let stream = twitch.streams.data.find(s => s.language === 'pt');
      if (!stream) stream = twitch.streams.data[0];
      const channelName = stream.user_login;
      const parent = window.location.hostname || 'localhost';
      twitchEmbed = `<iframe src="https://player.twitch.tv/?channel=${channelName}&parent=${parent}" frameborder="0" allowfullscreen="true" scrolling="no" height="378" width="620"></iframe>`;
    } else {
      twitchEmbed = '<div class="game-twitch-error">Nenhuma transmissão ao vivo encontrada para este jogo.</div>';
    }
  } else {
    twitchEmbed = '<div class="game-twitch-error">Erro ao buscar transmissões ao vivo.</div>';
  }

  // Separar banner principal das screenshots
  const bannerHtml = mainImage ? `<div class="main-banner"><img class="game-detail-img" src="${mainImage}" alt="${game.title}"></div>` : '';
  const screenshots = images.filter(img => img !== mainImage);
  const screenshotsHtml = screenshots.length > 0 ? `
    <section class="screenshots-section">
      <h3>Screenshots</h3>
      <div class="swiper swiper-container">
        <div class="swiper-wrapper">
          ${screenshots.map(img => `<div class="swiper-slide"><img class="game-detail-img" src="${img}" alt="${game.title}"></div>`).join('')}
        </div>
        <div class="swiper-button-next"></div>
        <div class="swiper-button-prev"></div>
      </div>
    </section>
  ` : '';

  detailDiv.innerHTML = `
    <div class="game-detail-container">
      <!-- Hero Section -->
      <div class="game-hero">
        ${bannerHtml}
        <div class="game-hero-overlay">
          <div class="game-hero-content">
            <div class="game-hero-info">
            <h1 class="game-title">${game.title}</h1>
            ${game.earlyAccess ? `<span class="early-access-badge">Early Access</span>` : ''}
            </div>
            ${game.tags && game.tags.length > 0 ? `
              <div class="game-tags-hero">
                ${game.tags.slice(0, 3).map(tag => `<span class="game-tag-hero">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="game-content">
        <!-- Left Column -->
        <div class="game-main-info">
          <!-- Price Section -->
          <div class="price-section">
            <h3>Preço e Oferta</h3>
            <div class="price-card">
              <div class="price-main">
                <span class="price-current">${formatPrice(game.discountedPrice)}</span>
                <span class="price-original">${formatPrice(game.originalPrice)}</span>
              </div>
              <div class="discount-badge">-${game.discountPercentage}%</div>
            </div>
            <div class="store-info">
              <span class="store-name">🏪 ${game.shop}</span>
              <span class="platforms">🎮 ${game.platform && game.platform.length ? game.platform.join(', ') : 'PC'}</span>
            </div>
            <a href="${game.dealUrl}" target="_blank" class="buy-button">
              <span>🛒 Comprar Agora</span>
            </a>
          </div>

          <!-- Description -->
          ${description ? `
            <div class="description-section">
              <h3>Sobre o Jogo</h3>
              <div class="description-content">
                <p>${description}</p>
              </div>
            </div>
          ` : ''}

          <!-- Screenshots -->
          ${screenshotsHtml}

          ${twitchEmbed ? `
            <div class="twitch-card">
              <h4>Transmissão ao Vivo</h4>
              <div class="twitch-content">
                ${twitchEmbed}
              </div>
            </div>
          ` : ''}
        </div>

        <!-- Right Sidebar -->
        <div class="game-sidebar">
          <!-- Game Info -->
          <div class="info-card">
            <h4>Informações do Jogo</h4>
            ${game.releaseDate ? `<div class="info-item"><span class="info-label">Lançamento:</span><span class="info-value">${new Date(game.releaseDate).toLocaleDateString('pt-BR')}</span></div>` : ''}
            ${game.developers && game.developers.length > 0 ? `<div class="info-item"><span class="info-label">Desenvolvedor:</span><span class="info-value">${game.developers[0].name}</span></div>` : ''}
            ${game.publishers && game.publishers.length > 0 ? `<div class="info-item"><span class="info-label">Publicadora:</span><span class="info-value">${game.publishers[0].name}</span></div>` : ''}
          </div>

          <!-- Tags -->
          ${game.tags && game.tags.length > 0 ? `
            <div class="tags-card">
              <h4>Tags</h4>
              <div class="tags-grid">
                ${game.tags.map(tag => `<span class="game-tag">${tag}</span>`).join('')}
              </div>
            </div>
          ` : ''}

          <!-- Reviews -->
          ${game.reviews && game.reviews.length > 0 ? `
            <div class="reviews-card">
              <h4>Avaliações</h4>
              <div class="reviews-list">
                ${game.reviews.map(review => `
                  <div class="review-item">
                    <div class="review-header">
                      <span class="review-score score-${review.score >= 80 ? 'high' : review.score >= 60 ? 'medium' : 'low'}">${review.score}</span>
                      <div class="review-meta">
                        <div class="review-source">${review.source}</div>
                        <div class="review-count">${review.count.toLocaleString()} avaliações</div>
                      </div>
                    </div>
                    <a href="${review.url}" target="_blank" class="review-link">Ver detalhes</a>
                  </div>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    </div>
  `;

  // Inicializa Swiper apenas se houver screenshots
  if (window.Swiper && screenshots.length > 0) {
    new Swiper('.swiper', {
      loop: screenshots.length > 1,
      navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' },
      slidesPerView: 1,
      spaceBetween: 10,
    });
  }
}

document.addEventListener('DOMContentLoaded', renderGameDetail);
