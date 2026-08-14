let serverless;
let app;
let supabaseReady;
let initError = null;
let expressHandlerCache = null;

// Guard module-level require so top-level crashes don't kill the function
try {
  serverless = require('serverless-http');
  const server = require('../server.js');
  app = server.app;
  supabaseReady = server.supabaseReady;
} catch (e) {
  initError = e;
  console.error('[api/index.js] Module init failed:', e && e.stack ? e.stack : e);
}

const handler = async (req, res) => {
  // If init failed at module level, return diagnostic error
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
    // Wait for Supabase connection (cold start safety)
    if (supabaseReady && typeof supabaseReady.then === 'function') {
      await supabaseReady;
    }
  } catch (e) {
    // Supabase init failure is non-fatal (JSON fallback exists); log and continue
    console.warn('[api/index.js] supabaseReady rejected (will use JSON fallback):', e.message);
  }

  try {
    if (!expressHandlerCache) {
      expressHandlerCache = serverless(app);
    }
    return expressHandlerCache(req, res);
  } catch (e) {
    console.error('[api/index.js] Request handler error:', e && e.stack ? e.stack : e);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({
      error: 'FUNCTION_INVOCATION_FAILED',
      message: e.message || String(e),
    }));
  }
};

module.exports = handler;
// Vercel CJS->ESM interop safety (some runtimes look for .default)
module.exports.default = handler;
