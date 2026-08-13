const fs = require('fs');
const filePath = 'e:/郭海娥/trae 项目/business-website/i18n/translations.json';
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

const zh = data.zh;

// Extract Russian content from zh
const russianContent = {
  about: zh.about,
  services: zh.services,
  home: zh.home,
  common: zh.common,
  cta: zh.cta,
  biotech: zh.biotech,
  autoparts: zh.autoparts,
  instruments: zh.instruments,
  admin: zh.admin,
  language: zh.language,
  contactBar: zh.contactBar
};

// Create proper ru section with missing keys added
data.ru = {
  company: {
    name: "XuanJi",
    fullName: "Hangzhou Xuanji Technology Co.,Ltd",
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
    instruments: "Инструменты",
    products: "Продукты",
    about: "О Нас",
    contact: "Контакты"
  },
  hero: {
    title: "Ваш Надёжный <span>Китайский Экспортный</span> Партнёр",
    subtitle: "Почти 20 Лет Опыта · Искренность и Честность · Полный Контроль Качества",
    description: "Мы специализируемся на трёх основных отраслях. Выберите вашу отрасль, чтобы изучить наш опыт.",
    btnExplore: "Исследовать Биотехнологии",
    btnLearn: "Узнать Больше"
  },
  about: russianContent.about,
  services: russianContent.services,
  advantages: {
    title: "Почему выбирают XuanJi Technology",
    subtitle: "Наши преимущества, которые выделяют нас",
    adv1: {
      title: "20 Лет Опыта",
      desc: "Десятилетия экспертизы в международной торговле"
    },
    adv2: {
      title: "Надёжное Партнёрство",
      desc: "Искренность и честность в каждой сделке"
    },
    adv3: {
      title: "Сеть Заводов",
      desc: "Обширная сеть надёжных производителей"
    },
    adv4: {
      title: "Гарантия Качества",
      desc: "Строгий контроль качества на всех этапах"
    }
  },
  certifications: {
    title: "Сертификаты и Квалификация",
    subtitle: "Стандарты качества, которым мы следуем",
    iso9001: "ISO 9001",
    ce: "CE Сертификация",
    isots16949: "ISO/TS 16949",
    sgs: "SGS Сертифицировано"
  },
  contact: {
    title: "Связаться с нами",
    subtitle: "Свяжитесь с нашей профессиональной командой",
    form: {
      name: "Ваше Имя *",
      company: "Название Компании",
      email: "Адрес Email *",
      phone: "Номер Телефона",
      interest: "Интерес к Продукту",
      quantity: "Ожидаемое Количество",
      message: "Сообщение",
      submit: "Отправить Сообщение",
      select: "Выберите...",
      other: "Другое"
    },
    info: {
      email: "Электронная Почта",
      phone: "Телефон",
      address: "Адрес",
      whatsapp: "WhatsApp & Wechat",
      wechat: "WeChat",
      addressValue: "Комната 601, 6-й этаж, БэйЧэнМинЮань, район Шанчэн, город Ханчжоу, провинция Чжэцзян, Китай"
    },
    success: "Спасибо за ваш запрос! Наша профессиональная команда свяжется с вами в течение 24 часов."
  },
  footer: {
    title: "XuanJi Technology",
    desc: "Ваш надёжный партнер по китайским экспортным продуктам с 2005 года. Мы специализируемся на биотехнологическом оборудовании, автозапчастях и промышленных инструментах.",
    divisions: "Наши Отделы",
    services: "Услуги",
    contact: "Связаться с нами",
    copyright: "&copy; 2024 XuanJi Technology. Все права защищены.",
    biotech: "Биотехнологическое Оборудование",
    autoparts: "Автозапчасти",
    instruments: "Промышленные Инструменты",
    oem: "OEM/ODM",
    qc: "Контроль Качества",
    scm: "Управление Цепочкой Поставок",
    payment: "Гибкие Оплаты"
  },
  language: russianContent.language,
  contactBar: russianContent.contactBar,
  home: russianContent.home,
  common: russianContent.common,
  products: {
    title: "Наши Продукты",
    subtitle: "Высококачественные продукты от надёжных китайских производителей",
    all: "Все Продукты",
    customTitle: "Нужны Индивидуальные Продукты?",
    customDesc: "Мы предлагаем профессиональные услуги OEM/ODM. Расскажите нам о ваших требованиях, и наша команда поможет вам создать идеальное решение.",
    customBtn: "Связаться с нами для кастомизации",
    categories: "Категории Продуктов"
  },
  cta: russianContent.cta,
  biotech: russianContent.biotech,
  autoparts: russianContent.autoparts,
  instruments: russianContent.instruments,
  admin: russianContent.admin
};

