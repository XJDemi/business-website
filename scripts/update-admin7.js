const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../admin/index.html');
let content = fs.readFileSync(adminPath, 'utf8');

const oldUpdateCategories = "function updateCategories() {\n      const industry = document.getElementById('form-industry').value;\n      const select = document.getElementById('form-category');\n      select.innerHTML = '<option value=\"\">Select Category</option>';\n      \n      if (categories[industry]) {\n        categories[industry].forEach(cat => {\n          const option = document.createElement('option');\n          option.value = cat;\n          option.textContent = cat;\n          select.appendChild(option);\n        });\n      }\n    }";

const newUpdateCategories = "async function updateCategories() {\n      const industry = document.getElementById('form-industry').value;\n      const select = document.getElementById('form-category');\n      select.innerHTML = '<option value=\"\">Select Category</option>';\n      \n      if (industry) {\n        const response = await fetch(`/api/categories?industry=${industry}`);\n        const data = await response.json();\n        if (data.success) {\n          data.data.forEach(cat => {\n            const option = document.createElement('option');\n            option.value = cat.name;\n            option.textContent = cat.name;\n            select.appendChild(option);\n          });\n        }\n      }\n    }";

content = content.replace(oldUpdateCategories, newUpdateCategories);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('updateCategories updated');
