const fs = require('fs');
const path = require('path');

const backupPath = path.join(__dirname, 'i18n', 'translations.json.backup');
const raw = fs.readFileSync(backupPath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

const lines = raw.split('\n');

// 找到所有顶级语言块
function findLangBlocks(lineArr) {
  const blocks = [];
  for (let i = 0; i < lineArr.length; i++) {
    const line = lineArr[i];
    const match = line.match(/^  "(en|zh|ru|es|de|fr|it)":\s*\{/);
    if (match) {
      blocks.push({ lang: match[1], startLine: i });
    }
  }
  return blocks;
}

const langBlocks = findLangBlocks(lines);

function getBlockLines(blockLang) {
  const idx = langBlocks.findIndex(b => b.lang === blockLang);
  if (idx === -1) return null;
  const startLine = langBlocks[idx].startLine;
  const endLine = (idx + 1 < langBlocks.length) ? langBlocks[idx + 1].startLine : lines.length;
  return lines.slice(startLine, endLine);
}

// 检查en块的language键
console.log('=== 检查en块的language键 ===');
const enBlock = getBlockLines('en');
const enTopKeys = [];
enBlock.forEach((line, idx) => {
  const match = line.match(/^    "([^"]+)":\s*\{/);
  if (match) {
    enTopKeys.push({ key: match[1], line: idx });
  }
});

console.log('en块的顶级键:');
enTopKeys.forEach((k, i) => console.log(`  ${i}: ${k.key}`));

// 提取en.language
const enLangIdx = enTopKeys.findIndex(k => k.key === 'language');
if (enLangIdx !== -1) {
  const enLangStart = enTopKeys[enLangIdx].line;
  const enLangEnd = enTopKeys[enLangIdx + 1] ? enTopKeys[enLangIdx + 1].line : enBlock.length;
  const enLangContent = enBlock.slice(enLangStart, enLangEnd).join('\n');
  console.log('\nen.language内容:');
  console.log(enLangContent);
}

// 检查zh块的结构
console.log('\n\n=== 检查zh块结构 ===');
const zhBlock = getBlockLines('zh');
const zhTopKeys = [];
zhBlock.forEach((line, idx) => {
  const match = line.match(/^    "([^"]+)":\s*\{/);
  if (match) {
    zhTopKeys.push({ key: match[1], line: idx });
  }
});

console.log('zh块的顶级键（37个）:');
zhTopKeys.forEach((k, i) => {
  // 标记哪些是第一组，哪些是第二组
  const group = i <= 20 ? '第一组(中文)' : '第二组(俄语)';
  console.log(`  ${i}: ${k.key} (${group}, 相对行${k.line})`);
});

// 检查第二组（俄语）缺少了哪些键
console.log('\n=== 第二组（俄语）缺少的键 ===');
const group1Keys = zhTopKeys.slice(0, 21).map(k => k.key);
const group2Keys = zhTopKeys.slice(21).map(k => k.key);
console.log('第一组的键:', group1Keys);
console.log('第二组的键:', group2Keys);

const missingInGroup2 = group1Keys.filter(k => !group2Keys.includes(k));
console.log('第二组缺少的键:', missingInGroup2);

// 检查contact键在第二组中是否存在
const contactInGroup2 = zhTopKeys.filter((k, i) => i > 20 && k.key === 'contact');
console.log('\n第二组中的contact键:', contactInGroup2.length > 0 ? '存在' : '不存在');
