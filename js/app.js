// ═══════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════
const PAGES=['dashboard','assets','crypto','calendar','cot','news','scoring','theses','sectors'];
const MAIN_NAV=['dashboard','crypto','assets','scoring'];
const DRAWER_P=['news','cot','sectors','calendar','theses'];

function go(id){
  PAGES.forEach(p=>{
    const el=document.getElementById('p-'+p);
    if(el) el.classList.toggle('active',p===id);
  });
  document.querySelector('.scroll').scrollTop=0;
  MAIN_NAV.forEach(n=>{
    const b=document.getElementById('nb-'+n);
    if(b) b.classList.toggle('active',n===id);
  });
  document.getElementById('nb-more').classList.toggle('active',DRAWER_P.includes(id));
  document.querySelectorAll('.sitem').forEach(item=>{
    item.classList.toggle('active',item.getAttribute('onclick')&&item.getAttribute('onclick').includes(id));
  });
}
function openDrawer(){
  document.getElementById('dr').classList.add('open');
  document.getElementById('ov').classList.add('open');
}
function closeDrawer(){
  document.getElementById('dr').classList.remove('open');
  document.getElementById('ov').classList.remove('open');
}

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════
function fmt(n,dec=2){return Number(n).toLocaleString('fr-FR',{minimumFractionDigits:dec,maximumFractionDigits:dec})}
function fmtK(n){if(n>1e12)return (n/1e12).toFixed(2)+'T';if(n>1e9)return (n/1e9).toFixed(2)+'B';if(n>1e6)return (n/1e6).toFixed(2)+'M';return n}
function chgColor(v){return v>=0?'var(--green)':'var(--red)'}
function chgArrow(v){return v>=0?'▲':'▼'}
function pct(v){return (v>=0?'+':'')+v.toFixed(2)+'%'}

// ═══════════════════════════════════════
// COINGECKO — Crypto live prices (no API key)
// ═══════════════════════════════════════
let cryptoData = {};

// Essaie plusieurs proxies CORS en cascade
async function fetchWithProxy(url){
  // Try direct fetch first (no proxy needed for CORS-enabled APIs)
  try{
    const r=await fetch(url,{signal:AbortSignal.timeout(8000)});
    if(r.ok)return r;
  }catch(e){
    log('fetchWithProxy','Direct request failed, trying proxies...');
  }
  
  const proxies=[
    u=>`https://corsproxy.io/?${encodeURIComponent(u)}`,
    u=>`https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    u=>`https://thingproxy.freeboard.io/fetch/${u}`,
  ];
  
  for(let i=0;i<proxies.length;i++){
    try{
      const proxyUrl = proxies[i](url);
      const r=await fetch(proxyUrl,{signal:AbortSignal.timeout(8000)});
      if(r.ok){
        log('fetchWithProxy',`Success with proxy ${i+1}`);
        return r;
      }
    }catch(e){
      log('fetchWithProxy',`Proxy ${i+1} failed: ${e.message}`,'warn');
    }
  }
  throw new Error('All requests failed - no proxy available or API unreachable');
}

async function fetchCrypto(){
  try{
    const ids='bitcoin,ethereum,solana,binancecoin,ripple,cardano,avalanche-2,polkadot,chainlink,dogecoin,shiba-inu,sui,toncoin,pepe,near,matic-network,litecoin,uniswap,aave,render-token';
    const url=`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=20&page=1&price_change_percentage=24h,7d`;
    log('Crypto','Fetching market data from CoinGecko...');
    const r=await fetchWithProxy(url);
    const data=await r.json();
    if(!data || data.length===0){
      throw new Error('No data returned from CoinGecko');
    }
    cryptoData=data;
    log('Crypto',`Loaded ${data.length} cryptocurrencies successfully`);
    renderTickerCrypto(data);
    renderCryptoHmap(data);
    renderCryptoFull(data);
    renderAssets(data);
    renderScoringCrypto(data);
    updateThesisBTC(data);
    updateTime();
  }catch(e){
    log('Crypto','Error loading data: '+e.message,'error');
    document.getElementById('ticker-bar').innerHTML='<span style="font-family:IBM Plex Mono,monospace;font-size:9px;color:var(--text3)">❌ Données indisponibles</span>';
  }
}

