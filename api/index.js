// Vercel serverless function - XuanJi Technology
// Uses native fetch() instead of @supabase/supabase-js for zero-dep reliability

const express = require('express');

const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://idvlxevufkpfxfiffvus.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkdmx4ZXZ1ZmtwZnhmaWZmdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTgwNzEsImV4cCI6MjEwMDE3NDA3MX0.NOLE7ocrd1ajfcu4ObHTjYTMwNPWu7F-eD2JtHE1l0g';

function supaHeaders(extra) {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
    ...extra
  };
}

async function supaQuery(table, method, pathPart, body) {
  const url = `${SUPABASE_URL}/rest/v1/${table}${pathPart || ''}`;
  const opts = {
    method: method || 'GET',
    headers: supaHeaders()
  };
  if (body !== undefined) {
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) {
    return { data: null, error: { status: res.status, message: text } };
  }
  try {
    const data = JSON.parse(text);
    return { data, error: null };
  } catch {
    return { data: text, error: null };
  }
}

async function supaRpc(functionName, body) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;
  const opts = {
    method: 'POST',
    headers: supaHeaders(),
    body: JSON.stringify(body || {})
  };
  const res = await fetch(url, opts);
  const text = await res.text();
  try { return { data: JSON.parse(text), error: null }; }
  catch { return { data: text, error: null }; }
}

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ==================== HEALTH ====================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', mode: 'vercel-serverless', time: new Date().toISOString() });
});

