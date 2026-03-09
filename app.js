/* ========================================
   Futures Pro - Main Application
   ======================================== */

// ==========================================
// Constants & Data
// ==========================================

// Data source APIs
const DATA_SOURCES = {
  eastmoney: {
    name: '东方财富',
    baseUrl: 'https://push2.eastmoney.com/api/qt/stock/get',
    fields: 'f43,f57,f58,f169,f170,f46,f44,f45,f50,f47,f48,f49',
    getSecId: (code) => {
      // 交易所代码映射:
      // 1 = 上期所 (SHFE) - 贵金属, 铜, 铝, 锌, 镍, 铅, 锡, 不锈钢, 沥青, 螺纹, 热卷
      // 4 = 大商所 (DCE) - 铁矿石, 豆粕, 豆油, 豆一, 豆二
      // 5 = 郑商所 (CZCE) - 白糖, 棉花, 粳米, 甲醇, PTA, 橡胶
      // 6 = 上期能源 (INE) - 原油, 20号胶
      // 8 = 中金所 (CFFEX) - 股指期货
      // 101 = 纽约COMEX - 黄金, 白银, 铜
      // 118 = 上海金交所 - Au(T+D), Ag(T+D)
      
      // 使用T+D合约(118)和特定合约代码
      const mapping = {
        // 贵金属 - 使用T+D合约 (这些目前可用)
        'aum': '118.AUTD',      // 黄金T+D (可用的实时行情)
        'agm': '118.AGTD',      // 白银T+D (可用的实时行情)
        'AUTD': '118.AUTD',     // 黄金T+D
        'AGTD': '118.AGTD',     // 白银T+D
        // 国际贵金属 - 尝试COMEX
        'GC': '101.GC2306',     // COMEX黄金 2023年6月
        'SI': '101.SI2306',     // COMEX白银 2023年6月
        // 工业金属 - 尝试具体合约 (2026年3月可用的合约)
        'cum': '1.CU2606',      // 沪铜 2026年6月
        'alm': '1.AL2606',      // 沪铝 2026年6月
        'znm': '1.ZN2606',      // 沪锌 2026年6月
        'nim': '1.NI2606',      // 沪镍 2026年6月
        'pb': '1.PB2606',       // 沪铅 2026年6月
        'sn': '1.SN2606',       // 沪锡 2026年6月
        'ss': '1.SS2606',       // 不锈钢 2026年6月
        'HG': '101.HG2306',     // COMEX铜 2023年6月
        // 能源 - 原油
        'sc': '6.SC2612',       // SC原油 2026年12月
        'scm': '6.SC2612',      // 国内原油 2026年12月
        'B00Y': '1.OI2606',     // 布伦特原油 2026年6月
        // 黑色金属
        'rbm': '1.RB2606',      // 螺纹钢 2026年6月
        'rb': '1.RB2606',       // 螺纹钢 2026年6月
        'im': '4.I2606',        // 铁矿石 2026年6月
        'i': '4.I2606',         // 铁矿石 2026年6月
        'hc': '1.HC2606',       // 热卷 2026年6月
        // 农产品 - 大商所
        'mm': '4.M2606',        // 豆粕 2026年6月
        'm': '4.M2606',         // 豆粕 2026年6月
        'ym': '4.Y2606',        // 豆油 2026年6月
        'y': '4.Y2606',         // 豆油 2026年6月
        'a': '4.A2606',         // 豆一 2026年6月
        'b': '4.B2606',         // 豆二 2026年6月
        // 农产品 - 郑商所
        'SRM': '5.SR2609',      // 白糖 2026年9月
        'SR': '5.SR2609',       // 白糖 2026年9月
        'CFM': '5.CF2609',      // 棉花 2026年9月
        'CF': '5.CF2609',       // 棉花 2026年9月
        'JR': '5.JR2609',       // 粳米 2026年9月
        // 化工 - 郑商所
        'MAm': '5.MA2609',      // 甲醇 2026年9月
        'MA': '5.MA2609',       // 甲醇 2026年9月
        'SAM': '1.SA2609',      // 纯碱 2026年9月
        'SA': '1.SA2609',       // 纯碱 2026年9月
        'TAM': '5.TA2609',      // PTA 2026年9月
        'TA': '5.TA2609',       // PTA 2026年9月
        'RU': '5.RU2609',       // 橡胶 2026年9月
        // 沥青 - 上期所
        'BU': '1.BU2606',       // 沥青 2026年6月
      };
      
      // 如果是简单代码，尝试匹配
      const lowerCode = code.toLowerCase();
      if (mapping[lowerCode]) {
        return mapping[lowerCode];
      }
      
      // 尝试直接使用代码 (作为后备)
      return `1.${code.toUpperCase()}`;
    }
  },
  sina: {
    name: '新浪财经',
    baseUrl: 'https://hq.sinajs.cn/list='
  },
  ifeng: {
    name: '凤凰财经',
    baseUrl: 'http://quotes.ifeng.com/'
  }
};

