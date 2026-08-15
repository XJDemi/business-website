require('dotenv').config();

const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');
const nodemailer = require('nodemailer');
const { Client } = require('pg');
const sharp = require('sharp');

const app = express();
const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'xuanji-secret-key-2024';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

let supabase;
let usingSupabase = false;

let db = {
  users: [],
  products: [],
  visits: [],
  inquiries: [],
  categories: [],
  public_phrases: [],
  site_settings: {},
  nextProductId: 1,
  nextInquiryId: 1,
  nextVisitId: 1,
  nextCategoryId: 1,
  nextPhraseId: 1
};

const DB_FILE = path.join(__dirname, 'database.json');

function loadDB() {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
      const loadedDb = { ...db, ...data };
      
      if (!loadedDb.users || loadedDb.users.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        loadedDb.users = [{
          id: 1,
          username: 'admin',
          password: hashedPassword,
          created_at: new Date().toISOString()
        }];
        fs.writeFileSync(DB_FILE, JSON.stringify(loadedDb, null, 2));
        console.log('Default admin user created in JSON: admin / admin123');
      }
      
      return loadedDb;
    }
  } catch (e) {
    console.error('Failed to load database:', e);
  }
  
  const hashedPassword = bcrypt.hashSync('admin123', 10);
  return {
    ...db,
    users: [{
      id: 1,
      username: 'admin',
      password: hashedPassword,
      created_at: new Date().toISOString()
    }]
  };
}

async function saveDB() {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
  } catch (e) {
    console.error('Failed to save database:', e);
  }
}

