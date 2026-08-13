const fs = require('fs');
const path = require('path');

const serverPath = path.join(__dirname, '../server.js');
let content = fs.readFileSync(serverPath, 'utf8');

const searchStr = "app.get('/api/categories', (req, res) => {\n  res.json({ success: true, data: categories });\n});";

const replaceStr = "app.get('/api/categories', (req, res) => {\n  const { industry } = req.query;\n  let items = db.categories || [];\n  if (industry) items = items.filter(c => c.industry === industry);\n  res.json({ success: true, data: items });\n});";

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(serverPath, content, 'utf8');
console.log('Step 1 done');
