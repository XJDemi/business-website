// Vercel serverless function for XuanJi Technology
// 前台直连 Supabase，这里只处理 POST 表单提交和少量配置接口

const express = require('express');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://idvlvxevkpfkxffivus.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkdmx4ZXZ1ZmtwZnhmaWZmdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTgwNzEsImV4cCI6MjEwMDE3NDA3MX0.NOLE7ocrd1ajfcu4ObHTjYTMwNPWu7F-eD2JtHE1l0g';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'vercel-serverless', time: new Date().toISOString() });
});

// Site settings (for footer data)
app.get('/api/site-settings', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .limit(1);
    if (error) {
      console.error('site-settings error:', error);
      res.json({ success: true, data: {} });
      return;
    }
    res.json({ success: true, data: data && data[0] ? data[0] : {} });
  } catch (e) {
    console.error('site-settings exception:', e);
    res.json({ success: true, data: {} });
  }
});

// Submit inquiry (contact form)
app.post('/api/inquiry', async (req, res) => {
  try {
    const body = req.body || {};
    const { data, error } = await supabase
      .from('inquiries')
      .insert([{
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        company: body.company || '',
        industry: body.industry || '',
        product: body.product || '',
        message: body.message || '',
        source_page: body.source_page || '',
        session_id: body.session_id || '',
        visitor_id: body.visitor_id || '',
        product_id: body.product_id || '',
        product_name: body.product_name || '',
        quantity: body.quantity || '',
        created_at: new Date().toISOString()
      }]);
    if (error) {
      console.error('inquiry insert error:', error);
      res.status(500).json({ success: false, error: 'Submit failed' });
      return;
    }
    res.json({ success: true, data });
  } catch (e) {
    console.error('inquiry exception:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Submit inquiry (product modal form)
app.post('/api/inquiries', async (req, res) => {
  try {
    const body = req.body || {};
    const { data, error } = await supabase
      .from('inquiries')
      .insert([{
        name: body.name || '',
        email: body.email || '',
        phone: body.phone || '',
        company: body.company || '',
        industry: body.industry || '',
        product: body.product || '',
        message: body.message || '',
        source_page: body.source_page || '',
        session_id: body.session_id || '',
        visitor_id: body.visitor_id || '',
        product_id: body.product_id || '',
        product_name: body.product_name || '',
        quantity: body.quantity || '',
        created_at: new Date().toISOString()
      }]);
    if (error) {
      console.error('inquiries insert error:', error);
      res.status(500).json({ success: false, error: 'Submit failed' });
      return;
    }
    res.json({ success: true, data });
  } catch (e) {
    console.error('inquiries exception:', e);
    res.status(500).json({ success: false, error: e.message });
  }
});

// Track visit (page tracking)
app.post('/api/track-visit', async (req, res) => {
  try {
    const body = req.body || {};
    const { data, error } = await supabase
      .from('visits')
      .insert([{
        visitor_id: body.visitor_id || '',
        session_id: body.session_id || '',
        page_url: body.page_url || '',
        page_title: body.page_title || '',
        referrer: body.referrer || '',
        device_type: body.device_type || '',
        duration: body.duration || 0,
        created_at: new Date().toISOString()
      }]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// Login endpoint (basic, for admin - will be enhanced later)
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password required' });
      return;
    }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .limit(1);
    if (error || !data || data.length === 0) {
      res.status(401).json({ success: false, error: 'Invalid credentials' });
      return;
    }
    res.json({ success: true, token: 'dev-token-placeholder', user: { username } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// 404 for unmatched API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'Not found' });
});

module.exports = app;