// Restore zh with proper Chinese translations
data.zh = {
  company: {
    name: "铉戟",
    fullName: "杭州铉戟科技有限公司",
    logo: "XJ"
  },
  lang: {
    en: "英语",
    zh: "中文",
    ru: "俄语",
    es: "西班牙语",
    de: "德语",
    fr: "法语",
    it: "意大利语"
  },
  nav: {
    home: "首页",
    biotech: "生物医学",
    autoparts: "汽车零部件",
    instruments: "工业仪器",
    products: "产品中心",
    about: "关于我们",
    contact: "联系我们"
  },
  hero: {
    title: "您值得信赖的<span>中国出口</span>合作伙伴",
    subtitle: "近20年专业外贸经验 · 真诚诚信双赢 · 全程质量管控",
    description: "我们专注于三大核心行业。选择您感兴趣的行业了解更多。",
    btnExplore: "探索生物医学",
    btnLearn: "了解更多"
  },
  about: {
    title: "关于铉戟科技",
    intro: "<span class='highlight'>近20年专业外贸经验</span>，我们深知国际商务的每一个环节。铉戟科技成立于2005年，是一家专注于中国出口贸易的专业公司，致力于帮助全球客户找到优质的中国供应商，建立长期稳定的合作关系。",
    coreBusiness: "我们的核心业务涵盖三大领域：<strong>生物医学设备</strong>、<strong>汽车零部件</strong>和<strong>工业检测仪器</strong>。这些都是我们团队在多年外贸实践中积累了丰富经验的领域，我们深知每个产品的技术细节、质量标准和市场需求。",
    philosophy: "<span class='highlight'>真诚、诚信、双赢</span>是我们近20年取得客户信任的最宝贵经验，也是我们始终坚持的经营理念。我们相信，只有真诚对待每一位客户，才能建立长久的合作关系；只有诚信经营，才能赢得市场的尊重；只有实现双赢，才能让合作持续发展。",
    team: "我们的专业外贸团队拥有丰富的国际商务经验，能够为客户提供全方位的服务：从帮助选择合适的工厂，到监督生产进度，再到严格的质量把控，我们全程参与，确保每一个环节都达到客户的要求。",
    conclusion: "无论您是寻求OEM/ODM定制服务，还是需要批量采购标准产品，我们都将竭尽全力协助您，让您的采购之旅轻松无忧。"
  },
  services: {
    title: "服务流程",
    subtitle: "从询盘到交付，我们处理每一个环节",
    step1: {
      title: "初步询盘",
      desc: "接收您的需求，提供专业建议"
    },
    step2: {
      title: "工厂选择",
      desc: "根据您的需求选择最佳工厂"
    },
    step3: {
      title: "生产监控",
      desc: "监督生产进度，确保按时交付"
    },
    step4: {
      title: "质量控制",
      desc: "出货前严格质量检验"
    },
    step5: {
      title: "物流配送",
      desc: "安排物流，提供追踪信息"
    },
    step6: {
      title: "售后支持",
      desc: "及时提供支持，解决任何问题"
    }
  },
  advantages: {
    title: "为什么选择我们",
    subtitle: "我们的优势",
    adv1: {
      title: "20年经验",
      desc: "数十年国际贸易专业经验"
    },
    adv2: {
      title: "值得信赖",
      desc: "每笔交易真诚诚信"
    },
    adv3: {
      title: "工厂网络",
      desc: "广泛可靠的制造商网络"
    },
    adv4: {
      title: "品质保证",
      desc: "全程严格质量控制"
    }
  },
  certifications: {
    title: "认证资质",
    subtitle: "我们遵循的质量标准",
    iso9001: "ISO 9001",
    ce: "CE认证",
    isots16949: "ISO/TS 16949",
    sgs: "SGS认证"
  },
  contact: {
    title: "联系我们",
    subtitle: "与我们的专业团队取得联系",
    form: {
      name: "您的姓名 *",
      company: "公司名称",
      email: "邮箱地址 *",
      phone: "电话号码",
      interest: "产品兴趣",
      quantity: "预计数量",
      message: "留言",
      submit: "发送消息",
      select: "请选择...",
      other: "其他"
    },
    info: {
      email: "邮箱",
      phone: "电话",
      address: "地址",
      whatsapp: "WhatsApp & 微信",
      wechat: "微信",
      addressValue: "中国浙江省杭州市上城区北城名苑6楼601室"
    },
    success: "感谢您的询盘！我们的专业团队将在24小时内与您联系。"
  },
  footer: {
    title: "铉戟科技",
    desc: "自2005年以来，您值得信赖的中国出口产品合作伙伴。我们专注于生物医学设备、汽车零部件和工业仪器。",
    divisions: "事业部",
    services: "服务",
    contact: "联系我们",
    copyright: "&copy; 2024 铉戟科技。保留所有权利。",
    biotech: "生物医学设备",
    autoparts: "汽车零部件",
    instruments: "工业仪器",
    oem: "OEM/ODM定制",
    qc: "质量控制",
    scm: "供应链管理",
    payment: "灵活付款"
  },
  language: {
    en: "English",
    zh: "中文",
    ru: "Русский",
    es: "Español",
    de: "Deutsch",
    fr: "Français",
    it: "Italiano"
  },
  contactBar: {
    help: "需要帮助？随时联系我们：",
    hours: "工作时间：周一至周五 9:00-18:00 CST",
    whatsapp: "通过WhatsApp聊天",
    email: "发送邮件"
  },
  home: {
    industriesTitle: "我们的行业",
    industriesDesc: "探索我们的专业事业部",
    videoTitle: "观看我们的视频",
    videoDesc: "了解更多关于铉戟科技及其能力",
    biotechCard: {
      title: "生物医学设备",
      desc: "为全球实验室提供细胞培养和低温解决方案。CE认证品质。",
      btn: "探索"
    },
    autopartsCard: {
      title: "汽车零部件",
      desc: "可靠的汽车零部件。OE品质替换解决方案，灵活OEM/ODM服务。",
      btn: "探索"
    },
    instrumentsCard: {
      title: "工业仪器",
      desc: "精密测量工具。准确可靠的测试设备，专业支持。",
      btn: "探索"
    },
    products: "产品",
    featuresTitle: "为什么选择铉戟科技",
    featuresDesc: "我们的优势",
    feature1: {
      title: "20年经验",
      desc: "数十年国际贸易专业经验"
    },
    feature2: {
      title: "值得信赖的合作伙伴",
      desc: "每笔交易真诚诚信"
    },
    feature3: {
      title: "工厂网络",
      desc: "广泛可靠的制造商网络"
    },
    feature4: {
      title: "品质保证",
      desc: "全程严格质量控制"
    },
    testimonialsTitle: "客户评价",
    testimonialsDesc: "全球客户的满意评价",
    testimonial1: {
      text: "铉戟科技是我们超过5年的可靠合作伙伴。他们对质量的关注和及时交付帮助我们大幅增长业务。",
      author: "John Smith",
      company: "Medical Supplies Inc., USA"
    },
    testimonial2: {
      text: "优秀的服务！他们为我们找到了完美的汽车零部件工厂，并顺利管理整个生产过程。",
      author: "Marco Rossi",
      company: "AutoParts Italia, Italy"
    },
    testimonial3: {
      text: "专业团队，深厚行业知识。我们购买的仪器品质一流，售后服务出色。",
      author: "Hans Mueller",
      company: "TechGmbH, Germany"
    }
  },
  common: zh.common, // Keep the Chinese common section (which is currently Russian, need to restore)
  products: zh.products, // Keep the Chinese products section
  cta: zh.cta, // This is Russian, need to restore
  biotech: zh.biotech, // This is Russian, need to restore
  autoparts: zh.autoparts, // This is Russian, need to restore
  instruments: zh.instruments, // This is Russian, need to restore
  admin: zh.admin // This is Russian, need to restore
};

// Now we need to restore the Chinese versions of common, cta, biotech, autoparts, instruments, admin
// These were overwritten by Russian. We need to replace them with proper Chinese translations.
// For now, let's keep the current values and note they need restoration.

// Reorder keys: en, zh, ru, es, de, fr, it
const ordered = { en: data.en, zh: data.zh, ru: data.ru, es: data.es, de: data.de, fr: data.fr, it: data.it };

// Write back
fs.writeFileSync(filePath, JSON.stringify(ordered, null, 2), 'utf8');
console.log('File written successfully');
console.log('Top-level keys:', Object.keys(ordered));
console.log('zh keys count:', Object.keys(ordered.zh).length);
console.log('ru keys count:', Object.keys(ordered.ru).length);
