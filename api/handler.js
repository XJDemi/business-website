// Vercel catch-all API route - handles all /api/* requests

const bcrypt = require('bcryptjs');

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

// Parse multipart/form-data into a flat object of string fields (file parts are skipped;
// images arrive as base64 data URLs in the image_data hidden field)
function parseMultipart(req) {
  return new Promise(function (resolve) {
    var chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () {
      var fields = {};
      try {
        var ct = req.headers['content-type'] || '';
        var bm = /boundary=(?:"([^"]+)"|([^;]+))/i.exec(ct);
        if (!bm) return resolve(fields);
        var boundary = Buffer.from('--' + (bm[1] || bm[2]));
        var buf = Buffer.concat(chunks);
        var start = buf.indexOf(boundary);
        while (start !== -1) {
          var next = buf.indexOf(boundary, start + boundary.length);
          if (next === -1) break;
          // part content sits between (start + boundary + CRLF) and (next - CRLF)
          var part = buf.slice(start + boundary.length + 2, next - 2);
          var headEnd = part.indexOf('\r\n\r\n');
          if (headEnd !== -1) {
            var head = part.slice(0, headEnd).toString('utf8');
            var content = part.slice(headEnd + 4);
            var nm = /name="([^"]*)"/.exec(head);
            if (nm && !/filename="/.test(head)) {
              fields[nm[1]] = content.toString('utf8');
            }
            // file parts ignored: the admin form sends images as base64 data URLs
          }
          start = next;
        }
      } catch (e) {}
      resolve(fields);
    });
  });
}

// Accept both JSON and multipart/form-data bodies
function parseBodyAny(req) {
  var ct = (req.headers['content-type'] || '').toLowerCase();
  if (ct.indexOf('multipart/form-data') !== -1) return parseMultipart(req);
  return parseBody(req);
}

// Upload a base64 data-URL image to the Supabase public storage bucket, return public URL
async function uploadDataUrlImage(dataUrl) {
  var m = /^data:([^;]+);base64,(.*)$/.exec(dataUrl);
  if (!m) return null;
  var contentType = m[1];
  var ext = contentType === 'image/png' ? 'png' : (contentType === 'image/jpeg' ? 'jpg' : 'webp');
  var path = 'products/' + Date.now() + '-' + Math.random().toString(36).slice(2, 10) + '.' + ext;
  var res = await fetch(SUPABASE_URL + '/storage/v1/object/product-images/' + path, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': contentType,
      'x-upsert': 'true'
    },
    body: Buffer.from(m[2], 'base64')
  });
  if (!res.ok) {
    var t = await res.text();
    throw new Error('Image upload failed: ' + res.status + ' ' + t.slice(0, 200));
  }
  return SUPABASE_URL + '/storage/v1/object/public/product-images/' + path;
}

// Build a safe products payload from form fields (whitelist: only columns that exist).
async function buildProductPayload(fields, isUpdate) {
  var body = {};
  ['name', 'industry', 'category', 'description', 'specifications', 'price_range'].forEach(function (k) {
    if (fields[k] !== undefined && fields[k] !== null) body[k] = String(fields[k]);
  });
  // Multi-language SEO fields: admin form sends JSON strings like {"en":"...","zh":"..."}
  ['seo_meta_title', 'seo_meta_description', 'seo_keywords'].forEach(function (k) {
    if (fields[k] === undefined || fields[k] === null || fields[k] === '') return;
    var parsed = null;
    try { parsed = typeof fields[k] === 'string' ? JSON.parse(fields[k]) : fields[k]; } catch (e) { parsed = null; }
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) body[k] = parsed;
  });
  if (fields.seo_image_alt !== undefined && fields.seo_image_alt !== null) body.seo_image_alt = String(fields.seo_image_alt);
  var imageData = typeof fields.image_data === 'string' ? fields.image_data : '';
  if (imageData.indexOf('data:image/') === 0) {
    var url = await uploadDataUrlImage(imageData);
    if (url) body.image_url = url;
    else if (!isUpdate) body.image_url = '';
  } else if (!isUpdate) {
    body.image_url = '';
  }
  // on update, leave image_url untouched unless a new image was uploaded
  return body;
}

// Write products row; if the SEO columns are missing (migration not run yet), retry once
// without seo_* fields so non-SEO edits still succeed, and report a readable warning.
async function writeProduct(method, pathPart, body) {
  var r = await supaQuery('products', method, pathPart, body);
  if (r.error) {
    var msg = extractErrMsg(r.error);
    if (/seo_(meta_title|meta_description|keywords|image_alt)/.test(msg) && /does not exist|42703|column/i.test(msg)) {
      var stripped = {};
      Object.keys(body).forEach(function (k) { if (k.indexOf('seo_') !== 0) stripped[k] = body[k]; });
      var r2 = await supaQuery('products', method, pathPart, stripped);
      if (!r2.error) r2.warning = 'SEO fields were not saved: please run supabase-fix-all.sql in the Supabase SQL editor';
      return r2;
    }
  }
  return r;
}