// Default contracts - using T+D and available contracts
const DEFAULT_CONTRACTS = [
  { code: 'AUTD', name: '黄金T+D', category: '贵金属', unit: '元/克' },
  { code: 'AGTD', name: '白银T+D', category: '贵金属', unit: '元/千克' },
  { code: 'aum', name: '黄金T+D', category: '贵金属', unit: '元/克' },
  { code: 'agm', name: '白银T+D', category: '贵金属', unit: '元/千克' },
];

// Quick add options - only working contracts
const QUICK_ADD_OPTIONS = [
  { code: 'AUTD', name: '黄金T+D', category: '贵金属' },
  { code: 'AGTD', name: '白银T+D', category: '贵金属' },
  { code: 'aum', name: '黄金T+D', category: '贵金属' },
  { code: 'agm', name: '白银T+D', category: '贵金属' },
];

// Category mapping
const CATEGORY_MAP = {
  'metals': '贵金属',
  'metals-industrial': '工业金属',
  'energy': '能源',
  'agriculture': '农产品',
  'chemical': '化工',
  'black': '黑色金属'
};

// ==========================================
// State
// ==========================================

let state = {
  currentPage: 'home',
  currentCategory: null,
  dataSource: 'eastmoney',
  favorites: [],
  quotes: {},
  priceHistory: {},
  selectedContract: null,
  refreshInterval: 30000,
  timer: null,
  chart: null
};

// ==========================================
// Initialization
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initUI();
  initEventListeners();
  refreshData();
  startAutoRefresh();
});

// Load state from localStorage
function loadState() {
  try {
    const saved = localStorage.getItem('futures_pro_state');
    if (saved) {
      const parsed = JSON.parse(saved);
      state.favorites = parsed.favorites || [];
      state.dataSource = parsed.dataSource || 'eastmoney';
    }
  } catch (e) {
    console.error('Failed to load state:', e);
  }
  
  // Use defaults if empty
  if (state.favorites.length === 0) {
    state.favorites = DEFAULT_CONTRACTS.slice(0, 6).map(c => ({ ...c }));
  }
}

// Save state to localStorage
function saveState() {
  try {
    localStorage.setItem('futures_pro_state', JSON.stringify({
      favorites: state.favorites,
      dataSource: state.dataSource
    }));
  } catch (e) {
    console.error('Failed to save state:', e);
  }
}

// Initialize UI
function initUI() {
  // Set data source selector
  document.getElementById('dataSource').value = state.dataSource;
  
  // Render quick tags
  renderQuickTags();
  
  // Show home page
  showPage('home');
}

