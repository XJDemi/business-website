const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

console.log('当前顶级键:', Object.keys(data));
console.log('ru的键:', Object.keys(data.ru));

// 创建ru部分缺失的键
const missingRuKeys = {
  company: {
    name: "XuanJi",
    fullName: "Ханчжоуская технологическая компания Xuanji",
    logo: "XJ"
  },
  lang: {
    en: "Английский",
    zh: "Китайский",
    ru: "Русский",
    es: "Испанский",
    de: "Немецкий",
    fr: "Французский",
    it: "Итальянский"
  },
  nav: {
    home: "Главная",
    biotech: "Биотехнологии",
    autoparts: "Автозапчасти",
    instruments: "Приборы",
    products: "Продукты",
    about: "О нас",
    contact: "Контакты"
  },
  hero: {
    title: "Ваш надежный партнер в <span>китайском экспорте</span>",
    subtitle: "Почти 20 лет профессионального опыта в международной торговле · Искренность и доверие · Полный контроль качества",
    description: "Мы специализируемся в трех основных отраслях. Выберите интересующую отрасль, чтобы узнать больше о нашей экспертизе.",
    btnExplore: "Исследовать биотехнологии",
    btnLearn: "Узнать больше"
  },
  products: {
    title: "Наши продукты",
    subtitle: "Высококачественные продукты от надежных китайских производителей",
    all: "Все продукты",
    customTitle: "Нужны изделия на заказ?",
    customDesc: "Мы предлагаем профессиональные услуги OEM/ODM. Расскажите нам о ваших требованиях, и наша команда поможет вам разработать идеальное решение.",
    customBtn: "Связаться с нами для заказа",
    categories: "Категории продуктов"
  }
};

// 将缺失的键添加到ru部分
const newRuData = {
  company: missingRuKeys.company,
  lang: missingRuKeys.lang,
  nav: missingRuKeys.nav,
  hero: missingRuKeys.hero,
  about: data.ru.about,
  services: data.ru.services,
  advantages: data.ru.advantages,
  certifications: data.ru.certifications,
  contact: data.ru.contact,
  form: data.ru.form,
  footer: data.ru.footer,
  language: {
    en: "Английский",
    zh: "Китайский",
    ru: "Русский",
    es: "Испанский",
    de: "Немецкий",
    fr: "Французский",
    it: "Итальянский"
  },
  contactBar: data.ru.contactBar,
  home: data.ru.home,
  common: data.ru.common,
  products: missingRuKeys.products,
  cta: data.ru.cta,
  biotech: data.ru.biotech,
  autoparts: data.ru.autoparts,
  instruments: data.ru.instruments,
  admin: data.ru.admin
};

// 验证
console.log('\n新的ru键:', Object.keys(newRuData));

// 构建最终数据
const finalData = {
  en: data.en,
  zh: data.zh,
  ru: newRuData,
  es: data.es,
  de: data.de,
  fr: data.fr,
  it: data.it
};

// 验证JSON
try {
  const output = JSON.stringify(finalData, null, 2);
  const parsed = JSON.parse(output);
  console.log('\nJSON验证通过！');
  
  function hasRussian(text) {
    return /[А-Яа-я]/.test(text);
  }
  
  console.log('\n各语言部分检查:');
  ['en', 'zh', 'ru', 'es', 'de', 'fr', 'it'].forEach(lang => {
    if (parsed[lang]) {
      const str = JSON.stringify(parsed[lang]);
      const keys = Object.keys(parsed[lang]);
      console.log(`  ${lang}: ✅ 存在, ${keys.length}个顶级键, 包含俄语: ${hasRussian(str)}`);
    } else {
      console.log(`  ${lang}: ❌ 不存在`);
    }
  });
  
  // 写回文件
  fs.writeFileSync(filePath, output, 'utf8');
  console.log('\n文件已更新！');
  
  // 验证ru部分
  console.log('\nru部分的键:', Object.keys(parsed.ru));
  
} catch (e) {
  console.log('JSON验证失败:', e.message);
}
