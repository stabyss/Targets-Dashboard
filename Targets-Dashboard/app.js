// 修改 fetchContractData 函数，添加更详细的错误处理和重试机制
async function fetchContractData(code, source) {
  if (source.name === '东方财富') {
    const secId = source.getSecId(code);
    // 使用代理服务器
    const proxyUrl = `${PROXY_SERVER_URLS[currentProxyIndex]}/proxy/eastmoney?secid=${encodeURIComponent(secId)}&fields=${source.fields}&ut=fa5fd1943c7b386f172d6893dbfba10b&fltt=2&invt=2&_=${Date.now()}`;
    
    try {
      console.log('Attempting to fetch from:', proxyUrl);
      
      // 添加超时处理
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒超时
      
      const response = await fetch(proxyUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        console.error('API response not ok:', response.status, response.statusText);
        return null;
      }
      
      const data = await response.json();
      
      // 检查是否返回了有效数据
      if (!data.data || !data.data.f43) {
        console.error('No valid data returned for:', secId, data);
        return null;
      }
      
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
    } catch (error) {
      console.error('Fetch error:', error);
      
      // 如果是网络错误，尝试切换到备用代理URL
      if (error.name === 'AbortError') {
        console.warn('Request timed out');
      } else if (error.message.includes('Failed to fetch')) {
        console.warn('Connection failed, trying fallback proxy');
        
        // 尝试下一个代理URL
        if (currentProxyIndex < PROXY_SERVER_URLS.length - 1) {
          currentProxyIndex++;
          console.log('Trying fallback proxy:', PROXY_SERVER_URLS[currentProxyIndex]);
          
          // 重新尝试请求
          return await fetchContractData(code, source);
        }
      }
      
      return null;
    }
  }
  
  return null;
}