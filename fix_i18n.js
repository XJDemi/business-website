const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');

// 读取当前文件
const raw = fs.readFileSync(filePath, 'utf8');

// 备份原文件
fs.writeFileSync(filePath + '.backup', raw, 'utf8');
console.log('已创建备份文件');

// 由于原文件结构有问题（重复键），我们采用更简单的方法：
// 1. 使用JSON.parse解析当前文件（会保留最后一个重复键的值）
// 2. 但由于结构问题，我们直接手动构建正确的JSON

// 更简单的方法：使用en、es、de、fr、it块（这些是正常的），
// 然后手动构建zh和ru块

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

// 获取每个语言块的内容（从startLine到下一个语言块的startLine）
function getBlockLines(blockLang) {
  const idx = langBlocks.findIndex(b => b.lang === blockLang);
  if (idx === -1) return null;
  
  const startLine = langBlocks[idx].startLine;
  const endLine = (idx + 1 < langBlocks.length) ? langBlocks[idx + 1].startLine : lines.length;
  
  return lines.slice(startLine, endLine);
}

// 提取正常的语言块（en, es, de, fr, it）
const enLines = getBlockLines('en');
const esLines = getBlockLines('es');
const deLines = getBlockLines('de');
const frLines = getBlockLines('fr');
const itLines = getBlockLines('it');

// 找到zh块的范围
const zhStartIdx = langBlocks.findIndex(b => b.lang === 'zh');
const zhEndLine = langBlocks[zhStartIdx + 1].startLine; // es的开始位置
const zhLines = lines.slice(langBlocks[zhStartIdx].startLine, zhEndLine);

// 提取zh部分的第一组（中文）和第二组（俄语）
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

const zhTopKeys = findTopKeys(zhLines);

// 第一组（中文）：位置0-20
const firstGroupKeyInfo = zhTopKeys.slice(0, 21);
// 第二组（俄语）：位置21+
const secondGroupKeyInfo = zhTopKeys.slice(21);

// 从指定行范围提取键的内容
function extractKeyRange(lineArr, startKeyInfo, endKeyInfo) {
  const start = startKeyInfo.line;
  const end = endKeyInfo ? endKeyInfo.line : lineArr.length;
  return lineArr.slice(start, end);
}

// 提取第一组的每个键的内容
function extractGroupContent(lineArr, keyInfoArr) {
  const result = {};
  for (let i = 0; i < keyInfoArr.length; i++) {
    const keyInfo = keyInfoArr[i];
    const nextKeyInfo = keyInfoArr[i + 1];
    result[keyInfo.key] = {
      start: keyInfo.line,
      end: nextKeyInfo ? nextKeyInfo.line : lineArr.length
    };
  }
  return result;
}

const firstGroupContent = extractGroupContent(zhLines, firstGroupKeyInfo);
const secondGroupContent = extractGroupContent(zhLines, secondGroupKeyInfo);

// 获取en部分的键顺序
const enTopKeys = findTopKeys(enLines);
const enKeyOrder = enTopKeys.map(k => k.key);

// 构建新的zh部分
const zhOutputLines = [];
zhOutputLines.push('  "zh": {');

for (const key of enKeyOrder) {
  if (firstGroupContent[key]) {
    const { start, end } = firstGroupContent[key];
    const keyLines = zhLines.slice(start, end);
    // 跳过第一行（键声明），添加新的键声明
    const firstLine = keyLines[0];
    const braceIdx = firstLine.indexOf('{');
    zhOutputLines.push('    "' + key + '": ' + firstLine.substring(braceIdx));
    for (let i = 1; i < keyLines.length; i++) {
      zhOutputLines.push(keyLines[i]);
    }
  }
}

// 移除最后一个逗号
let zhResult = zhOutputLines.join('\n');
zhResult = zhResult.replace(/,\n  \}$/, '\n  }');