async function initSupabaseTables() {
  try {
    console.log('Please create tables manually in Supabase console with the following SQL:');
    console.log('--- SQL START ---');
    console.log(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        sort_order INTEGER DEFAULT 0,
        seo_meta_title JSONB DEFAULT '{}',
        seo_meta_description JSONB DEFAULT '{}',
        seo_keywords JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_title JSONB DEFAULT '{}';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_meta_description JSONB DEFAULT '{}';
      ALTER TABLE categories ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '{}';

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        industry TEXT NOT NULL,
        description TEXT,
        specifications TEXT,
        price_range TEXT,
        image_url TEXT,
        sort_order INTEGER DEFAULT 0,
        translations JSONB DEFAULT '{}',
        seo_meta_title JSONB DEFAULT '{}',
        seo_meta_description JSONB DEFAULT '{}',
        seo_keywords JSONB DEFAULT '{}',
        seo_image_alt TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_meta_title JSONB DEFAULT '{}';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_meta_description JSONB DEFAULT '{}';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_keywords JSONB DEFAULT '{}';
      ALTER TABLE products ADD COLUMN IF NOT EXISTS seo_image_alt TEXT;

      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        visitor_id TEXT,
        session_id TEXT,
        page_url TEXT,
        page_title TEXT,
        referrer TEXT,
        country TEXT,
        ip TEXT,
        user_agent TEXT,
        device_type TEXT,
        duration INTEGER DEFAULT 0,
        is_new INTEGER DEFAULT 0,
        search_keyword TEXT,
        traffic_source TEXT,
        product_id TEXT,
        product_name TEXT,
        event_type TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS inquiries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT,
        company TEXT,
        industry TEXT,
        product TEXT,
        message TEXT NOT NULL,
        source_page TEXT,
        session_id TEXT,
        visitor_id TEXT,
        product_id TEXT,
        product_name TEXT,
        quantity TEXT,
        attachment_url TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS product_id TEXT;
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS product_name TEXT;
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS quantity TEXT;
      ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS attachment_url TEXT;

      CREATE TABLE IF NOT EXISTS public_phrases (
        id SERIAL PRIMARY KEY,
        key TEXT UNIQUE NOT NULL,
        original_text TEXT,
        translations JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS site_settings (
        id SERIAL PRIMARY KEY,
        contact_name TEXT,
        youtube_link TEXT,
        whatsapp_link TEXT,
        instagram_link TEXT,
        facebook_link TEXT,
        linkedin_link TEXT,
        wechat_link TEXT,
        company_email TEXT,
        contact_phone TEXT,
        homepage_seo_title JSONB DEFAULT '{}',
        homepage_seo_description JSONB DEFAULT '{}',
        homepage_seo_keywords JSONB DEFAULT '{}',
        google_verification_code TEXT,
        social_share_enabled BOOLEAN DEFAULT true,
        whatsapp_float_enabled BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS contact_name TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepage_seo_title JSONB DEFAULT '{}';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepage_seo_description JSONB DEFAULT '{}';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS homepage_seo_keywords JSONB DEFAULT '{}';
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS google_verification_code TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS social_share_enabled BOOLEAN DEFAULT true;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS whatsapp_float_enabled BOOLEAN DEFAULT true;

      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_contact_name TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_whatsapp TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_wechat TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_email TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS biotech_phone TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_contact_name TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_whatsapp TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_wechat TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_email TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS autoparts_phone TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_contact_name TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_whatsapp TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_wechat TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_email TEXT;
      ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS instruments_phone TEXT;

      CREATE INDEX IF NOT EXISTS idx_visits_session ON visits(session_id);
      CREATE INDEX IF NOT EXISTS idx_inquiries_session ON inquiries(session_id);
      CREATE INDEX IF NOT EXISTS idx_products_industry ON products(industry);
      CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
      CREATE INDEX IF NOT EXISTS idx_categories_industry ON categories(industry);
      CREATE INDEX IF NOT EXISTS idx_public_phrases_key ON public_phrases(key);

      ALTER TABLE products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
      ALTER TABLE visits ENABLE ROW LEVEL SECURITY;
      ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public_phrases ENABLE ROW LEVEL SECURITY;
      ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
      CREATE POLICY "products_public_read" ON products FOR SELECT USING (true);
      CREATE POLICY "categories_public_read" ON categories FOR SELECT USING (true);
      CREATE POLICY "categories_public_insert" ON categories FOR INSERT WITH CHECK (true);
      CREATE POLICY "visits_public_insert" ON visits FOR INSERT WITH CHECK (true);
      CREATE POLICY "visits_admin_read" ON visits FOR SELECT USING (true);
      CREATE POLICY "inquiries_public_insert" ON inquiries FOR INSERT WITH CHECK (true);
      CREATE POLICY "inquiries_admin_read" ON inquiries FOR SELECT USING (true);
      CREATE POLICY "users_admin_access" ON users FOR ALL USING (true);
      CREATE POLICY "users_public_select" ON users FOR SELECT USING (true);
      CREATE POLICY "public_phrases_public_read" ON public_phrases FOR SELECT USING (true);
      CREATE POLICY "site_settings_public_read" ON site_settings FOR SELECT USING (true);
    `);
    console.log('--- SQL END ---');
    
    const { data: adminData } = await supabase.from('users').select('*').eq('username', 'admin');
    if (!adminData || adminData.length === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await supabase.from('users').insert([{
        username: 'admin',
        password: hashedPassword
      }]);
      console.log('Default admin user created: admin / admin123');
    }

    await initDefaultCategories();
    console.log('Default categories initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize Supabase tables:', error);
    return false;
  }
}

async function connectSupabase() {
  db = loadDB();

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.log('Supabase config not set, using JSON file storage');
    await initDefaultCategories();
    return;
  }

  try {
    supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
    
    const { status } = await supabase.from('products').select('id').limit(1);
    if (status === 200) {
      usingSupabase = true;
      console.log('Connected to Supabase');
      
      const { data: maxProduct } = await supabase.from('products').select('id').order('id', { ascending: false }).limit(1);
      db.nextProductId = maxProduct && maxProduct[0] ? maxProduct[0].id + 1 : 1;

      const { data: maxInquiry } = await supabase.from('inquiries').select('id').order('id', { ascending: false }).limit(1);
      db.nextInquiryId = maxInquiry && maxInquiry[0] ? maxInquiry[0].id + 1 : 1;

      const { data: maxVisit } = await supabase.from('visits').select('id').order('id', { ascending: false }).limit(1);
      db.nextVisitId = maxVisit && maxVisit[0] ? maxVisit[0].id + 1 : 1;

      const { data: maxCategory } = await supabase.from('categories').select('id').order('id', { ascending: false }).limit(1);
      db.nextCategoryId = maxCategory && maxCategory[0] ? maxCategory[0].id + 1 : 1;

      const { data: maxPhrase } = await supabase.from('public_phrases').select('id').order('id', { ascending: false }).limit(1);
      db.nextPhraseId = maxPhrase && maxPhrase[0] ? maxPhrase[0].id + 1 : 1;

      const { data: adminData } = await supabase.from('users').select('*').eq('username', 'admin');
      if (!adminData || adminData.length === 0) {
        const hashedPassword = bcrypt.hashSync('admin123', 10);
        await supabase.from('users').insert([{
          username: 'admin',
          password: hashedPassword
        }]);
        console.log('Default admin user created: admin / admin123');
      }

      await initDefaultCategories();
      console.log('Default categories initialized');
    } else {
      await initSupabaseTables();
      usingSupabase = true;
      console.log('Connected to Supabase with new tables');
    }
  } catch (error) {
    console.error('Supabase connection failed, falling back to JSON:', error);
    usingSupabase = false;
    await initDefaultCategories();
  }
}

const SUPPORTED_LANGS = ['zh', 'ru', 'es', 'de', 'fr', 'it'];

const DEMO_TRANSLATIONS = {
  zh: {
    'Test Translation Product': '测试翻译产品',
    'Test Category': '测试分类',
    'This is a test description for translation feature.': '这是翻译功能的测试描述。',
    '$50-$100': '¥50-¥100'
  },
  ru: {
    'Test Translation Product': 'Тестовый продукт для перевода',
    'Test Category': 'Тестовая категория',
    'This is a test description for translation feature.': 'Это тестовое описание для функции перевода.',
    '$50-$100': '50-100 $'
  },
  es: {
    'Test Translation Product': 'Producto de prueba de traducción',
    'Test Category': 'Categoría de prueba',
    'This is a test description for translation feature.': 'Esta es una descripción de prueba para la función de traducción.',
    '$50-$100': '$50-$100'
  },
  de: {
    'Test Translation Product': 'Test-Übersetzungsprodukt',
    'Test Category': 'Testkategorie',
    'This is a test description for translation feature.': 'Dies ist eine Testbeschreibung für die Übersetzungsfunktion.',
    '$50-$100': '$50-$100'
  },
  fr: {
    'Test Translation Product': 'Produit de test de traduction',
    'Test Category': 'Catégorie de test',
    'This is a test description for translation feature.': 'Ceci est une description de test pour la fonction de traduction.',
    '$50-$100': '$50-$100'
  },
  it: {
    'Test Translation Product': 'Prodotto di prova di traduzione',
    'Test Category': 'Categoria di prova',
    'This is a test description for translation feature.': 'Questa è una descrizione di prova per la funzione di traduzione.',
    '$50-$100': '$50-$100'
  }
};

const translationCache = {};
const TRANSLATION_CACHE_FILE = path.join(__dirname, 'translation-cache.json');
let translationDisabled = false;

(function loadTranslationCache() {
  try {
    if (fs.existsSync(TRANSLATION_CACHE_FILE)) {
      const data = JSON.parse(fs.readFileSync(TRANSLATION_CACHE_FILE, 'utf8'));
      Object.assign(translationCache, data);
      console.log(`Loaded ${Object.keys(translationCache).length} cached translations`);
    }
  } catch (e) {
    console.warn('Failed to load translation cache file:', e.message);
  }
})();

function persistTranslationCache() {
  try {
    fs.writeFileSync(TRANSLATION_CACHE_FILE, JSON.stringify(translationCache));
  } catch (e) {
    console.warn('Failed to persist translation cache:', e.message);
  }
}

function isMyMemoryLimitResponse(data) {
  if (!data) return false;
  const details = (data.responseDetails || '').toString().toUpperCase();
  const status = data.responseStatus;
  const text = (data.responseData && data.responseData.translatedText || '').toString().toUpperCase();
  if (details.indexOf('MYMEMORY WARNING') !== -1) return true;
  if (text.indexOf('MYMEMORY WARNING') !== -1) return true;
  if (text.indexOf('YOU USED ALL AVAILABLE FREE TRANSLATIONS') !== -1) return true;
  if (status === 429 || status === 403) return true;
  return false;
}

async function translateText(text, targetLang) {
  if (!text || !targetLang || targetLang === 'en') return text;

  const cacheKey = `${targetLang}::${text}`;
  if (translationCache[cacheKey]) {
    return translationCache[cacheKey];
  }

  const publicTranslation = await getPublicTranslation(text, targetLang);
  if (publicTranslation) {
    translationCache[cacheKey] = publicTranslation;
    return publicTranslation;
  }

  if (DEMO_TRANSLATIONS[targetLang] && DEMO_TRANSLATIONS[targetLang][text]) {
    translationCache[cacheKey] = DEMO_TRANSLATIONS[targetLang][text];
    return translationCache[cacheKey];
  }

  if (translationDisabled) {
    return text;
  }

  const langMap = {
    'zh': 'zh',
    'ru': 'ru',
    'es': 'es',
    'de': 'de',
    'fr': 'fr',
    'it': 'it'
  };

  const tl = langMap[targetLang] || targetLang;

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|${tl}`;
    const response = await fetch(url);
    const data = await response.json();

    if (isMyMemoryLimitResponse(data)) {
      console.warn('MyMemory translation limit reached, switching to original-text mode');
      translationDisabled = true;
      return text;
    }

    if (data && data.responseData && data.responseData.translatedText) {
      translationCache[cacheKey] = data.responseData.translatedText;
      persistTranslationCache();
      return translationCache[cacheKey];
    }
    return text;
  } catch (error) {
    console.warn('Translation service unavailable for', targetLang, '- using original text');
    return text;
  }
}

function isMyMemoryWarningText(text) {
  if (!text || typeof text !== 'string') return false;
  const upper = text.toUpperCase();
  return upper.indexOf('MYMEMORY WARNING') !== -1 ||
         upper.indexOf('YOU USED ALL AVAILABLE FREE TRANSLATIONS') !== -1;
}

function sanitizeTranslation(value) {
  if (!value || typeof value !== 'string') return value;
  return isMyMemoryWarningText(value) ? null : value;
}

function cleanProductTranslations(product) {
  if (!product.translations) return product;
  let cleaned = false;
  for (const lang of Object.keys(product.translations)) {
    const langTrans = product.translations[lang];
    if (!langTrans) continue;
    for (const field of ['name', 'description', 'specifications', 'price_range', 'category']) {
      if (langTrans[field] && isMyMemoryWarningText(langTrans[field])) {
        delete langTrans[field];
        cleaned = true;
      }
    }
    const remaining = Object.keys(langTrans).filter(k => langTrans[k]);
    if (remaining.length === 0) {
      delete product.translations[lang];
      cleaned = true;
    }
  }
  if (cleaned) {
    console.log(`Cleaned MyMemory warning text from product ${product.id} translations`);
  }
  return product;
}

async function translateProduct(product) {
  const translations = {};

  for (const lang of SUPPORTED_LANGS) {
    translations[lang] = {};

    if (product.name) {
      translations[lang].name = await translateText(product.name, lang);
    }
    if (product.description) {
      translations[lang].description = await translateText(product.description, lang);
    }
    if (product.specifications) {
      translations[lang].specifications = await translateText(product.specifications, lang);
    }
    if (product.price_range) {
      translations[lang].price_range = await translateText(product.price_range, lang);
    }
    if (product.category) {
      translations[lang].category = await translateText(product.category, lang);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return translations;
}

async function initDefaultCategories() {
  if (!db.categories) db.categories = [];

  // Only initialize default categories on first run (when categories table is empty).
  // This prevents re-adding categories that the user has intentionally deleted.
  if (db.categories.length > 0) {
    return;
  }

  const categoryList = {
    biotech: ['Tube Thawing Machine', 'Bag Thawing Machine', 'Cryobag Thawing Machine', 'Portable Thawing Device', 'Programmable Freezer', 'Programmable Cooling Box', 'Cell Cryobag', 'Stem Cell Cryobag', 'Immune Cell Cryobag', 'Liquid Nitrogen Tank', 'Ice-Free Workstation', 'Ice-Free Freezer', 'Tube Block', 'Dry Ice Transport Box', 'Ice Tray'],
    autoparts: ['Roller Chain', 'Brake Disc', 'Timing Chain', 'Wheel Hub', 'Clutch Assembly', 'Suspension Components'],
    instruments: ['Coating Thickness Gauge', 'Ultrasonic Thickness Gauge', 'Conductivity Meter', 'Hardness Tester', 'Pressure Gauge', 'Surface Roughness Tester']
  };

  if (usingSupabase && supabase) {
    try {
      const { data: existingCategories, error: selectError } = await supabase.from('categories').select('*');
      
      if (selectError) {
        console.error('Failed to select categories:', selectError);
        return;
      }

      // If Supabase already has categories, don't re-initialize
      if (existingCategories && existingCategories.length > 0) {
        console.log(`Categories already exist (${existingCategories.length}), skipping initialization`);
        return;
      }

      let sortOrder = 0;
      for (const [industry, names] of Object.entries(categoryList)) {
        for (const name of names) {
          await supabase.from('categories').insert([{
            name,
            industry,
            sort_order: sortOrder++
          }]);
        }
      }
      
      console.log('Categories initialized with English names');
    } catch (error) {
      console.error('Error in initDefaultCategories:', error);
    }
  } else {
    let sortOrder = 0;

    for (const [industry, names] of Object.entries(categoryList)) {
      for (const name of names) {
        db.categories.push({
          id: db.nextCategoryId++,
          name,
          industry,
          sort_order: sortOrder++,
          created_at: new Date().toISOString()
        });
      }
    }

    if (db.categories.length > 0) {
      await saveDB();
      console.log(`Initialized ${db.categories.length} categories`);
    }
  }
}

async function getUsers() {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('users').select('*');
    return data || [];
  }
  return db.users;
}

async function getUserByUsername(username) {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('users').select('*').eq('username', username).limit(1);
      console.log('getUserByUsername query:', username);
      console.log('Query error:', error);
      console.log('Query data:', data);
      if (error) {
        console.error('Supabase query failed, falling back to JSON:', error);
        usingSupabase = false;
        db = loadDB();
        return db.users.find(u => u.username === username);
      }
      return data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
      return db.users.find(u => u.username === username);
    }
  }
  return db.users.find(u => u.username === username);
}

async function getProducts(query = {}) {
  if (usingSupabase && supabase) {
    try {
      let q = supabase.from('products').select('*');
      if (query.industry) q = q.eq('industry', query.industry);
      if (query.category) q = q.eq('category', query.category);
      const { data, error } = await q.order('sort_order', { ascending: true });
      if (error) {
        console.error('Supabase products query failed:', error);
        throw error;
      }
      if (!data || data.length === 0) {
        console.log('Supabase products empty, falling back to JSON');
        usingSupabase = false;
        db = loadDB();
      } else {
        return data;
      }
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  let items = db.products.slice();
  if (query.industry) items = items.filter(p => p.industry === query.industry);
  if (query.category) items = items.filter(p => p.category === query.category);
  items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return items;
}

async function getProductById(id) {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('products').select('*').eq('id', parseInt(id)).limit(1);
      if (error) {
        console.error('Supabase product query failed:', error);
        throw error;
      }
      return data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  return db.products.find(p => p.id === parseInt(id));
}

async function createProduct(product) {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('products').insert([product]).select();
      if (error) {
        console.error('Supabase product insert failed:', error);
        throw error;
      }
      await saveDB();
      return data && data[0] ? data[0] : product;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  if (product.sort_order === undefined) {
    const maxOrder = db.products.length > 0 ? Math.max(...db.products.map(p => p.sort_order || 0)) : 0;
    product.sort_order = maxOrder + 1;
  }
  db.products.push(product);
  await reorganizeProductSortOrder();
  return product;
}

async function updateProduct(id, updates) {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('products').update(updates).eq('id', parseInt(id)).select();
      if (error) {
        console.error('Supabase product update failed:', error);
        throw error;
      }
      await saveDB();
      return data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  const idx = db.products.findIndex(p => p.id === parseInt(id));
  if (idx !== -1) {
    db.products[idx] = { ...db.products[idx], ...updates };
    await saveDB();
  }
  return db.products[idx];
}

async function deleteProduct(id) {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('products').delete().eq('id', parseInt(id)).select();
      if (error) {
        console.error('Supabase product delete failed:', error);
        throw error;
      }
      await reorganizeProductSortOrder();
      await saveDB();
      return data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  const idx = db.products.findIndex(p => p.id === parseInt(id));
  if (idx !== -1) {
    const result = db.products.splice(idx, 1)[0];
    await reorganizeProductSortOrder();
    await saveDB();
    return result;
  }
  return null;
}

async function reorganizeProductSortOrder() {
  const products = await getProducts({});
  products.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  let changed = false;
  for (let i = 0; i < products.length; i++) {
    if (products[i].sort_order !== i) {
      products[i].sort_order = i;
      changed = true;
      if (usingSupabase && supabase) {
        await supabase.from('products').update({ sort_order: i }).eq('id', products[i].id);
      }
    }
  }
  
  if (changed) {
    await saveDB();
    console.log('Reorganized product sort_order');
  }
}

async function getPublicPhrases(query = {}) {
  if (usingSupabase && supabase) {
    try {
      let q = supabase.from('public_phrases').select('*');
      if (query.search) {
        const searchTerm = `%${query.search}%`;
        q = q.or(`key.ilike.${searchTerm},original_text.ilike.${searchTerm}`);
      }
      const { data, error } = await q.order('id', { ascending: false });
      if (error) {
        console.error('Supabase public_phrases query failed:', error);
        throw error;
      }
      return data || [];
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  let items = db.public_phrases || [];
  if (query.search) {
    const searchTerm = query.search.toLowerCase();
    items = items.filter(p => 
      p.key.toLowerCase().includes(searchTerm) || 
      (p.original_text && p.original_text.toLowerCase().includes(searchTerm))
    );
  }
  return items.slice().reverse();
}

async function getPublicPhraseByKey(key) {
  if (!key) return null;
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('public_phrases').select('*').eq('key', key).limit(1);
      if (error) {
        console.error('Supabase public_phrases query failed:', error);
        throw error;
      }
      return data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  return db.public_phrases.find(p => p.key === key);
}

async function getPublicPhraseById(id) {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('public_phrases').select('*').eq('id', parseInt(id)).limit(1);
      if (error) {
        console.error('Supabase public_phrases query by id failed:', error);
        throw error;
      }
      return data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  return db.public_phrases.find(p => p.id === parseInt(id));
}

async function createPublicPhrase(phrase) {
  if (!phrase.key) {
    throw new Error('Key is required');
  }
  phrase.translations = phrase.translations || {};
  
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('public_phrases').insert([phrase]).select();
      if (error) {
        console.error('Supabase public_phrases insert failed:', error);
        throw error;
      }
      await saveDB();
      return data && data[0] ? data[0] : phrase;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  const existing = db.public_phrases.find(p => p.key === phrase.key);
  if (existing) {
    throw new Error('Phrase with this key already exists');
  }
  phrase.id = db.nextPhraseId++;
  phrase.created_at = new Date().toISOString();
  phrase.updated_at = new Date().toISOString();
  db.public_phrases.push(phrase);
  await saveDB();
  return phrase;
}

async function updatePublicPhrase(id, updates) {
  let phrase = null;
  if (usingSupabase && supabase) {
    try {
      const { data: existingData, error: fetchError } = await supabase.from('public_phrases').select('*').eq('id', parseInt(id)).limit(1);
      if (fetchError) {
        console.error('Supabase public_phrases fetch failed:', fetchError);
        throw fetchError;
      }
      if (!existingData || existingData.length === 0) {
        return null;
      }
      
      const existing = existingData[0];
      const existingTranslations = typeof existing.translations === 'string' 
        ? JSON.parse(existing.translations) 
        : (existing.translations || {});
      
      if (updates.translations) {
        updates.translations = { ...existingTranslations, ...updates.translations };
      }
      
      updates.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase.from('public_phrases').update(updates).eq('id', parseInt(id)).select();
      if (error) {
        console.error('Supabase public_phrases update failed:', error);
        throw error;
      }
      await saveDB();
      phrase = data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  if (!phrase) {
    const idx = db.public_phrases.findIndex(p => p.id === parseInt(id));
    if (idx !== -1) {
      const existingTranslations = db.public_phrases[idx].translations || {};
      if (updates.translations) {
        updates.translations = { ...existingTranslations, ...updates.translations };
      }
      db.public_phrases[idx] = { 
        ...db.public_phrases[idx], 
        ...updates, 
        updated_at: new Date().toISOString() 
      };
      await saveDB();
      phrase = db.public_phrases[idx];
    }
  }
  
  if (phrase) {
    const key = phrase.key || '';
    for (const cacheKey of Object.keys(translationCache)) {
      if (cacheKey.includes(`::${key}`)) {
        delete translationCache[cacheKey];
      }
    }
    persistTranslationCache();
  }
  
  return phrase;
}

async function deletePublicPhrase(id) {
  let phrase = null;
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('public_phrases').delete().eq('id', parseInt(id)).select();
      if (error) {
        console.error('Supabase public_phrases delete failed:', error);
        throw error;
      }
      await saveDB();
      phrase = data && data[0] ? data[0] : null;
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  if (!phrase) {
    const idx = db.public_phrases.findIndex(p => p.id === parseInt(id));
    if (idx !== -1) {
      phrase = db.public_phrases.splice(idx, 1)[0];
      await saveDB();
    }
  }
  
  if (phrase) {
    const key = phrase.key || '';
    for (const cacheKey of Object.keys(translationCache)) {
      if (cacheKey.includes(`::${key}`)) {
        delete translationCache[cacheKey];
      }
    }
    persistTranslationCache();
  }
  
  return phrase;
}

async function clearPublicPhrases() {
  if (usingSupabase && supabase) {
    try {
      const { error } = await supabase.from('public_phrases').delete().neq('id', 0);
      if (error) {
        console.error('Supabase public_phrases truncate failed:', error);
        throw error;
      }
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  db.public_phrases = [];
  await saveDB();
  Object.keys(translationCache).forEach(key => delete translationCache[key]);
  persistTranslationCache();
  return { success: true, message: 'All public phrases deleted successfully.' };
}

async function getPublicTranslation(key, lang) {
  if (!key || lang === 'en') return null;
  
  let phrase = await getPublicPhraseByKey(key);
  if (phrase && phrase.translations && phrase.translations[lang]) {
    return phrase.translations[lang];
  }
  
  return null;
}

// ========== NEWS CRUD ==========
async function getNews(query = {}) {
  let data = [...db.news];
  if (query.industry) {
    data = data.filter(n => n.industry === query.industry);
  }
  if (query.published !== undefined) {
    data = data.filter(n => n.published === (query.published === 'true'));
  }
  return data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

async function getNewsById(id) {
  return db.news.find(n => n.id === parseInt(id)) || null;
}

async function createNews(news) {
  const maxId = db.news.reduce((max, n) => Math.max(max, n.id || 0), 0);
  news.id = maxId + 1;
  news.created_at = new Date().toISOString();
  news.sort_order = news.sort_order || db.news.length;
  db.news.push(news);
  await saveDB();
  return news;
}

async function updateNews(id, updates) {
  const idx = db.news.findIndex(n => n.id === parseInt(id));
  if (idx !== -1) {
    db.news[idx] = { ...db.news[idx], ...updates };
    await saveDB();
    return db.news[idx];
  }
  return null;
}

async function deleteNews(id) {
  const idx = db.news.findIndex(n => n.id === parseInt(id));
  if (idx !== -1) {
    const news = db.news.splice(idx, 1)[0];
    await saveDB();
    return news;
  }
  return null;
}

// ========== CASE STUDIES CRUD ==========
async function getCaseStudies(query = {}) {
  let data = [...db.case_studies];
  if (query.industry) {
    data = data.filter(c => c.industry === query.industry);
  }
  if (query.published !== undefined) {
    data = data.filter(c => c.published === (query.published === 'true'));
  }
  return data.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

async function getCaseStudyById(id) {
  return db.case_studies.find(c => c.id === parseInt(id)) || null;
}

async function createCaseStudy(caseStudy) {
  const maxId = db.case_studies.reduce((max, c) => Math.max(max, c.id || 0), 0);
  caseStudy.id = maxId + 1;
  caseStudy.created_at = new Date().toISOString();
  caseStudy.sort_order = caseStudy.sort_order || db.case_studies.length;
  db.case_studies.push(caseStudy);
  await saveDB();
  return caseStudy;
}

async function updateCaseStudy(id, updates) {
  const idx = db.case_studies.findIndex(c => c.id === parseInt(id));
  if (idx !== -1) {
    db.case_studies[idx] = { ...db.case_studies[idx], ...updates };
    await saveDB();
    return db.case_studies[idx];
  }
  return null;
}

async function deleteCaseStudy(id) {
  const idx = db.case_studies.findIndex(c => c.id === parseInt(id));
  if (idx !== -1) {
    const caseStudy = db.case_studies.splice(idx, 1)[0];
    await saveDB();
    return caseStudy;
  }
  return null;
}

async function getSiteSettings() {
  if (usingSupabase && supabase) {
    try {
      const { data, error } = await supabase.from('site_settings').select('*').limit(1);
      if (error) {
        console.error('Supabase site_settings query failed:', error);
        throw error;
      }
      if (data && data[0]) {
        return data[0];
      }
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  return db.site_settings || {};
}

async function updateSiteSettings(settings) {
  const now = new Date().toISOString();
  settings.updated_at = now;
  
  if (usingSupabase && supabase) {
    try {
      const { data: existingData } = await supabase.from('site_settings').select('id').limit(1);
      if (existingData && existingData[0]) {
        const { data, error } = await supabase.from('site_settings').update(settings).eq('id', existingData[0].id).select();
        if (error) {
          console.error('Supabase site_settings update failed:', error);
          throw error;
        }
        await saveDB();
        return data && data[0] ? data[0] : settings;
      } else {
        settings.created_at = now;
        const { data, error } = await supabase.from('site_settings').insert([settings]).select();
        if (error) {
          console.error('Supabase site_settings insert failed:', error);
          throw error;
        }
        await saveDB();
        return data && data[0] ? data[0] : settings;
      }
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  
  db.site_settings = settings;
  await saveDB();
  return settings;
}

async function getCategories(query = {}) {
  if (usingSupabase && supabase) {
    try {
      let q = supabase.from('categories').select('*');
      if (query.industry) q = q.eq('industry', query.industry);
      const { data, error } = await q.order('sort_order', { ascending: true });
      if (error) {
        console.error('Supabase categories query failed:', error);
        throw error;
      }
      if (!data || data.length === 0) {
        console.log('Supabase categories empty, falling back to JSON');
        usingSupabase = false;
        db = loadDB();
      } else {
        return data;
      }
    } catch (err) {
      console.error('Supabase connection error, falling back to JSON:', err);
      usingSupabase = false;
      db = loadDB();
    }
  }
  let items = db.categories || [];
  if (query.industry) items = items.filter(c => c.industry === query.industry);
  items.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  return items;
}

async function getCategoryById(id) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('categories').select('*').eq('id', parseInt(id)).limit(1);
    return data && data[0] ? data[0] : null;
  }
  return db.categories.find(c => c.id === parseInt(id));
}

async function createCategory(category) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('categories').insert([category]).select();
    return data && data[0] ? data[0] : category;
  }
  if (!db.categories) db.categories = [];
  if (category.sort_order === undefined) {
    category.sort_order = db.categories.length;
  }
  db.categories.push(category);
  await saveDB();
  return category;
}

async function updateCategory(id, updates) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('categories').update(updates).eq('id', parseInt(id)).select();
    return data && data[0] ? data[0] : null;
  }
  const idx = db.categories.findIndex(c => c.id === parseInt(id));
  if (idx !== -1) {
    db.categories[idx] = { ...db.categories[idx], ...updates };
    await saveDB();
  }
  return db.categories[idx];
}

async function deleteCategory(id) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('categories').delete().eq('id', parseInt(id)).select();
    return data && data[0] ? data[0] : null;
  }
  const idx = db.categories.findIndex(c => c.id === parseInt(id));
  if (idx !== -1) {
    const result = db.categories.splice(idx, 1)[0];
    await saveDB();
    return result;
  }
  return null;
}

async function getInquiries() {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('inquiries').select('*').order('id', { ascending: false });
    return data || [];
  }
  return db.inquiries.slice().reverse();
}

async function createInquiry(inquiry) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('inquiries').insert([inquiry]).select();
    return data && data[0] ? data[0] : inquiry;
  }
  db.inquiries.push(inquiry);
  return inquiry;
}

async function sendInquiryNotification(inquiry) {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.warn('[SMTP Warning] SMTP_USER or SMTP_PASS not configured in .env. Email notifications will not be sent.');
      return;
    }
    
    const settings = await getSiteSettings();
    const adminEmail = settings.company_email || 'admin@example.com';
    
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const mailOptions = {
      from: inquiry.email,
      to: adminEmail,
      subject: `New Inquiry - ${inquiry.product_name || 'General'}`,
      html: `
        <h2>New Inquiry Received</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Name:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.name}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Email:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.email}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Company:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.company || '-'}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>WhatsApp:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.whatsapp || '-'}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Product:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.product_name || '-'}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Quantity:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.quantity || '-'}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Message:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.message || '-'}</td></tr>
          <tr><td style="border: 1px solid #ccc; padding: 8px;"><strong>Source:</strong></td><td style="border: 1px solid #ccc; padding: 8px;">${inquiry.source_page || '-'}</td></tr>
        </table>
      `
    };
    
    await transporter.sendMail(mailOptions);
    console.log('Inquiry notification email sent successfully');
  } catch (error) {
    console.error('Failed to send inquiry notification:', error);
  }
}

async function getVisitsBySession(sessionId) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('visits').select('*').eq('session_id', sessionId);
    return data || [];
  }
  return db.visits.filter(v => v.session_id === sessionId);
}

async function createVisit(visit) {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('visits').insert([visit]).select();
    return data && data[0] ? data[0] : visit;
  }
  db.visits.push(visit);
  return visit;
}

