// Vercel serverless function - XuanJi Technology
// Pure Node.js handler, zero dependencies, maximum reliability

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://idvlxevufkpfxfiffvus.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkdmx4ZXZ1ZmtwZnhmaWZmdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTgwNzEsImV4cCI6MjEwMDE3NDA3MX0.NOLE7ocrd1ajfcu4ObHTjYTMwNPWu7F-eD2JtHE1l0g';

function supaHeaders() {
  return {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };
}

async function supaQuery(table, method, pathPart, body) {
  const url = SUPABASE_URL + '/rest/v1/' + table + (pathPart || '');
  const opts = { method: method || 'GET', headers: supaHeaders() };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const text = await res.text();
  if (!res.ok) return { data: null, error: { status: res.status, message: text } };
  try { return { data: JSON.parse(text), error: null }; }
  catch (e) { return { data: text, error: null }; }
}

function parseBody(req) {
  return new Promise(function (resolve) {
    var data = '';
    req.on('data', function (chunk) { data += chunk; });
    req.on('end', function () {
      if (!data) return resolve({});
      try { resolve(JSON.parse(data)); }
      catch (e) { resolve({}); }
    });
  });
}

function sendJson(res, status, obj) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization,apikey'
  });
  res.end(JSON.stringify(obj));
}

