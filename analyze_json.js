const fs = require('fs');

// Read the raw file
const raw = fs.readFileSync('i18n/translations.json', 'utf8');

// We need to find key boundaries in the raw text
// Strategy: work with the raw text to identify sections

// Find the line positions of top-level keys
const lines = raw.split('\n');
const topLevelKeys = [];

for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  // Match top-level keys like "en": { or "zh": { etc
  const match = trimmed.match(/^"(en|zh|ru|es|de|fr|it)":\s*\{/);
  if (match) {
    topLevelKeys.push({ key: match[1], line: i });
  }
}

console.log('Top-level key positions:');
topLevelKeys.forEach(k => console.log(`  ${k.key} at line ${k.line + 1}`));

// Find where zh section ends (before ru/es starts)
// zh starts at topLevelKeys[1] (zh)
// The next key after zh should be either ru or es

const zhStart = topLevelKeys.find(k => k.key === 'zh');
const esStart = topLevelKeys.find(k => k.key === 'es');
const deStart = topLevelKeys.find(k => k.key === 'de');

// The misplaced ru content is between zh's admin end and es start
// Let's find the zh section structure by looking at nested keys

// Find all top-level and important nested keys
console.log('\nLooking for misplaced ru section...');

// The approach: find the line where zh's admin section ends
// Then the next top-level key should be ru, but instead it's about (Russian)

// Let's scan for key transitions
const keyTransitions = [];
for (let i = 0; i < lines.length; i++) {
  const trimmed = lines[i].trim();
  // Look for key patterns like "about": {, "services": { etc at the beginning of line
  const keyMatch = trimmed.match(/^"(about|services|advantages|certifications|contact|footer|language|contactBar|home|common|products|cta|biotech|autoparts|instruments|admin|company|lang|nav|hero)":\s*\{/);
  if (keyMatch) {
    // Determine nesting level by indentation
    const indent = lines[i].match(/^(\s*)/)[1].length;
    keyTransitions.push({ key: keyMatch[1], line: i + 1, indent });
  }
}

// Print key transitions with context around the zh/ru boundary
console.log('\nKey transitions (around line 1500-1550):');
keyTransitions.filter(k => k.line >= 1390 && k.line <= 1550).forEach(k => {
  console.log(`  Line ${k.line} (indent ${k.indent}): ${k.key}`);
});

console.log('\nKey transitions (around line 2100-2200):');
keyTransitions.filter(k => k.line >= 2100 && k.line <= 2200).forEach(k => {
  console.log(`  Line ${k.line} (indent ${k.indent}): ${k.key}`);
});