// Move a row up/down within its industry by swapping sort_order with the neighbor row
async function moveRow(table, id, direction, useIndustry) {
  var g = await supaQuery(table, 'GET', '?id=eq.' + id + '&select=*');
  if (g.error) return { status: 500, body: { success: false, error: extractErrMsg(g.error) } };
  if (!Array.isArray(g.data) || !g.data[0]) return { status: 404, body: { success: false, error: 'Item not found' } };
  var row = g.data[0];
  var qs = '?select=id,sort_order&order=sort_order.asc';
  if (useIndustry && row.industry) qs += '&industry=eq.' + encodeURIComponent(row.industry);
  var list = await supaQuery(table, 'GET', qs);
  if (list.error) return { status: 500, body: { success: false, error: extractErrMsg(list.error) } };
  var rows = Array.isArray(list.data) ? list.data : [];
  var idx = -1;
  for (var i = 0; i < rows.length; i++) { if (String(rows[i].id) === String(id)) { idx = i; break; } }
  if (idx === -1) return { status: 404, body: { success: false, error: 'Item not found in list' } };
  var swapWith = direction === 'up' ? idx - 1 : idx + 1;
  if (swapWith < 0 || swapWith >= rows.length) return { status: 200, body: { success: true } };
  // normalize sort_order by list position, then swap the two rows
  var updates = [];
  for (var j = 0; j < rows.length; j++) {
    var target = j === idx ? swapWith : (j === swapWith ? idx : j);
    if (rows[j].sort_order !== target) {
      updates.push(supaQuery(table, 'PATCH', '?id=eq.' + rows[j].id, { sort_order: target }));
    }
  }
  await Promise.all(updates);
  return { status: 200, body: { success: true } };
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

// Extract a readable message from a Supabase error object
function extractErrMsg(err) {
  if (!err) return 'Unknown error';
  if (typeof err === 'string') return err;
  if (err.message) {
    // err.message may itself be a JSON string from PostgREST
    if (typeof err.message === 'string' && err.message.charAt(0) === '{') {
      try { var parsed = JSON.parse(err.message); if (parsed.message) return parsed.message; } catch (e) {}
    }
    return err.message;
  }
  return JSON.stringify(err);
}

function matchRoute(method, pathname) {
  if (pathname === '/api/health' && method === 'GET')
    return function () { return { status: 200, body: { status: 'ok', time: new Date().toISOString() } }; };

  if (pathname === '/api/products' && method === 'GET')
    return async function (req, res, q) {
      var qs = new URLSearchParams();
      if (q.industry) qs.set('industry', 'eq.' + q.industry);
      if (q.category) qs.set('category', 'eq.' + q.category);
      qs.set('select', '*'); qs.set('order', 'sort_order.asc');
      var r = await supaQuery('products', 'GET', '?' + qs.toString());
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      var rows = Array.isArray(r.data) ? r.data : [];
      return { status: 200, body: { success: true, data: rows, pagination: { currentPage: Number(q.page) || 1, totalPages: 1, totalItems: rows.length } } };
    };

  var pmm = pathname.match(/^\/api\/products\/([^/]+)\/move$/);
  if (pmm && method === 'POST') return async function (req) {
    var b = await parseBody(req);
    return moveRow('products', decodeURIComponent(pmm[1]), b.direction, true);
  };

  var m = pathname.match(/^\/api\/products\/([^/]+)$/);
  if (m) {
    var id = decodeURIComponent(m[1]);
    if (method === 'GET') return async function () {
      var r = await supaQuery('products', 'GET', '?id=eq.' + id + '&select=*');
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : null } };
    };
    if (method === 'PUT') return async function (req) {
      try {
        var body = await buildProductPayload(await parseBodyAny(req), true);
        if (Object.keys(body).length === 0) return { status: 400, body: { success: false, error: 'No valid fields to update' } };
        var r = await writeProduct('PATCH', '?id=eq.' + id, body);
        if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
        var out = { success: true, data: r.data && r.data[0] ? r.data[0] : r.data };
        if (r.warning) out.warning = r.warning;
        return { status: 200, body: out };
      } catch (e) {
        return { status: 500, body: { success: false, error: e.message } };
      }
    };
    if (method === 'DELETE') return async function () {
      var r = await supaQuery('products', 'DELETE', '?id=eq.' + id);
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      return { status: 200, body: { success: true, data: r.data } };
    };
  }

  if (pathname === '/api/products' && method === 'POST') return async function (req) {
    try {
      var fields = await parseBodyAny(req);
      // compute next sort_order (max + 1)
      var mx = await supaQuery('products', 'GET', '?select=sort_order&order=sort_order.desc&limit=1');
      var maxOrder = (Array.isArray(mx.data) && mx.data[0] && typeof mx.data[0].sort_order === 'number') ? mx.data[0].sort_order : -1;
      var body = await buildProductPayload(fields, false);
      if (!body.sort_order) body.sort_order = maxOrder + 1;
      var r = await writeProduct('POST', '', body);
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      var out = { success: true, data: r.data && r.data[0] ? r.data[0] : r.data };
      if (r.warning) out.warning = r.warning;
      return { status: 200, body: out };
    } catch (e) {
      return { status: 500, body: { success: false, error: e.message } };
    }
  };

  if (pathname === '/api/categories' && method === 'GET') return async function (req, res, q) {
    var qs = new URLSearchParams();
    if (q.industry) qs.set('industry', 'eq.' + q.industry);
    qs.set('select', '*'); qs.set('order', 'sort_order.asc');
    var r = await supaQuery('categories', 'GET', '?' + qs.toString());
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var cmm = pathname.match(/^\/api\/categories\/([^/]+)\/move$/);
  if (cmm && method === 'POST') return async function (req) {
    var b = await parseBody(req);
    return moveRow('categories', decodeURIComponent(cmm[1]), b.direction, true);
  };

  var cm = pathname.match(/^\/api\/categories\/([^/]+)$/);
  if (cm) {
    var cid = decodeURIComponent(cm[1]);
    if (method === 'GET') return async function () {
      var r = await supaQuery('categories', 'GET', '?id=eq.' + cid + '&select=*');
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : null } };
    };
    if (method === 'PUT') return async function (req) {
      var body = await parseBody(req);
      // whitelist: only columns that exist in the categories table
      var payload = {};
      ['name', 'industry', 'sort_order'].forEach(function (k) {
        if (body[k] !== undefined && body[k] !== null) payload[k] = body[k];
      });
      if (Object.keys(payload).length === 0) return { status: 400, body: { success: false, error: 'No valid fields to update' } };
      var r = await supaQuery('categories', 'PATCH', '?id=eq.' + cid, payload);
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : r.data } };
    };
    if (method === 'DELETE') return async function () {
      var r = await supaQuery('categories', 'DELETE', '?id=eq.' + cid);
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      return { status: 200, body: { success: true, data: r.data } };
    };
  }

  if (pathname === '/api/categories' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var payload = {};
    ['name', 'industry', 'sort_order'].forEach(function (k) {
      if (body[k] !== undefined && body[k] !== null) payload[k] = body[k];
    });
    var r = await supaQuery('categories', 'POST', '', payload);
    if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
    return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : r.data } };
  };

  if (pathname === '/api/news' && method === 'GET') return async function (req, res, q) {
    var qs = new URLSearchParams();
    if (q.industry) qs.set('industry', 'eq.' + q.industry);
    qs.set('select', '*'); qs.set('order', 'sort_order.asc');
    var r = await supaQuery('news', 'GET', '?' + qs.toString());
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var nm = pathname.match(/^\/api\/news\/([^/]+)$/);
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

  if (pathname === '/api/case-studies' && method === 'GET') return async function (req, res, q) {
    var qs = new URLSearchParams();
    if (q.industry) qs.set('industry', 'eq.' + q.industry);
    qs.set('select', '*'); qs.set('order', 'sort_order.asc');
    var r = await supaQuery('case_studies', 'GET', '?' + qs.toString());
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var csm = pathname.match(/^\/api\/case-studies\/([^/]+)$/);
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

  var im = pathname.match(/^\/api\/inquiries\/([^/]+)$/);
  if (im && method === 'DELETE') return async function () {
    var r = await supaQuery('inquiries', 'DELETE', '?id=eq.' + im[1]);
    if (r.error) return { status: 500, body: { success: false, error: r.error } };
    return { status: 200, body: { success: true, data: r.data } };
  };

  if (pathname === '/api/site-settings' && method === 'GET') return async function () {
    var r = await supaQuery('site_settings', 'GET', '?select=*&limit=1');
    if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
    return { status: 200, body: { success: true, data: r.data && r.data[0] ? r.data[0] : {} } };
  };

  if (pathname === '/api/site-settings' && method === 'PUT') return async function (req) {
    var body = await parseBody(req);
    delete body.id;
    // Find existing settings row (works with any id value)
    var g = await supaQuery('site_settings', 'GET', '?select=id&limit=1');
    if (g.error) return { status: 500, body: { success: false, error: extractErrMsg(g.error) } };
    var existingId = Array.isArray(g.data) && g.data[0] ? g.data[0].id : null;
    if (existingId !== null) {
      var r = await supaQuery('site_settings', 'PATCH', '?id=eq.' + existingId, body);
      if (r.error) return { status: 500, body: { success: false, error: extractErrMsg(r.error) } };
      return { status: 200, body: { success: true, data: r.data } };
    }
    // No row exists -> insert (let DB assign id, avoids identity-column conflicts)
    var r2 = await supaQuery('site_settings', 'POST', '', [body]);
    if (r2.error) return { status: 500, body: { success: false, error: extractErrMsg(r2.error) } };
    return { status: 200, body: { success: true, data: r2.data } };
  };

  if ((pathname === '/api/track' || pathname === '/api/track-visit') && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    await supaQuery('visits', 'POST', '', [Object.assign({}, body, { created_at: new Date().toISOString() })]);
    return { status: 200, body: { success: true } };
  };

  if (pathname === '/api/login' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    if (!body.username || !body.password) return { status: 400, body: { success: false, error: 'Username and password required' } };
    var r = await supaQuery('users', 'GET', '?username=eq.' + encodeURIComponent(body.username) + '&select=*&limit=1');
    if (r.error || !r.data || r.data.length === 0) return { status: 401, body: { success: false, error: 'Invalid credentials' } };
    var stored = r.data[0].password || '';
    var ok = false;
    try {
      ok = await bcrypt.compare(String(body.password), stored);
    } catch (e) {
      // stored value is not a valid bcrypt hash -> plain text fallback
      ok = stored === String(body.password);
    }
    if (!ok) return { status: 401, body: { success: false, error: 'Invalid credentials' } };
    return { status: 200, body: { success: true, token: 'dev-token', user: { username: body.username } } };
  };

  // Change admin password: verifies current password, stores bcrypt hash of new one
  if (pathname === '/api/change-password' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    var username = body.username, currentPassword = body.current_password, newPassword = body.new_password;
    if (!username || !currentPassword || !newPassword) return { status: 400, body: { success: false, error: 'Username, current password and new password are required' } };
    if (String(newPassword).length < 6) return { status: 400, body: { success: false, error: 'New password must be at least 6 characters' } };
    var r = await supaQuery('users', 'GET', '?username=eq.' + encodeURIComponent(username) + '&select=*&limit=1');
    if (r.error || !r.data || r.data.length === 0) return { status: 401, body: { success: false, error: 'Invalid credentials' } };
    var stored = r.data[0].password || '';
    var ok = false;
    try {
      ok = await bcrypt.compare(String(currentPassword), stored);
    } catch (e) {
      ok = stored === String(currentPassword);
    }
    if (!ok) return { status: 401, body: { success: false, error: 'Current password is incorrect' } };
    var hash = await bcrypt.hash(String(newPassword), 10);
    var u = await supaQuery('users', 'PATCH', '?id=eq.' + r.data[0].id, { password: hash });
    if (u.error) return { status: 500, body: { success: false, error: extractErrMsg(u.error) } };
    return { status: 200, body: { success: true } };
  };

  if (pathname === '/api/stats' && method === 'GET') return async function () {
    var p1 = await supaQuery('products', 'GET', '?select=id');
    var p2 = await supaQuery('inquiries', 'GET', '?select=id');
    return { status: 200, body: { success: true, data: { products: Array.isArray(p1.data) ? p1.data.length : 0, inquiries: Array.isArray(p2.data) ? p2.data.length : 0, updatedAt: new Date().toISOString() } } };
  };

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

  var sm = pathname.match(/^\/api\/snapshots\/([^/]+)$/);
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

  if (pathname === '/api/upload-editor-image' && method === 'POST') return async function (req) {
    var body = await parseBody(req);
    return { status: 200, body: { success: true, url: body.url || '' } };
  };

  if (pathname === '/api/delete-image' && method === 'POST')
    return function () { return { status: 200, body: { success: true } }; };

  if (pathname === '/api/public-phrases' && method === 'GET') return async function () {
    var r = await supaQuery('public_phrases', 'GET', '?select=*&order=id.asc');
    return { status: 200, body: { success: true, data: Array.isArray(r.data) ? r.data : [] } };
  };

  var pm = pathname.match(/^\/api\/public-phrases\/([^/]+)$/);
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