async function getAllVisits() {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('visits').select('*');
    return data || [];
  }
  return db.visits;
}

async function getAllInquiries() {
  if (usingSupabase && supabase) {
    const { data } = await supabase.from('inquiries').select('*');
    return data || [];
  }
  return db.inquiries;
}

const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

app.use(cors({
  origin: ['http://localhost:8080', 'http://127.0.0.1:8080', 'http://localhost:8000', 'http://127.0.0.1:8000'],
  credentials: true
}));
app.use(express.json());
app.use(express.static(__dirname));
app.use('/uploads', express.static(uploadDir, {
  maxAge: '1y',
  etag: false,
  headers: {
    'Cache-Control': 'public, max-age=31536000, immutable',
    'Access-Control-Allow-Origin': '*'
  }
}));

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token.' });
    }
    req.user = user;
    next();
  });
}

function getDeviceType(userAgent) {
  if (/mobile/i.test(userAgent)) return 'mobile';
  if (/tablet/i.test(userAgent)) return 'tablet';
  return 'desktop';
}

function getCountryFromIP(ip) {
  if (!ip || ip === 'unknown') return 'Unknown';
  const countries = ['US', 'UK', 'DE', 'FR', 'JP', 'CN', 'AU', 'BR', 'CA', 'EU'];
  const hash = ip.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  return countries[hash % countries.length];
}

