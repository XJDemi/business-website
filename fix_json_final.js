const fs = require('fs');

const raw = fs.readFileSync('i18n/translations.json', 'utf8');
const lines = raw.split('\n');

// Step 1: Build en section (lines 2-784, 0-indexed: 1-783)
// These lines are correct as-is
const enSection = lines.slice(1, 784).join('\n');

// Step 2: Build zh section - only Chinese content (lines 785-1528, 0-indexed: 784-1527)
// The zh Chinese content ends with admin section at line 1528
// We need to close the zh section properly
const zhChineseContent = lines.slice(784, 1528).join('\n');
// Remove trailing comma from last line if present, and close zh section
// Line 1528 is "    }," which closes admin
// We need to add "  }," to close zh section
const zhSection = zhChineseContent + '\n  },';

// Step 3: Build ru section
// First, create the missing top-level keys in Russian
const ruMissingKeys = `  "ru": {
    "company": {
      "name": "XuanJi",
      "fullName": "Ханчжоу Сюаньцзи Технолоджи Ко., Лтд",
      "logo": "XJ"
    },
    "lang": {
      "en": "Английский",
      "zh": "Китайский",
      "ru": "Русский",
      "es": "Испанский",
      "de": "Немецкий",
      "fr": "Французский",
      "it": "Итальянский"
    },
    "nav": {
      "home": "Главная",
      "biotech": "Биотехнологии",
      "autoparts": "Автозапчасти",
      "instruments": "Инструменты",
      "products": "Продукты",
      "about": "О нас",
      "contact": "Контакты"
    },
    "hero": {
      "title": "Ваш надёжный <span>китайский экспортный</span> партнёр",
      "subtitle": "Почти 20 лет опыта · Искренность и честность · Полный контроль качества",
      "description": "Мы специализируемся на трёх основных отраслях. Выберите вашу отрасль, чтобы изучить наш опыт.",
      "btnExplore": "Изучить Биотехнологии",
      "btnLearn": "Узнать больше"
    },`;

// Now get the Russian content from lines 1529-2186
// These lines start with "about": { and end with home section
const ruRussianContent = lines.slice(1528, 2186).join('\n');

// Step 4: Build the complete ru section
// Remove the trailing comma from ruRussianContent's last section before closing
// The ru Russian content ends with home section, line 2186 is "  },"
// We need to close ru with "  }," 

const ruSection = ruMissingKeys + '\n' + ruRussianContent + '\n  },';

// Step 5: Build es, de, fr, it sections
// es: lines 2187-2856 (0-indexed: 2186-2855)
const esSection = lines.slice(2186, 2856).join('\n');

// de: lines 2857-3504 (0-indexed: 2856-3503)
const deSection = lines.slice(2856, 3504).join('\n');

// fr: lines 3505-4152 (0-indexed: 3504-4151)
const frSection = lines.slice(3504, 4152).join('\n');

// it: lines 4153-end (0-indexed: 4152-end)
const itSection = lines.slice(4152).join('\n');

// Step 6: Reassemble the complete JSON
// Remove trailing comma from it section's last line
const itLines = itSection.split('\n');
// Last line should be } (the closing of it), then } (closing of root)
// Let's fix it properly
const lastLine = itLines[itLines.length - 1].trim();
if (lastLine === '}') {
  // This is the closing of the root object, remove it
  itLines.pop();
}
const itFixed = itLines.join('\n');

// Now assemble
const output = '{\n' + 
  enSection + ',\n' + 
  zhSection + '\n' + 
  ruSection + '\n' + 
  esSection + ',\n' + 
  deSection + ',\n' + 
  frSection + ',\n' + 
  itFixed + '\n' + 
  '}';