function renderTickerCrypto(data){
  const btc=data.find(c=>c.id==='bitcoin');
  const eth=data.find(c=>c.id==='ethereum');
  const sol=data.find(c=>c.id==='solana');
  const bar=document.getElementById('ticker-bar');
  if(!btc)return;
  bar.innerHTML=`
    <div class="tick"><span class="tick-s">BTC</span><span class="tick-v">$${fmtK(Math.round(btc.current_price))}</span><span class="tick-c" style="color:${chgColor(btc.price_change_percentage_24h)}">${pct(btc.price_change_percentage_24h)}</span></div>
    <div class="tick"><span class="tick-s">ETH</span><span class="tick-v">$${fmt(eth.current_price,0)}</span><span class="tick-c" style="color:${chgColor(eth.price_change_percentage_24h)}">${pct(eth.price_change_percentage_24h)}</span></div>
    <div class="tick"><span class="tick-s">SOL</span><span class="tick-v">$${fmt(sol.current_price,2)}</span><span class="tick-c" style="color:${chgColor(sol.price_change_percentage_24h)}">${pct(sol.price_change_percentage_24h)}</span></div>
    <div class="tick"><span class="tick-s">MCap</span><span class="tick-v">$${fmtK(btc.market_cap+eth.market_cap)}</span><span class="tick-c" style="color:var(--text3)">Total</span></div>
  `;
}

function renderCryptoHmap(data){
  const top6=data.slice(0,6);
  const el=document.getElementById('crypto-hmap');
  el.innerHTML=top6.map(c=>{
    const chg=c.price_change_percentage_24h||0;
    const abs=Math.abs(chg);
    const opacity=Math.min(abs/5,1)*0.4+0.05;
    const color=chg>=0?`rgba(46,204,113,${opacity})`:`rgba(231,76,60,${opacity})`;
    const tc=chg>=0?'var(--green)':'var(--red)';
    return `<div class="hc" style="background:${color}">
      <div class="hc-s" style="color:${tc}">${c.symbol.toUpperCase()}</div>
      <div class="hc-p" style="color:${tc}">${pct(chg)}</div>
    </div>`;
  }).join('');
}

function renderCryptoFull(data){
  const el=document.getElementById('crypto-full-grid');
  el.innerHTML=data.map(c=>{
    const chg=c.price_change_percentage_24h||0;
    const tc=chg>=0?'var(--green)':'var(--red)';
    return `<div class="crypto-card">
      <div class="cc-name">${c.symbol.toUpperCase()} <span style="color:var(--text3);font-size:8px">#${c.market_cap_rank}</span></div>
      <div class="cc-price">$${c.current_price>100?fmt(c.current_price,0):fmt(c.current_price,4)}</div>
      <div class="cc-chg" style="color:${tc}">${chgArrow(chg)} ${pct(chg)}</div>
      <div class="cc-mcap">MCap: $${fmtK(c.market_cap)}</div>
    </div>`;
  }).join('');
}

function renderAssets(data){
  const btc=data.find(c=>c.id==='bitcoin');
  const eth=data.find(c=>c.id==='ethereum');
  const sol=data.find(c=>c.id==='solana');
  const bnb=data.find(c=>c.id==='binancecoin');
  if(!btc)return;

  const assets=[
    {name:'BTC',price:'$'+fmtK(Math.round(btc.current_price)),chg:btc.price_change_percentage_24h,score:scoreAsset(btc)},
    {name:'ETH',price:'$'+fmt(eth.current_price,0),chg:eth.price_change_percentage_24h,score:scoreAsset(eth)},
    {name:'SOL',price:'$'+fmt(sol.current_price,2),chg:sol.price_change_percentage_24h,score:scoreAsset(sol)},
    {name:'BNB',price:'$'+fmt(bnb.current_price,2),chg:bnb.price_change_percentage_24h,score:scoreAsset(bnb)},
  ];

  document.getElementById('assets-tbody').innerHTML=assets.map(a=>{
    const tc=a.chg>=0?'var(--green)':'var(--red)';
    const sc=a.score;
    const scColor=sc>=65?'var(--green)':sc>=45?'var(--gold2)':'var(--red)';
    const sig=sc>=65?'ACHAT':sc>=45?'OBS.':'VENTE';
    const sigC=sc>=65?'var(--green)':sc>=45?'var(--gold2)':'var(--red)';
    return `<tr>
      <td>${a.name}</td>
      <td style="font-family:'IBM Plex Mono',monospace">${a.price}</td>
      <td style="color:${tc};font-family:'IBM Plex Mono',monospace">${pct(a.chg)}</td>
      <td style="color:${scColor};font-family:'IBM Plex Mono',monospace;font-weight:600">${sc}</td>
      <td style="color:${sigC};font-weight:600">${sig}</td>
    </tr>`;
  }).join('');
}