// Demo data for fallback when API fails
const DEMO_DATA = {
  'aum': { price: 452.30, open: 450.50, high: 453.80, low: 449.20, volume: 156000, change: 1.80, changePercent: 0.40 },
  'agm': { price: 5420, open: 5380, high: 5450, low: 5350, volume: 89000, change: 40, changePercent: 0.74 },
  'AUTD': { price: 453.25, open: 451.80, high: 454.50, low: 450.90, volume: 45000, change: 1.45, changePercent: 0.32 },
  'AGTD': { price: 5412, open: 5390, high: 5430, low: 5375, volume: 32000, change: 22, changePercent: 0.41 },
  'GC': { price: 1985.20, open: 1972.50, high: 1990.80, low: 1968.30, volume: 125000, change: 12.70, changePercent: 0.64 },
  'cum': { price: 68950, open: 68500, high: 69200, low: 68300, volume: 78000, change: 450, changePercent: 0.66 },
  'alm': { price: 18420, open: 18350, high: 18500, low: 18280, volume: 95000, change: 70, changePercent: 0.38 },
  'nim': { price: 172800, open: 171500, high: 173500, low: 170800, volume: 45000, change: 1300, changePercent: 0.76 },
  'sc': { price: 528.4, open: 525.0, high: 530.2, low: 523.8, volume: 180000, change: 3.4, changePercent: 0.65 },
  'B00Y': { price: 82.15, open: 81.60, high: 82.50, low: 81.20, volume: 95000, change: 0.55, changePercent: 0.67 },
  'rb': { price: 3680, open: 3665, high: 3695, low: 3650, volume: 2100000, change: 15, changePercent: 0.41 },
  'i': { price: 795.0, open: 788.5, high: 798.0, low: 785.0, volume: 850000, change: 6.5, changePercent: 0.82 },
  'm': { price: 3528, open: 3510, high: 3545, low: 3495, volume: 650000, change: 18, changePercent: 0.51 },
  'y': { price: 7896, open: 7850, high: 7920, low: 7830, volume: 420000, change: 46, changePercent: 0.59 },
  'SR': { price: 6215, open: 6180, high: 6240, low: 6165, volume: 380000, change: 35, changePercent: 0.57 },
  'CF': { price: 15425, open: 15380, high: 15480, low: 15320, volume: 280000, change: 45, changePercent: 0.29 },
  'MA': { price: 2685, open: 2670, high: 2698, low: 2662, volume: 750000, change: 15, changePercent: 0.56 },
  'SA': { price: 2985, open: 2965, high: 3002, low: 2958, volume: 520000, change: 20, changePercent: 0.67 }
};

// Demo mode flag
let demoMode = false;

// Initialize event listeners
function initEventListeners() {
  // Navigation tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const page = tab.dataset.page;
      if (page === 'home') {
        showPage('home');
      } else {
        state.currentCategory = CATEGORY_MAP[page];
        document.getElementById('categoryTitle').textContent = state.currentCategory;
        showPage('category', page);
      }
    });
  });
  
  // Data source selector
  document.getElementById('dataSource').addEventListener('change', (e) => {
    state.dataSource = e.target.value;
    saveState();
    refreshData();
  });
  
  // Refresh interval
  document.getElementById('refreshInterval').addEventListener('change', (e) => {
    state.refreshInterval = parseInt(e.target.value);
    startAutoRefresh();
  });
  
  // Refresh button
  document.getElementById('refreshBtn').addEventListener('click', refreshData);
  
  // Add favorite button
  document.getElementById('addFavorite').addEventListener('click', () => {
    openModal();
  });
  
  // Modal controls
  document.getElementById('closeModal').addEventListener('click', closeModal);
  document.getElementById('cancelAdd').addEventListener('click', closeModal);
  document.getElementById('confirmAdd').addEventListener('click', addContract);
  
  // Detail panel close
  document.getElementById('closeDetail').addEventListener('click', closeDetail);
  
  // Modal overlay click
  document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-overlay')) {
      closeModal();
    }
  });
}

// ==========================================
// Page Navigation
// ==========================================

function showPage(page, category) {
  // Update nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.page === page || 
      (category && CATEGORY_MAP[tab.dataset.page] === state.currentCategory));
  });
  
  // Show/hide pages
  document.getElementById('homePage').classList.toggle('active', page === 'home');
  document.getElementById('categoryPage').classList.toggle('active', page === 'category');
  
  state.currentPage = page;
  
  // Render appropriate page
  if (page === 'home') {
    renderFavorites();
    checkVolatility();
  } else {
    renderCategoryContracts();
  }
}

// ==========================================
// Data Fetching
// ==========================================

