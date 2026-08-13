const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const backupPath = filePath + '.backup';

// 从备份读取并清理换行符
const raw = fs.readFileSync(backupPath, 'utf8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 解析JSON
const data = JSON.parse(raw);

console.log('当前顶级键:', Object.keys(data));
console.log('zh的键:', Object.keys(data.zh));

// 检查zh部分的language键
function hasRussian(text) {
  return /[А-Яа-я]/.test(text);
}

// 注意：由于JSON.parse会合并重复键，zh.language可能已经被俄语覆盖
console.log('\nzh.language:', JSON.stringify(data.zh.language));
console.log('zh.language包含俄语:', hasRussian(JSON.stringify(data.zh.language)));

// 检查zh.home
console.log('\nzh.home的键:', Object.keys(data.zh.home));

// 现在我需要重新构建正确的结构
// 方法：直接从原文件中提取中文和俄语内容

// 由于JSON.parse会丢失数据，我需要手动处理文本
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
console.log('\n语言块位置:');
langBlocks.forEach(b => console.log(`  ${b.lang}: 行 ${b.startLine + 1}`));

// 获取指定块的行
function getBlockLines(blockLang) {
  const idx = langBlocks.findIndex(b => b.lang === blockLang);
  if (idx === -1) return null;
  const startLine = langBlocks[idx].startLine;
  const endLine = (idx + 1 < langBlocks.length) ? langBlocks[idx + 1].startLine : lines.length;
  return lines.slice(startLine, endLine);
}

// 获取zh块
const zhBlock = getBlockLines('zh');
console.log(`\nzh块: ${zhBlock.length}行`);

// 找到zh块中的所有顶级键
function findTopKeys(lineArr) {
  const keys = [];
  lineArr.forEach((line, idx) => {
    const match = line.match(/^    "([^"]+)":\s*\{/);
    if (match) {
      keys.push({ key: match[1], line: idx });
    }
  });
  return keys;
}

const zhTopKeys = findTopKeys(zhBlock);
console.log(`zh块中有 ${zhTopKeys.length} 个顶级键`);

// 第一组（中文）：索引0-20
// 第二组（俄语）：索引21-36

// 现在我用一种更简单的方法：
// 1. 从zh块中提取第一组的所有键（中文）
// 2. 从zh块中提取第二组的所有键（俄语）
// 3. 修复第一组中的language键
// 4. 构建新的zh和ru对象

// 提取第一组（中文）的每个键
const zhChineseKeys = {};
for (let i = 0; i <= 20; i++) {
  const keyInfo = zhTopKeys[i];
  const nextKey = zhTopKeys[i + 1];
  const start = keyInfo.line;
  const end = nextKey ? nextKey.line : zhBlock.length;
  
  // 提取这个键的内容（从"key": { 到 }）
  const keyLines = zhBlock.slice(start, end);
  const keyContent = keyLines.join('\n');
  
  // 用eval或其他方式提取值
  // 由于这是JSON格式，我可以解析它
  const keyMatch = keyContent.match(/^\s*"([^"]+)":\s*\{([\s\S]*)\}\s*,?\s*$/);
  if (keyMatch) {
    const keyName = keyMatch[1];
    const keyValue = '{' + keyMatch[2] + '}';
    try {
      zhChineseKeys[keyName] = JSON.parse(keyValue);
    } catch (e) {
      console.log(`解析zh键 ${keyName} 失败:`, e.message);
      // 保存原始内容用于调试
      zhChineseKeys[keyName] = keyValue;
    }
  }
}

console.log('\n第一组（中文）键:', Object.keys(zhChineseKeys));

// 修复language键
if (hasRussian(JSON.stringify(zhChineseKeys.language))) {
  console.log('zhChineseKeys.language包含俄语，修复为中文');
  zhChineseKeys.language = {
    zh: "中文",
    en: "英语",
    ru: "俄语",
    es: "西班牙语",
    de: "德语",
    fr: "法语",
    it: "意大利语"
  };
}

// 提取第二组（俄语）的每个键
const ruRussianKeys = {};
for (let i = 21; i <= 36; i++) {
  const keyInfo = zhTopKeys[i];
  const nextKey = zhTopKeys[i + 1];
  const start = keyInfo.line;
  const end = nextKey ? nextKey.line : zhBlock.length;
  
  const keyLines = zhBlock.slice(start, end);
  const keyContent = keyLines.join('\n');
  
  const keyMatch = keyContent.match(/^\s*"([^"]+)":\s*\{([\s\S]*)\}\s*,?\s*$/);
  if (keyMatch) {
    const keyName = keyMatch[1];
    const keyValue = '{' + keyMatch[2] + '}';
    try {
      ruRussianKeys[keyName] = JSON.parse(keyValue);
    } catch (e) {
      console.log(`解析ru键 ${keyName} 失败:`, e.message);
      ruRussianKeys[keyName] = keyValue;
    }
  }
}

console.log('第二组（俄语）键:', Object.keys(ruRussianKeys));

// 构建最终的数据对象
const finalData = {
  en: data.en,
  zh: zhChineseKeys,
  ru: ruRussianKeys,
  es: data.es,
  de: data.de,
  fr: data.fr,
  it: data.it
};

// 验证
try {
  const output = JSON.stringify(finalData, null, 2);
  const parsed = JSON.parse(output);
  console.log('\n最终JSON验证通过！');
  console.log('顶级键:', Object.keys(parsed));
  
  // 检查zh
  const zhStr = JSON.stringify(parsed.zh);
  console.log('zh部分包含俄语字符:', hasRussian(zhStr));
  
  // 检查ru
  if (parsed.ru) {
    const ruStr = JSON.stringify(parsed.ru);
    console.log('ru部分包含俄语字符:', hasRussian(ruStr));
  }
  
  // 写回文件
  fs.writeFileSync(filePath, output, 'utf8');
  console.log('\n文件已更新！');
  
  // 验证各部分
  console.log('\n各语言部分检查:');
  ['en', 'zh', 'ru', 'es', 'de', 'fr', 'it'].forEach(lang => {
    if (parsed[lang]) {
      const str = JSON.stringify(parsed[lang]);
      const keys = Object.keys(parsed[lang]);
      console.log(`  ${lang}: ✅ 存在, ${keys.length}个顶级键, 包含俄语: ${hasRussian(str)}`);
    } else {
      console.log(`  ${lang}: ❌ 不存在`);
    }
  });
  
} catch (e) {
  console.log('\n最终JSON验证失败:', e.message);
}
