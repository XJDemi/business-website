const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

function hasRussian(text) {
  return /[А-Яа-я]/.test(text);
}

// 检查en部分
console.log('=== en部分检查 ===');
console.log('en的键:', Object.keys(data.en));

// 检查en中哪个键包含俄语
for (const [key, value] of Object.entries(data.en)) {
  const str = JSON.stringify(value);
  if (hasRussian(str)) {
    console.log(`  en.${key} 包含俄语:`);
    // 显示俄语内容
    const matches = str.match(/[А-Яа-я]+/g);
    if (matches) {
      console.log(`    俄语词汇: ${matches.slice(0, 10).join(', ')}`);
    }
  }
}

// 检查ru部分
console.log('\n=== ru部分检查 ===');
console.log('ru的键:', Object.keys(data.ru));

// ru应该有这些键: company, lang, nav, hero, about, services, advantages, certifications, contact, form, footer, language, contactBar, home, common, products, cta, biotech, autoparts, instruments, admin
const expectedKeys = ['company', 'lang', 'nav', 'hero', 'about', 'services', 'advantages', 'certifications', 'contact', 'form', 'footer', 'language', 'contactBar', 'home', 'common', 'products', 'cta', 'biotech', 'autoparts', 'instruments', 'admin'];
const missingKeys = expectedKeys.filter(k => !data.ru[k]);
console.log('ru缺少的键:', missingKeys);

// 检查zh部分
console.log('\n=== zh部分检查 ===');
console.log('zh的键:', Object.keys(data.zh));

// 检查zh是否缺少form键
if (!data.zh.form) {
  console.log('zh缺少form键！');
} else {
  console.log('zh.form存在');
}

// 检查zh.home
console.log('\nzh.home的键:', Object.keys(data.zh.home));

// 检查en.home
console.log('\nen.home的键:', Object.keys(data.en.home));

// 检查en.contact
console.log('\nen.contact:', JSON.stringify(data.en.contact));

// 检查en.about
console.log('\nen.about的键:', Object.keys(data.en.about));

// 检查en.footer
console.log('\nen.footer的键:', Object.keys(data.en.footer));