// Proxy server URL (update this to your deployed proxy URL)
// Try multiple proxy URLs for fallback
const PROXY_SERVER_URLS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// Current proxy URL index for fallback
let currentProxyIndex = 0;

async function refreshData() {
  const contracts = state.currentPage === 'home' 
    ? state.favorites 
    : getContractsByCategory(state.currentCategory);
  
  if (contracts.length === 0) return;
  
  updateStatus('connecting');
  
  try {
    const source = DATA_SOURCES[state.dataSource];
    const results = await Promise.allSettled(
      contracts.map(c => fetchContractData(c.code, source))
    );
    
    let successCount = 0;
    results.forEach((result, index) => {
      const contract = contracts[index];
      if (result.status === 'fulfilled' && result.value) {
        state.quotes[contract.code] = result.value;
        
        // Store price history for volatility check
        if (!state.priceHistory[contract.code]) {
          state.priceHistory[contract.code] = [];
        }
        const price = parseFloat(result.value.price);
        if (!isNaN(price) && price > 0) {
          const history = state.priceHistory[contract.code];
          history.push({ price, time: Date.now() });
          // Keep only last 48 entries (assuming 30s interval = 24 min of data)
          if (history.length > 48) history.shift();
        }
        
        successCount++;
      }
    });
    
    updateStatus(successCount > 0 ? 'connected' : 'error');
    
    // If no data from API, use demo data
    if (successCount === 0) {
      demoMode = true;
      console.log('Using demo data (API unavailable)');
      contracts.forEach(contract => {
        const demo = DEMO_DATA[contract.code];
        if (demo) {
          state.quotes[contract.code] = demo;
          if (!state.priceHistory[contract.code]) {
            state.priceHistory[contract.code] = [];
          }
          // Add some fake history for demo
          for (let i = 0; i < 20; i++) {
            const variation = (Math.random() - 0.5) * demo.price * 0.02;
            state.priceHistory[contract.code].push({
              price: demo.price - demo.change + variation,
              time: Date.now() - (20 - i) * 60000
            });
          }
          state.priceHistory[contract.code].push({ price: demo.price, time: Date.now() });
        }
      });
      updateStatus('demo');
    }
    updateLastUpdateTime();
    
    // Render current page
    if (state.currentPage === 'home') {
      renderFavorites();
      checkVolatility();
    } else {
      renderCategoryContracts();
    }
    
    // Update detail panel if open
    if (state.selectedContract) {
      updateDetailPanel(state.selectedContract);
    }
    
  } catch (error) {
    console.error('Refresh error:', error);
    updateStatus('error');
    // Try fallback proxy URL
    if (currentProxyIndex < PROXY_SERVER_URLS.length - 1) {
      currentProxyIndex++;
      console.log('Trying fallback proxy:', PROXY_SERVER_URLS[currentProxyIndex]);
      setTimeout(refreshData, 1000);
    }
  }
}

async function fetchContractData(code, source) {
  if (source.name === '东方财富') {
    const secId = source.getSecId(code);
    // Use proxy server instead of direct API call with fallback
    const proxyUrl = `${PROXY_SERVER_URLS[currentProxyIndex]}/proxy/eastmoney?secid=${encodeURIComponent(secId)}&fields=${source.fields}&ut=fa5fd1943c7b386f172d6893dbfba10b&fltt=2&invt=2&_=${Date.now()}`;
    
    try {
      const response = await fetch(proxyUrl, {
        
      });
      
      if (!response.ok) {
        console.error('API response not ok:', response.status);
        return null;
      }
      
      const data = await response.json();
      
      // Check if we got valid data
      if (!data.data) {
        console.error('No data for:', secId, data);
        return null;
      }
      
      const d = data.data;
      
      // Check if price is valid
      if (!d.f43 || d.f43 === '-') {
        console.error('Invalid price for:', secId);
        return null;
      }
      
      return {
        price: d.f43,
        open: d.f46,
        high: d.f44,
        low: d.f45,
        volume: d.f47,
        amount: d.f48,
        change: d.f170,
        changePercent: d.f169,
        settle: d.f50,
        openInterest: d.f49,
        upperLimit: d.f57,
        lowerLimit: d.f58
      };
    } catch (error) {
      console.error('Fetch error:', error);
      return null;
    }
  }
  
  return null;
}

