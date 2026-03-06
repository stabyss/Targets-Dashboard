/* ========================================
   Futures Pro - Backend Proxy Server
   ======================================== */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3000;

// Proxy configuration
const PROXY_CONFIG = {
  eastmoney: {
    baseUrl: 'https://push2.eastmoney.com',
    allowedPaths: ['/api/qt/stock/get']
  },
  sina: {
    baseUrl: 'https://hq.sinajs.cn',
    allowedPaths: ['/list']
  },
  ifeng: {
    baseUrl: 'http://quotes.ifeng.com',
    allowedPaths: []
  }
};

// Create HTTP server
const server = http.createServer((req, res) => {
  // Set CORS headers - Allow all origins for development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }
  
  // Only allow GET requests for data fetching
  if (req.method !== 'GET') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }
  
  // Parse request URL
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;
  
  // Route: /proxy/eastmoney
  if (pathname.startsWith('/proxy/eastmoney')) {
    handleEastMoneyProxy(query, res);
  }
  // Route: /proxy/sina
  else if (pathname.startsWith('/proxy/sina')) {
    handleSinaProxy(query, res);
  }
  // Route: /health
  else if (pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: Date.now() }));
  }
  // 404 for unknown routes
  else {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not found' }));
  }
});

// Handle East Money proxy
function handleEastMoneyProxy(query, res) {
  const secId = query.secid;
  const fields = query.fields || 'f43,f57,f58,f169,f170,f46,f44,f45,f50,f47,f48,f49';
  const ut = query.ut || 'fa5fd1943c7b386f172d6893dbfba10b';
  
  if (!secId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Missing secid parameter' }));
    return;
  }
  
  const proxyUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secId)}&fields=${fields}&ut=${ut}&fltt=2&invt=2&_=${Date.now()}`;
  
  console.log('Proxying to:', proxyUrl);
  
  https.get(proxyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Referer': 'https://quote.eastmoney.com/',
      'Accept': 'application/json, text/plain, */*'
    }
  }, (proxyRes) => {
    let data = '';
    
    // 记录响应状态码和头部信息
    console.log('Response status:', proxyRes.statusCode);
    console.log('Response headers:', proxyRes.headers);
    
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      // 检查是否是有效的JSON响应
      if (proxyRes.statusCode !== 200) {
        console.error('Non-200 response from East Money:', proxyRes.statusCode);
        res.writeHead(502, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: 'Remote server returned non-200 status code', 
          statusCode: proxyRes.statusCode,
          details: data.substring(0, 200)
        }));
        return;
      }
      
      // 检查Content-Type是否为JSON
      const contentType = proxyRes.headers['content-type'] || '';
      if (!contentType.includes('application/json') && !contentType.includes('text/plain')) {
        console.error('Invalid content type:', contentType);
        res.writeHead(502, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: 'Invalid content type from remote server', 
          contentType: contentType,
          details: data.substring(0, 200)
        }));
        return;
      }
      
      try {
        // 尝试解析JSON
        console.log('Attempting to parse JSON:', data.substring(0, 100));
        const jsonData = JSON.parse(data);
        
        // 验证数据结构
        if (!jsonData.data || !jsonData.data.f43) {
          console.error('Invalid data structure:', jsonData);
          res.writeHead(502, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ 
            error: 'Invalid data structure from East Money', 
            details: 'Missing required fields in response'
          }));
          return;
        }
        
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(jsonData));
      } catch (e) {
        console.error('Parse error:', e.message, 'Data:', data.substring(0, 200));
        res.writeHead(502, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: 'Failed to parse response from East Money', 
          details: e.message,
          rawResponse: data.substring(0, 200),
          responseLength: data.length
        }));
      }
    });
  }).on('error', (err) => {
    console.error('East Money proxy error:', err.message);
    res.writeHead(502, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      error: 'Proxy request failed', 
      message: err.message,
      details: 'Network error occurred'
    }));
  });
}

// Handle Sina proxy
function handleSinaProxy(query, res) {
  const symbol = query.symbol;
  
  if (!symbol) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Missing symbol parameter' }));
    return;
  }
  
  const proxyUrl = `https://hq.sinajs.cn/list=${symbol}`;
  
  https.get(proxyUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
  }, (proxyRes) => {
    let data = '';
    
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end(data);
    });
  }).on('error', (err) => {
    console.error('Sina proxy error:', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Proxy request failed', message: err.message }));
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`Futures Pro Proxy Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`East Money proxy: http://localhost:${PORT}/proxy/eastmoney?secid=113.AU2206`);
  console.log(`CORS enabled for all origins`);
});