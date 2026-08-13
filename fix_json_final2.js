const fs = require('fs');

const raw = fs.readFileSync('i18n/translations.json', 'utf8');
const lines = raw.split('\n');

// Step 1: Extract en section (lines 2-784, 0-indexed: 1-783)
// Line 784 is "  }," which is the closing of en with trailing comma
const enSection = lines.slice(1, 784).join('\n');

// Step 2: Build zh section - only Chinese content (lines 785-1528, 0-indexed: 784-1527)
// Line 1528 is "    }," which is the end of admin section (with trailing comma)
// We need to:
//   a. Remove trailing comma from admin closing (since it's now the last key)
//   b. Add closing for zh section
const zhChineseLines = lines.slice(784, 1528);
// Fix the last line: remove comma from "    }," to "    }"
const lastZhLine = zhChineseLines[zhChineseLines.length - 1];
zhChineseLines[zhChineseLines.length - 1] = lastZhLine.replace(/,\s*$/, '');
const zhChineseContent = zhChineseLines.join('\n');
// Add zh section closing with trailing comma (since ru follows)
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
    },
    "products": {
      "title": "Наши Продукты",
      "subtitle": "Высококачественные продукты от надёжных китайских производителей",
      "all": "Все Продукты",
      "customTitle": "Нужны ли вам персонализированные продукты?",
      "customDesc": "Мы предлагаем профессиональные услуги OEM/ODM. Расскажите нам о ваших требованиях, и наша команда поможет вам разработать идеальное решение.",
      "customBtn": "Связаться с нами для персонализации",
      "categories": "Категории Продуктов"
    },`;

// Now get the Russian content from lines 1529-2185 (about through home, without the final closing)
// Lines 1529-2185 contain the Russian keys (about through home)
// Line 2185 is "    }" which closes the home section
const ruRussianLines = lines.slice(1528, 2185); // 0-indexed: 1528 to 2184
// The last line of ruRussianLines should be the closing of home section
// It should NOT have a trailing comma since it's followed by ru's closing

// Build ru section: missing keys + russian content + closing
const ruRussianContent = ruRussianLines.join('\n');
const ruSection = ruMissingKeys + '\n' + ruRussianContent + '\n  },';

// Step 4: Build es section (lines 2187-2856, 0-indexed: 2186-2855)
// Line 2187 is "  "es": {" and line 2856 is "  },"
const esSection = lines.slice(2186, 2856).join('\n');

// Step 5: Build de section (lines 2857-3504, 0-indexed: 2856-3503)
const deSection = lines.slice(2856, 3504).join('\n');

// Step 6: Build fr section (lines 3505-4152, 0-indexed: 3504-4151)
const frSection = lines.slice(3504, 4152).join('\n');

// Step 7: Build it section (lines 4153-4799, 0-indexed: 4152-4798)
// The it section should end with "}" (no trailing comma)
// Line 4799 is "  }" and line 4800 is "}" (root close)
const itLines = lines.slice(4152, 4799); // includes "  }" closing of it
const itSection = itLines.join('\n');

// Step 8: Reassemble
// enSection already ends with "  }," (comma included)
// zhSection ends with "  }," (comma included)
// ruSection ends with "  }," (comma included)
// esSection ends with "  }," (comma included)
// deSection ends with "  }," (comma included)
// frSection ends with "  }," (comma included)
// itSection ends with "  }" (no comma, last section)

const output = '{\n' + 
  enSection + '\n' + 
  zhSection + '\n' + 
  ruSection + '\n' + 
  esSection + '\n' + 
  deSection + '\n' + 
  frSection + '\n' + 
  itSection + '\n' + 
  '}';

// Step 9: Validate
try {
  const data = JSON.parse(output);
  console.log('JSON is valid!');
  console.log('Top-level keys:', Object.keys(data));
  
  // Quick check
  const checks = [
    ['zh', 'about', 'title'],
    ['zh', 'services', 'title'],
    ['zh', 'contact', 'title'],
    ['zh', 'nav', 'home'],
    ['zh', 'hero', 'title'],
    ['zh', 'company', 'name'],
    ['ru', 'about', 'title'],
    ['ru', 'nav', 'home'],
    ['ru', 'hero', 'title'],
    ['ru', 'company', 'name'],
    ['ru', 'lang', 'ru'],
  ];
  
  checks.forEach(([lang, ...path]) => {
    let val = data[lang];
    path.forEach(k => { val = val ? val[k] : undefined; });
    console.log(`${lang}.${path.join('.')}: ${val}`);
  });
  
  // Check all pages keys for all languages
  const pagesKeys = [
    'company.name', 'company.logo',
    'nav.home', 'nav.about', 'nav.contact', 'nav.biotech', 'nav.autoparts', 'nav.instruments',
    'lang.en', 'lang.zh', 'lang.ru', 'lang.es', 'lang.de', 'lang.fr', 'lang.it',
    'hero.title', 'hero.subtitle', 'hero.description', 'hero.btnExplore', 'hero.btnLearn',
    'about.title', 'about.intro', 'about.coreBusiness', 'about.philosophy', 'about.team', 'about.conclusion',
    'services.title', 'services.subtitle', 'services.step1.title',
    'contact.title', 'contact.subtitle', 'contact.form.name', 'contact.form.email',
    'contact.info.email', 'contact.info.phone', 'contact.info.address', 'contact.info.whatsapp', 'contact.info.wechat',
    'contact.info.addressValue',
    'contact.success',
    'footer.title', 'footer.desc', 'footer.divisions', 'footer.services', 'footer.contact',
    'footer.biotech', 'footer.autoparts', 'footer.instruments',
    'footer.copyright',
    'home.industriesTitle', 'home.industriesDesc', 
    'home.biotechCard.title', 'home.biotechCard.desc', 'home.biotechCard.btn',
    'home.autopartsCard.title', 'home.autopartsCard.desc', 'home.autopartsCard.btn',
    'home.instrumentsCard.title', 'home.instrumentsCard.desc', 'home.instrumentsCard.btn',
    'home.featuresTitle', 'home.featuresDesc',
    'home.feature1.title', 'home.feature1.desc',
    'home.feature2.title', 'home.feature2.desc',
    'home.feature3.title', 'home.feature3.desc',
    'home.feature4.title', 'home.feature4.desc',
    'home.testimonialsTitle', 'home.testimonialsDesc',
    'home.testimonial1.text', 'home.testimonial1.author', 'home.testimonial1.company',
    'home.testimonial2.text', 'home.testimonial2.author', 'home.testimonial2.company',
    'home.testimonial3.text', 'home.testimonial3.author', 'home.testimonial3.company',
    'cta.title', 'cta.desc', 'cta.btn',
    'advantages.title', 'advantages.subtitle',
    'certifications.title', 'certifications.subtitle',
    'contactBar.help', 'contactBar.hours', 'contactBar.whatsapp', 'contactBar.email',
    'products.title', 'products.subtitle', 'products.all',
  ];
  
  console.log('\n--- Detailed key validation ---');
  let allGood = true;
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
      if (val === undefined || val === null || val === '') {
        console.log(`    MISSING/EMPTY: ${key}`);
        missing++;
        allGood = false;
      }
    });
    if (missing === 0) {
      console.log('    All keys present!');
    } else {
      console.log(`    ${missing} keys missing/empty`);
    }
  });
  
  if (allGood) {
    console.log('\nAll validations passed! Writing file...');
    fs.writeFileSync('i18n/translations.json', output, 'utf8');
    console.log('Fixed file written successfully!');
  } else {
    console.log('\nSome keys are missing/empty. File NOT written.');
  }
  
} catch(e) {
  console.log('JSON parse error:', e.message);
}