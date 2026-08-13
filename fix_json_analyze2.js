const fs = require('fs');

const raw = fs.readFileSync('i18n/translations.json', 'utf8');
const lines = raw.split('\n');

// Check end of ru section and start of es
console.log('Lines around 2180-2195:');
for (let i = 2179; i < 2195; i++) {
  console.log(`  [${i+1}]: ${lines[i]}`);
}

// Also check end of it section
console.log('\nLast 10 lines of file:');
for (let i = lines.length - 10; i < lines.length; i++) {
  console.log(`  [${i+1}]: ${lines[i]}`);
}

// Check what the zh section looks like when properly closed
// Line 1528 is "    }," which is the end of admin inside zh
// We need to close zh with "  }," after the admin section
console.log('\nLines around 1525-1532:');
for (let i = 1524; i < 1532; i++) {
  console.log(`  [${i+1}]: ${lines[i]}`);
}

// Let me also check the structure of zh admin section
// to understand nesting
console.log('\nZh section admin structure:');
// admin section starts at line 1399
console.log('Line 1399:', lines[1398]);
console.log('Line 1400:', lines[1399]);
console.log('Line 1527:', lines[1526]);
console.log('Line 1528:', lines[1527]);
console.log('Line 1529:', lines[1528]);

// Verify: does zh Chinese section have proper structure?
// It should have: company, lang, nav, hero, about, services, advantages, 
// certifications, contact, footer, language, contactBar, home, common,
// products, cta, biotech, autoparts, instruments, admin
// Let me check if these keys exist in zh Chinese section

const zhChineseContent = lines.slice(784, 1528).join('\n');
const zhKeys = ['company', 'lang', 'nav', 'hero', 'about', 'services', 
  'advantages', 'certifications', 'contact', 'footer', 'language', 
  'contactBar', 'home', 'common', 'products', 'cta', 'biotech', 
  'autoparts', 'instruments', 'admin'];

console.log('\nChecking zh Chinese keys:');
zhKeys.forEach(key => {
  const regex = new RegExp(`"${key}":`);
  const found = regex.test(zhChineseContent);
  console.log(`  ${key}: ${found ? 'YES' : 'MISSING'}`);
});

// Check ru Russian content for keys
const ruRussianContent = lines.slice(1528, 2186).join('\n');
console.log('\nChecking ru Russian keys:');
const ruKeys = ['about', 'services', 'advantages', 'certifications', 'contact', 
  'footer', 'language', 'contactBar', 'common', 'cta', 'biotech', 
  'autoparts', 'instruments', 'admin', 'home'];
ruKeys.forEach(key => {
  const regex = new RegExp(`"${key}":`);
  const found = regex.test(ruRussianContent);
  console.log(`  ${key}: ${found ? 'YES' : 'MISSING'}`);
});

// Check missing ru keys
console.log('\nChecking ru missing keys (should be missing):');
const ruMissingKeys = ['company', 'lang', 'nav', 'hero', 'products'];
ruMissingKeys.forEach(key => {
  const regex = new RegExp(`"${key}":`);
  const found = regex.test(ruRussianContent);
  console.log(`  ${key}: ${found ? 'FOUND (unexpected)' : 'MISSING (expected)'}`);
});