// ==================== PRODUCTS ====================
app.get('/api/products', async (req, res) => {
  try {
    const q = new URLSearchParams();
    if (req.query.industry) q.set('industry', `eq.${req.query.industry}`);
    if (req.query.category) q.set('category', `eq.${req.query.category}`);
    if (req.query.published) q.set('published', `eq.${req.query.published}`);
    q.set('select', '*');
    q.set('order', 'sort_order.asc');
    const { data, error } = await supaQuery('products', 'GET', `?${q.toString()}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('products', 'GET', `?id=eq.${req.params.id}&select=*`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: data && data[0] ? data[0] : null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { data, error } = await supaQuery('products', 'POST', '', req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('products', 'PATCH', `?id=eq.${req.params.id}`, req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('products', 'DELETE', `?id=eq.${req.params.id}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== CATEGORIES ====================
app.get('/api/categories', async (req, res) => {
  try {
    const q = new URLSearchParams();
    if (req.query.industry) q.set('industry', `eq.${req.query.industry}`);
    q.set('select', '*');
    q.set('order', 'sort_order.asc');
    const { data, error } = await supaQuery('categories', 'GET', `?${q.toString()}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/categories/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('categories', 'GET', `?id=eq.${req.params.id}&select=*`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: data && data[0] ? data[0] : null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const { data, error } = await supaQuery('categories', 'POST', '', req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('categories', 'PATCH', `?id=eq.${req.params.id}`, req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('categories', 'DELETE', `?id=eq.${req.params.id}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== NEWS ====================
app.get('/api/news', async (req, res) => {
  try {
    const q = new URLSearchParams();
    if (req.query.industry) q.set('industry', `eq.${req.query.industry}`);
    if (req.query.published) q.set('published', `eq.${req.query.published}`);
    q.set('select', '*');
    q.set('order', 'sort_order.asc');
    const { data, error } = await supaQuery('news', 'GET', `?${q.toString()}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/news/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('news', 'GET', `?id=eq.${req.params.id}&select=*`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: data && data[0] ? data[0] : null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/news', async (req, res) => {
  try {
    const { data, error } = await supaQuery('news', 'POST', '', req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/news/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('news', 'PATCH', `?id=eq.${req.params.id}`, req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/news/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('news', 'DELETE', `?id=eq.${req.params.id}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== CASE STUDIES ====================
app.get('/api/case-studies', async (req, res) => {
  try {
    const q = new URLSearchParams();
    if (req.query.industry) q.set('industry', `eq.${req.query.industry}`);
    if (req.query.published) q.set('published', `eq.${req.query.published}`);
    q.set('select', '*');
    q.set('order', 'sort_order.asc');
    const { data, error } = await supaQuery('case_studies', 'GET', `?${q.toString()}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/case-studies/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('case_studies', 'GET', `?id=eq.${req.params.id}&select=*`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: data && data[0] ? data[0] : null });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/case-studies', async (req, res) => {
  try {
    const { data, error } = await supaQuery('case_studies', 'POST', '', req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.put('/api/case-studies/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('case_studies', 'PATCH', `?id=eq.${req.params.id}`, req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/case-studies/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('case_studies', 'DELETE', `?id=eq.${req.params.id}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== INQUIRIES ====================
app.post('/api/inquiry', async (req, res) => {
  try {
    const { data, error } = await supaQuery('inquiries', 'POST', '', [{
      ...req.body,
      created_at: new Date().toISOString()
    }]);
    if (error) return res.status(500).json({ success: false, error: 'Submit failed' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/inquiries', async (req, res) => {
  try {
    const { data, error } = await supaQuery('inquiries', 'POST', '', [{
      ...req.body,
      created_at: new Date().toISOString()
    }]);
    if (error) return res.status(500).json({ success: false, error: 'Submit failed' });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/inquiries', async (req, res) => {
  try {
    const { data, error } = await supaQuery('inquiries', 'GET', '?select=*&order=created_at.desc');
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/inquiries/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('inquiries', 'DELETE', `?id=eq.${req.params.id}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== SITE SETTINGS ====================
app.get('/api/site-settings', async (req, res) => {
  try {
    const { data, error } = await supaQuery('site_settings', 'GET', '?select=*&limit=1');
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: data && data[0] ? data[0] : {} });
  } catch (e) {
    res.json({ success: true, data: {} });
  }
});

app.put('/api/site-settings', async (req, res) => {
  try {
    const { data, error } = await supaQuery('site_settings', 'PATCH', '?id=eq.1', req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== TRACKING ====================
app.post('/api/track', async (req, res) => {
  try {
    const { data, error } = await supaQuery('visits', 'POST', '', [{
      ...req.body,
      created_at: new Date().toISOString()
    }]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

app.post('/api/track-visit', async (req, res) => {
  try {
    const { data, error } = await supaQuery('visits', 'POST', '', [{
      ...req.body,
      created_at: new Date().toISOString()
    }]);
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

app.post('/api/track-duration', async (req, res) => {
  try {
    const body = req.body || {};
    if (body.visitor_id && body.duration) {
      await supaRpc('update_visit_duration', {
        p_visitor_id: body.visitor_id,
        p_duration: body.duration
      });
    }
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// ==================== LOGIN ====================
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ success: false, error: 'Username and password required' });
    }
    const { data, error } = await supaQuery('users', 'GET', `?username=eq.${encodeURIComponent(username)}&select=*&limit=1`);
    if (error || !data || data.length === 0) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    res.json({ success: true, token: 'dev-token', user: { username } });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== STATS ====================
app.get('/api/stats', async (req, res) => {
  try {
    const [p1, p2, p3] = await Promise.all([
      supaQuery('products', 'GET', '?select=id'),
      supaQuery('inquiries', 'GET', '?select=id'),
      supaQuery('visits', 'GET', '?select=id&limit=1')
    ]);
    const productCount = Array.isArray(p1.data) ? p1.data.length : 0;
    const inquiryCount = Array.isArray(p2.data) ? p2.data.length : 0;
    const { data: lastVisit } = p3;
    res.json({
      success: true,
      data: {
        products: productCount,
        inquiries: inquiryCount,
        lastVisitAt: lastVisit && lastVisit[0] ? lastVisit[0].created_at : null,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (e) {
    res.json({
      success: true,
      data: { products: 0, inquiries: 0, lastVisitAt: null, updatedAt: new Date().toISOString() }
    });
  }
});

// ==================== SNAPSHOTS ====================
app.get('/api/snapshots', async (req, res) => {
  try {
    const { data, error } = await supaQuery('snapshots', 'GET', '?select=*&order=created_at.desc');
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

app.post('/api/snapshots', async (req, res) => {
  try {
    const { data, error } = await supaQuery('snapshots', 'POST', '', [{
      ...req.body,
      created_at: new Date().toISOString()
    }]);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.delete('/api/snapshots/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('snapshots', 'DELETE', `?id=eq.${req.params.id}`);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/snapshots/:id/rollback', async (req, res) => {
  try {
    res.json({ success: true, message: 'Rollback completed (placeholder)' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.get('/api/snapshots/config', async (req, res) => {
  try {
    const { data, error } = await supaQuery('snapshots', 'GET', '?select=*&order=created_at.desc&limit=1');
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: data && data[0] ? data[0] : {} });
  } catch (e) {
    res.json({ success: true, data: {} });
  }
});

app.get('/api/snapshots/logs', async (req, res) => {
  try {
    res.json({ success: true, data: [] });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

// ==================== UPLOAD / DELETE IMAGE (placeholder) ====================
app.post('/api/upload-editor-image', async (req, res) => {
  try {
    res.json({ success: true, url: req.body && req.body.url ? req.body.url : '' });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/delete-image', async (req, res) => {
  try {
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ==================== PUBLIC PHRASES ====================
app.get('/api/public-phrases', async (req, res) => {
  try {
    const { data, error } = await supaQuery('public_phrases', 'GET', '?select=*&order=id.asc');
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data: Array.isArray(data) ? data : [] });
  } catch (e) {
    res.json({ success: true, data: [] });
  }
});

app.put('/api/public-phrases/:id', async (req, res) => {
  try {
    const { data, error } = await supaQuery('public_phrases', 'PATCH', `?id=eq.${req.params.id}`, req.body);
    if (error) return res.status(500).json({ success: false, error });
    res.json({ success: true, data });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/public-phrases/clear', async (req, res) => {
  try {
    const { data, error } = await supaQuery('public_phrases', 'DELETE', '?id=gt.0');
    res.json({ success: true });
  } catch (e) {
    res.json({ success: true });
  }
});

// ==================== 404 catch ====================
app.use('/api/*', (req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found' });
});

module.exports = app;
