#!/usr/bin/env node

// ═══════════════════════════════════════
// PROJECT VERIFICATION SCRIPT
// Run: node verify.js
// ═══════════════════════════════════════

const fs = require('fs');
const path = require('path');

console.log('\n🔍 FundaScope Project Verification\n');

const files = [
  'index.html',
  'css/style.css',
  'js/config.js',
  'js/app.js',
  'js/diagnostic.js',
  'README.md'
];

let issues = [];
let warnings = [];

// Check 1: All files exist
console.log('✓ Checking files...');
files.forEach(file => {
  const filepath = path.join(__dirname, file);
  if (fs.existsSync(filepath)) {
    const size = fs.statSync(filepath).size;
    console.log(`  ✅ ${file} (${size} bytes)`);
  } else {
    console.log(`  ❌ ${file} (MISSING)`);
    issues.push(`Missing file: ${file}`);
  }
});

// Check 2: Verify critical functions in JS files
console.log('\n✓ Checking JavaScript...');

const appJs = fs.readFileSync(path.join(__dirname, 'js/app.js'), 'utf8');
const criticalFunctions = [
  'fetchCrypto',
  'loadFREDData',
  'fetchNews',
  'callAI',
  'go',
  'init'
];

criticalFunctions.forEach(func => {
  if (appJs.includes(`function ${func}(`) || appJs.includes(`async function ${func}(`)) {
    console.log(`  ✅ ${func}() defined`);
  } else {
    console.log(`  ⚠️  ${func}() not found`);
    warnings.push(`Function ${func}() may be missing`);
  }
});

// Check 3: Verify config
console.log('\n✓ Checking configuration...');
const configJs = fs.readFileSync(path.join(__dirname, 'js/config.js'), 'utf8');

if (configJs.includes('API_CONFIG')) {
  console.log('  ✅ API_CONFIG defined');
} else {
  console.log('  ❌ API_CONFIG not found');
  issues.push('API_CONFIG not defined in config.js');
}

if (configJs.includes('const log')) {
  console.log('  ✅ log() function defined');
} else {
  console.log('  ❌ log() function not found');
  issues.push('log() function not in config.js');
}

if (configJs.includes('testAPIs')) {
  console.log('  ✅ testAPIs() function defined');
} else {
  console.log('  ⚠️  testAPIs() function missing');
  warnings.push('testAPIs() not defined');
}

// Check 4: HTML structure
console.log('\n✓ Checking HTML structure...');
const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const htmlChecks = {
  'DOCTYPE': '<!DOCTYPE',
  'CSS Link': 'css/style.css',
  'config.js': 'js/config.js',
  'app.js': 'js/app.js',
  'diagnostic.js': 'js/diagnostic.js',
  'Dashboard page': 'p-dashboard',
  'Crypto page': 'p-crypto',
  'Ticker bar': 'ticker-bar'
};

Object.entries(htmlChecks).forEach(([name, check]) => {
  if (indexHtml.includes(check)) {
    console.log(`  ✅ ${name}`);
  } else {
    console.log(`  ❌ ${name}`);
    issues.push(`HTML missing: ${name}`);
  }
});

// Summary
console.log('\n═══════════════════════════════════════');
console.log('📊 VERIFICATION SUMMARY');
console.log('═══════════════════════════════════════\n');

if (issues.length === 0 && warnings.length === 0) {
  console.log('✅ All checks passed!\n');
  console.log('🚀 Project is ready to use:');
  console.log('   1. Open index.html in a browser');
  console.log('   2. Press F12 to open DevTools');
  console.log('   3. Run: runDiagnostics() to test APIs');
  console.log('   4. (Optional) Add Claude API key to config.js\n');
} else {
  if (issues.length > 0) {
    console.log('❌ ISSUES FOUND:');
    issues.forEach(issue => console.log(`   • ${issue}`));
    console.log();
  }
  
  if (warnings.length > 0) {
    console.log('⚠️  WARNINGS:');
    warnings.forEach(warning => console.log(`   • ${warning}`));
    console.log();
  }
}

console.log('═══════════════════════════════════════\n');
