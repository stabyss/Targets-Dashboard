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
    baseUrl: 'https://push2delay.eastmoney.com/api/qt/stock/get',
    fields: 'f43,f57,f58,f169,f170,f46,f44,f45,f50,f47,f48,f49',
    getSecId: (code) => {
      const mapping = {
        // 贵金属
        'aum': '113.aum',    // 沪金
        'agm': '113.agm',    // 沪银
        'AUTD': '118.AUTD',  // 黄金T+D
        'AGTD': '118.AGTD',  // 白银T+D
        'GC': '101.GC00Y',   // COMEX黄金
        'SI': '101.SI00Y',   // COMEX白银
        // 工业金属
        'cum': '113.cum',    // 沪铜
        'alm': '113.alm',    // 沪铝
        'znm': '113.znm',    // 沪锌
        'nim': '113.nim',    // 沪镍
        'pbm': '113.pbm',    // 沪铅
        'spm': '113.spm',    // 沪锡
        'ssm': '113.ssm',    // 不锈钢
        'HG': '101.HG00Y',   // COMEX铜
        // 能源
        'scm': '142.scm',    // 国内原油
        'B00Y': '112.B00Y', // 布伦特原油
        // 黑色金属
        'rbm': '113.rbm',    // 螺纹钢
        'im': '114.im',      // 铁矿石
        'hc': '113.hc',      // 热卷
        // 农产品
        'mm': '114.mm',      // 豆粕
        'ym': '114.ym',      // 豆油
        'a': '114.a',        // 豆一
        'b': '114.b',        // 豆二
        'SRM': '115.SRM',    // 白糖
        'CFM': '115.CFM',    // 棉花
        'JR': '115.JR',      // 粳米
        // 化工
        'MAm': '115.MAm',    // 甲醇
        'SAM': '115.SAM',    // 纯碱
        'TA': '115.TA',      // PTA
        'RU': '115.RU',      // 橡胶
        'BU': '113.BU',      // 沥青
        'SC': '142.SC',      // 原油
      };
      return mapping[code.toLowerCase()] || `113.${code.toLowerCase()}`;
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

// Default contracts
const DEFAULT_CONTRACTS = [
  { code: 'aum', name: '沪金主连', category: '贵金属', unit: '元/克' },
  { code: 'agm', name: '沪银主连', category: '贵金属', unit: '元/千克' },
  { code: 'AUTD', name: '黄金T+D', category: '贵金属', unit: '元/克' },
  { code: 'AGTD', name: '白银T+D', category: '贵金属', unit: '元/千克' },
  { code: 'GC', name: 'COMEX黄金', category: '贵金属', unit: '美元/盎司' },
  { code: 'cum', name: '沪铜主连', category: '工业金属', unit: '元/吨' },
  { code: 'alm', name: '沪铝主连', category: '工业金属', unit: '元/吨' },
  { code: 'nim', name: '沪镍主连', category: '工业金属', unit: '元/吨' },
  { code: 'scm', name: '国内原油', category: '能源', unit: '元/桶' },
  { code: 'B00Y', name: '布伦特原油', category: '能源', unit: '美元/桶' },
  { code: 'rbm', name: '螺纹钢主连', category: '黑色金属', unit: '元/吨' },
  { code: 'im', name: '铁矿石主连', category: '黑色金属', unit: '元/吨' },
  { code: 'mm', name: '豆粕主连', category: '农产品', unit: '元/吨' },
  { code: 'ym', name: '豆油主连', category: '农产品', unit: '元/吨' },
  { code: 'SRM', name: '白糖主连', category: '农产品', unit: '元/吨' },
  { code: 'CFM', name: '棉花主连', category: '农产品', unit: '元/吨' },
  { code: 'MAm', name: '甲醇主连', category: '化工', unit: '元/吨' },
  { code: 'SAM', name: '纯碱主连', category: '化工', unit: '元/吨' }
];

// Quick add options
const QUICK_ADD_OPTIONS = [
  { code: 'aum', name: '沪金', category: '贵金属' },
  { code: 'agm', name: '沪银', category: '贵金属' },
  { code: 'AUTD', name: '黄金T+D', category: '贵金属' },
  { code: 'GC', name: 'COMEX黄金', category: '贵金属' },
  { code: 'cum', name: '沪铜', category: '工业金属' },
  { code: 'alm', name: '沪铝', category: '工业金属' },
  { code: 'nim', name: '沪镍', category: '工业金属' },
  { code: 'B00Y', name: '布伦特原油', category: '能源' },
  { code: 'scm', name: '国内原油', category: '能源' },
  { code: 'rbm', name: '螺纹钢', category: '黑色金属' },
  { code: 'im', name: '铁矿石', category: '黑色金属' },
  { code: 'mm', name: '豆粕', category: '农产品' },
  { code: 'SRM', name: '白糖', category: '农产品' },
  { code: 'MAm', name: '甲醇', category: '化工' },
  { code: 'SAM', name: '纯碱', category: '化工' }
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
  }
}

async function fetchContractData(code, source) {
  if (source.name === '东方财富') {
    const secId = source.getSecId(code);
    const url = `${source.baseUrl}?secid=${encodeURIComponent(secId)}&fields=${source.fields}&ut=fa5fd1943c7b386f172d6893dbfba10b&fltt=2&invt=2&_=${Date.now()}`;
    
    const response = await fetch(url, {
      headers: { 'Referer': 'https://quote.eastmoney.com/' }
    });
    
    const data = await response.json();
    if (!data.data) return null;
    
    const d = data.data;
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
    alert品种已存在');
('该    return;
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