// Step 7: Validate the JSON
try {
  const data = JSON.parse(output);
  console.log('JSON is valid!');
  console.log('Top-level keys:', Object.keys(data));
  console.log('Has en:', !!data.en);
  console.log('Has zh:', !!data.zh);
  console.log('Has ru:', !!data.ru);
  console.log('Has es:', !!data.es);
  console.log('Has de:', !!data.de);
  console.log('Has fr:', !!data.fr);
  console.log('Has it:', !!data.it);
  
  // Check zh is correct now
  console.log('\nzh.about.title:', data.zh.about ? data.zh.about.title : 'MISSING');
  console.log('zh.services.title:', data.zh.services ? data.zh.services.title : 'MISSING');
  console.log('zh.contact.title:', data.zh.contact ? data.zh.contact.title : 'MISSING');
  console.log('zh.footer.title:', data.zh.footer ? data.zh.footer.title : 'MISSING');
  console.log('zh.home.industriesTitle:', data.zh.home ? data.zh.home.industriesTitle : 'MISSING');
  console.log('zh.nav.home:', data.zh.nav ? data.zh.nav.home : 'MISSING');
  console.log('zh.hero.title:', data.zh.hero ? data.zh.hero.title : 'MISSING');
  console.log('zh.products:', data.zh.products ? 'exists' : 'MISSING');
  console.log('zh.company.name:', data.zh.company ? data.zh.company.name : 'MISSING');
  console.log('zh.lang.ru:', data.zh.lang ? data.zh.lang.ru : 'MISSING');
  
  // Check ru is correct
  console.log('\nru.about.title:', data.ru.about ? data.ru.about.title : 'MISSING');
  console.log('ru.services.title:', data.ru.services ? data.ru.services.title : 'MISSING');
  console.log('ru.contact.title:', data.ru.contact ? data.ru.contact.title : 'MISSING');
  console.log('ru.footer.title:', data.ru.footer ? data.ru.footer.title : 'MISSING');
  console.log('ru.home.industriesTitle:', data.ru.home ? data.ru.home.industriesTitle : 'MISSING');
  console.log('ru.nav.home:', data.ru.nav ? data.ru.nav.home : 'MISSING');
  console.log('ru.hero.title:', data.ru.hero ? data.ru.hero.title : 'MISSING');
  console.log('ru.products:', data.ru.products ? 'exists' : 'MISSING');
  console.log('ru.company.name:', data.ru.company ? data.ru.company.name : 'MISSING');
  console.log('ru.lang.ru:', data.ru.lang ? data.ru.lang.ru : 'MISSING');
  
  // Check all keys needed for Home/About/Contact pages
  console.log('\n--- Key validation for Home/About/Contact pages ---');
  const pagesKeys = [
    'company.name', 'company.logo',
    'nav.home', 'nav.about', 'nav.contact', 'nav.biotech', 'nav.autoparts', 'nav.instruments',
    'lang.en', 'lang.zh', 'lang.ru', 'lang.es', 'lang.de', 'lang.fr', 'lang.it',
    'hero.title', 'hero.subtitle', 'hero.description', 'hero.btnExplore', 'hero.btnLearn',
    'about.title', 'about.intro', 'about.coreBusiness', 'about.philosophy', 'about.team', 'about.conclusion',
    'services.title', 'services.subtitle',
    'contact.title', 'contact.subtitle', 'contact.form.name', 'contact.form.email',
    'contact.info.email', 'contact.info.phone', 'contact.info.address', 'contact.info.whatsapp', 'contact.info.wechat',
    'footer.title', 'footer.desc', 'footer.divisions', 'footer.services', 'footer.contact',
    'home.industriesTitle', 'home.industriesDesc', 'home.biotechCard.title', 'home.autopartsCard.title', 'home.instrumentsCard.title',
    'contactBar.help', 'contactBar.hours', 'contactBar.whatsapp', 'contactBar.email',
  ];
  
  ['en', 'zh', 'ru', 'es', 'de', 'fr', 'it'].forEach(lang => {
    console.log(`\n  Language: ${lang}`);
    const langData = data[lang];
    let missing = 0;
    pagesKeys.forEach(key => {
      const parts = key.split('.');
      let val = langData;
      for (const p of parts) {
        if (val && typeof val === 'object' && p in val) {
          val = val[p];
        } else {
          val = undefined;
          break;
        }
      }
      if (val === undefined) {
        console.log(`    MISSING: ${key}`);
        missing++;
      }
    });
    if (missing === 0) {
      console.log('    All keys present!');
    }
  });
  
  // Write the fixed file
  fs.writeFileSync('i18n/translations.json', output, 'utf8');
  console.log('\nFixed file written!');
  
} catch(e) {
  console.log('JSON parse error:', e.message);
  console.log('Output first 500 chars:', output.substring(0, 500));
}