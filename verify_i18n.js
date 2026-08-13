const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'i18n', 'translations.json');

const raw = fs.readFileSync(filePath, 'utf8');
const data = JSON.parse(raw);

console.log('顶级语言键:', Object.keys(data));

// 检查zh部分
function hasRussian(text) {
  return /[А-Яа-я]/.test(text);
}

console.log('\n=== zh部分检查 ===');
console.log('zh部分的键:', Object.keys(data.zh));

const zhStr = JSON.stringify(data.zh);
console.log('zh部分是否包含俄语字符:', hasRussian(zhStr));

// 检查zh部分的每个主要键
for (const [key, value] of Object.entries(data.zh)) {
  if (typeof value === 'object' && value !== null) {
    const str = JSON.stringify(value);
    if (hasRussian(str)) {
      console.log(`  ❌ ${key} 包含俄语字符`);
    } else {
      console.log(`  ✓ ${key} 是中文`);
    }
  }
}

console.log('\n=== ru部分检查 ===');
console.log('ru部分的键:', Object.keys(data.ru));

const ruStr = JSON.stringify(data.ru);
console.log('ru部分是否包含俄语字符:', hasRussian(ruStr));

// 检查ru部分的每个主要键
for (const [key, value] of Object.entries(data.ru)) {
  if (typeof value === 'object' && value !== null) {
    const str = JSON.stringify(value);
    if (hasRussian(str)) {
      console.log(`  ✓ ${key} 是俄语`);
    } else {
      console.log(`  ❌ ${key} 不是俄语（可能是英语占位符）`);
    }
  }
}

console.log('\n=== en部分检查 ===');
const enStr = JSON.stringify(data.en);
console.log('en部分是否包含俄语字符:', hasRussian(enStr));

// 检查en部分的主要键
for (const [key, value] of Object.entries(data.en)) {
  if (typeof value === 'object' && value !== null) {
    const str = JSON.stringify(value);
    if (hasRussian(str)) {
      console.log(`  ⚠️ ${key} 包含俄语字符`);
    }
  }
}

console.log('\n=== 完成 ===');
