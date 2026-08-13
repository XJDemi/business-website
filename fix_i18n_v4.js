const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const backupPath = filePath + '.backup';

// 确保有备份
if (!fs.existsSync(backupPath)) {
  console.log('错误: 备份文件不存在！');
  process.exit(1);
}

// 从备份读取（确保使用备份的干净数据）
const rawWithCRLF = fs.readFileSync(backupPath, 'utf8');

// 清理换行符：将 \r\n 统一为 \n
const raw = rawWithCRLF.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

// 写回清理后的文件（备份中可能有CRLF）
fs.writeFileSync(filePath, raw, 'utf8');

// 验证清理后的文件
try {
  JSON.parse(raw);
  console.log('清理后的JSON可以正常解析');
} catch (e) {
  console.log('清理后的JSON无法解析:', e.message);
  process.exit(1);
}

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

// 检查各块
['en', 'es', 'de', 'fr', 'it'].forEach(lang => {
  const block = getBlockLines(lang);
  if (block) {
    console.log(`${lang}块: ${block.length}行, 首行: ${block[0].substring(0, 30)}, 尾行: ${block[block.length-1].substring(0, 30)}`);
  }
});

// 处理zh块
const zhBlock = getBlockLines('zh');
console.log(`\nzh块: ${zhBlock.length}行`);

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
console.log(`zh块中有 ${zhTopKeys.length} 个顶级键`);

// 第一组（中文）：位置0-20
// 第二组（俄语）：位置21-36
const group1EndLine = zhTopKeys[21].line; // 第二组开始的相对行号

console.log(`第一组结束于相对行 ${group1EndLine}（第二组的${zhTopKeys[21].key}键开始处）`);

// 提取第一组的内容（中文）
// 第一组应该从zhBlock的开头到第二组开始之前
// 但需要添加闭合的 } 来结束整个zh对象
let zhChineseContent = zhBlock.slice(0, group1EndLine);

// 添加zh对象的闭合
zhChineseContent.push('  }');

console.log(`第一组（中文）: ${zhChineseContent.length}行`);
console.log(`  首行: ${zhChineseContent[0]}`);
console.log(`  尾行: ${zhChineseContent[zhChineseContent.length-1]}`);

// 提取第二组的内容（俄语）
// 第二组从"about"键开始，到zh块的结尾（但需要去掉原来的闭合）
let ruRussianContent = zhBlock.slice(group1EndLine);

// 去掉原来的结尾（zh块的闭合 }）
if (ruRussianContent[ruRussianContent.length - 1].trim() === '},') {
  ruRussianContent[ruRussianContent.length - 1] = ruRussianContent[ruRussianContent.length - 1].replace(/,$/, '');
}

console.log(`\n第二组（俄语）: ${ruRussianContent.length}行`);
console.log(`  首行: ${ruRussianContent[0]}`);
console.log(`  尾行: ${ruRussianContent[ruRussianContent.length-1]}`);

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
  
  // 注意：zhChineseContent现在包含了闭合的 }
  // 所以需要调整删除的范围
  const oldLangLines = zhChineseContent.slice(zhLangStart, zhLangEnd);
  zhChineseContent = zhChineseContent.slice(0, zhLangStart)
    .concat(zhLanguageFix, zhChineseContent.slice(zhLangEnd));
}

// 构建新的ru块
// ruRussianContent的第一行是 "about": { ...
// 需要改成 "ru": { 开头
let ruBlockLines = ruRussianContent.slice();

// 替换第一行：从 "about": { 改为 "ru": {
ruBlockLines[0] = ruBlockLines[0].replace(
  /^    "about": \{/,
  '  "ru": {\n    "about": {'
);

// 现在组装最终JSON
const outputLines = ['{'];

// 函数：将块添加到输出，并处理逗号
function addBlock(blockLines, isLastBlock) {
  const result = blockLines.slice();
  
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