app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  console.log('Login attempt for:', username);
  const user = await getUserByUsername(username);
  console.log('Found user:', user ? 'Yes' : 'No');
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const isValid = bcrypt.compareSync(password, user.password);
  console.log('Password valid:', isValid);

  if (!isValid) {
    return res.status(401).json({ error: 'Invalid username or password.' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ success: true, token, user: { id: user.id, username: user.username } });
});

app.post('/api/track', async (req, res) => {
  const { visitor_id, session_id, page_url, page_title, referrer, duration, is_new, search_keyword, traffic_source, device_type } = req.body;
  const ip = req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const detectedDeviceType = device_type || getDeviceType(userAgent);
  const country = getCountryFromIP(ip);

  try {
    await createVisit({
      visitor_id: visitor_id || '',
      session_id: session_id || '',
      page_url: page_url || '',
      page_title: page_title || '',
      referrer: referrer || '',
      country,
      ip,
      user_agent: userAgent,
      device_type: detectedDeviceType,
      duration: duration || 0,
      is_new: is_new ? 1 : 0,
      search_keyword: search_keyword || '',
      traffic_source: traffic_source || '',
      created_at: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Track error:', error);
    res.json({ success: true });
  }
});

app.post('/api/track-product', async (req, res) => {
  const { visitor_id, session_id, product_id, product_name, page_url } = req.body;
  const ip = req.ip || (req.headers['x-forwarded-for'] || '').split(',')[0] || 'unknown';
  const userAgent = req.headers['user-agent'] || '';
  const deviceType = getDeviceType(userAgent);
  const country = getCountryFromIP(ip);

  try {
    await createVisit({
      visitor_id: visitor_id || '',
      session_id: session_id || '',
      page_url: page_url || '',
      page_title: `Product View: ${product_name || ''}`,
      referrer: '',
      country,
      ip,
      user_agent: userAgent,
      device_type: deviceType,
      duration: 0,
      is_new: 0,
      search_keyword: '',
      traffic_source: '',
      product_id: product_id || '',
      product_name: product_name || '',
      event_type: 'product_view',
      created_at: new Date().toISOString()
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Product track error:', error);
    res.json({ success: true });
  }
});

app.post('/api/track-duration', async (req, res) => {
  const { visitor_id, session_id, page_url, duration } = req.body;
  
  try {
    const allVisits = await getAllVisits();
    const latestVisit = allVisits
      .filter(v => v.session_id === session_id && v.page_url === page_url)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
    
    if (latestVisit) {
      if (usingSupabase && supabase) {
        await supabase.from('visits').update({ duration: duration }).eq('id', latestVisit.id);
      } else {
        const idx = db.visits.findIndex(v => v.id === latestVisit.id);
        if (idx !== -1) {
          db.visits[idx].duration = duration;
          await saveDB();
        }
      }
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Duration track error:', error);
    res.json({ success: true });
  }
});

app.post('/api/inquiry', async (req, res) => {
  const { name, email, phone, company, industry, product, product_id, quantity, message, source_page, source_department, session_id, visitor_id } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  const inquiry = {
    name, email, phone: phone || '', company: company || '',
    industry: industry || '', product: product || '',
    product_id: product_id || null, quantity: quantity || '',
    message, source_page: source_page || '', source_department: source_department || '',
    session_id: session_id || '', visitor_id: visitor_id || '',
    created_at: new Date().toISOString()
  };

  await createInquiry(inquiry);
  sendInquiryNotification(inquiry);

  res.json({ success: true, message: 'Thank you for your inquiry! We will contact you within 24 hours.' });
});

app.post('/api/inquiries', upload.single('attachment'), async (req, res) => {
  const { name, email, company, whatsapp, quantity, message, product_id, product_name, source_page, source_department } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  let attachment_url = null;
  if (req.file) {
    const filePath = path.join(uploadDir, req.file.filename);
    const fileContent = fs.readFileSync(filePath);
    const randomSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const filename = `attachment_${Date.now()}_${randomSuffix}${path.extname(req.file.originalname)}`;
    
    try {
      attachment_url = await imageStorage.upload(fileContent, filename, req.file.mimetype);
    } catch (error) {
      console.error('Attachment upload failed:', error);
      attachment_url = `/uploads/${filename}`;
      fs.writeFileSync(filePath, fileContent);
    }
    
    fs.unlinkSync(path.join(uploadDir, req.file.filename));
  }

  const inquiry = {
    name, email, phone: whatsapp || '', company: company || '',
    industry: '', product: product_name || '',
    message: message || '', source_page: source_page || '',
    product_id: product_id || '', product_name: product_name || '',
    quantity: quantity || '', attachment_url: attachment_url || '',
    source_department: source_department || '',
    created_at: new Date().toISOString()
  };

  await createInquiry(inquiry);
  sendInquiryNotification(inquiry);

  res.json({ success: true, message: 'Thank you for your inquiry! We will contact you within 24 hours.' });
});

app.get('/api/inquiries', authenticateToken, async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const allItems = await getInquiries();

  const allVisits = await getAllVisits();

  const itemsWithVisits = allItems.map(inquiry => {
    const sessionVisits = allVisits.filter(v => v.session_id === inquiry.session_id);
    
    const visitorVisits = inquiry.visitor_id 
      ? allVisits.filter(v => v.visitor_id === inquiry.visitor_id)
      : [];

    const country = sessionVisits.length > 0 ? sessionVisits[0].country : 'Unknown';
    const ip = sessionVisits.length > 0 ? sessionVisits[0].ip : 'Unknown';
    const deviceType = sessionVisits.length > 0 ? sessionVisits[0].device_type : 'Unknown';

    const pagesVisited = sessionVisits.map(v => ({
      url: v.page_url,
      title: v.page_title,
      duration: v.duration,
      time: v.created_at,
      traffic_source: v.traffic_source
    })).sort((a, b) => new Date(a.time) - new Date(b.time));

    const productsViewed = visitorVisits
      .filter(v => v.event_type === 'product_view' && v.product_id)
      .map(v => ({
        product_id: v.product_id,
        product_name: v.product_name,
        time: v.created_at
      })).sort((a, b) => new Date(b.time) - new Date(a.time));

    const totalDuration = sessionVisits.reduce((sum, v) => sum + (v.duration || 0), 0);

    const firstVisit = sessionVisits.length > 0
      ? sessionVisits.reduce((earliest, v) =>
          new Date(v.created_at) < new Date(earliest.created_at) ? v : earliest
        ).created_at
      : null;

    const referrer = sessionVisits.length > 0
      ? sessionVisits.find(v => v.referrer)?.referrer || ''
      : inquiry.source_page || '';

    const trafficSource = sessionVisits.length > 0
      ? sessionVisits.find(v => v.traffic_source)?.traffic_source || ''
      : '';

    const searchKeywords = [...new Set(sessionVisits.filter(v => v.search_keyword).map(v => v.search_keyword))];

    const visitCount = visitorVisits.length > 0 ? visitorVisits.length : sessionVisits.length;
    const firstVisitOverall = visitorVisits.length > 0
      ? visitorVisits.reduce((earliest, v) =>
          new Date(v.created_at) < new Date(earliest.created_at) ? v : earliest
        ).created_at
      : firstVisit;

    return {
      ...inquiry,
      country,
      ip,
      device_type: deviceType,
      pages_visited: pagesVisited,
      products_viewed: productsViewed,
      total_duration: totalDuration,
      first_visit: firstVisit,
      first_visit_overall: firstVisitOverall,
      referrer,
      traffic_source: trafficSource,
      search_keywords: searchKeywords,
      visit_count: visitCount,
      visitor_id: inquiry.visitor_id
    };
  });

  const start = (parseInt(page) - 1) * parseInt(limit);
  const items = itemsWithVisits.slice(start, start + parseInt(limit));
  const total = itemsWithVisits.length;

  res.json({
    success: true,
    data: items,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalItems: total
    }
  });
});

async function applyTranslation(product, lang) {
  if (!lang || lang === 'en') {
    return product;
  }

  const translated = { ...product };

  if (product.translations && product.translations[lang]) {
    const langTranslations = product.translations[lang];
    if (langTranslations.name && !isMyMemoryWarningText(langTranslations.name)) translated.name = langTranslations.name;
    if (langTranslations.description && !isMyMemoryWarningText(langTranslations.description)) translated.description = langTranslations.description;
    if (langTranslations.specifications && !isMyMemoryWarningText(langTranslations.specifications)) translated.specifications = langTranslations.specifications;
    if (langTranslations.price_range && !isMyMemoryWarningText(langTranslations.price_range)) translated.price_range = langTranslations.price_range;
    if (langTranslations.category && !isMyMemoryWarningText(langTranslations.category)) translated.category = langTranslations.category;
  } else {
    if (product.name) translated.name = await translateText(product.name, lang);
    if (product.description) translated.description = await translateText(product.description, lang);
    if (product.specifications) translated.specifications = await translateText(product.specifications, lang);
    if (product.price_range) translated.price_range = await translateText(product.price_range, lang);
    if (product.category) translated.category = await translateText(product.category, lang);
  }

  return translated;
}

function validateImageUrl(image_url) {
  if (!image_url) return null;
  
  if (image_url.startsWith('http://') || image_url.startsWith('https://')) {
    return image_url;
  }
  
  if (image_url.startsWith('/')) {
    const filePath = path.join(__dirname, image_url);
    if (fs.existsSync(filePath)) {
      return image_url;
    }
    console.warn(`Image file not found: ${filePath}`);
    return null;
  }
  
  return null;
}

app.get('/api/products', async (req, res) => {
  const { industry, category, page = 1, limit = 20, lang = 'en' } = req.query;
  const allItems = await getProducts({ industry, category });
  const start = (parseInt(page) - 1) * parseInt(limit);
  const paged = allItems.slice(start, start + parseInt(limit));
  
  const translated = await Promise.all(paged.map(async (product) => {
    const result = await applyTranslation(product, lang);
    result.image_url = validateImageUrl(product.image_url);
    return result;
  }));

  res.json({
    success: true,
    data: translated,
    pagination: {
      currentPage: parseInt(page),
      totalPages: Math.ceil(allItems.length / limit),
      totalItems: allItems.length
    }
  });
});

app.get('/api/products/:id', async (req, res) => {
  const { lang = 'en' } = req.query;
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });
  
  const translated = await applyTranslation(product, lang);
  translated.image_url = validateImageUrl(product.image_url);
  res.json({ success: true, data: translated });
});

const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || 'supabase';
const STORAGE_BUCKET = process.env.STORAGE_BUCKET || 'product-images';

const imageStorage = {
  async upload(fileBuffer, filename, contentType, options = {}) {
    if (STORAGE_PROVIDER === 'cloudflare-r2') {
      return this.uploadToCloudflareR2(fileBuffer, filename, contentType, options);
    }
    return this.uploadToSupabase(fileBuffer, filename, contentType, options);
  },

  async uploadToSupabase(fileBuffer, filename, contentType, options = {}) {
    if (!usingSupabase || !supabase) {
      throw new Error('Supabase not available');
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(`products/${filename}`, fileBuffer, {
        contentType: contentType,
        upsert: options.upsert || true
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data: urlData } = await supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(`products/${filename}`);

    if (urlData && urlData.publicUrl) {
      return urlData.publicUrl;
    }

    throw new Error('Failed to get public URL');
  },

  async uploadToCloudflareR2(fileBuffer, filename, contentType, options = {}) {
    throw new Error('Cloudflare R2 not configured. Set STORAGE_PROVIDER=cloudflare-r2 and configure R2 credentials.');
  },

  async delete(filename) {
    if (STORAGE_PROVIDER === 'cloudflare-r2') {
      return this.deleteFromCloudflareR2(filename);
    }
    return this.deleteFromSupabase(filename);
  },

  async deleteFromSupabase(filename) {
    if (!usingSupabase || !supabase) {
      throw new Error('Supabase not available');
    }

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove([`products/${filename}`]);

    if (error) {
      throw error;
    }

    return true;
  },

  async deleteFromCloudflareR2(filename) {
    throw new Error('Cloudflare R2 not configured. Set STORAGE_PROVIDER=cloudflare-r2 and configure R2 credentials.');
  }
};

async function processAndUploadImage(imageData) {
  if (!imageData || !imageData.startsWith('data:image/')) {
    return null;
  }

  const matches = imageData.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!matches || matches.length !== 3) {
    return null;
  }

  const ext = matches[1];
  const allowedExts = ['jpeg', 'jpg', 'png', 'webp'];
  if (!allowedExts.includes(ext.toLowerCase())) {
    console.error('Unsupported image format:', ext);
    return null;
  }

  const base64Data = matches[2];
  let buffer = Buffer.from(base64Data, 'base64');
  const maxDimension = 1920;
  const maxFileSize = 800 * 1024;

  try {
    const metadata = await sharp(buffer).metadata();
    let width = metadata.width || 1920;
    let height = metadata.height || 1920;

    let resizeWidth = width;
    let resizeHeight = height;

    if (width > maxDimension || height > maxDimension) {
      if (width > height) {
        resizeWidth = maxDimension;
        resizeHeight = Math.round((height * maxDimension) / width);
      } else {
        resizeHeight = maxDimension;
        resizeWidth = Math.round((width * maxDimension) / height);
      }
    }

    buffer = await sharp(buffer)
      .resize(resizeWidth, resizeHeight, {
        fit: sharp.fit.contain,
        background: { r: 248, g: 249, b: 250, alpha: 1 }
      })
      .webp({ quality: 85 })
      .toBuffer();

    if (buffer.length > maxFileSize) {
      let quality = 80;
      while (buffer.length > maxFileSize && quality > 20) {
        quality -= 5;
        buffer = await sharp(buffer)
          .webp({ quality: quality })
          .toBuffer();
      }
    }

    console.log('Image processed successfully, size:', buffer.length, 'bytes');
  } catch (err) {
    console.error('Image processing failed, using original:', err);
  }

  const randomSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const filename = `product_${Date.now()}_${randomSuffix}.webp`;
  const contentType = 'image/webp';

  try {
    const url = await imageStorage.upload(buffer, filename, contentType);
    console.log('Image uploaded to storage:', url);
    return url;
  } catch (uploadError) {
    console.error('Storage upload failed:', uploadError);
  }

  if (process.env.NODE_ENV !== 'production') {
    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  }

  return null;
}

app.post('/api/upload-editor-image', authenticateToken, async (req, res) => {
  try {
    const { image_data } = req.body;
    if (!image_data || !image_data.startsWith('data:image/')) {
      return res.status(400).json({ success: false, error: 'Invalid image data' });
    }

    const url = await processAndUploadImage(image_data);
    if (url) {
      res.json({ success: true, url });
    } else {
      res.status(500).json({ success: false, error: 'Image upload failed' });
    }
  } catch (error) {
    console.error('Editor image upload error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

async function deleteProductImage(imageUrl) {
  if (!imageUrl) return;

  if (imageUrl.startsWith('http')) {
    const fileName = imageUrl.split('/').pop();
    try {
      await imageStorage.delete(fileName);
      console.log('Image deleted from storage:', fileName);
    } catch (error) {
      console.error('Failed to delete image from storage:', error);
    }
  } else {
    const imagePath = path.join(__dirname, imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
      console.log('Local image deleted:', imagePath);
    }
  }
}

app.delete('/api/delete-image', authenticateToken, async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ success: false, error: 'Image URL is required' });
    }

    await deleteProductImage(url);
    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete image error:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/products', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, category, industry, description, specifications, price_range, image_data, seo_meta_title, seo_meta_description, seo_keywords, seo_image_alt } = req.body;
  let image_url = null;

  if (image_data && image_data.startsWith('data:image/')) {
    image_url = await processAndUploadImage(image_data);
  } else if (req.file) {
    const filePath = path.join(uploadDir, req.file.filename);
    const fileContent = fs.readFileSync(filePath);
    const ext = req.file.mimetype.split('/')[1];
    const allowedExts = ['jpeg', 'jpg', 'png', 'webp'];
    
    if (!allowedExts.includes(ext.toLowerCase())) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported image format. Only jpg, png, webp allowed.' });
    }

    let buffer = fileContent;
    try {
      const metadata = await sharp(buffer).metadata();
      let width = metadata.width || 1920;
      let height = metadata.height || 1920;
      const maxDimension = 1920;
      const maxFileSize = 800 * 1024;

      let resizeWidth = width;
      let resizeHeight = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          resizeWidth = maxDimension;
          resizeHeight = Math.round((height * maxDimension) / width);
        } else {
          resizeHeight = maxDimension;
          resizeWidth = Math.round((width * maxDimension) / height);
        }
      }

      buffer = await sharp(buffer)
        .resize(resizeWidth, resizeHeight, {
          fit: sharp.fit.contain,
          background: { r: 248, g: 249, b: 250, alpha: 1 }
        })
        .webp({ quality: 85 })
        .toBuffer();

      if (buffer.length > maxFileSize) {
        let quality = 80;
        while (buffer.length > maxFileSize && quality > 20) {
          quality -= 5;
          buffer = await sharp(buffer).webp({ quality: quality }).toBuffer();
        }
      }
    } catch (err) {
      console.error('Image processing failed:', err);
    }

    const randomSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const filename = `product_${Date.now()}_${randomSuffix}.webp`;

    try {
      image_url = await imageStorage.upload(buffer, filename, 'image/webp');
      console.log('Product image uploaded:', image_url);
    } catch (uploadError) {
      console.error('Storage upload failed:', uploadError);
      image_url = `/uploads/${filename}`;
      fs.writeFileSync(filePath, buffer);
    }

    fs.unlinkSync(path.join(uploadDir, req.file.filename));
  }

  if (!name || !category || !industry) {
    return res.status(400).json({ error: 'Name, category, and industry are required.' });
  }

  console.log('Starting translation for product:', name);
  const translations = await translateProduct({
    name, category, industry,
    description: description || '',
    specifications: specifications || '',
    price_range: price_range || ''
  });
  console.log('Translation completed:', JSON.stringify(translations));

  const product = {
    id: db.nextProductId++,
    name, category, industry,
    description: description || '',
    specifications: specifications || '',
    price_range: price_range || '',
    image_url,
    translations,
    seo_meta_title: seo_meta_title ? (typeof seo_meta_title === 'string' ? JSON.parse(seo_meta_title) : seo_meta_title) : {},
    seo_meta_description: seo_meta_description ? (typeof seo_meta_description === 'string' ? JSON.parse(seo_meta_description) : seo_meta_description) : {},
    seo_keywords: seo_keywords ? (typeof seo_keywords === 'string' ? JSON.parse(seo_keywords) : seo_keywords) : {},
    seo_image_alt: seo_image_alt || '',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  await createProduct(product);
  res.json({ success: true, data: product });
});

