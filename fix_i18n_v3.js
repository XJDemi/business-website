const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');
const backupPath = filePath + '.backup';

// 备份
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log('已创建备份文件');
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

// 提取指定语言块的内容（返回行数组）
function getBlockLines(blockLang) {
  const idx = langBlocks.findIndex(b => b.lang === blockLang);
  if (idx === -1) return null;
  
  const startLine = langBlocks[idx].startLine;
  const endLine = (idx + 1 < langBlocks.length) ? langBlocks[idx + 1].startLine : lines.length;
  
  return lines.slice(startLine, endLine);
}

// 处理块：如果不是最后一个块，将末尾的}改为},
function processBlock(blockLines, isLastBlock) {
  const result = blockLines.slice();
  const lastIdx = result.length - 1;
  const lastLine = result[lastIdx].trim();
  
  if (isLastBlock) {
    // 最后一个块，确保以 } 结尾，没有逗号
    if (lastLine === '},') {
      result[lastIdx] = result[lastIdx].replace(/,$/, '');
    }
  } else {
    // 非最后一个块，确保以 }, 结尾
    if (lastLine === '}') {
      result[lastIdx] = result[lastIdx] + ',';
    }
  }
  
  return result;
}

// 构建en、es、de、fr、it块
let enBlock = getBlockLines('en');
let esBlock = getBlockLines('es');
let deBlock = getBlockLines('de');
let frBlock = getBlockLines('fr');
let itBlock = getBlockLines('it');

// 处理zh块
let zhBlock = getBlockLines('zh');

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

// 第一组（中文）：位置0-20
// 第二组（俄语）：位置21-36
const group1End = zhTopKeys[21].line; // 第二组开始的位置

// 提取第一组的内容（中文）
let zhChineseContent = zhBlock.slice(0, group1End);

// 提取第二组的内容（俄语）
let ruRussianContent = zhBlock.slice(group1End);

// 修复language键
const zhLangStart = zhTopKeys[11].line;
const zhLangEnd = zhTopKeys[12].line;
const zhLangContent = zhBlock.slice(zhLangStart, zhLangEnd).join('\n');

if (/[А-Яа-я]/.test(zhLangContent)) {
  console.log('第一组的language键包含俄语，需要修复为中文');
  
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
  
  zhChineseContent = zhChineseContent.slice(0, zhLangStart).concat(zhLanguageFix, zhChineseContent.slice(zhLangEnd));
}

// 构建新的ru块
// ruRussianContent第一行应该是 "about": { ，需要改成 "ru": { 开头
let ruBlockLines = ruRussianContent.slice();

// 替换第一行：从 "about": { 改为 "ru": {
ruBlockLines[0] = ruBlockLines[0].replace(/^    "about":/, '  "ru": {\n    "about":');

// 组装最终JSON
const allBlocks = [
  { lines: enBlock, isLast: false },
  { lines: zhChineseContent, isLast: false },
  { lines: ruBlockLines, isLast: false },
  { lines: esBlock, isLast: false },
  { lines: deBlock, isLast: false },
  { lines: frBlock, isLast: false },
  { lines: itBlock, isLast: true }
];

const outputLines = ['{'];

for (const block of allBlocks) {
  const processed = processBlock(block.lines, block.isLast);
  outputLines.push(...processed);
}

outputLines.push('}');

const output = outputLines.join('\n');

// 验证
try {
  const parsed = JSON.parse(output);
  console.log('JSON验证通过！');
  console.log('顶级键:', Object.keys(parsed));
  
  // 检查zh部分
  const zhStr = JSON.stringify(parsed.zh);
  const hasRussian = (text) => /[А-Яа-я]/.test(text);
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
  console.log('文件已更新！');
  
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
      console.log(`  ${lang}: 存在, ${Object.keys(verifyData[lang]).length}个键, 包含俄语: ${hasRussian(str)}`);
    } else {
      console.log(`  ${lang}: 不存在`);
    }
  });
  
} catch (e) {
  console.log('JSON验证失败:', e.message);
  console.log('\n输出前3000字符:');
  console.log(output.substring(0, 3000));
}