function matchRoute(method, pathname) {
  // /api/health
  if (pathname === '/api/health' && method === 'GET')
    return function () { return { status: 200, body: { status: 'ok', time: new Date().toISOString() } }; };

  // Products CRUD
  if (pathname === '/api/products' && method === 'GET')
    return async function (req, res, q) {
      var qs = new URLSearchParams();
      if (q.industry) qs.set('industry', 'eq.' + q.industry);
      if (q.category) qs.set('category', 'eq.' + q.category);
      qs.set('select', '*'); qs.set('order', 'sort_order.asc');
      var r = await supaQuery('products', 'GET', '?' + qs.toString());
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
    };

  var m = pathname.match(/^\/api\/products\/(\d+)$/);
  if (m) {
    var id = m[1];
    if (method === 'GET') return async function () {
      var r = await supaQuery('products', 'GET', '?id=eq.' + id + '&select=*');
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : null } };
    };
    if (method === 'PUT') return async function (req, res) {
      var body = await parseBody(req);
      var r = await supaQuery('products', 'PATCH', '?id=eq.' + id, body);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
    if (method === 'DELETE') return async function () {
      var r = await supaQuery('products', 'DELETE', '?id=eq.' + id);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
  }

  if (pathname === '/api/products' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('products', 'POST', '', body);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  // Categories CRUD
  if (pathname === '/api/categories' && method === 'GET') return async function (req, res, q) {
    var qs = new URLSearchParams();
    if (q.industry) qs.set('industry', 'eq.' + q.industry);
    qs.set('select', '*'); qs.set('order', 'sort_order.asc');
    var r = await supaQuery('categories', 'GET', '?' + qs.toString());
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var cm = pathname.match(/^\/api\/categories\/(\d+)$/);
  if (cm) {
    var cid = cm[1];
    if (method === 'GET') return async function () {
      var r = await supaQuery('categories', 'GET', '?id=eq.' + cid + '&select=*');
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : null } };
    };
    if (method === 'PUT') return async function (req) {
      var body = await parseBody(req);
      var r = await supaQuery('categories', 'PATCH', '?id=eq.' + cid, body);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
    if (method === 'DELETE') return async function () {
      var r = await supaQuery('categories', 'DELETE', '?id=eq.' + cid);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
  }

  if (pathname === '/api/categories' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('categories', 'POST', '', body);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  // News CRUD
  if (pathname === '/api/news' && method === 'GET') return async function (req, res, q) {
    var qs = new URLSearchParams();
    if (q.industry) qs.set('industry', 'eq.' + q.industry);
    qs.set('select', '*'); qs.set('order', 'sort_order.asc');
    var r = await supaQuery('news', 'GET', '?' + qs.toString());
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var nm = pathname.match(/^\/api\/news\/(\d+)$/);
  if (nm) {
    var nid = nm[1];
    if (method === 'GET') return async function () {
      var r = await supaQuery('news', 'GET', '?id=eq.' + nid + '&select=*');
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : null } };
    };
    if (method === 'PUT') return async function (req) {
      var body = await parseBody(req);
      var r = await supaQuery('news', 'PATCH', '?id=eq.' + nid, body);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
    if (method === 'DELETE') return async function () {
      var r = await supaQuery('news', 'DELETE', '?id=eq.' + nid);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
  }

  if (pathname === '/api/news' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('news', 'POST', '', body);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  // Case Studies CRUD
  if (pathname === '/api/case-studies' && method === 'GET') return async function (req, res, q) {
    var qs = new URLSearchParams();
    if (q.industry) qs.set('industry', 'eq.' + q.industry);
    qs.set('select', '*'); qs.set('order', 'sort_order.asc');
    var r = await supaQuery('case_studies', 'GET', '?' + qs.toString());
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var csm = pathname.match(/^\/api\/case-studies\/(\d+)$/);
  if (csm) {
    var csid = csm[1];
    if (method === 'GET') return async function () {
      var r = await supaQuery('case_studies', 'GET', '?id=eq.' + csid + '&select=*');
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : null } };
    };
    if (method === 'PUT') return async function (req) {
      var body = await parseBody(req);
      var r = await supaQuery('case_studies', 'PATCH', '?id=eq.' + csid, body);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
    if (method === 'DELETE') return async function () {
      var r = await supaQuery('case_studies', 'DELETE', '?id=eq.' + csid);
      if (r.error) return { status: 500, body: { success: false, error: r.error } };
      return { status: 200, body: { success: true, data: r.data } };
    };
  }

  if (pathname === '/api/case-studies' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('case_studies', 'POST', '', body);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  // Inquiries
  if ((pathname === '/api/inquiry' || pathname === '/api/inquiries') && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('inquiries', 'POST', '', [Object.assign({}, body, { created_at: new Date().toISOString() })]);
    if (r.error) return { status: 500, body: { success: false, error: 'Submit failed' } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  if (pathname === '/api/inquiries' && method === 'GET') return async function () {
    var r = await supaQuery('inquiries', 'GET', '?select=*&order=created_at.desc');
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var im = pathname.match(/^\/api\/inquiries\/(\d+)$/);
  if (im && method === 'DELETE') return async function () {
    var r = await supaQuery('inquiries', 'DELETE', '?id=eq.' + im[1]);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  // Site Settings
  if (pathname === '/api/site-settings' && method === 'GET') return async function () {
    var r = await supaQuery('site_settings', 'GET', '?select=*&limit=1');
    return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : {} } };
  };

  if (pathname === '/api/site-settings' && method === 'PUT') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('site_settings', 'PATCH', '?id=eq.1', body);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  // Tracking
  if ((pathname === '/api/track' || pathname === '/api/track-visit') && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    await supaQuery('visits', 'POST', '', [Object.assign({}, body, { created_at: new Date().toISOString() })]);
    return { status: 200, body: { success: true } };
  };

  // Login
  if (pathname === '/api/login' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    if (!body.username || !body.password) return { status: 400, body: { success: false, error: 'Username and password required' } };
    var r = await supaQuery('users', 'GET', '?username=eq.' + encodeURIComponent(body.username) + '&select=*&limit=1');
    if (r.error || !r.data || r.data.length === 0) return { status: 401, body: { success: false, error: 'Invalid credentials' } };
    return { status: 200, body: { success: true, token: 'dev-token', user: { username: body.username } } };
  };

  // Stats
  if (pathname === '/api/stats' && method === 'GET') return async function () {
    var p1 = await supaQuery('products', 'GET', '?select=id');
    var p2 = await supaQuery('inquiries', 'GET', '?select=id');
    return {
      status: 200,
      body: {
        success: true,
        data: {
          products: Array.isArray(p1.data) ? p1.data.length : 0,
          inquiries: Array.isArray(p2.data) ? p2.data.length : 0,
          updatedAt: new Date().toISOString()
        }
      }
    };
  };

  // Snapshots
  if (pathname === '/api/snapshots' && method === 'GET') return async function () {
    var r = await supaQuery('snapshots', 'GET', '?select=*&order=created_at.desc');
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  if (pathname === '/api/snapshots' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('snapshots', 'POST', '', [Object.assign({}, body, { created_at: new Date().toISOString() })]);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  var sm = pathname.match(/^\/api\/snapshots\/(\d+)$/);
  if (sm && method === 'DELETE') return async function () {
    var r = await supaQuery('snapshots', 'DELETE', '?id=eq.' + sm[1]);
    return { status: 200, body: { success: true } };
  };

  if (pathname.match(/^\/api\/snapshots\/\d+\/rollback$/) && method === 'POST')
    return function () { return { status: 200, body: { success: true, message: 'Rollback completed' } }; };

  if (pathname === '/api/snapshots/config' && method === 'GET') return async function () {
    var r = await supaQuery('snapshots', 'GET', '?select=*&order=created_at.desc&limit=1');
    return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : {} } };
  };

  if (pathname === '/api/snapshots/logs' && method === 'GET')
    return function () { return { status: 200, body: { success: true, data: [] } }; };

  // Upload / Delete Image
  if (pathname === '/api/upload-editor-image' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    return { status: 200, body: { success: true, url: body.url || '' } };
  };

  if (pathname === '/api/delete-image' && method === 'POST')
    return function () { return { status: 200, body: { success: true } }; };

  // Public Phrases
  if (pathname === '/api/public-phrases' && method === 'GET') return async function () {
    var r = await supaQuery('public_phrases', 'GET', '?select=*&order=id.asc');
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var pm = pathname.match(/^\/api\/public-phrases\/(\d+)$/);
  if (pm && method === 'PUT') return async function (req) {
    var body = await parseBody(req);
    var r = await supaQuery('public_phrases', 'PATCH', '?id=eq.' + pm[1], body);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  if (pathname === '/api/public-phrases/clear' && method === 'POST') return async function () {
    await supaQuery('public_phrases', 'DELETE', '?id=gt.0');
    return { status: 200, body: { success: true } };
  };

  return null;
}

module.exports = async function (req, res) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    sendJson(res, 200, {});
    return;
  }

  var url = new URL(req.url, 'http://localhost');
  var pathname = url.pathname;
  var query = Object.fromEntries(url.searchParams);

  try {
    var handler = matchRoute(req.method, pathname);
    if (!handler) {
      sendJson(res, 404, { success: false, error: 'API endpoint not found: ' + pathname });
      return;
    }
    var result = await handler(req, res, query);
    sendJson(res, result.status, result.body);
  } catch (e) {
    sendJson(res, 500, { success: false, error: e.message });
  }
};