app.put('/api/products/:id', authenticateToken, upload.single('image'), async (req, res) => {
  const { name, category, industry, description, specifications, price_range, image_data } = req.body;
  const product = await getProductById(req.params.id);

  if (!product) return res.status(404).json({ error: 'Product not found.' });

  if (image_data && image_data.startsWith('data:image/')) {
    if (product.image_url) {
      await deleteProductImage(product.image_url);
    }
    
    const newImageUrl = await processAndUploadImage(image_data);
    if (newImageUrl) {
      product.image_url = newImageUrl;
    }
  } else if (req.file) {
    if (product.image_url) {
      await deleteProductImage(product.image_url);
    }

    const filePath = path.join(uploadDir, req.file.filename);
    const fileContent = fs.readFileSync(filePath);
    const ext = req.file.mimetype.split('/')[1];
    const allowedExts = ['jpeg', 'jpg', 'png', 'webp'];
    
    if (!allowedExts.includes(ext.toLowerCase())) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: 'Unsupported image format. Only jpg, png, webp allowed.' });
    }

    let buffer = fileContent;
    try {
      const metadata = await sharp(buffer).metadata();
      let width = metadata.width || 1920;
      let height = metadata.height || 1920;
      const maxDimension = 1920;
      const maxFileSize = 800 * 1024;

      let resizeWidth = width;
      let resizeHeight = height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          resizeWidth = maxDimension;
          resizeHeight = Math.round((height * maxDimension) / width);
        } else {
          resizeHeight = maxDimension;
          resizeWidth = Math.round((width * maxDimension) / height);
        }
      }

      buffer = await sharp(buffer)
        .resize(resizeWidth, resizeHeight, {
          fit: sharp.fit.contain,
          background: { r: 248, g: 249, b: 250, alpha: 1 }
        })
        .webp({ quality: 85 })
        .toBuffer();

      if (buffer.length > maxFileSize) {
        let quality = 80;
        while (buffer.length > maxFileSize && quality > 20) {
          quality -= 5;
          buffer = await sharp(buffer).webp({ quality: quality }).toBuffer();
        }
      }
    } catch (err) {
      console.error('Image processing failed:', err);
    }

    const randomSuffix = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const filename = `product_${Date.now()}_${randomSuffix}.webp`;

    try {
      product.image_url = await imageStorage.upload(buffer, filename, 'image/webp');
      console.log('Product image updated:', product.image_url);
    } catch (uploadError) {
      console.error('Storage upload failed:', uploadError);
      product.image_url = `/uploads/${filename}`;
      fs.writeFileSync(filePath, buffer);
    }

    fs.unlinkSync(path.join(uploadDir, req.file.filename));
  }

  if (!name || !category || !industry) {
    return res.status(400).json({ error: 'Name, category, and industry are required.' });
  }

  product.name = name;
  product.category = category;
  product.industry = industry;
  product.description = description || '';
  product.specifications = specifications || '';
  product.price_range = price_range || '';
  
  if (req.body.seo_meta_title) {
    try {
      product.seo_meta_title = typeof req.body.seo_meta_title === 'string' ? JSON.parse(req.body.seo_meta_title) : req.body.seo_meta_title;
    } catch (e) {
      product.seo_meta_title = {};
    }
  }
  if (req.body.seo_meta_description) {
    try {
      product.seo_meta_description = typeof req.body.seo_meta_description === 'string' ? JSON.parse(req.body.seo_meta_description) : req.body.seo_meta_description;
    } catch (e) {
      product.seo_meta_description = {};
    }
  }
  if (req.body.seo_keywords) {
    try {
      product.seo_keywords = typeof req.body.seo_keywords === 'string' ? JSON.parse(req.body.seo_keywords) : req.body.seo_keywords;
    } catch (e) {
      product.seo_keywords = {};
    }
  }
  if (req.body.seo_image_alt !== undefined) {
    product.seo_image_alt = req.body.seo_image_alt || '';
  }
  
  product.updated_at = new Date().toISOString();

  const translations = await translateProduct({
    name, category, industry,
    description: description || '',
    specifications: specifications || '',
    price_range: price_range || ''
  });
  product.translations = translations;

  await updateProduct(req.params.id, product);
  res.json({ success: true, data: product });
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  if (product.image_url) {
    await deleteProductImage(product.image_url);
  }

  await deleteProduct(req.params.id);
  res.json({ success: true, message: 'Product deleted successfully.' });
});