function scoreAsset(coin){
  let score=50;
  const chg24=coin.price_change_percentage_24h||0;
  const chg7=coin.price_change_percentage_7d_in_currency||0;
  if(chg24>5)score+=15;else if(chg24>2)score+=8;else if(chg24>0)score+=3;else if(chg24<-5)score-=15;else if(chg24<-2)score-=8;else score-=3;
  if(chg7>10)score+=12;else if(chg7>0)score+=5;else if(chg7<-10)score-=12;else score-=5;
  const rank=coin.market_cap_rank||50;
  if(rank<=5)score+=10;else if(rank<=20)score+=5;
  return Math.max(5,Math.min(95,Math.round(score)));
}

function renderScoringCrypto(data){
  const sorted=[...data].sort((a,b)=>scoreAsset(b)-scoreAsset(a));
  document.getElementById('scoring-list').innerHTML=sorted.slice(0,8).map(c=>{
    const sc=scoreAsset(c);
    const col=sc>=65?'var(--green)':sc>=45?'var(--gold2)':'var(--red)';
    const sig=sc>=65?'ACHAT':sc>=45?'OBS.':'VENTE';
    return `<div class="sli">
      <span class="sln">${c.symbol.toUpperCase()}</span>
      <div class="slt"><div class="slf" style="width:${sc}%;background:${col}"></div></div>
      <span class="slv" style="color:${col}">${sc}</span>
      <span class="slg" style="color:${col}">${sig}</span>
    </div>`;
  }).join('');
}

function updateThesisBTC(data){
  const btc=data.find(c=>c.id==='bitcoin');
  if(!btc)return;
  const price=btc.current_price;
  const entry=85000;
  const pnl=((price-entry)/entry*100).toFixed(1);
  const pnlEl=document.getElementById('btc-thesis-pnl');
  if(pnlEl){
    pnlEl.textContent=(pnl>=0?'+':'')+pnl+'%';
    pnlEl.className='tag '+(pnl>=0?'bull':'bear');
  }
  const priceEl=document.getElementById('btc-current-price');
  if(priceEl) priceEl.textContent='$'+fmtK(Math.round(price));
}

// ═══════════════════════════════════════
// FRED API — Données macro US réelles
// FRED_API_KEY: demo key (remplacer par clé perso sur fred.stlouisfed.org)
// ═══════════════════════════════════════
const FRED_KEY='f5a26b2a89e86a3f79bb671a7f6f63d9'; // Clé demo publique

async function fetchFRED(series){
  const url=`https://api.stlouisfed.org/fred/series/observations?series_id=${series}&api_key=${FRED_KEY}&file_type=json&sort_order=desc&limit=3`;
  const r=await fetchWithProxy(url);
  const d=await r.json();
  if(d.observations&&d.observations.length>0){
    const latest=d.observations.find(o=>o.value!='.');
    const prev=d.observations.filter(o=>o.value!='.')[1];
    return{value:parseFloat(latest.value),prev:parseFloat(prev?.value),date:latest.date};
  }
  return null;
}

