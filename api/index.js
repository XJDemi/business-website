let app;
let supabaseReady;
let initError = null;

try {
  const server = require('../server.js');
  app = server.app;
  supabaseReady = server.supabaseReady;
} catch (e) {
  initError = e;
  console.error('[api/index.js] Module init failed:', e && e.stack ? e.stack : e);
}

// Vercel @vercel/node runtime supports Express app directly.
// We wrap it to ensure supabaseReady is awaited and init errors are surfaced.
const handler = async (req, res) => {
  if (initError) {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'Server module failed to initialize',
      message: initError.message || String(initError),
    }));
    return;
  }

  try {
    if (supabaseReady && typeof supabaseReady.then === 'function') {
      await supabaseReady;
    }
  } catch (e) {
    console.warn('[api/index.js] supabaseReady rejected (will use JSON fallback):', e.message);
  }

  try {
    // Vercel passes Node-style (req, res) directly to Express app
    return app(req, res);
  } catch (e) {
    console.error('[api/index.js] Request handler error:', e && e.stack ? e.stack : e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'INTERNAL_SERVER_ERROR',
      message: e.message || String(e),
    }));
  }
};

module.exports = handler;
module.exports.default = handler;
