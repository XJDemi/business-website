const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let content = fs.readFileSync(serverPath, 'utf8');

const oldCategoriesApi = `app.get('/api/categories', (req, res) => {
  res.json({ success: true, data: categories });
});

app.get('/api/industries', (req, res) => {
  res.json({ success: true, data: industries });
});`;

const newCategoriesApi = `app.get('/api/categories', (req, res) => {
  const { industry } = req.query;
  let items = db.categories || [];
  if (industry) items = items.filter(c => c.industry === industry);
  res.json({ success: true, data: items });
});

app.post('/api/categories', authenticateToken, (req, res) => {
  const { name, industry } = req.body;
  if (!name || !industry) {
    return res.status(400).json({ error: 'Name and industry are required.' });
  }
  const category = {
    id: db.nextCategoryId++,
    name,
    industry,
    created_at: new Date().toISOString()
  };
  if (!db.categories) db.categories = [];
  db.categories.push(category);
  saveDB(db);
  res.json({ success: true, data: category });
});

app.put('/api/categories/:id', authenticateToken, (req, res) => {
  const { name, industry } = req.body;
  const category = db.categories.find(c => c.id === parseInt(req.params.id));
  if (!category) return res.status(404).json({ error: 'Category not found.' });
  category.name = name || category.name;
  category.industry = industry || category.industry;
  saveDB(db);
  res.json({ success: true, data: category });
});

app.delete('/api/categories/:id', authenticateToken, (req, res) => {
  const idx = db.categories.findIndex(c => c.id === parseInt(req.params.id));
  if (idx === -1) return res.status(404).json({ error: 'Category not found.' });
  const hasProducts = db.products.some(p => p.category === db.categories[idx].name);
  if (hasProducts) return res.status(400).json({ error: 'Cannot delete category with products.' });
  db.categories.splice(idx, 1);
  saveDB(db);
  res.json({ success: true, message: 'Category deleted successfully.' });
});

app.get('/api/industries', (req, res) => {
  res.json({ success: true, data: industries });
});`;

content = content.replace(oldCategoriesApi, newCategoriesApi);
fs.writeFileSync(serverPath, content, 'utf8');
console.log('Server updated with category CRUD API');
