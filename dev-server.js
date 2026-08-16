// Local development server for XuanJi Technology
// Serves static files and proxies API requests to the same logic as Vercel
const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS,PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization,apikey');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// Mount API routes - apiApp already has /api/* routes built in
// Only forward requests that start with /api/
const apiApp = require('./api/index.js');
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return apiApp(req, res, next);
  }
  next();
});

// Static file serving
const PUBLIC_DIR = path.join(__dirname, 'public');
const ROOT_DIR = __dirname;

// Serve static files from public/
app.use(express.static(PUBLIC_DIR, {
  maxAge: '1h',
  extensions: ['js', 'css', 'png', 'jpg', 'jpeg', 'svg', 'ico', 'webp', 'gif', 'json', 'woff2', 'ttf']
}));

// Serve root files
app.get(/^\/(.*)\.(html|css|js|png|jpg|jpeg|svg|ico|webp|gif|json|woff2|ttf)$/, (req, res) => {
  const filePath = path.join(ROOT_DIR, req.path);
  if (fs.existsSync(filePath)) {
    return res.sendFile(filePath);
  }
  res.status(404).send('Not found');
});

// Clean URLs
const cleanUrls = {
  '/admin': '/admin/index.html',
  '/biotech': '/biotech/index.html',
  '/autoparts': '/autoparts/index.html',
  '/instruments': '/instruments/index.html',
  '/about': '/about.html',
  '/contact': '/contact.html',
  '/products': '/products.html'
};

Object.keys(cleanUrls).forEach(url => {
  app.get(url, (req, res) => {
    const filePath = path.join(ROOT_DIR, cleanUrls[url]);
    if (fs.existsSync(filePath)) {
      return res.sendFile(filePath);
    }
    res.status(404).send('Page not found');
  });
});

// Home page
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// 404 fallback
app.use((req, res) => {
  res.status(404).send('Page not found');
});

app.listen(PORT, () => {
  console.log(`=====================================`);
  console.log(`  XuanJi Technology Dev Server`);
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  API:   http://localhost:${PORT}/api/health`);
  console.log(`=====================================`);
});