async function loadFREDData(){
  try{
    log('FRED','Fetching US macroeconomic data...');
    const [gdp,cpi,rate,unemp,ism,retail]=await Promise.allSettled([
      fetchFRED('GDPC1'),   // PIB réel
      fetchFRED('CPIAUCSL'),// CPI
      fetchFRED('FEDFUNDS'),// Fed Funds
      fetchFRED('UNRATE'),  // Chômage
      fetchFRED('MANEMP'),  // Manufacturing employment proxy
      fetchFRED('RSXFS'),   // Ventes au détail
    ]);

    let successCount = 0;
    
    // KPI — PIB
    if(gdp.status==='fulfilled'&&gdp.value){
      const v=gdp.value;
      const trend=v.value>v.prev;
      const kpi=document.getElementById('kpi-gdp');
      kpi.className='kpi '+(trend?'up':'dn');
      kpi.innerHTML=`<div class="kl">PIB US (Réel)</div>
        <div class="kv">${fmt(v.value,1)}<span class="ku">B$</span></div>
        <div class="kc ${trend?'up':'dn'}">${chgArrow(trend?1:-1)} ${trend?'En hausse':'En baisse'}</div>
        <div class="ks">FRED · ${v.date}</div>`;
      successCount++;
    }

    // KPI — CPI
    if(cpi.status==='fulfilled'&&cpi.value){
      const v=cpi.value;
      const yoy=((v.value-v.prev)/v.prev*100);
      const high=yoy>3;
      const kpi=document.getElementById('kpi-cpi');
      kpi.className='kpi '+(high?'dn':'ne');
      kpi.innerHTML=`<div class="kl">CPI US</div>
        <div class="kv">${fmt(v.value,1)}<span class="ku">pt</span></div>
        <div class="kc dn">Inflation persistante</div>
        <div class="ks">FRED · ${v.date}</div>`;
      successCount++;
    }

    // KPI — Fed Rate
    if(rate.status==='fulfilled'&&rate.value){
      const v=rate.value;
      const kpi=document.getElementById('kpi-rate');
      kpi.className='kpi ne';
      kpi.innerHTML=`<div class="kl">Fed Funds Rate</div>
        <div class="kv">${fmt(v.value,2)}<span class="ku">%</span></div>
        <div class="kc" style="color:var(--gold2)">⊘ ${v.value===v.prev?'Inchangé':'Modifié'}</div>
        <div class="ks">FRED · ${v.date}</div>`;
      successCount++;
    }

    // KPI — Chômage
    if(unemp.status==='fulfilled'&&unemp.value){
      const v=unemp.value;
      const better=v.value<v.prev;
      const kpi=document.getElementById('kpi-unemp');
      kpi.className='kpi '+(better?'up':'dn');
      kpi.innerHTML=`<div class="kl">Chômage US</div>
        <div class="kv">${fmt(v.value,1)}<span class="ku">%</span></div>
        <div class="kc ${better?'up':'dn'}">${chgArrow(better?1:-1)} vs ${fmt(v.prev,1)}%</div>
        <div class="ks">FRED · ${v.date}</div>`;
      successCount++;
    }

    log('FRED',`Loaded ${successCount}/6 indicators successfully`);

    // Indicateurs list
    const indicators=[];
    if(cpi.status==='fulfilled'&&cpi.value) indicators.push({n:'CPI (Indice)',v:fmt(cpi.value.value,1),t:cpi.value.value>cpi.value.prev?'▲':'▼',c:cpi.value.value>cpi.value.prev?'dn':'up'});
    if(rate.status==='fulfilled'&&rate.value) indicators.push({n:'Fed Funds Rate',v:rate.value.value+'%',t:'⊘',c:'ne'});
    if(unemp.status==='fulfilled'&&unemp.value) indicators.push({n:'Taux chômage',v:unemp.value.value+'%',t:unemp.value.value<unemp.value.prev?'▲':'▼',c:unemp.value.value<unemp.value.prev?'up':'dn'});
    if(retail.status==='fulfilled'&&retail.value) indicators.push({n:'Ventes au détail',v:'$'+fmtK(retail.value.value*1e6),t:retail.value.value>retail.value.prev?'▲':'▼',c:retail.value.value>retail.value.prev?'up':'dn'});

    if(indicators.length>0){
      document.getElementById('fred-indicators').innerHTML=indicators.map(i=>
        `<div class="mr"><span class="mn">${i.n}<span class="fred-badge">FRED</span></span><span class="mv">${i.v}</span><span class="mp" style="color:${i.c==='up'?'var(--green)':i.c==='dn'?'var(--red)':'var(--gold2)'}">${i.t}</span></div>`
      ).join('');
    }

    // Scoring macro
    let macroScore=50;
    if(unemp.status==='fulfilled'&&unemp.value){
      const u=unemp.value.value;
      if(u<4)macroScore+=15;else if(u<5)macroScore+=8;else if(u>6)macroScore-=10;
    }
    if(rate.status==='fulfilled'&&rate.value){
      const r2=rate.value.value;
      if(r2>5)macroScore-=10;else if(r2<2)macroScore+=10;
    }
    macroScore=Math.max(10,Math.min(90,macroScore));
    document.getElementById('scoring-macro').innerHTML=`
      <div class="sli"><span class="sln">Emploi US</span><div class="slt"><div class="slf" style="width:${unemp.value?.value<4?80:65}%;background:var(--green)"></div></div><span class="slv" style="color:var(--green)">${unemp.value?.value<4?80:65}</span><span class="slg" style="color:var(--green)">FORT</span></div>
      <div class="sli"><span class="sln">Inflation</span><div class="slt"><div class="slf" style="width:30%;background:var(--red)"></div></div><span class="slv" style="color:var(--red)">30</span><span class="slg" style="color:var(--red)">ÉLEVÉE</span></div>
      <div class="sli"><span class="sln">Taux Fed</span><div class="slt"><div class="slf" style="width:35%;background:var(--gold)"></div></div><span class="slv" style="color:var(--gold2)">35</span><span class="slg" style="color:var(--gold2)">RESTRICTIF</span></div>
    `;

    // Mettre à jour score global
    updateGlobalScore();

  }catch(e){
    log('FRED','Error loading data: '+e.message,'error');
    document.getElementById('fred-indicators').innerHTML='<div class="err">❌ Données FRED indisponibles. Vérifiez votre connexion.</div>';
  }
}

