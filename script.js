let gamesData = [];

async function fetchGamesFromAPI() {
    showLoading();
    try {
        const response = await fetch('/api/itad/deals');
        const data = await response.json();
        gamesData = (data && data.list) ? data.list.map(deal => {
            const price = deal.deal && deal.deal.price ? deal.deal.price.amount : null;
            const original = deal.deal && deal.deal.regular ? deal.deal.regular.amount : null;
            const discount = deal.deal && typeof deal.deal.cut === 'number' ? deal.deal.cut : null;
            const shop = deal.deal && deal.deal.shop && deal.deal.shop.name ? deal.deal.shop.name : '';
            const url = deal.deal && deal.deal.url ? deal.deal.url : '';
            const image = deal.assets && (deal.assets.banner400 || deal.assets.boxart || deal.assets.banner145) ? (deal.assets.banner400 || deal.assets.boxart || deal.assets.banner145) : '';
            const platforms = deal.deal && deal.deal.platforms ? deal.deal.platforms.map(p => p.name) : (deal.platforms ? deal.platforms.map(p => p.name || p) : []);
            return {
                id: deal.id,
                title: deal.title,
                image: image,
                rating: 0,
                genre: '',
                platform: platforms,
                originalPrice: typeof original === 'number' ? original : '',
                discountedPrice: typeof price === 'number' ? price : '',
                discountPercentage: typeof discount === 'number' ? discount : '',
                shop: shop,
                dealUrl: url
            };
        }) : [];
        console.log('gamesData após fetch:', gamesData);
    } catch (error) {
        showToast('Erro ao buscar jogos em promoção', 'error');
    } finally {
        hideLoading();
    }
}
// State
let currentFilter = 'all';
let currentSort = 'discount';

// DOM Elements
const mobileMenuBtn = document.getElementById('mobileMenuBtn');
const mobileMenu = document.getElementById('mobileMenu');
const searchInput = document.getElementById('searchInput');
const featuredGrid = document.getElementById('featuredGrid');
const gamesGrid = document.getElementById('gamesGrid');
const filterTabs = document.querySelectorAll('.filter-tab');
const sortSelect = document.getElementById('sortSelect');
const newsletterForm = document.getElementById('newsletterForm');
const loadingOverlay = document.getElementById('loadingOverlay');
const toastContainer = document.getElementById('toastContainer');

// Utility Functions
function formatPrice(price) {
  if (typeof price !== 'number' || isNaN(price)) return 'Indisponível';
  return `R$ ${price.toFixed(2).replace('.', ',')}`;
}

function createStars(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  let stars = '';
  
  for (let i = 0; i < fullStars; i++) {
      stars += '⭐';
  }
  if (hasHalfStar) {
      stars += '⭐';
  }
  
  return stars;
}

function showLoading() {
  loadingOverlay.style.display = 'flex';
}

function hideLoading() {
  loadingOverlay.style.display = 'none';
}

function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
      toast.remove();
  }, 3000);
}

// Game Card Creation
function createGameCard(game, featured = false) {
  const cardClass = featured ? 'game-card featured-card' : 'game-card';
  
  return `
      <div class="${cardClass}" data-game-id="${game.id}">
          <div class="game-card-image">
              <img src="${game.image}" alt="${game.title}" loading="lazy">
              <div class="discount-badge">-${game.discountPercentage}%</div>
          </div>
          <div class="game-card-content">
              <h3 class="game-title">${game.title}</h3>
              <p class="game-genre">${game.genre}</p>
              <div class="game-platforms">
                  ${game.platform.map(platform => 
                      `<span class="platform-badge">${platform}</span>`
                  ).join('')}
              </div>
              <div class="game-prices">
                  <div class="price-info">
                      <span class="original-price">${formatPrice(game.originalPrice)}</span>
                      <span class="discounted-price">${formatPrice(game.discountedPrice)}</span>
                  </div>
                  <a href="${game.dealUrl}">
                  <button class="add-to-cart-btn">
                      Comprar na ${game.shop}
                  </button>
                  </a>
              </div>
          </div>
      </div>
  `;
}

// Filter and Sort Functions
function getFilteredGames() {
  let filteredGames = [...gamesData];
  
  // Apply search filter
  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
      filteredGames = filteredGames.filter(game => 
          game.title.toLowerCase().includes(searchTerm) ||
          game.genre.toLowerCase().includes(searchTerm)
      );
  }
  
  // Apply category filter
  switch (currentFilter) {
      case 'best-deals':
          filteredGames = filteredGames.filter(game => game.discountPercentage >= 70);
          break;
      case 'new-releases':
          filteredGames = filteredGames.slice(0, 6);
          break;
      case 'all':
      default:
          break;
  }
  
  // Apply sorting
  switch (currentSort) {
      case 'discount':
          filteredGames.sort((a, b) => b.discountPercentage - a.discountPercentage);
          break;
      case 'price-low':
          filteredGames.sort((a, b) => a.discountedPrice - b.discountedPrice);
          break;
      case 'price-high':
          filteredGames.sort((a, b) => b.discountedPrice - a.discountedPrice);
          break;
      case 'rating':
          filteredGames.sort((a, b) => b.rating - a.rating);
          break;
  }
  
  return filteredGames;
}

