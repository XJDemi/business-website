const fs = require('fs');
const raw = fs.readFileSync('i18n/translations.json', 'utf8');

// Check if JSON is valid
try {
  const data = JSON.parse(raw);
  console.log('Top-level keys:', Object.keys(data));
  console.log('Has en:', !!data.en);
  console.log('Has zh:', !!data.zh);
  console.log('Has ru:', !!data.ru);
  console.log('Has es:', !!data.es);
  console.log('Has de:', !!data.de);
  console.log('Has fr:', !!data.fr);
  console.log('Has it:', !!data.it);
  
  // Check zh keys
  if (data.zh) {
    console.log('zh keys:', Object.keys(data.zh));
    // Check if zh has about.title in Chinese or Russian
    console.log('zh.about.title:', data.zh.about ? data.zh.about.title : 'MISSING');
    console.log('zh.services.title:', data.zh.services ? data.zh.services.title : 'MISSING');
    console.log('zh.contact.title:', data.zh.contact ? data.zh.contact.title : 'MISSING');
    console.log('zh.footer.title:', data.zh.footer ? data.zh.footer.title : 'MISSING');
    console.log('zh.home.industriesTitle:', data.zh.home ? data.zh.home.industriesTitle : 'MISSING');
    console.log('zh.nav.home:', data.zh.nav ? data.zh.nav.home : 'MISSING');
    console.log('zh.hero.title:', data.zh.hero ? data.zh.hero.title : 'MISSING');
    console.log('zh.products:', data.zh.products ? 'exists' : 'MISSING');
  }
  
  // Check if ru exists and its keys
  if (data.ru) {
    console.log('ru keys:', Object.keys(data.ru));
  }
} catch(e) {
  console.log('JSON parse error:', e.message);
}