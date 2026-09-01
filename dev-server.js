// Local development server for XuanJi Technology
// Serves static files and proxies API requests to the same logic as Vercel
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8080;
const ROOT_DIR = __dirname;
const apiHandler = require('./api/handler.js');

const MIME = {
  '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
  '.webp': 'image/webp', '.gif': 'image/gif', '.woff2': 'font/woff2',
  '.ttf': 'font/ttf', '.map': 'application/json', '.webmanifest': 'application/manifest+json'
};

const CLEAN_URLS = {
  '/admin': '/admin/index.html',
  '/biotech': '/biotech/index.html',
  '/autoparts': '/autoparts/index.html',
  '/instruments': '/instruments/index.html',
  '/about': '/about.html',
  '/contact': '/contact.html',
  '/products': '/products.html'
};

const server = http.createServer(async (req, res) => {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
  if (req.method === 'OPTIONS') { res.writeHead(200); res.end(); return; }

  var urlObj = new URL(req.url, 'http://localhost');
  var pathname = urlObj.pathname;

  // API routes
  if (pathname.startsWith('/api/')) {
    return apiHandler(req, res);
  }

  // Clean URLs
  if (CLEAN_URLS[pathname]) {
    var cleanPath = path.join(ROOT_DIR, CLEAN_URLS[pathname]);
    if (fs.existsSync(cleanPath)) return serveFile(res, cleanPath);
  }

  // Home page
  if (pathname === '/') {
    return serveFile(res, path.join(ROOT_DIR, 'index.html'));
  }

  // Static files from root
  var filePath = path.join(ROOT_DIR, decodeURIComponent(pathname));
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return serveFile(res, filePath);
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not found');
});

function serveFile(res, filePath) {
  var ext = path.extname(filePath).toLowerCase();
  var mime = MIME[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': mime });
  fs.createReadStream(filePath).pipe(res);
}

server.listen(PORT, function () {
  console.log('=====================================');
  console.log('  XuanJi Technology Dev Server');
  console.log('  Local: http://localhost:' + PORT);
  console.log('  API:   http://localhost:' + PORT + '/api/health');
  console.log('=====================================');
});
