const fs = require('fs');

// Read the raw file
const raw = fs.readFileSync('i18n/translations.json', 'utf8');
const lines = raw.split('\n');

// We know:
// - en: lines 2-784
// - zh: lines 785-2186 (but contains misplaced ru from line 1529)
//   - zh Chinese content: lines 785-1528 (company through admin)
//   - ru Russian content: lines 1529-2186 (about through home)
// - es: lines 2187-2856
// - de: lines 2857-3504
// - fr: lines 3505-4152
// - it: lines 4153-end

// Step 1: Extract en section (lines 2-784)
const enLines = lines.slice(1, 784); // 0-indexed: lines[1] to lines[783]
// Verify: line 2 is "en": {, line 784 should be },

// Step 2: Extract zh Chinese content (lines 785-1528)
const zhChineseLines = lines.slice(784, 1528); // 0-indexed: lines[784] to lines[1527]
// This includes everything from "zh": { to the end of admin section

// Step 3: Extract ru Russian content (lines 1529-2186)
const ruRussianLines = lines.slice(1528, 2186); // 0-indexed: lines[1528] to lines[2185]

// Step 4: Extract es section (lines 2187-2856)
const esLines = lines.slice(2186, 2856);

// Step 5: Extract de section (lines 2857-3504)
const deLines = lines.slice(2856, 3504);

// Step 6: Extract fr section (lines 3505-4152)
const frLines = lines.slice(3504, 4152);

// Step 7: Extract it section (lines 4153-end)
const itLines = lines.slice(4152);

console.log('Extracted sections:');
console.log(`  en: ${enLines.length} lines`);
console.log(`  zh Chinese: ${zhChineseLines.length} lines`);
console.log(`  ru Russian: ${ruRussianLines.length} lines`);
console.log(`  es: ${esLines.length} lines`);
console.log(`  de: ${deLines.length} lines`);
console.log(`  fr: ${frLines.length} lines`);
console.log(`  it: ${itLines.length} lines`);

// Now we need to:
// 1. Build proper zh section from zhChineseLines
// 2. Build proper ru section by:
//    a. Adding missing keys (company, lang, nav, hero, products) in Russian
//    b. Adding the Russian content from ruRussianLines
// 3. Reassemble

// For zh section: we need to close it properly
// zhChineseLines ends with the admin section. We need to add closing braces.
// Let's check the last few lines of zhChineseLines
console.log('\nLast 5 lines of zh Chinese:');
for (let i = zhChineseLines.length - 5; i < zhChineseLines.length; i++) {
  console.log(`  [${i+1}]: ${zhChineseLines[i]}`);
}

// For ru section: we need to check the first few lines
console.log('\nFirst 5 lines of ru Russian:');
for (let i = 0; i < 5; i++) {
  console.log(`  [${i+1}]: ${ruRussianLines[i]}`);
}

// Check the ru section structure
// The ruRussianLines start with "about": { (missing the "ru": { wrapper)
// We need to add the missing top-level wrapper and missing keys

// Also check where zh Chinese section's admin ends
// The admin section should end with proper closing braces
// Let me look at what's around line 1528

console.log('\nLines around 1525-1530:');
for (let i = 1524; i < 1530; i++) {
  console.log(`  [${i+1}]: ${lines[i]}`);
}