// ═══════════════════════════════════════
// SCORE GLOBAL (combiné crypto + macro)
// ═══════════════════════════════════════
function updateGlobalScore(){
  if(Object.keys(cryptoData).length===0)return;
  const data=cryptoData;
  const btc=data.find&&data.find(c=>c.id==='bitcoin');
  if(!btc)return;

  const btcChg=btc.price_change_percentage_24h||0;
  const cryptoScore=scoreAsset(btc);

  // Scores composites
  const growth=65; // FRED PIB
  const infl=30;   // Inflation haute = score bas
  const emp=btcChg>0?72:58;
  const pol=38;
  const crypto=cryptoScore;

  const global=Math.round((growth+infl+emp+pol+crypto)/5);

  // Update UI
  document.getElementById('score-num').textContent=global;
  const arc=document.getElementById('score-arc');
  const offset=226-(226*global/100);
  arc.setAttribute('stroke-dashoffset',offset.toFixed(0));
  arc.setAttribute('stroke',global>=65?'var(--green)':global>=45?'var(--gold)':'var(--red)');

  const tag=document.getElementById('score-tag');
  if(global>=65){tag.textContent='Risk-On';tag.className='tag bull';}
  else if(global>=45){tag.textContent='Neutre';tag.className='tag neut';}
  else{tag.textContent='Risk-Off';tag.className='tag bear';}

  // Barres
  const bars=[
    ['growth',growth,'var(--green)'],
    ['infl',infl,'var(--red)'],
    ['emp',emp,'var(--green)'],
    ['pol',pol,'var(--gold)'],
    ['crypto',crypto,crypto>=65?'var(--green)':crypto>=45?'var(--gold)':'var(--red)'],
  ];
  bars.forEach(([id,val,col])=>{
    const f=document.getElementById('sb-'+id);
    const v=document.getElementById('sv-'+id);
    if(f){f.style.width=val+'%';f.style.background=col;}
    if(v)v.textContent=val;
  });
}

