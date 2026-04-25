// ═══════════════════════════════════════
// API DIAGNOSTIC TEST
// Run in browser console or Node.js
// ═══════════════════════════════════════

console.clear();
console.log('🔍 FundaScope API DIAGNOSTIC TEST\n');

// Test 1: CoinGecko API
async function testCoinGecko() {
  console.log('📊 TEST 1: CoinGecko API');
  try {
    const response = await fetch('https://api.coingecko.com/api/v3/coins/bitcoin?vs_currencies=usd&market_data=true');
    const data = await response.json();
    if (data.id === 'bitcoin') {
      console.log('✅ CoinGecko: OK - BTC price: $' + data.market_data.current_price.usd);
      return true;
    }
  } catch (e) {
    console.error('❌ CoinGecko: FAILED -', e.message);
    return false;
  }
}

// Test 2: FRED API
async function testFRED() {
  console.log('\n📊 TEST 2: FRED API (US Economic Data)');
  try {
    const key = 'f5a26b2a89e86a3f79bb671a7f6f63d9';
    const url = `https://api.stlouisfed.org/fred/series/observations?series_id=GDPC1&api_key=${key}&file_type=json&limit=1`;
    const response = await fetch(url);
    const data = await response.json();
    if (data.observations && data.observations.length > 0) {
      console.log('✅ FRED API: OK - Latest GDP data: ' + data.observations[0].value);
      return true;
    }
  } catch (e) {
    console.error('❌ FRED API: FAILED -', e.message);
    return false;
  }
}

// Test 3: CORS Proxy
async function testCORS() {
  console.log('\n📊 TEST 3: CORS Proxy (Fallback for blocked APIs)');
  try {
    // Test with a public endpoint that requires CORS
    const url = 'https://api.coingecko.com/api/v3/ping';
    const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(url)}`;
    const response = await fetch(proxyUrl);
    const data = await response.json();
    if (data.gecko_says) {
      console.log('✅ CORS Proxy: OK - Response: ' + data.gecko_says);
      return true;
    }
  } catch (e) {
    console.error('❌ CORS Proxy: FAILED -', e.message);
    return false;
  }
}

// Test 4: Check Claude API configuration
function testClaudeConfig() {
  console.log('\n📊 TEST 4: Claude AI Configuration');
  const hasApiKey = typeof API_CONFIG !== 'undefined' && API_CONFIG?.claude?.key;
  if (hasApiKey) {
    console.log('✅ Claude API: KEY CONFIGURED');
    return true;
  } else {
    console.warn('⚠️  Claude API: NO KEY - Feature will be disabled');
    return false;
  }
}

// Run all tests
async function runDiagnostics() {
  const results = {
    coingecko: await testCoinGecko(),
    fred: await testFRED(),
    cors: await testCORS(),
    claude: testClaudeConfig()
  };
  
  console.log('\n═══════════════════════════════════════');
  console.log('📋 SUMMARY:');
  console.log('═══════════════════════════════════════');
  
  const ok = Object.values(results).filter(r => r).length;
  const total = Object.keys(results).length;
  
  console.log(`✅ Operational: ${ok}/${total}`);
  
  Object.entries(results).forEach(([name, status]) => {
    console.log(`  ${status ? '✅' : '⚠️ '} ${name}: ${status ? 'OK' : 'ISSUE'}`);
  });
  
  if (ok === total) {
    console.log('\n🎉 All systems operational!');
  } else if (ok >= 2) {
    console.log('\n⚠️  Some services unavailable - app will work in degraded mode');
  } else {
    console.log('\n❌ Critical failure - app may not function');
  }
  
  return results;
}

// Auto-run on load
if (typeof window !== 'undefined') {
  window.runDiagnostics = runDiagnostics;
  console.log('Run: runDiagnostics() to test APIs\n');
}