// 构建新的ru部分
const ruOutputLines = [];
ruOutputLines.push('  "ru": {');

for (const key of enKeyOrder) {
  if (secondGroupContent[key]) {
    // 使用俄语内容
    const { start, end } = secondGroupContent[key];
    const keyLines = zhLines.slice(start, end);
    const firstLine = keyLines[0];
    const braceIdx = firstLine.indexOf('{');
    ruOutputLines.push('    "' + key + '": ' + firstLine.substring(braceIdx));
    for (let i = 1; i < keyLines.length; i++) {
      ruOutputLines.push(keyLines[i]);
    }
  } else {
    // 使用en的内容作为占位符（company, lang, nav, hero, products）
    const enKeyInfo = enTopKeys.find(k => k.key === key);
    if (enKeyInfo) {
      const keyIdx = enTopKeys.findIndex(k => k.key === key);
      const nextKeyInfo = keyIdx + 1 < enTopKeys.length ? enTopKeys[keyIdx + 1] : null;
      const start = enKeyInfo.line;
      const end = nextKeyInfo ? nextKeyInfo.line : enLines.length;
      const keyLines = enLines.slice(start, end);
      
      const firstLine = keyLines[0];
      const braceIdx = firstLine.indexOf('{');
      ruOutputLines.push('    "' + key + '": ' + firstLine.substring(braceIdx));
      for (let i = 1; i < keyLines.length; i++) {
        ruOutputLines.push(keyLines[i]);
      }
    }
  }
}

// 移除最后一个逗号
let ruResult = ruOutputLines.join('\n');
ruResult = ruResult.replace(/,\n  \}$/, '\n  }');

// 组装最终结果
// 直接拼接各个块的内容，确保格式正确
function getBlockAsString(lines, isLastBlock) {
  let result = lines.join('\n');
  // 移除原有的逗号
  result = result.replace(/,\n  \}$/, '\n  }');
  // 添加新的逗号（如果不是最后一个块）
  if (!isLastBlock) {
    result = result.replace(/\n  \}$/, '\n  },');
  }
  return result;
}

const enStr = getBlockAsString(enLines, false);
const esStr = getBlockAsString(esLines, false);
const deStr = getBlockAsString(deLines, false);
const frStr = getBlockAsString(frLines, false);
const itStr = getBlockAsString(itLines, true); // 最后一个块，不需要逗号

// 对于zh和ru，添加逗号（如果不是最后）
zhResult = zhResult.replace(/\n  \}$/, '\n  },');
ruResult = ruResult.replace(/\n  \}$/, '\n  },');

// 组装最终JSON
let finalJson = '{\n' + enStr + '\n' + zhResult + '\n' + ruResult + '\n' + esStr + '\n' + deStr + '\n' + frStr + '\n' + itStr;

// 验证JSON是否有效
try {
  JSON.parse(finalJson);
  console.log('JSON验证通过！');
} catch (e) {
  console.log('JSON验证失败:', e.message);
  process.exit(1);
}

// 写入文件
fs.writeFileSync(filePath, finalJson, 'utf8');
console.log('文件已更新！');

// 验证新文件
const newData = JSON.parse(finalJson);
console.log('新文件的语言键:', Object.keys(newData));
console.log('zh部分的键:', Object.keys(newData.zh));
console.log('ru部分的键:', Object.keys(newData.ru));

// 检查zh部分是否全是中文（不包含俄语字符）
function hasRussian(text) {
  return /[А-Яа-я]/.test(text);
}

const zhStr = JSON.stringify(newData.zh);
console.log('\nzh部分是否包含俄语字符:', hasRussian(zhStr));

const ruStr = JSON.stringify(newData.ru);
console.log('ru部分是否包含俄语字符:', hasRussian(ruStr));

// 检查en部分
const enCheckStr = JSON.stringify(newData.en);
console.log('en部分是否包含俄语字符:', hasRussian(enCheckStr));