function renderFeaturedGames() {
  const featuredGames = gamesData.filter(game => game.featured);
  featuredGrid.innerHTML = featuredGames.map(game => createGameCard(game, true)).join('');
}

function renderGames() {
  showLoading();
  
  setTimeout(() => {
      const filteredGames = getFilteredGames();
      console.log('filteredGames para exibir:', filteredGames);
      gamesGrid.innerHTML = filteredGames.map(game => createGameCard(game)).join('');
      hideLoading();
  }, 300);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async function() {
  await fetchGamesFromAPI();
  renderFeaturedGames();
  renderGames();

  // Delegação de clique para GameCard
  gamesGrid.addEventListener('click', function(e) {
    const card = e.target.closest('.game-card');
    if (card) {
      const id = card.getAttribute('data-game-id');
      const game = gamesData.find(g => g.id == id);
      if (game) {
        // Garante que o campo id salvo é o UUID da ITAD para funcionar com /games/info/v2
        const selected = { ...game };
        // Mantém o UUID original do deal.id
        localStorage.setItem('selectedGame', JSON.stringify(selected));
        window.location.href = 'game.html';
      }
    }
  });
});

// Mobile menu toggle
if (mobileMenuBtn && mobileMenu) {
  mobileMenuBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    mobileMenu.classList.toggle('active');
  });

  // Fecha o menu ao clicar em link do menu mobile
  mobileMenu.addEventListener('click', function(e) {
    if (e.target.classList.contains('mobile-nav-link')) {
      mobileMenu.classList.remove('active');
    }
  });

  // Fecha o menu ao clicar fora dele
  document.addEventListener('click', function(e) {
    if (mobileMenu.classList.contains('active') && !e.target.closest('.mobile-menu') && !e.target.closest('#mobileMenuBtn')) {
      mobileMenu.classList.remove('active');
    }
  });
}

// Search functionality
searchInput.addEventListener('input', function() {
  renderGames();
});

// Filter tabs
filterTabs.forEach(tab => {
  tab.addEventListener('click', function() {
      // Remove active class from all tabs
      filterTabs.forEach(t => t.classList.remove('active'));
      
      // Add active class to clicked tab
      this.classList.add('active');
      
      // Update current filter
      currentFilter = this.dataset.filter;
      
      // Re-render games
      renderGames();
  });
});

// Sort functionality
sortSelect.addEventListener('change', function() {
  currentSort = this.value;
  renderGames();
});

// Newsletter form
newsletterForm.addEventListener('submit', function(e) {
  e.preventDefault();
  
  const email = this.querySelector('.newsletter-input').value;
  
  showLoading();
  
  // Simulate API call
  setTimeout(() => {
      hideLoading();
      showToast('Inscrição realizada com sucesso!');
      this.reset();
  }, 1000);
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
      e.preventDefault();
      
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
          target.scrollIntoView({
              behavior: 'smooth',
              block: 'start'
          });
      }
  });
});

// Add scroll effect to header
window.addEventListener('scroll', function() {
  const header = document.querySelector('.header');
  if (window.scrollY > 100) {
      header.style.background = 'rgba(15, 15, 20, 0.98)';
  } else {
      header.style.background = 'rgba(15, 15, 20, 0.95)';
  }
});

// Add intersection observer for animations
const observerOptions = {
  threshold: 0.1,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver(function(entries) {
  entries.forEach(entry => {
      if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
      }
  });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.game-card, .stat, .footer-section').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(20px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + K to focus search
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
  }
  
  // Escape to close mobile menu
  if (e.key === 'Escape') {
      mobileMenu.classList.remove('active');
  }
});

// Lazy loading for images
if ('IntersectionObserver' in window) {
  const imageObserver = new IntersectionObserver(function(entries) {
      entries.forEach(entry => {
          if (entry.isIntersecting) {
              const img = entry.target;
              img.src = img.dataset.src || img.src;
              img.classList.remove('lazy');
              imageObserver.unobserve(img);
          }
      });
  });
  
  document.querySelectorAll('img[loading="lazy"]').forEach(img => {
      imageObserver.observe(img);
  });
}
