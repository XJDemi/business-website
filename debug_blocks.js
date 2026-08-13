const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const raw = fs.readFileSync(filePath, 'utf8');
const lines = raw.split('\n');

// 提取所有顶级语言块
function findLangBlocks(lineArr) {
  const blocks = [];
  for (let i = 0; i < lineArr.length; i++) {
    const line = lineArr[i];
    const match = line.match(/^  "(en|zh|ru|es|de|fr|it)":\s*\{/);
    if (match) {
      blocks.push({
        lang: match[1],
        startLine: i
      });
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

// 检查每个块的结构
['en', 'zh', 'es', 'de', 'fr', 'it'].forEach(lang => {
  const block = getBlockLines(lang);
  if (block) {
    console.log(`\n=== ${lang}块 (${block.length}行) ===`);
    console.log('第一行:', JSON.stringify(block[0]));
    console.log('最后一行:', JSON.stringify(block[block.length - 1]));
    console.log('倒数第二行:', block.length > 1 ? JSON.stringify(block[block.length - 2]) : 'N/A');
  }
});

// 检查en块的最后20行
console.log('\n\nen块的最后20行:');
const enBlock = getBlockLines('en');
const last20 = enBlock.slice(-20);
last20.forEach((line, i) => {
  console.log(`${enBlock.length - 20 + i}: ${JSON.stringify(line)}`);
});

// 检查zhChineseContent（第一组）的结构
console.log('\n\n=== zhChineseContent (第一组) ===');
const zhBlock = getBlockLines('zh');

// 找到zh块中的顶级键
function findTopKeys(lineArr) {
  const keys = [];
  const keyRegex = /^    "([^"]+)":\s*\{/;
  lineArr.forEach((line, idx) => {
    const match = line.match(keyRegex);
    if (match) {
      keys.push({ key: match[1], line: idx });
    }
  });
  return keys;
}

const zhTopKeys = findTopKeys(zhBlock);
const group1End = zhTopKeys[21].line;
const zhChineseContent = zhBlock.slice(0, group1End);

console.log('行数:', zhChineseContent.length);
console.log('第一行:', JSON.stringify(zhChineseContent[0]));
console.log('最后一行:', JSON.stringify(zhChineseContent[zhChineseContent.length - 1]));
console.log('倒数第二行:', zhChineseContent.length > 1 ? JSON.stringify(zhChineseContent[zhChineseContent.length - 2]) : 'N/A');

// 检查zhChineseContent的最后20行
console.log('\nzhChineseContent的最后20行:');
const zhLast20 = zhChineseContent.slice(-20);
zhLast20.forEach((line, i) => {
  console.log(`${zhChineseContent.length - 20 + i}: ${JSON.stringify(line)}`);
});

// 检查ruRussianContent（第二组）的结构
console.log('\n\n=== ruRussianContent (第二组) ===');
const ruRussianContent = zhBlock.slice(group1End);
console.log('行数:', ruRussianContent.length);
console.log('第一行:', JSON.stringify(ruRussianContent[0]));
console.log('最后一行:', JSON.stringify(ruRussianContent[ruRussianContent.length - 1]));
