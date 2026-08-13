const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../admin/index.html');
let content = fs.readFileSync(adminPath, 'utf8');

const searchStr = "document.getElementById('category-form').addEventListener('submit', async (e) => {\n      e.preventDefault();\n      const form = e.target;\n      const id = form.dataset.id;\n      const data = { name: form.name.value, industry: form.industry.value };\n      \n      const url = id ? `/api/categories/${id}` : '/api/categories';\n      const method = id ? 'PUT' : 'POST';\n      \n      const response = await fetch(url, {\n        method: method,\n        headers: { \n          'Content-Type': 'application/json',\n          Authorization: `Bearer ${token}` \n        },\n        body: JSON.stringify(data)\n      });\n      \n      const result = await response.json();\n      if (result.success) {\n        alert(id ? 'Category updated successfully' : 'Category added successfully');\n        delete form.dataset.id;\n        showPage('categories');\n      } else {\n        alert(result.error);\n      }\n    });";

const searchEnd = "document.getElementById('product-form').addEventListener('submit', async (e) => {";

content = content.replace(searchEnd, searchStr + '\n\n    ' + searchEnd);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('Category form handler added');
