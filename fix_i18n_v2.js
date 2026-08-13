const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');

// 读取当前文件（已恢复备份）
const raw = fs.readFileSync(filePath, 'utf8');

// 验证当前文件是否可以解析
try {
  JSON.parse(raw);
  console.log('当前文件可以被JSON.parse解析');
} catch (e) {
  console.log('当前文件无法被JSON.parse解析:', e.message);
  process.exit(1);
}

// 由于JSON.parse会丢失重复键的数据，我们需要手动处理
// 让我先分析当前文件的结构

const lines = raw.split('\n');

// 找到顶级语言块的位置
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

console.log('\n顶级语言块位置:');
langBlocks.forEach(b => {
  console.log(`  ${b.lang}: 行 ${b.startLine + 1}`);
});

// 提取en、es、de、fr、it块（这些是正常的，直接使用）
function getBlockLines(blockLang) {
  const idx = langBlocks.findIndex(b => b.lang === blockLang);
  if (idx === -1) return null;
  
  const startLine = langBlocks[idx].startLine;
  const endLine = (idx + 1 < langBlocks.length) ? langBlocks[idx + 1].startLine : lines.length;
  
  return lines.slice(startLine, endLine);
}

// 检查每个块是否正常
['en', 'zh', 'es', 'de', 'fr', 'it'].forEach(lang => {
  const block = getBlockLines(lang);
  if (block) {
    const blockStr = block.join('\n');
    // 尝试解析这个块
    try {
      const obj = JSON.parse('{' + blockStr.replace(/^\s*"[^"]+":\s*\{/, '').replace(/\}\s*$/, '') + '}');
      console.log(`${lang}: 可以解析`);
    } catch (e) {
      console.log(`${lang}: 无法解析 - ${e.message.substring(0, 50)}`);
    }
  }
});

// 现在我们需要手动处理zh块
// zh块从行785开始，到行2186结束（es开始的位置）
const zhBlock = getBlockLines('zh');
console.log('\nzh块长度:', zhBlock.length, '行');

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
console.log('\nzh块中的顶级键（按顺序）:');
zhTopKeys.forEach((k, i) => {
  console.log(`  ${i}: ${k.key} (相对行 ${k.line + 1})`);
});

// 检查每个键的语言
function hasRussian(text) {
  return /[А-Яа-я]/.test(text);
}

console.log('\nzh块中每个键的语言:');
zhTopKeys.forEach((keyInfo, i) => {
  const nextKey = zhTopKeys[i + 1];
  const keyStart = keyInfo.line;
  const keyEnd = nextKey ? nextKey.line : zhBlock.length;
  const keyContent = zhBlock.slice(keyStart, keyEnd).join('\n');
  const isRussian = hasRussian(keyContent);
  console.log(`  ${keyInfo.key}: ${isRussian ? '俄语' : '中文'}`);
});

// 现在我明白了问题所在：
// - 第一组（位置0-20）：company, lang, nav, hero, about到admin
// - 第二组（位置21+）：about到home
// 
// 但是根据检查结果，第一组中的很多键已经是俄语了！
// 这说明原文件的结构可能更复杂

// 让我检查第一组中每个键的实际内容
console.log('\n第一组键的前几个字符:');
zhTopKeys.slice(0, 5).forEach((keyInfo, i) => {
  const nextKey = zhTopKeys[i + 1];
  const keyStart = keyInfo.line;
  const keyEnd = nextKey ? nextKey.line : zhBlock.length;
  const keyContent = zhBlock.slice(keyStart, keyEnd).join('\n');
  // 只显示前200个字符
  console.log(`  ${keyInfo.key}: ${keyContent.substring(0, 200)}...`);
});
