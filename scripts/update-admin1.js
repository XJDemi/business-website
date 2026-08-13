const fs = require('fs');
const path = require('path');

const adminPath = path.join(__dirname, '../admin/index.html');
let content = fs.readFileSync(adminPath, 'utf8');

const searchStr = "<li><a href=\"#\" onclick=\"showPage('inquiries')\">Inquiries</a></li>\n          </ul>";

const replaceStr = "<li><a href=\"#\" onclick=\"showPage('categories')\">Categories</a></li>\n            <li><a href=\"#\" onclick=\"showPage('inquiries')\">Inquiries</a></li>\n          </ul>";

content = content.replace(searchStr, replaceStr);
fs.writeFileSync(adminPath, content, 'utf8');
console.log('Sidebar updated');
