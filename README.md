# FundaScope - Dashboard Live
## 📋 API Integration Status

### ✅ Currently Working
- **CoinGecko API**: Crypto market data (no auth required)
- **FRED API**: US macroeconomic indicators
- **CoinGecko News**: Market news feeds

### ⚠️ Requires Configuration
- **Claude AI (Anthropic)**: Requires API key for AI analysis features

---

## 🔧 Configuration Guide

### 1. Claude AI Setup (Optional - AI Features)
To enable AI-powered analysis:

#### Get your API key:
1. Visit: https://console.anthropic.com
2. Create an account or sign in
3. Generate API key from dashboard

#### Configure in `js/config.js`:
```javascript
claude: {
  key: 'your-api-key-here',  // Add your key here
  // ... rest of config
}
```

**Security Note**: Never commit API keys to version control!

### 2. Testing APIs
Open browser DevTools console (F12) and run:
```javascript
runDiagnostics()
```

This will test:
- ✅ CoinGecko API connectivity
- ✅ FRED API connectivity  
- ✅ CORS proxy functionality
- ✅ Claude AI configuration

### 3. Monitoring in Production
Check browser console (F12) for real-time logs:
- `[INIT]` - Application startup
- `[Crypto]` - Cryptocurrency data
- `[FRED]` - Macroeconomic data
- `[News]` - News feed updates
- `[Claude API]` - AI analysis errors

---

## 🐛 Known Issues & Fixes

### Issue 1: "Données temporairement indisponibles"
**Cause**: CORS proxy timeout or API unreachable

**Fix Options**:
- Check internet connection
- Wait 30 seconds (auto-retry)
- Some proxies are unstable - browser cache helps

### Issue 2: Claude AI returns error
**Cause**: API key not configured or invalid

**Fix**: 
- Add API key in `config.js` (see above)
- Or remove Claude AI features

### Issue 3: SPX data not showing
**Note**: SPX requires separate API (not included yet)
- Current: BTC, ETH, SOL only
- Ticker shows "Total MCap" placeholder

---

## 📊 Data Sources

| Component | API | Auth | Update Freq | Status |
|-----------|-----|------|-------------|--------|
| Crypto Prices | CoinGecko | No | 60s | ✅ |
| Economic Data | FRED | Yes* | 5min | ✅ |
| News | CoinGecko | No | 2min | ✅ |
| AI Analysis | Anthropic Claude | Yes | On-demand | ⚠️ |

*FRED uses public demo key (rate limited)

---

## 🚀 Quick Start

### 1. No Configuration Required (Basic Mode)
- CoinGecko and FRED work out-of-box
- Just open `index.html` in browser

### 2. With AI Features (Recommended)
- Add Claude API key to `config.js`
- Restart browser/clear cache
- Try "⚡ IA" button on dashboard

### 3. Debug Mode
- Open DevTools console (F12)
- Run `runDiagnostics()`
- Check logs for any errors
- Review `API_CONFIG` object

---

## 📁 Project Structure

```
/
├── index.html          # Main UI
├── css/
│   └── style.css       # All styling
├── js/
│   ├── config.js       # API configuration & testing
│   ├── app.js          # Main application logic
│   └── diagnostic.js   # API diagnostic tools
└── README.md          # This file
```

---

## 🔄 Auto-Refresh Intervals

- **Crypto**: Every 60 seconds
- **FRED**: Every 5 minutes (API rate limit)
- **News**: Every 2 minutes

Adjust in `app.js` → `init()` function

---

## 💡 Troubleshooting

### Dashboard shows "Chargement..." forever
1. Press F12 → Console
2. Look for error messages
3. Run `runDiagnostics()` to identify issue
4. Check API status page or rate limits

### Browser console shows 403 errors
- FRED API key may be exhausted (public demo key)
- Get own key from https://fred.stlouisfed.org

### Claude AI button does nothing  
- No API key configured
- Add key to `config.js`
- Valid Anthropic key required: https://console.anthropic.com

---

## 🔐 Security Notes

⚠️ **NEVER**:
- Hardcode API keys in HTML/JS files
- Commit keys to Git
- Share keys publicly

✅ **BETTER**:
- Use environment variables
- Backend proxy server
- OAuth/managed secrets

---

## 📞 Support

For issues, check:
1. Browser console (F12) for error messages
2. Run `runDiagnostics()` to verify APIs
3. Check API provider status pages
4. Review configuration in `config.js`

---

**Last Updated**: April 25, 2026
**Version**: 1.0.0 - Refactored with proper API handling
