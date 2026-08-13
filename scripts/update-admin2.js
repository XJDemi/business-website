const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../admin/index.html');
let content = fs.readFileSync(adminPath, 'utf8');

const searchStr = '<div id="inquiries-content" style="display: none;">';

const replaceStr = '<div id="categories-content" style="display: none;">\n          <div class="card">\n            <h2>Category Management</h2>\n            <div class="filter-bar">\n              <select id="category-filter-industry" onchange="loadCategoriesList()">\n                <option value="">All Industries</option>\n                <option value="biotech">Biotech</option>\n                <option value="autoparts">Auto Parts</option>\n                <option value="instruments">Instruments</option>\n              </select>\n              <button class="btn btn-primary" onclick="showAddCategory()">Add Category</button>\n            </div>\n            <table class="table">\n              <thead>\n                <tr>\n                  <th>ID</th>\n                  <th>Name</th>\n                  <th>Industry</th>\n                  <th>Actions</th>\n                </tr>\n              </thead>\n              <tbody id="categories-table-body"></tbody>\n            </table>\n          </div>\n        </div>\n\n        <div id="add-category-content" style="display: none;">\n          <div class="card">\n            <h2>Add New Category</h2>\n            <form id="category-form">\n              <div class="form-group">\n                <label>Category Name *</label>\n                <input type="text" name="name" required>\n              </div>\n              <div class="form-group">\n                <label>Industry *</label>\n                <select name="industry" required>\n                  <option value="">Select Industry</option>\n                  <option value="biotech">Biotech</option>\n                  <option value="autoparts">Auto Parts</option>\n                  <option value="instruments">Instruments</option>\n                </select>\n              </div>\n              <div style="display: flex; gap: 15px;">\n                <button type="submit" class="btn btn-primary">Save Category</button>\n                <button type="button" class="btn btn-secondary" onclick="showPage(\\'categories\\')">Cancel</button>\n              </div>\n            </form>\n          </div>\n        </div>\n\n        <div id="inquiries-content" style="display: none;">';

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('Categories content added');