function getContractsByCategory(category) {
  return DEFAULT_CONTRACTS.filter(c => c.category === category);
}

// ==========================================
// Rendering
// ==========================================

function renderFavorites() {
  const grid = document.getElementById('favoritesGrid');
  
  if (state.favorites.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <p>暂无自选品种</p>
        <p class="hint">点击上方「添加品种」按钮添加</p>
      </div>
    `;
    return;
  }
  
  grid.innerHTML = state.favorites.map(contract => createCard(contract)).join('');
}

function renderCategoryContracts() {
  const grid = document.getElementById('cardsGrid');
  const contracts = getContractsByCategory(state.currentCategory);
  
  if (contracts.length === 0) {
    grid.innerHTML = '<div class="empty-state"><p>暂无品种</p></div>';
    return;
  }
  
  grid.innerHTML = contracts.map(contract => createCard(contract)).join('');
}

function createCard(contract) {
  const quote = state.quotes[contract.code] || {};
  const price = parseFloat(quote.price) || 0;
  const changePercent = parseFloat(quote.changePercent) || 0;
  const change = parseFloat(quote.change) || 0;
  
  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  const priceStr = formatPrice(price, contract.code);
  const changeStr = formatChange(change, changePercent);
  const history = state.priceHistory[contract.code] || [];
  
  return `
    <div class="card ${direction}" data-code="${contract.code}" onclick="openDetail('${contract.code}')">
      <button class="card-remove" onclick="event.stopPropagation(); removeFavorite('${contract.code}')">✕</button>
      <div class="card-header">
        <div class="card-info">
          <div class="card-name">${contract.name}</div>
          <div class="card-code">${contract.code.toUpperCase()}</div>
        </div>
        <div class="card-category">${contract.category}</div>
      </div>
      <div class="card-price ${direction}">${priceStr}</div>
      <div class="card-change ${direction}">${changeStr}</div>
      <div class="card-chart">
        ${createMiniChart(history, direction)}
      </div>
      <div class="card-meta">
        <div class="card-meta-item">
          <span class="card-meta-label">今开</span>
          <span class="card-meta-value">${formatPrice(quote.open, contract.code)}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-label">最高</span>
          <span class="card-meta-value up">${formatPrice(quote.high, contract.code)}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-label">成交量</span>
          <span class="card-meta-value">${formatVolume(quote.volume)}</span>
        </div>
        <div class="card-meta-item">
          <span class="card-meta-label">最低</span>
          <span class="card-meta-value down">${formatPrice(quote.low, contract.code)}</span>
        </div>
      </div>
      <div class="card-unit">${contract.unit}</div>
    </div>
  `;
}

function createMiniChart(history, direction) {
  if (history.length < 2) return '';
  
  const prices = history.map(h => h.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  
  const width = 100;
  const height = 30;
  const padding = 2;
  
  const points = prices.map((p, i) => {
    const x = padding + (i / (prices.length - 1)) * (width - 2 * padding);
    const y = padding + (1 - (p - min) / range) * (height - 2 * padding);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  
  const color = direction === 'up' ? '#26a69a' : direction === 'down' ? '#ef5350' : '#666';
  
  return `
    <svg width="${width}" height="${height}" style="display:block">
      <polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>
  `;
}

// ==========================================
// Volatility Check
// ==========================================

function checkVolatility() {
  const alert = document.getElementById('volatilityAlert');
  const cards = document.getElementById('volatilityCards');
  
  const volatilityContracts = [];
  
  state.favorites.forEach(contract => {
    const history = state.priceHistory[contract.code] || [];
    if (history.length < 2) return;
    
    const oldest = history[0];
    const newest = history[history.length - 1];
    
    const priceChange = ((newest.price - oldest.price) / oldest.price) * 100;
    
    if (Math.abs(priceChange) >= 4) {
      volatilityContracts.push({
        ...contract,
        change: priceChange
      });
    }
  });
  
  if (volatilityContracts.length > 0) {
    alert.style.display = 'block';
    cards.innerHTML = volatilityContracts.map(c => `
      <div class="alert-card ${c.change > 0 ? 'up' : 'down'}">
        <div class="alert-card-name">${c.name}</div>
        <div class="alert-card-change ${c.change > 0 ? 'up' : 'down'}">
          ${c.change > 0 ? '+' : ''}${c.change.toFixed(2)}%
        </div>
      </div>
    `).join('');
  } else {
    alert.style.display = 'none';
  }
}

// ==========================================
// Detail Panel
// ==========================================

function openDetail(code) {
  const contract = state.favorites.find(c => c.code === code) || 
    DEFAULT_CONTRACTS.find(c => c.code === code);
  
  if (!contract) return;
  
  state.selectedContract = contract;
  updateDetailPanel(contract);
  document.getElementById('detailPanel').classList.add('open');
}

function closeDetail() {
  state.selectedContract = null;
  document.getElementById('detailPanel').classList.remove('open');
  if (state.chart) {
    state.chart.destroy();
    state.chart = null;
  }
}

function updateDetailPanel(contract) {
  const quote = state.quotes[contract.code] || {};
  const changePercent = parseFloat(quote.changePercent) || 0;
  const direction = changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'flat';
  
  document.getElementById('detailTitle').textContent = contract.name;
  document.getElementById('detailSubtitle').textContent = `${contract.code.toUpperCase()} · ${contract.unit}`;
  
  const stats = [
    { label: '现价', value: formatPrice(quote.price, contract.code), direction },
    { label: '涨跌幅', value: formatChange(parseFloat(quote.change), changePercent), direction },
    { label: '今开', value: formatPrice(quote.open, contract.code) },
    { label: '最高', value: formatPrice(quote.high, contract.code), direction: 'up' },
    { label: '最低', value: formatPrice(quote.low, contract.code), direction: 'down' },
    { label: '成交量', value: formatVolume(quote.volume) },
    { label: '持仓量', value: formatVolume(quote.openInterest) },
    { label: '结算价', value: formatPrice(quote.settle, contract.code) },
    { label: '涨停价', value: formatPrice(quote.upperLimit, contract.code), direction: 'up' },
    { label: '跌停价', value: formatPrice(quote.lowerLimit, contract.code), direction: 'down' }
  ];
  
  document.getElementById('detailStats').innerHTML = stats.map(s => `
    <div class="detail-stat">
      <div class="detail-stat-label">${s.label}</div>
      <div class="detail-stat-value ${s.direction || ''}">${s.value}</div>
    </div>
  `).join('');
  
  // Update chart
  updateChart(contract);
}

function updateChart(contract) {
  const history = state.priceHistory[contract.code] || [];
  const quote = state.quotes[contract.code] || {};
  const direction = parseFloat(quote.changePercent) > 0 ? 'up' : parseFloat(quote.changePercent) < 0 ? 'down' : 'flat';
  
  const ctx = document.getElementById('priceChart').getContext('2d');
  
  if (state.chart) {
    state.chart.destroy();
  }
  
  if (history.length < 2) return;
  
  const prices = history.map(h => h.price);
  
  state.chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: prices.map((_, i) => i + 1),
      datasets: [{
        data: prices,
        borderColor: direction === 'up' ? '#26a69a' : direction === 'down' ? '#ef5350' : '#666',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        backgroundColor: direction === 'up' ? 'rgba(38, 166, 154, 0.1)' : direction === 'down' ? 'rgba(239, 83, 80, 0.1)' : 'rgba(102, 102, 102, 0.1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (c) => `${formatPrice(c.raw, contract.code)} ${contract.unit}`
          }
        }
      },
      scales: {
        x: { display: false },
        y: {
          grid: { color: '#2a2a2a' },
          ticks: {
            color: '#666',
            font: { size: 10 },
            callback: (v) => formatPrice(v, contract.code)
          }
        }
      }
    }
  });
}

// ==========================================
// Modal & Add/Remove
// ==========================================

function openModal() {
  document.getElementById('addModal').classList.add('open');
}

function closeModal() {
  document.getElementById('addModal').classList.remove('open');
  document.getElementById('contractCode').value = '';
  document.getElementById('contractName').value = '';
}

function addContract() {
  const code = document.getElementById('contractCode').value.trim().toLowerCase();
  const name = document.getElementById('contractName').value.trim();
  const category = document.getElementById('contractCategory').value;
  
  if (!code) {
    alert('请输入合约代码');
    return;
  }
  
  // Check if already exists
  if (state.favorites.find(c => c.code === code)) {
    alert('该品种已存在');
    return;
  }
  
  // Get unit from defaults or use generic
  const defaultContract = DEFAULT_CONTRACTS.find(c => c.code === code);
  const unit = defaultContract?.unit || '元';
  
  state.favorites.push({
    code,
    name: name || defaultContract?.name || code.toUpperCase(),
    category: category,
    unit
  });
  
  saveState();
  closeModal();
  refreshData();
}

function removeFavorite(code) {
  if (!confirm(`移除 ${code.toUpperCase()}?`)) return;
  
  state.favorites = state.favorites.filter(c => c.code !== code);
  delete state.quotes[code];
  delete state.priceHistory[code];
  
  saveState();
  renderFavorites();
  checkVolatility();
}

function quickAdd(code) {
  if (state.favorites.find(c => c.code === code)) {
    alert('该品种已存在');
    return;
  }
  
  const defaultContract = DEFAULT_CONTRACTS.find(c => c.code === code);
  if (defaultContract) {
    state.favorites.push({ ...defaultContract });
    saveState();
    refreshData();
  }
}

function renderQuickTags() {
  const container = document.getElementById('quickTags');
  container.innerHTML = QUICK_ADD_OPTIONS.map(opt => `
    <span class="quick-tag" onclick="quickAdd('${opt.code}')">${opt.name}</span>
  `).join('');
}

// ==========================================
// Auto Refresh
// ==========================================

function startAutoRefresh() {
  if (state.timer) {
    clearInterval(state.timer);
  }
  
  if (state.refreshInterval > 0) {
    state.timer = setInterval(refreshData, state.refreshInterval);
  }
}

// ==========================================
// Status Updates
// ==========================================

function updateStatus(status) {
  const dot = document.getElementById('statusDot');
  const text = document.getElementById('statusText');
  
  dot.className = 'status-dot';
  
  if (status === 'connected') {
    dot.classList.add('connected');
    text.textContent = '已连接';
  } else if (status === 'connecting') {
    text.textContent = '连接中...';
  } else if (status === 'demo') {
    dot.classList.add('connected');
    text.textContent = '演示模式';
  } else {
    dot.classList.add('error');
    text.textContent = '连接失败';
  }
}

function updateLastUpdateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString('zh-CN', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit' 
  });
  document.getElementById('lastUpdate').textContent = timeStr;
}

// ==========================================
// Formatters
// ==========================================

function formatPrice(value, code) {
  if (!value || value === '-') return '--';
  const num = parseFloat(value);
  if (isNaN(num)) return '--';
  
  // Determine decimal places
  let decimals = 0;
  if (code.match(/^(aum|agm|autd|agt|gc|si)$/i)) {
    decimals = 2;
  } else if (code.match(/^(b00y|scm)$/i)) {
    decimals = 2;
  }
  
  return num.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function formatChange(change, percent) {
  if (change === undefined || change === null || change === '-') return '--';
  const num = parseFloat(change);
  const pct = parseFloat(percent);
  if (isNaN(num)) return '--';
  
  const sign = num > 0 ? '+' : '';
  if (pct !== undefined && !isNaN(pct)) {
    return `${sign}${pct.toFixed(2)}%`;
  }
  return `${sign}${num.toFixed(2)}`;
}

function formatVolume(value) {
  if (!value || value === '-') return '--';
  const num = parseFloat(value);
  if (isNaN(num)) return '--';
  
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  return num.toLocaleString('zh-CN');
}

// Make functions available globally
window.openDetail = openDetail;
window.removeFavorite = removeFavorite;
window.quickAdd = quickAdd;
