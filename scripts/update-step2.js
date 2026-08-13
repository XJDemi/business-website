const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let content = fs.readFileSync(serverPath, 'utf8');

const searchStr = "app.get('/api/industries', (req, res) => {\n  res.json({ success: true, data: industries });\n});";

const replaceStr = "app.post('/api/categories', authenticateToken, (req, res) => {\n  const { name, industry } = req.body;\n  if (!name || !industry) {\n    return res.status(400).json({ error: 'Name and industry are required.' });\n  }\n  const category = {\n    id: db.nextCategoryId++,\n    name,\n    industry,\n    created_at: new Date().toISOString()\n  };\n  if (!db.categories) db.categories = [];\n  db.categories.push(category);\n  saveDB(db);\n  res.json({ success: true, data: category });\n});\n\napp.put('/api/categories/:id', authenticateToken, (req, res) => {\n  const { name, industry } = req.body;\n  const category = db.categories.find(c => c.id === parseInt(req.params.id));\n  if (!category) return res.status(404).json({ error: 'Category not found.' });\n  category.name = name || category.name;\n  category.industry = industry || category.industry;\n  saveDB(db);\n  res.json({ success: true, data: category });\n});\n\napp.delete('/api/categories/:id', authenticateToken, (req, res) => {\n  const idx = db.categories.findIndex(c => c.id === parseInt(req.params.id));\n  if (idx === -1) return res.status(404).json({ error: 'Category not found.' });\n  const hasProducts = db.products.some(p => p.category === db.categories[idx].name);\n  if (hasProducts) return res.status(400).json({ error: 'Cannot delete category with products.' });\n  db.categories.splice(idx, 1);\n  saveDB(db);\n  res.json({ success: true, message: 'Category deleted successfully.' });\n});\n\napp.get('/api/industries', (req, res) => {\n  res.json({ success: true, data: industries });\n});";

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(serverPath, content, 'utf8');
console.log('Step 2 done');