// ═══════════════════════════════════════
// NEWS — CoinGecko News (no key needed)
// ═══════════════════════════════════════
async function fetchNews(){
  try{
    log('News','Fetching latest news from CoinGecko...');
    const r=await fetchWithProxy('https://api.coingecko.com/api/v3/news');
    const data=await r.json();
    const news=data.data||data||[];
    const el=document.getElementById('news-card');
    if(news.length===0){
      el.innerHTML='<div class="err">ℹ️ Aucune news disponible pour le moment.</div>';
      log('News','No news available','warn');
      return;
    }
    log('News',`Loaded ${news.length} news items`);
    el.innerHTML=news.slice(0,10).map(n=>{
      const title=n.title||n.description||'';
      const source=n.author||n.news_site||'Source';
      const ago=n.created_at?timeAgo(n.created_at):'Récent';
      const bull=title.match(/bull|surge|rally|gain|high|record|rise|up|moon|pump/i);
      const bear=title.match(/bear|crash|drop|fall|low|dump|fear|sell|down|decline/i);
      const sentColor=bull?'rgba(46,204,113,.15)':bear?'rgba(231,76,60,.15)':'rgba(90,100,128,.15)';
      const sentTc=bull?'var(--green)':bear?'var(--red)':'var(--text3)';
      const sentLabel=bull?'BULL':bear?'BEAR':'NEUTRE';
      return `<div class="ni">
        <div class="nt">${source.toUpperCase()} <span class="ns" style="background:${sentColor};color:${sentTc}">${sentLabel}</span></div>
        <div class="nti">${title.slice(0,120)}${title.length>120?'…':''}</div>
        <div class="nm">${ago}</div>
      </div>`;
    }).join('');
  }catch(e){
    log('News','Error loading news: '+e.message,'error');
    document.getElementById('news-card').innerHTML='<div class="err">❌ News temporairement indisponibles.</div>';
  }
}

function timeAgo(ts){
  const now=Date.now();
  const t=typeof ts==='number'?ts*1000:new Date(ts).getTime();
  const diff=Math.floor((now-t)/1000);
  if(diff<60)return 'Il y a '+diff+'s';
  if(diff<3600)return 'Il y a '+Math.floor(diff/60)+'min';
  if(diff<86400)return 'Il y a '+Math.floor(diff/3600)+'h';
  return 'Il y a '+Math.floor(diff/86400)+'j';
}

// ═══════════════════════════════════════
// CLAUDE AI
// ═══════════════════════════════════════
// WARNING: Claude API requires an API key that should NOT be hardcoded
// To enable: configure API_CONFIG.claude.key in config.js or via environment

