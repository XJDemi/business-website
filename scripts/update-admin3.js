const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../admin/index.html');
let content = fs.readFileSync(adminPath, 'utf8');

const searchStr = '<div id="inquiries-content" style="display: none;">';

const replaceStr = `
<div id="categories-content" style="display: none;">
  <div class="card">
    <h2>Category Management</h2>
    <div class="filter-bar">
      <select id="category-filter-industry" onchange="loadCategoriesList()">
        <option value="">All Industries</option>
        <option value="biotech">Biotech</option>
        <option value="autoparts">Auto Parts</option>
        <option value="instruments">Instruments</option>
      </select>
      <button class="btn btn-primary" onclick="showAddCategory()">Add Category</button>
    </div>
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Industry</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody id="categories-table-body"></tbody>
    </table>
  </div>
</div>

<div id="add-category-content" style="display: none;">
  <div class="card">
    <h2>Add New Category</h2>
    <form id="category-form">
      <div class="form-group">
        <label>Category Name *</label>
        <input type="text" name="name" required>
      </div>
      <div class="form-group">
        <label>Industry *</label>
        <select name="industry" required>
          <option value="">Select Industry</option>
          <option value="biotech">Biotech</option>
          <option value="autoparts">Auto Parts</option>
          <option value="instruments">Instruments</option>
        </select>
      </div>
      <div style="display: flex; gap: 15px;">
        <button type="submit" class="btn btn-primary">Save Category</button>
        <button type="button" class="btn btn-secondary" onclick="showPage('categories')">Cancel</button>
      </div>
    </form>
  </div>
</div>

<div id="inquiries-content" style="display: none;">`;

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('Categories content added');
