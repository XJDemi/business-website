const fs=require('fs')
const p='../admin/index.html'
let c=fs.readFileSync(p,'utf8')
const s='<div id=\
inquiries-content\'
const r='<div id=\
categories-content\ style=\display:none\><div class=\card\><h2>Categories</h2><table class=\table\><thead><tr><th>ID</th><th>Name</th><th>Industry</th><th>Actions</th></tr></thead><tbody id=\categories-table-body\></tbody></table></div></div><div id=\add-category-content\ style=\display:none\><div class=\card\><h2>Add Category</h2><form id=\category-form\><input type=\text\ name=\name\ placeholder=\Name\><select name=\industry\><option value=\biotech\>Biotech</option></select><button type=\submit\>Save</button></form></div></div><div id=\inquiries-content\'
c=c.replace(s,r)
fs.writeFileSync(p,c)
console.log('done')
