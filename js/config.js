// ═══════════════════════════════════════
// API CONFIGURATION & STATUS
// ═══════════════════════════════════════

const API_CONFIG = {
  // CoinGecko (No key needed - public API)
  coingecko: {
    name: 'CoinGecko',
    requiresAuth: false,
    status: 'pending',
    lastCheck: null,
    endpoint: 'https://api.coingecko.com/api/v3'
  },
  
  // FRED (Economic data - public API with key)
  fred: {
    name: 'FRED (St. Louis Fed)',
    requiresAuth: true,
    key: 'f5a26b2a89e86a3f79bb671a7f6f63d9',
    status: 'pending',
    lastCheck: null,
    endpoint: 'https://api.stlouisfed.org/fred'
  },
  
  // Claude AI (requires API key - WARNING: not included for security)
  claude: {
    name: 'Claude AI (Anthropic)',
    requiresAuth: true,
    key: null, // Must be set via environment or removed
    status: 'pending',
    lastCheck: null,
    endpoint: 'https://api.anthropic.com/v1',
    warning: 'API key required - remove or set via environment'
  }
};

// Test API connectivity
async function testAPIs(){
  console.log('🔍 Testing API connections...');
  
  // Test CoinGecko
  try{
    const res = await fetchWithProxy('https://api.coingecko.com/api/v3/ping');
    const data = await res.json();
    API_CONFIG.coingecko.status = data.gecko_says ? 'ok' : 'error';
    API_CONFIG.coingecko.lastCheck = new Date();
    console.log('✅ CoinGecko:', API_CONFIG.coingecko.status);
  }catch(e){
    API_CONFIG.coingecko.status = 'error';
    API_CONFIG.coingecko.lastCheck = new Date();
    console.error('❌ CoinGecko failed:', e.message);
  }
  
  // Test FRED
  try{
    const url = `${API_CONFIG.fred.endpoint}/series/observations?series_id=GDPC1&api_key=${API_CONFIG.fred.key}&file_type=json&limit=1`;
    const res = await fetchWithProxy(url);
    const data = await res.json();
    API_CONFIG.fred.status = data.observations ? 'ok' : 'error';
    API_CONFIG.fred.lastCheck = new Date();
    console.log('✅ FRED API:', API_CONFIG.fred.status);
  }catch(e){
    API_CONFIG.fred.status = 'error';
    API_CONFIG.fred.lastCheck = new Date();
    console.error('❌ FRED API failed:', e.message);
  }
  
  // Claude AI status (always pending since no key)
  if(!API_CONFIG.claude.key){
    API_CONFIG.claude.status = 'disabled';
    console.warn('⚠️  Claude AI: DISABLED (no API key)');
  }
  
  return API_CONFIG;
}

// Get status summary
function getAPIStatusSummary(){
  const summary = {
    ok: [],
    error: [],
    disabled: []
  };
  
  Object.values(API_CONFIG).forEach(api => {
    if(api.status === 'ok') summary.ok.push(api.name);
    else if(api.status === 'error') summary.error.push(api.name);
    else if(api.status === 'disabled') summary.disabled.push(api.name);
  });
  
  return summary;
}

// Enhanced logging
function log(section, message, level = 'info'){
  const timestamp = new Date().toLocaleTimeString('fr-FR');
  const icon = level === 'error' ? '❌' : level === 'warn' ? '⚠️ ' : '✅';
  console.log(`[${timestamp}] ${icon} [${section}] ${message}`);
}