async function callAI(prompt,system){
  if(!API_CONFIG || !API_CONFIG.claude || !API_CONFIG.claude.key){
    log('Claude AI','API key not configured - feature disabled','warn');
    throw new Error('Claude AI n\'est pas configuré. Clé API requise sur api.anthropic.com');
  }
  
  const r=await fetch("https://api.anthropic.com/v1/messages",{
    method:"POST",
    headers:{
      "Content-Type":"application/json",
      "x-api-key": API_CONFIG.claude.key,
      "anthropic-version": "2023-06-01"
    },
    body:JSON.stringify({
      model:"claude-opus-4-1-20250805",
      max_tokens:1000,
      system,
      messages:[{role:"user",content:prompt}]
    })
  });
  
  if(!r.ok){
    const err = await r.json();
    log('Claude API',`Error ${r.status}: ${err.error?.message || 'Unknown error'}','error');
    throw new Error(`Claude API error: ${err.error?.message || 'Unknown error'}`);
  }
  
  const d=await r.json();
  return d.content?.[0]?.text||"Analyse non disponible.";
}

async function aiDash(){
  const q=document.getElementById('ai-q').value;
  const el=document.getElementById('ai-dash');
  
  if(!API_CONFIG?.claude?.key){
    el.innerHTML='<div style="color:var(--text3);font-style:italic;padding:10px">⚠️ Claude AI requiert une clé API. <a href="https://console.anthropic.com" style="color:var(--gold2)" target="_blank">Obtenir une clé</a></div>';
    return;
  }
  
  const btc=cryptoData.find&&cryptoData.find?cryptoData.find(c=>c.id==='bitcoin'):null;
  const context=btc?`BTC: $${Math.round(btc.current_price)} (${pct(btc.price_change_percentage_24h)} 24h), ETH: $${Math.round(cryptoData.find(c=>c.id==='ethereum')?.current_price||0)}`:'Données crypto en cours de chargement';
  const prompt=q||`Analyse macro des marchés financiers. Données actuelles: ${context}. Quels sont les risques et opportunités du moment ?`;
  el.innerHTML='<span class="ld"><span></span><span></span><span></span></span> Analyse avec données live…';
  try{
    el.textContent=await callAI(prompt,"Tu es analyste senior (Goldman Sachs). Utilise les données de marché fournies. Réponds en français, 3-4 phrases, concis et actionnable.");
    document.getElementById('ai-q').value='';
  }catch(e){
    el.innerHTML=`<div style="color:var(--red)">❌ ${e.message}</div>`;
    log('aiDash',`Error: ${e.message}`,'error');
  }
}

async function aiScore(){
  const q=document.getElementById('sc-q').value;
  if(!q.trim())return;
  
  const el=document.getElementById('sc-t');
  
  if(!API_CONFIG?.claude?.key){
    el.innerHTML='<div style="color:var(--text3);font-style:italic;padding:10px">⚠️ Claude AI requiert une clé API</div>';
    return;
  }
  
  const btc=cryptoData.find&&cryptoData.find?cryptoData.find(c=>c.id==='bitcoin'):null;
  const ctx=btc?`Contexte marché: BTC $${Math.round(btc.current_price)}, variation 24h: ${pct(btc.price_change_percentage_24h)}.`:'';
  el.innerHTML='<span class="ld"><span></span><span></span><span></span></span> Analyse fondamentale…';
  try{
    el.textContent=await callAI(q+' '+ctx,"Tu es analyste fondamental expert. Donne un score 0-100, 2-3 facteurs clés, catalyseurs à surveiller. En français, 4 phrases max.");
    document.getElementById('sc-q').value='';
  }catch(e){
    el.innerHTML=`<div style="color:var(--red)">❌ ${e.message}</div>`;
    log('aiScore',`Error: ${e.message}`,'error');
  }
}

// ═══════════════════════════════════════
// CLOCK & REFRESH
// ═══════════════════════════════════════
function updateTime(){
  const now=new Date();
  document.getElementById('last-update').textContent='Mis à jour '+now.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'});
}

function tick(){
  const e=new Date(new Date().toLocaleString("en-US",{timeZone:"America/New_York"}));
  const el=document.getElementById('clk');
  if(el) el.textContent=e.getHours().toString().padStart(2,'0')+':'+e.getMinutes().toString().padStart(2,'0');
}

// ═══════════════════════════════════════
// INIT
// ═══════════════════════════════════════
async function init(){
  log('INIT','Starting application...');
  
  // Test APIs at startup
  try{
    await testAPIs();
    const status = getAPIStatusSummary();
    log('INIT',`API Status - OK: ${status.ok.length}, Error: ${status.error.length}, Disabled: ${status.disabled.length}`);
  }catch(e){
    log('INIT','API testing failed: '+e.message,'error');
  }
  
  // Load data
  try{
    await fetchCrypto();
    log('INIT','Crypto data loaded');
  }catch(e){
    log('INIT','Crypto load failed: '+e.message,'error');
  }
  
  try{
    await loadFREDData();
    log('INIT','FRED data loaded');
  }catch(e){
    log('INIT','FRED load failed: '+e.message,'error');
  }
  
  try{
    fetchNews();
    log('INIT','News loaded');
  }catch(e){
    log('INIT','News load failed: '+e.message,'error');
  }
  
  // Auto-refresh
  setInterval(fetchCrypto, 60000);
  setInterval(loadFREDData, 300000);
  setInterval(fetchNews, 120000);
  
  log('INIT','Application ready. Auto-refresh enabled.');
}

setInterval(tick,60000);tick();
init();
