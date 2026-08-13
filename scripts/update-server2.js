const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let content = fs.readFileSync(serverPath, 'utf8');

const searchStr = "app.get('/api/categories', (req, res) => {\n  const { industry } = req.query;\n  let items = db.categories || [];\n  if (industry) items = items.filter(c => c.industry === industry);\n  res.json({ success: true, data: items });\n});";

const replaceStr = "app.get('/api/categories', (req, res) => {\n  const { industry } = req.query;\n  let items = db.categories || [];\n  if (industry) items = items.filter(c => c.industry === industry);\n  res.json({ success: true, data: items });\n});\n\napp.get('/api/categories/:id', (req, res) => {\n  const category = db.categories.find(c => c.id === parseInt(req.params.id));\n  if (!category) return res.status(404).json({ error: 'Category not found.' });\n  res.json({ success: true, data: category });\n});";

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(serverPath, content, 'utf8');
console.log('GET category by ID added');
