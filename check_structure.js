const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const raw = fs.readFileSync(filePath, 'utf8');

// 验证JSON
try {
  const data = JSON.parse(raw);
  console.log('JSON可以正常解析');
  console.log('顶级键:', Object.keys(data));
} catch (e) {
  console.log('JSON解析失败:', e.message);
}

const lines = raw.split('\n');

// 找到所有顶级语言块
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
console.log('\n语言块位置:');
langBlocks.forEach(b => console.log(`  ${b.lang}: 行 ${b.startLine + 1}`));

// 检查zh块
const zhIdx = langBlocks.findIndex(b => b.lang === 'zh');
if (zhIdx !== -1) {
  const zhStart = langBlocks[zhIdx].startLine;
  const zhEnd = (zhIdx + 1 < langBlocks.length) ? langBlocks[zhIdx + 1].startLine : lines.length;
  const zhBlock = lines.slice(zhStart, zhEnd);
  
  console.log('\nzh块长度:', zhBlock.length, '行');
  
  // 找到zh块中的顶级键
  const topKeys = [];
  zhBlock.forEach((line, idx) => {
    const match = line.match(/^    "([^"]+)":\s*\{/);
    if (match) {
      topKeys.push({ key: match[1], line: idx });
    }
  });
  
  console.log('zh块中的顶级键数量:', topKeys.length);
  console.log('\nzh块中的顶级键:');
  topKeys.forEach((k, i) => console.log(`  ${i}: ${k.key} (相对行 ${k.line + 1})`));
  
  // 检查每个键的语言
  function hasRussian(text) {
    return /[А-Яа-я]/.test(text);
  }
  
  console.log('\nzh块中每个键的语言:');
  topKeys.forEach((keyInfo, i) => {
    const nextKey = topKeys[i + 1];
    const keyStart = keyInfo.line;
    const keyEnd = nextKey ? nextKey.line : zhBlock.length;
    const keyContent = zhBlock.slice(keyStart, keyEnd).join('\n');
    const isRussian = hasRussian(keyContent);
    console.log(`  ${keyInfo.key} (位置${i}): ${isRussian ? '俄语' : '中文'}`);
  });
}
