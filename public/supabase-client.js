// Supabase frontend client for direct DB access from pages (B方案)
// Anon key is safe in browser - RLS policies enforce read-only for anon role
(function () {
  const SUPABASE_URL = 'https://idvlvxevkpfkxffivus.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlkdmx4ZXZ1ZmtwZnhmaWZmdnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ1OTgwNzEsImV4cCI6MjEwMDE3NDA3MX0.NOLE7ocrd1ajfcu4ObHTjYTMwNPWu7F-eD2JtHE1l0g';

  window.SUPABASE_CONFIG = {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY
  };

  // Simple fetch wrapper for Supabase PostgREST REST API (no npm dep needed)
  window.SupaQuery = {
    from: function (table) {
      return new SupaTable(SUPABASE_URL, SUPABASE_ANON_KEY, table);
    }
  };

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

  SupaTable.prototype.order = function (col, opts) {
    const dir = opts && opts.ascending === false ? 'desc' : 'asc';
    this.queryParams.push(`order=${encodeURIComponent(col)}.${dir}`);
    return this;
  };

  SupaTable.prototype.limit = function (n) {
    this.queryParams.push(`limit=${n}`);
    return this;
  };

  SupaTable.prototype._url = function () {
    const qs = this.queryParams.length ? '?' + this.queryParams.join('&') : '';
    return this.baseUrl + qs;
  };

  SupaTable.prototype.then = function (resolve, reject) {
    const u = this._url();
    return fetch(u, {
      method: 'GET',
      headers: this.headers
    }).then(async r => {
      if (!r.ok) {
        let msg = `Supabase ${r.status}`;
        try { const t = await r.text(); msg += ': ' + t; } catch (_) {}
        throw new Error(msg);
      }
      const data = await r.json();
      return { data: data, error: null };
    }).then(resolve, reject);
  };
})();