app.post('/api/products/reorganize-sort', authenticateToken, async (req, res) => {
  try {
    await reorganizeProductSortOrder();
    res.json({ success: true, message: 'Product sort order reorganized successfully.' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reorganize product sort order.' });
  }
});

app.post('/api/products/:id/move', authenticateToken, async (req, res) => {
  const { direction } = req.body;
  const product = await getProductById(req.params.id);
  if (!product) return res.status(404).json({ error: 'Product not found.' });

  const allProducts = await getProducts();
  const currentIndex = allProducts.findIndex(p => p.id === product.id);

  if (direction === 'up' && currentIndex > 0) {
    const swapWith = allProducts[currentIndex - 1];
    const tempOrder = product.sort_order;
    product.sort_order = swapWith.sort_order;
    swapWith.sort_order = tempOrder;
    await updateProduct(product.id, { sort_order: product.sort_order });
    await updateProduct(swapWith.id, { sort_order: swapWith.sort_order });
    res.json({ success: true, message: 'Product moved up successfully.' });
  } else if (direction === 'down' && currentIndex < allProducts.length - 1) {
    const swapWith = allProducts[currentIndex + 1];
    const tempOrder = product.sort_order;
    product.sort_order = swapWith.sort_order;
    swapWith.sort_order = tempOrder;
    await updateProduct(product.id, { sort_order: product.sort_order });
    await updateProduct(swapWith.id, { sort_order: swapWith.sort_order });
    res.json({ success: true, message: 'Product moved down successfully.' });
  } else {
    res.status(400).json({ error: 'Cannot move product in that direction.' });
  }
});

app.get('/api/categories', async (req, res) => {
  const { industry, lang } = req.query;
  const items = await getCategories({ industry });
  
  const result = items.map(item => ({
    ...item,
    originalName: item.name
  }));
  
  if (lang && lang !== 'en') {
    for (const item of result) {
      const translatedName = await translateText(item.originalName, lang);
      item.name = translatedName || item.originalName;
    }
  }
  
  res.json({ success: true, data: result });
});

app.get('/api/categories/:id', async (req, res) => {
  const category = await getCategoryById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  res.json({ success: true, data: category });
});

app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name, industry } = req.body;
  if (!name || !industry) {
    return res.status(400).json({ error: 'Name and industry are required.' });
  }

  const allCategories = await getCategories();
  const maxOrder = allCategories.length > 0 ? Math.max(...allCategories.map(c => c.sort_order || 0)) : 0;

  const category = {
    id: db.nextCategoryId++,
    name,
    industry,
    sort_order: maxOrder + 1,
    created_at: new Date().toISOString()
  };
  await createCategory(category);
  res.json({ success: true, data: category });
});

app.put('/api/categories/:id', authenticateToken, async (req, res) => {
  const { name, industry } = req.body;
  const category = await getCategoryById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  category.name = name || category.name;
  category.industry = industry || category.industry;
  
  if (req.body.seo_meta_title) {
    try {
      category.seo_meta_title = typeof req.body.seo_meta_title === 'string' ? JSON.parse(req.body.seo_meta_title) : req.body.seo_meta_title;
    } catch (e) {
      category.seo_meta_title = {};
    }
  }
  if (req.body.seo_meta_description) {
    try {
      category.seo_meta_description = typeof req.body.seo_meta_description === 'string' ? JSON.parse(req.body.seo_meta_description) : req.body.seo_meta_description;
    } catch (e) {
      category.seo_meta_description = {};
    }
  }
  if (req.body.seo_keywords) {
    try {
      category.seo_keywords = typeof req.body.seo_keywords === 'string' ? JSON.parse(req.body.seo_keywords) : req.body.seo_keywords;
    } catch (e) {
      category.seo_keywords = {};
    }
  }
  
  await updateCategory(req.params.id, category);
  res.json({ success: true, data: category });
});

app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  const category = await getCategoryById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found.' });

  const allProducts = await getProducts();
  const hasProducts = allProducts.some(p => p.category === category.name);
  if (hasProducts) return res.status(400).json({ error: 'Cannot delete category with products.' });

  await deleteCategory(req.params.id);

  const remainingCategories = await getCategories();
  remainingCategories.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
  
  for (let i = 0; i < remainingCategories.length; i++) {
    if (remainingCategories[i].sort_order !== i) {
      await updateCategory(remainingCategories[i].id, { sort_order: i });
    }
  }

  res.json({ success: true, message: 'Category deleted successfully.' });
});

app.post('/api/categories/:id/move', authenticateToken, async (req, res) => {
  const { direction } = req.body;
  const category = await getCategoryById(req.params.id);
  if (!category) return res.status(404).json({ error: 'Category not found.' });

  const allCategories = await getCategories();
  const currentIndex = allCategories.findIndex(c => c.id === category.id);

  if (direction === 'up' && currentIndex > 0) {
    const swapWith = allCategories[currentIndex - 1];
    const tempOrder = category.sort_order;
    category.sort_order = swapWith.sort_order;
    swapWith.sort_order = tempOrder;
    await updateCategory(category.id, { sort_order: category.sort_order });
    await updateCategory(swapWith.id, { sort_order: swapWith.sort_order });
    res.json({ success: true, message: 'Category moved up successfully.' });
  } else if (direction === 'down' && currentIndex < allCategories.length - 1) {
    const swapWith = allCategories[currentIndex + 1];
    const tempOrder = category.sort_order;
    category.sort_order = swapWith.sort_order;
    swapWith.sort_order = tempOrder;
    await updateCategory(category.id, { sort_order: category.sort_order });
    await updateCategory(swapWith.id, { sort_order: swapWith.sort_order });
    res.json({ success: true, message: 'Category moved down successfully.' });
  } else {
    res.status(400).json({ error: 'Cannot move category in that direction.' });
  }
});

const industries = ['biotech', 'autoparts', 'instruments'];

app.get('/api/industries', (req, res) => {
  res.json({ success: true, data: industries });
});

app.get('/api/stats', authenticateToken, async (req, res) => {
  const allProducts = await getProducts();
  const totalProducts = allProducts.length;
  const biotechCount = allProducts.filter(p => p.industry === 'biotech').length;
  const autopartsCount = allProducts.filter(p => p.industry === 'autoparts').length;
  const instrumentsCount = allProducts.filter(p => p.industry === 'instruments').length;

  const today = new Date().toISOString().split('T')[0];
  const allVisits = await getAllVisits();
  const totalVisits = allVisits.length;
  const todayVisits = allVisits.filter(v => v.created_at.startsWith(today)).length;
  const uniqueVisitors = new Set(allVisits.map(v => v.session_id)).size;

  res.json({
    success: true,
    data: {
      totalProducts,
      byIndustry: { biotech: biotechCount, autoparts: autopartsCount, instruments: instrumentsCount },
      visits: { total: totalVisits, today: todayVisits, unique: uniqueVisitors }
    }
  });
});

function getPeriodRange(period) {
  const now = new Date();
  let startDate;
  
  switch(period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'yesterday':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      break;
    case '7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'thisweek':
      const day = now.getDay();
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1));
      break;
    case 'lastweek':
      const lastDay = now.getDay();
      const lastWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (lastDay === 0 ? 6 : lastDay - 1) - 7);
      startDate = lastWeekStart;
      break;
    case 'thismonth':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'lastmonth':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      break;
    case 'thisyear':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
    case 'lastyear':
      startDate = new Date(now.getFullYear() - 1, 0, 1);
      break;
    case '30days':
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return startDate;
}

function formatByPeriod(dateStr, period) {
  const date = new Date(dateStr);
  switch(period) {
    case 'today':
    case 'yesterday':
      return dateStr;
    case '7days':
    case '30days':
      return dateStr;
    case 'thisweek':
    case 'lastweek':
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return days[date.getDay()];
    case 'thismonth':
    case 'lastmonth':
      return `${date.getDate()}日`;
    case 'thisyear':
    case 'lastyear':
      return `${date.getMonth() + 1}月`;
    default:
      return dateStr;
  }
}

