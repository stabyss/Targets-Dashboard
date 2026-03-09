/* ========================================
   Futures Pro - Backend Proxy Server
   ======================================== */

const http = require('http');
const https = require('https');
const url = require('url');

const PORT = process.env.PORT || 3000;

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

// Handle East Money proxy - simplified version with proper fallback
function handleEastMoneyProxy(query, res) {
  const secId = query.secid;
  const fields = query.fields || 'f43,f57,f58,f169,f170,f46,f44,f45,f50,f47,f48,f49';
  
  if (!secId) {
    res.writeHead(400, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ error: 'Missing secid parameter' }));
    return;
  }
  
  // Use the main quote API endpoint with proper parameters
  const apiUrl = `https://push2.eastmoney.com/api/qt/stock/get?secid=${encodeURIComponent(secId)}&fields=${fields}&ut=f851c61d0a56e8866117e0f80c5d70f2&fltt=2&invt=2&wbp2u=0|0|0|0&_=${Date.now()}`;
  
  console.log('Fetching from East Money API:', apiUrl);
  
  const request = https.get(apiUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://quote.eastmoney.com/',
      'Accept': 'application/json, text/plain, */*'
    }
  }, (proxyRes) => {
    let data = '';
    
    proxyRes.on('data', (chunk) => {
      data += chunk;
    });
    
    proxyRes.on('end', () => {
      // Log response for debugging
      console.log('Response status:', proxyRes.statusCode);
      console.log('Response length:', data.length);
      console.log('Response preview:', data.substring(0, 200));
      
      // Check status code
      if (proxyRes.statusCode !== 200) {
        res.writeHead(502, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: 'API returned non-200', 
          statusCode: proxyRes.statusCode 
        }));
        return;
      }
      
      try {
        const jsonData = JSON.parse(data);
        
        // Check for valid data structure
        // The API returns {rc: 0, data: {...}} for success
        // It returns {rc: 100, data: null} for invalid secid
        if (jsonData.rc && jsonData.rc !== 0) {
          console.log('API returned error code:', jsonData.rc);
          // Return a special response that the frontend can handle
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ 
            error: 'invalid_secid', 
            rc: jsonData.rc,
            message: 'Invalid or expired contract code',
            data: null
          }));
          return;
        }
        
        // Check if data exists
        if (!jsonData.data) {
          console.log('No data in response');
          res.writeHead(200, { 
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          });
          res.end(JSON.stringify({ 
            error: 'no_data', 
            data: null 
          }));
          return;
        }
        
        // Success - return the data
        res.writeHead(200, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify(jsonData));
        
      } catch (e) {
        console.error('Parse error:', e.message);
        res.writeHead(502, { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        });
        res.end(JSON.stringify({ 
          error: 'parse_error', 
          message: e.message 
        }));
      }
    });
  });
  
  request.on('error', (err) => {
    console.error('Request error:', err.message);
    res.writeHead(502, { 
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(JSON.stringify({ 
      error: 'network_error', 
      message: err.message 
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
  console.log(`East Money proxy: http://localhost:${PORT}/proxy/eastmoney?secid=1.AU0`);
  console.log(`CORS enabled for all origins`);
});
