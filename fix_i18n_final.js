const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const backupPath = filePath + '.backup';

// 确保有备份
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log('已创建备份文件');
} else {
  console.log('备份文件已存在');
}

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
console.log('语言块位置:');
langBlocks.forEach(b => console.log(`  ${b.lang}: 行 ${b.startLine + 1}`));

// 提取指定语言块的内容（返回行数组）
function getBlockLines(blockLang) {
  const idx = langBlocks.findIndex(b => b.lang === blockLang);
  if (idx === -1) return null;
  
  const startLine = langBlocks[idx].startLine;
  const endLine = (idx + 1 < langBlocks.length) ? langBlocks[idx + 1].startLine : lines.length;
  
  return lines.slice(startLine, endLine);
}

// 构建en、es、de、fr、it块（这些是正常的）
const enBlock = getBlockLines('en');
const esBlock = getBlockLines('es');
const deBlock = getBlockLines('de');
const frBlock = getBlockLines('fr');
const itBlock = getBlockLines('it');

// 处理zh块
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
console.log('\nzh块中有', zhTopKeys.length, '个顶级键');

// 第一组（中文）：位置0-20
// 第二组（俄语）：位置21-36
const group1EndLine = zhTopKeys[21].line; // 第二组开始的相对行号

// 提取第一组的内容（中文）
let zhChineseContent = zhBlock.slice(0, group1EndLine);

// 提取第二组的内容（俄语）
let ruRussianContent = zhBlock.slice(group1EndLine);

console.log('第一组（中文）行数:', zhChineseContent.length);
console.log('第二组（俄语）行数:', ruRussianContent.length);

// 修复第一组中的language键（位置11）
const zhLangStart = zhTopKeys[11].line;
const zhLangEnd = zhTopKeys[12].line;
const zhLangContent = zhBlock.slice(zhLangStart, zhLangEnd).join('\n');

function hasRussian(text) {
  return /[А-Яа-я]/.test(text);
}

if (hasRussian(zhLangContent)) {
  console.log('\n第一组的language键包含俄语，修复为中文');
  
  const zhLanguageFix = [
    '    "language": {',
    '      "zh": "中文",',
    '      "en": "英语",',
    '      "ru": "俄语",',
    '      "es": "西班牙语",',
    '      "de": "德语",',
    '      "fr": "法语",',
    '      "it": "意大利语"',
    '    },'
  ];
  
  zhChineseContent = zhChineseContent.slice(0, zhLangStart)
    .concat(zhLanguageFix, zhChineseContent.slice(zhLangEnd));
}

// 构建新的ru块
// ruRussianContent的第一行是 "about": { ...
// 需要改成 "ru": { 开头
let ruBlockLines = ruRussianContent.slice();

// 替换第一行：从 "about": { 改为 "ru": {
// 原第一行:     "about": {
// 改为:         "ru": {
//                 "about": {
ruBlockLines[0] = ruBlockLines[0].replace(
  /^    "about": \{/,
  '  "ru": {\n    "about": {'
);

// 处理块的结尾
// 原zh块以 "home": { ... } 结尾，没有闭合整个zh块的 }
// 我们需要确保ru块以 } 结尾

// 现在组装最终JSON
// 每个块的结构是：
//   "lang": {
//     ...
//   },
// 但需要注意第一个块和最后一个块的特殊处理

const outputLines = ['{'];

// 函数：将块添加到输出，并处理逗号
function addBlock(blockLines, isLastBlock) {
  // 获取块的所有行
  const result = blockLines.slice();
  
  // 找到块的最后一行，确保格式正确
  const lastIdx = result.length - 1;
  const lastLine = result[lastIdx].trim();
  
  if (isLastBlock) {
    // 最后一个块，确保没有逗号
    if (lastLine.endsWith(',')) {
      result[lastIdx] = result[lastIdx].replace(/,$/, '');
    }
  } else {
    // 非最后一个块，确保以逗号结尾
    if (!lastLine.endsWith(',')) {
      result[lastIdx] = result[lastIdx] + ',';
    }
  }
  
  outputLines.push(...result);
}

// 添加所有块
addBlock(enBlock, false);
addBlock(zhChineseContent, false);
addBlock(ruBlockLines, false);
addBlock(esBlock, false);
addBlock(deBlock, false);
addBlock(frBlock, false);
addBlock(itBlock, true); // 最后一个块

outputLines.push('}');

const output = outputLines.join('\n');

// 验证
try {
  const parsed = JSON.parse(output);
  console.log('\nJSON验证通过！');
  console.log('顶级键:', Object.keys(parsed));
  
  // 检查zh部分
  const zhStr = JSON.stringify(parsed.zh);
  console.log('zh部分包含俄语字符:', hasRussian(zhStr));
  
  // 检查ru部分
  if (parsed.ru) {
    const ruStr = JSON.stringify(parsed.ru);
    console.log('ru部分包含俄语字符:', hasRussian(ruStr));
  } else {
    console.log('错误: ru部分不存在！');
  }
  
  // 写入文件
  fs.writeFileSync(filePath, output, 'utf8');
  console.log('\n文件已更新！');
  
  // 重新读取验证
  const verifyRaw = fs.readFileSync(filePath, 'utf8');
  const verifyData = JSON.parse(verifyRaw);
  console.log('验证: 文件可以正常解析');
  console.log('验证: 顶级语言键', Object.keys(verifyData));
  
  // 检查各部分
  console.log('\n各语言部分检查:');
  ['en', 'zh', 'ru', 'es', 'de', 'fr', 'it'].forEach(lang => {
    if (verifyData[lang]) {
      const str = JSON.stringify(verifyData[lang]);
      const keys = Object.keys(verifyData[lang]);
      console.log(`  ${lang}: ✅ 存在, ${keys.length}个顶级键, 包含俄语: ${hasRussian(str)}`);
    } else {
      console.log(`  ${lang}: ❌ 不存在`);
    }
  });
  
} catch (e) {
  console.log('\nJSON验证失败:', e.message);
  console.log('\n输出前3000字符:');
  console.log(output.substring(0, 3000));
  console.log('\n...');
  console.log('输出后1000字符:');
  console.log(output.substring(output.length - 1000));
}