app.get('/api/analytics', authenticateToken, async (req, res) => {
  const { period = '7days' } = req.query;
  const startDate = getPeriodRange(period);
  const now = new Date();

  const allVisits = await getAllVisits();
  const periodVisits = allVisits.filter(v => new Date(v.created_at) >= startDate && new Date(v.created_at) <= now);

  const allInquiries = await getAllInquiries();
  const periodInquiries = allInquiries.filter(i => new Date(i.created_at) >= startDate && new Date(i.created_at) <= now);

  const allProducts = await getProducts();

  const pageViewMap = {};
  const productClickMap = {};
  periodVisits.forEach(v => {
    const url = v.page_url || '/';
    pageViewMap[url] = (pageViewMap[url] || 0) + 1;
    
    if (v.event_type === 'product_view' && v.product_id) {
      productClickMap[v.product_id] = (productClickMap[v.product_id] || 0) + 1;
    } else {
      const match = url.match(/\/product\/(\d+)/) || url.match(/\/api\/products\/(\d+)/);
      if (match) {
        const productId = match[1];
        productClickMap[productId] = (productClickMap[productId] || 0) + 1;
      }
    }
  });

  const pageViews = Object.entries(pageViewMap)
    .map(([page_url, views]) => ({ page_url, views }))
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  const productClicks = Object.entries(productClickMap)
    .map(([productId, clicks]) => {
      const product = allProducts.find(p => p.id.toString() === productId);
      return { 
        product_id: productId,
        product_name: product ? product.name : 'Unknown',
        clicks 
      };
    })
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  const countryMap = {};
  periodVisits.forEach(v => {
    const country = v.country || 'Unknown';
    countryMap[country] = (countryMap[country] || 0) + 1;
  });
  const countryStats = Object.entries(countryMap)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const deviceMap = {};
  periodVisits.forEach(v => {
    deviceMap[v.device_type] = (deviceMap[v.device_type] || 0) + 1;
  });
  const deviceStats = Object.entries(deviceMap).map(([device_type, count]) => ({ device_type, count }));

  const refMap = {};
  periodVisits.forEach(v => {
    if (v.referrer) {
      const domain = v.referrer.match(/https?:\/\/([^\/]+)/)?.[1] || v.referrer;
      refMap[domain] = (refMap[domain] || 0) + 1;
    } else {
      refMap['Direct'] = (refMap['Direct'] || 0) + 1;
    }
  });
  const referralStats = Object.entries(refMap)
    .map(([referrer, count]) => ({ referrer, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const trafficSourceMap = {};
  periodVisits.forEach(v => {
    const source = v.traffic_source || (v.referrer ? 'referral' : 'direct');
    trafficSourceMap[source] = (trafficSourceMap[source] || 0) + 1;
  });
  const trafficSourceStats = Object.entries(trafficSourceMap)
    .map(([traffic_source, count]) => ({ traffic_source, count }))
    .sort((a, b) => b.count - a.count);

  const industryMap = {};
  periodVisits.forEach(v => {
    const match = v.page_url?.match(/industry=([^&]+)/);
    if (match) {
      industryMap[match[1]] = (industryMap[match[1]] || 0) + 1;
    }
  });
  const industryStats = Object.entries(industryMap)
    .map(([industry, count]) => ({ 
      industry: industry.charAt(0).toUpperCase() + industry.slice(1), 
      count 
    }))
    .sort((a, b) => b.count - a.count);

  const dailyMap = {};
  const inquiryDailyMap = {};
  
  const daysToShow = period === 'thisweek' || period === 'lastweek' ? 7 : 
                     period === 'thismonth' || period === 'lastmonth' ? 31 :
                     period === 'thisyear' || period === 'lastyear' ? 12 : 30;

  for (let i = daysToShow - 1; i >= 0; i--) {
    const d = new Date();
    if (period === 'thisweek') {
      const dayOfWeek = d.getDay();
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
      d.setDate(monday.getDate() + i);
    } else if (period === 'lastweek') {
      const dayOfWeek = d.getDay();
      const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1) - 7);
      d.setDate(monday.getDate() + i);
    } else if (period === 'thismonth') {
      d.setDate(i + 1);
    } else if (period === 'lastmonth') {
      d.setMonth(d.getMonth() - 1);
      d.setDate(i + 1);
    } else if (period === 'thisyear') {
      d.setMonth(i);
      d.setDate(1);
    } else if (period === 'lastyear') {
      d.setFullYear(d.getFullYear() - 1);
      d.setMonth(i);
      d.setDate(1);
    } else {
      d.setDate(d.getDate() - i);
    }
    
    const dateStr = d.toISOString().split('T')[0];
    dailyMap[dateStr] = { visits: 0, sessions: new Set(), inquiries: 0 };
    inquiryDailyMap[dateStr] = 0;
  }

  periodVisits.forEach(v => {
    const date = v.created_at.split('T')[0];
    if (dailyMap[date]) {
      dailyMap[date].visits++;
      dailyMap[date].sessions.add(v.session_id);
    }
  });

  periodInquiries.forEach(i => {
    const date = i.created_at.split('T')[0];
    if (dailyMap[date]) {
      dailyMap[date].inquiries++;
    }
  });

  const dailyStats = Object.entries(dailyMap)
    .map(([date, d]) => ({ 
      date, 
      label: formatByPeriod(date, period),
      visits: d.visits, 
      unique: d.sessions.size,
      inquiries: d.inquiries 
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const visitorStats = periodVisits
    .map(v => ({
      visitor_id: v.visitor_id,
      session_id: v.session_id,
      page_url: v.page_url,
      page_title: v.page_title,
      referrer: v.referrer,
      country: v.country,
      device_type: v.device_type,
      traffic_source: v.traffic_source,
      product_id: v.product_id,
      product_name: v.product_name,
      event_type: v.event_type,
      duration: v.duration,
      is_new: v.is_new,
      search_keyword: v.search_keyword,
      created_at: v.created_at
    }))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 50);

  const uniqueVisitors = new Set(periodVisits.map(v => v.visitor_id || v.session_id)).size;
  const avgDuration = periodVisits.length > 0 
    ? Math.round(periodVisits.reduce((sum, v) => sum + (v.duration || 0), 0) / periodVisits.length)
    : 0;

  res.json({
    success: true,
    data: {
      pageViews,
      productClicks,
      countryStats,
      deviceStats,
      referralStats,
      trafficSourceStats,
      industryStats,
      dailyStats,
      visitorStats,
      totalInquiries: periodInquiries.length,
      totalVisits: periodVisits.length,
      totalUniqueVisitors: uniqueVisitors,
      avgDuration
    }
  });
});

const SNAPSHOT_DIR = path.join(__dirname, 'snapshots');
const SNAPSHOT_LOG_FILE = path.join(SNAPSHOT_DIR, 'snapshot_logs.json');
const SNAPSHOT_CONFIG_FILE = path.join(SNAPSHOT_DIR, 'snapshot_config.json');

if (!fs.existsSync(SNAPSHOT_DIR)) {
  fs.mkdirSync(SNAPSHOT_DIR, { recursive: true });
}

function loadSnapshotConfig() {
  try {
    if (fs.existsSync(SNAPSHOT_CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(SNAPSHOT_CONFIG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load snapshot config:', e);
  }
  return {
    enabled: true,
    autoSnapshot: false,
    autoSnapshotInterval: 24,
    maxSnapshots: 50
  };
}

function saveSnapshotConfig(config) {
  try {
    fs.writeFileSync(SNAPSHOT_CONFIG_FILE, JSON.stringify(config, null, 2));
  } catch (e) {
    console.error('Failed to save snapshot config:', e);
  }
}

function loadSnapshotLogs() {
  try {
    if (fs.existsSync(SNAPSHOT_LOG_FILE)) {
      return JSON.parse(fs.readFileSync(SNAPSHOT_LOG_FILE, 'utf8'));
    }
  } catch (e) {
    console.error('Failed to load snapshot logs:', e);
  }
  return [];
}

function saveSnapshotLog(log) {
  try {
    const logs = loadSnapshotLogs();
    logs.unshift({
      ...log,
      id: Date.now(),
      created_at: new Date().toISOString()
    });
    fs.writeFileSync(SNAPSHOT_LOG_FILE, JSON.stringify(logs, null, 2));
  } catch (e) {
    console.error('Failed to save snapshot log:', e);
  }
}

async function createSnapshot(name = '') {
  const config = loadSnapshotConfig();
  if (!config.enabled) {
    return { success: false, error: 'Snapshot module is disabled' };
  }

  const translationsPath = path.join(__dirname, 'i18n', 'translations.json');
  let translations = {};
  try {
    translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read translations:', e);
  }

  const snapshotData = {
    version: '1.0',
    name: name || `Snapshot ${new Date().toLocaleString()}`,
    created_at: new Date().toISOString(),
    data: {
      categories: JSON.parse(JSON.stringify(db.categories)),
      translations: JSON.parse(JSON.stringify(translations)),
      users: JSON.parse(JSON.stringify(db.users)),
      nextCategoryId: db.nextCategoryId
    },
    excluded: {
      products: db.products.length,
      visits: db.visits.length,
      inquiries: db.inquiries.length
    }
  };

  const snapshotId = `snapshot_${Date.now()}.json`;
  const snapshotPath = path.join(SNAPSHOT_DIR, snapshotId);
  
  try {
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotData, null, 2));
    
    saveSnapshotLog({
      action: 'create',
      snapshot_id: snapshotId,
      snapshot_name: snapshotData.name,
      user: 'system',
      details: `Created snapshot with ${db.categories.length} categories`
    });

    const snapshots = getSnapshotList();
    if (snapshots.length > config.maxSnapshots) {
      const toDelete = snapshots.slice(config.maxSnapshots);
      toDelete.forEach(s => {
        const delPath = path.join(SNAPSHOT_DIR, s.id);
        if (fs.existsSync(delPath)) {
          fs.unlinkSync(delPath);
        }
      });
    }

    return { success: true, data: { id: snapshotId, name: snapshotData.name, created_at: snapshotData.created_at } };
  } catch (e) {
    console.error('Failed to create snapshot:', e);
    return { success: false, error: e.message };
  }
}

function getSnapshotList() {
  try {
    const files = fs.readdirSync(SNAPSHOT_DIR).filter(f => f.endsWith('.json') && f.startsWith('snapshot_') && !f.includes('_logs') && !f.includes('_config'));
    return files.map(f => {
      const filePath = path.join(SNAPSHOT_DIR, f);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      return {
        id: f,
        name: data.name,
        created_at: data.created_at,
        category_count: data.data.categories.length,
        excluded_products: data.excluded.products
      };
    }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  } catch (e) {
    console.error('Failed to get snapshot list:', e);
    return [];
  }
}

async function rollbackToSnapshot(snapshotId, userId) {
  const config = loadSnapshotConfig();
  if (!config.enabled) {
    return { success: false, error: 'Snapshot module is disabled' };
  }

  const snapshotPath = path.join(SNAPSHOT_DIR, snapshotId);
  if (!fs.existsSync(snapshotPath)) {
    return { success: false, error: 'Snapshot not found' };
  }

  try {
    const snapshotData = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

    const translationsPath = path.join(__dirname, 'i18n', 'translations.json');
    fs.writeFileSync(translationsPath, JSON.stringify(snapshotData.data.translations, null, 2));

    db.categories = snapshotData.data.categories;
    db.nextCategoryId = snapshotData.data.nextCategoryId;
    db.users = snapshotData.data.users;

    await saveDB();

    saveSnapshotLog({
      action: 'rollback',
      snapshot_id: snapshotId,
      snapshot_name: snapshotData.name,
      user: userId || 'admin',
      details: `Rolled back to snapshot. Restored ${snapshotData.data.categories.length} categories. Products (${db.products.length}) protected.`
    });

    return { 
      success: true, 
      message: 'Rollback completed successfully',
      restored: {
        categories: snapshotData.data.categories.length,
        translations: Object.keys(snapshotData.data.translations).length
      },
      protected: {
        products: db.products.length
      }
    };
  } catch (e) {
    console.error('Failed to rollback:', e);
    return { success: false, error: e.message };
  }
}

function deleteSnapshot(snapshotId) {
  const snapshotPath = path.join(SNAPSHOT_DIR, snapshotId);
  if (!fs.existsSync(snapshotPath)) {
    return { success: false, error: 'Snapshot not found' };
  }

  try {
    fs.unlinkSync(snapshotPath);
    
    saveSnapshotLog({
      action: 'delete',
      snapshot_id: snapshotId,
      user: 'admin',
      details: 'Deleted snapshot'
    });

    return { success: true, message: 'Snapshot deleted successfully' };
  } catch (e) {
    console.error('Failed to delete snapshot:', e);
    return { success: false, error: e.message };
  }
}

let autoSnapshotIntervalId = null;

function startAutoSnapshot() {
  const config = loadSnapshotConfig();
  if (autoSnapshotIntervalId) {
    clearInterval(autoSnapshotIntervalId);
  }

  if (config.enabled && config.autoSnapshot && config.autoSnapshotInterval > 0) {
    autoSnapshotIntervalId = setInterval(async () => {
      await createSnapshot(`Auto snapshot ${new Date().toLocaleString()}`);
    }, config.autoSnapshotInterval * 60 * 60 * 1000);
    console.log(`Auto snapshot scheduled every ${config.autoSnapshotInterval} hours`);
  }
}

startAutoSnapshot();

(async function cleanStoredWarningText() {
  try {
    const products = await getProducts({});
    let cleanedCount = 0;
    for (const product of products) {
      const before = JSON.stringify(product.translations || {});
      cleanProductTranslations(product);
      const after = JSON.stringify(product.translations || {});
      if (before !== after) {
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      await saveDB();
      console.log(`Cleaned MyMemory warning text from ${cleanedCount} products`);
    }
  } catch (e) {
    console.warn('Failed to clean stored warning text:', e.message);
  }
})();

app.get('/api/snapshots', authenticateToken, (req, res) => {
  res.json({ success: true, data: getSnapshotList() });
});

app.post('/api/snapshots', authenticateToken, async (req, res) => {
  const { name } = req.body;
  const result = await createSnapshot(name);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

app.post('/api/snapshots/:id/rollback', authenticateToken, async (req, res) => {
  const { userId } = req.body;
  const result = await rollbackToSnapshot(req.params.id, userId);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

app.delete('/api/snapshots/:id', authenticateToken, (req, res) => {
  const result = deleteSnapshot(req.params.id);
  if (result.success) {
    res.json(result);
  } else {
    res.status(400).json(result);
  }
});

app.get('/api/snapshots/config', authenticateToken, (req, res) => {
  res.json({ success: true, data: loadSnapshotConfig() });
});

app.put('/api/snapshots/config', authenticateToken, (req, res) => {
  const config = { ...loadSnapshotConfig(), ...req.body };
  saveSnapshotConfig(config);
  startAutoSnapshot();
  
  saveSnapshotLog({
    action: 'config_update',
    user: 'admin',
    details: `Updated snapshot config: ${JSON.stringify(config)}`
  });

  res.json({ success: true, data: config });
});

app.get('/api/snapshots/logs', authenticateToken, (req, res) => {
  res.json({ success: true, data: loadSnapshotLogs() });
});

app.get('/api/public-phrases', authenticateToken, async (req, res) => {
  const { search } = req.query;
  const phrases = await getPublicPhrases({ search });
  res.json({ success: true, data: phrases });
});

app.get('/api/public-phrases/:id', authenticateToken, async (req, res) => {
  const phrase = await getPublicPhraseById(req.params.id);
  if (!phrase) return res.status(404).json({ error: 'Phrase not found.' });
  res.json({ success: true, data: phrase });
});

app.post('/api/public-phrases', authenticateToken, async (req, res) => {
  const { key, original_text, translations } = req.body;
  try {
    const phrase = await createPublicPhrase({ key, original_text, translations });
    res.json({ success: true, data: phrase });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/public-phrases/:id', authenticateToken, async (req, res) => {
  const { key, original_text, translations } = req.body;
  const phrase = await updatePublicPhrase(req.params.id, { key, original_text, translations });
  if (!phrase) return res.status(404).json({ error: 'Phrase not found.' });
  res.json({ success: true, data: phrase });
});

app.delete('/api/public-phrases/:id', authenticateToken, async (req, res) => {
  const phrase = await deletePublicPhrase(req.params.id);
  if (!phrase) return res.status(404).json({ error: 'Phrase not found.' });
  res.json({ success: true, message: 'Phrase deleted successfully.' });
});

app.post('/api/public-phrases/clear', authenticateToken, async (req, res) => {
  try {
    const result = await clearPublicPhrases();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/public-translations', async (req, res) => {
  const { lang } = req.query;
  if (!lang || lang === 'en') {
    return res.json({ success: true, data: {} });
  }
  
  const phrases = await getPublicPhrases({});
  const translations = {};
  for (const phrase of phrases) {
    if (phrase.translations && phrase.translations[lang]) {
      translations[phrase.key] = phrase.translations[lang];
    }
  }
  
  res.json({ success: true, data: translations });
});

// ========== NEWS API ==========
app.get('/api/news', async (req, res) => {
  const { industry, published } = req.query;
  const news = await getNews({ industry, published });
  res.json({ success: true, data: news });
});

app.get('/api/news/:id', async (req, res) => {
  const news = await getNewsById(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found.' });
  res.json({ success: true, data: news });
});

app.post('/api/news', authenticateToken, async (req, res) => {
  try {
    const news = await createNews(req.body);
    res.json({ success: true, data: news });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/news/:id', authenticateToken, async (req, res) => {
  const news = await updateNews(req.params.id, req.body);
  if (!news) return res.status(404).json({ error: 'News not found.' });
  res.json({ success: true, data: news });
});

app.delete('/api/news/:id', authenticateToken, async (req, res) => {
  const news = await deleteNews(req.params.id);
  if (!news) return res.status(404).json({ error: 'News not found.' });
  res.json({ success: true, message: 'News deleted successfully.' });
});

// ========== CASE STUDIES API ==========
app.get('/api/case-studies', async (req, res) => {
  const { industry, published } = req.query;
  const caseStudies = await getCaseStudies({ industry, published });
  res.json({ success: true, data: caseStudies });
});

app.get('/api/case-studies/:id', async (req, res) => {
  const caseStudy = await getCaseStudyById(req.params.id);
  if (!caseStudy) return res.status(404).json({ error: 'Case study not found.' });
  res.json({ success: true, data: caseStudy });
});

app.post('/api/case-studies', authenticateToken, async (req, res) => {
  try {
    const caseStudy = await createCaseStudy(req.body);
    res.json({ success: true, data: caseStudy });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.put('/api/case-studies/:id', authenticateToken, async (req, res) => {
  const caseStudy = await updateCaseStudy(req.params.id, req.body);
  if (!caseStudy) return res.status(404).json({ error: 'Case study not found.' });
  res.json({ success: true, data: caseStudy });
});

app.delete('/api/case-studies/:id', authenticateToken, async (req, res) => {
  const caseStudy = await deleteCaseStudy(req.params.id);
  if (!caseStudy) return res.status(404).json({ error: 'Case study not found.' });
  res.json({ success: true, message: 'Case study deleted successfully.' });
});

app.get('/api/translate', async (req, res) => {
  const { key, text, lang } = req.query;
  if (!lang || lang === 'en') {
    return res.json({ success: true, translation: text || key });
  }

  try {
    const translationsPath = path.join(__dirname, 'i18n', 'translations.json');
    let translations = {};
    try {
      translations = JSON.parse(fs.readFileSync(translationsPath, 'utf8'));
    } catch (e) {}

    const langTranslations = translations[lang];
    if (langTranslations) {
      const keys = key.split('.');
      let value = langTranslations;
      for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
          value = value[k];
        } else {
          value = undefined;
          break;
        }
      }
      if (value !== undefined && typeof value === 'string' && value.length > 0) {
        return res.json({ success: true, translation: value });
      }
    }

    const publicTranslation = await getPublicTranslation(key, lang);
    if (publicTranslation) {
      return res.json({ success: true, translation: publicTranslation });
    }

    if (text) {
      const publicTranslationByText = await getPublicTranslation(text, lang);
      if (publicTranslationByText) {
        return res.json({ success: true, translation: publicTranslationByText });
      }
    }

    const machineTranslation = await translateText(text || key, lang);
    res.json({ success: true, translation: machineTranslation });
  } catch (error) {
    res.json({ success: true, translation: text || key });
  }
});

app.get('/api/site-settings', async (req, res) => {
  const settings = await getSiteSettings();
  res.json({ success: true, data: settings });
});

app.put('/api/site-settings', authenticateToken, async (req, res) => {
  try {
    const settings = await updateSiteSettings(req.body);
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});


app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

app.use('/admin', express.static(path.join(__dirname, 'admin')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const products = await getProducts();
    const categories = await getCategories();
    
    const baseUrl = req.protocol + '://' + req.get('host');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
    
    xml += `
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>`;
  
    xml += `
  <url>
    <loc>${baseUrl}/about.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  
    xml += `
  <url>
    <loc>${baseUrl}/contact.html</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  
    xml += `
  <url>
    <loc>${baseUrl}/biotech</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  
    xml += `
  <url>
    <loc>${baseUrl}/autoparts</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  
    xml += `
  <url>
    <loc>${baseUrl}/instruments</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>`;
  
    categories.forEach(cat => {
      const industry = cat.industry || '';
      xml += `
  <url>
    <loc>${baseUrl}/${industry}?category=${encodeURIComponent(cat.name)}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    
    products.forEach(product => {
      const industry = product.industry || '';
      xml += `
  <url>
    <loc>${baseUrl}/${industry}?product=${product.id}</loc>
    <lastmod>${(product.updated_at || new Date()).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });
    
    xml += `
</urlset>`;
    
    res.set('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    console.error('Failed to generate sitemap:', error);
    res.status(500).send('Failed to generate sitemap');
  }
});

app.get('/robots.txt', async (req, res) => {
  try {
    const settings = await getSiteSettings();
    const baseUrl = req.protocol + '://' + req.get('host');
    
    let robots = `User-agent: *
Allow: /
Sitemap: ${baseUrl}/sitemap.xml
`;
    
    if (settings.google_verification_code) {
      robots += `\n${settings.google_verification_code}\n`;
    }
    
    res.set('Content-Type', 'text/plain');
    res.send(robots);
  } catch (error) {
    console.error('Failed to generate robots.txt:', error);
    res.status(500).send('Failed to generate robots.txt');
  }
});

connectSupabase().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Server running on http://0.0.0.0:${PORT}`);
    console.log(`Admin panel: http://localhost:${PORT}/admin`);
    console.log(`Default login: admin / admin123`);
    console.log(`Using Supabase: ${usingSupabase}`);
  });
});

module.exports = app;
