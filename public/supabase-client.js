// Supabase frontend client for direct DB access from pages (B方案)
// Anon key is safe in browser - RLS policies enforce read-only for anon role
(function () {
  const SUPABASE_URL = 'https://idvlvxevkpfkxffivus.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkdmx4ZXZ1ZmtwZnhmaWZmdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTgwNzEsImV4cCI6MjEwMDE3NDA3MX0.NOLE7ocrd1ajfcu4ObHTjYTMwNPWu7F-eD2JtHE1l0g';
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 500;

  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };

  window.SupaQuery = {
    from: function (table) {
      return new SupaTable(SUPABASE_URL, SUPABASE_ANON_KEY, table);
    }
  };

  async function fetchWithRetry(url, options, retries = MAX_RETRIES) {
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || i === retries) {
          return response;
        }
        if (response.status === 404 || response.status === 401 || response.status === 403) {
          return response;
        }
      } catch (err) {
        if (i === retries) throw err;
      }
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (i + 1)));
    }
  }

  function SupaTable(url, key, table) {
    this.baseUrl = `${url}/rest/v1/${table}`;
    this.headers = {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    };
    this.queryParams = [];
  }

  SupaTable.prototype.select = function (fields) {
    this.queryParams.push('select=' + encodeURIComponent(fields || '*'));
    return this;
  };

  SupaTable.prototype.eq = function (col, val) {
    this.queryParams.push(`${encodeURIComponent(col)}=eq.${encodeURIComponent(val)}`);
    return this;
  };

  SupaTable.prototype.neq = function (col, val) {
    this.queryParams.push(`${encodeURIComponent(col)}=neq.${encodeURIComponent(val)}`);
    return this;
  };

  SupaTable.prototype.gt = function (col, val) {
    this.queryParams.push(`${encodeURIComponent(col)}=gt.${encodeURIComponent(val)}`);
    return this;
  };

  SupaTable.prototype.lt = function (col, val) {
    this.queryParams.push(`${encodeURIComponent(col)}=lt.${encodeURIComponent(val)}`);
    return this;
  };

  SupaTable.prototype.ilike = function (col, pattern) {
    this.queryParams.push(`${encodeURIComponent(col)}=ilike.${encodeURIComponent(pattern)}`);
    return this;
  };

  SupaTable.prototype.order = function (col, opts) {
    const dir = opts && opts.ascending === false ? 'desc' : 'asc';
    this.queryParams.push(`order=${encodeURIComponent(col)}.${dir}`);
    return this;
  };

  SupaTable.prototype.limit = function (n) {
    this.queryParams.push(`limit=${n}`);
    return this;
  };

  SupaTable.prototype.offset = function (n) {
    this.queryParams.push(`offset=${n}`);
    return this;
  };

  SupaTable.prototype.count = function () {
    this.headers['Prefer'] = 'return=count';
    return this;
  };

  SupaTable.prototype._url = function () {
    const qs = this.queryParams.length ? '?' + this.queryParams.join('&') : '';
    return this.baseUrl + qs;
  };

  SupaTable.prototype.then = function (resolve, reject) {
    const u = this._url();
    return fetchWithRetry(u, {
      method: 'GET',
      headers: this.headers
    }).then(async r => {
      if (!r.ok) {
        let msg = `Supabase ${r.status}`;
        try { const t = await r.text(); msg += ': ' + t.substring(0, 200); } catch (_) {}
        throw new Error(msg);
      }
      const text = await r.text();
      const data = JSON.parse(text || '[]');
      const countHeader = r.headers.get('Content-Range');
      let totalCount = null;
      if (countHeader) {
        const match = countHeader.match(/\/(\d+)$/);
        if (match) totalCount = parseInt(match[1], 10);
      }
      const result = { data: data, error: null };
      if (totalCount !== null) result.count = totalCount;
      return result;
    }).then(resolve, reject);
  };
})();
