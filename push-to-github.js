// push-to-github.js
// 使用 isomorphic-git 纯JS实现推送到GitHub，无需系统安装Git

const git = require('isomorphic-git');
const http = require('isomorphic-git/http/node');
const fs = require('fs');
const path = require('path');

const REPO_DIR = __dirname;
const GITHUB_REPO_URL = 'https://github.com/XJDemi/business-website.git';
const DEFAULT_AUTHOR = {
  name: 'XJDemi',
  email: 'xjdemi@users.noreply.github.com'
};

// 忽略规则（与.gitignore保持一致 + 额外排除）
const IGNORE_PATTERNS = [
  'node_modules',
  '.git',
  '.env',
  'business-website.zip',
  '*.log',
  '.DS_Store',
  'Thumbs.db'
];

function shouldIgnore(relativePath) {
  const normalized = relativePath.replace(/\\/g, '/');
  for (const pattern of IGNORE_PATTERNS) {
    if (normalized === pattern) return true;
    if (normalized.startsWith(pattern + '/')) return true;
    if (normalized.endsWith('/' + pattern)) return true;
    if (pattern.startsWith('*') && normalized.endsWith(pattern.slice(1))) return true;
  }
  return false;
}

function walkDir(dir, baseDir = dir) {
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath).replace(/\\/g, '/');
    if (shouldIgnore(relativePath)) continue;
    if (entry.isDirectory()) {
      results.push(...walkDir(fullPath, baseDir));
    } else if (entry.isFile()) {
      results.push(relativePath);
    }
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const githubToken = args[0] || process.env.GITHUB_TOKEN;
  const username = args[1] || process.env.GITHUB_USERNAME || 'XJDemi';

  console.log('========================================');
  console.log('Business Website - GitHub Push Script');
  console.log('========================================\n');

  // 1. 检查是否已有Git仓库
  const gitDir = path.join(REPO_DIR, '.git');
  let isNewRepo = !fs.existsSync(gitDir);

  if (isNewRepo) {
    console.log('[1/5] 初始化Git仓库...');
    await git.init({ fs, dir: REPO_DIR, defaultBranch: 'main' });
    console.log('      ✓ Git仓库初始化完成 (默认分支: main)');
  } else {
    console.log('[1/5] 检测到现有Git仓库，跳过初始化');
  }

  // 2. 配置用户信息
  console.log('[2/5] 配置Git用户信息...');
  try {
    await git.config({ fs, dir: REPO_DIR, path: 'user.name', value: DEFAULT_AUTHOR.name });
    await git.config({ fs, dir: REPO_DIR, path: 'user.email', value: DEFAULT_AUTHOR.email });
    console.log('      ✓ 用户信息已配置:', DEFAULT_AUTHOR.name, '<' + DEFAULT_AUTHOR.email + '>');
  } catch (e) {
    console.warn('      ⚠ 配置用户信息失败:', e.message);
  }

  // 3. 添加所有文件到暂存区
  console.log('[3/5] 扫描并添加文件到暂存区...');
  const files = walkDir(REPO_DIR);
  console.log('      找到待跟踪文件数:', files.length);

  let addedCount = 0;
  for (const file of files) {
    try {
      await git.add({ fs, dir: REPO_DIR, filepath: file });
      addedCount++;
      if (addedCount % 100 === 0) {
        console.log(`      已添加 ${addedCount}/${files.length} 个文件...`);
      }
    } catch (e) {
      // 忽略二进制文件或特殊文件的错误
      if (!e.message.includes('ENOENT') && !e.message.includes('binary')) {
        console.warn(`      ⚠ 跳过 ${file}:`, e.message);
      }
    }
  }
  console.log('      ✓ 已添加', addedCount, '个文件到暂存区');

  // 4. 创建提交
  console.log('[4/5] 创建本地提交...');
  const status = await git.statusMatrix({ fs, dir: REPO_DIR });
  const hasChanges = status.some(([ , a, b, c ]) => a !== b || b !== c);

  if (!hasChanges) {
    console.log('      ⓘ 没有变更需要提交');
  } else {
    try {
      const sha = await git.commit({
        fs,
        dir: REPO_DIR,
        message: 'Initial commit - XuanJi Technology business website\n\n- Full-featured Express backend with Supabase\n- Multi-language frontend (7 languages)\n- Multi-industry product pages (Biotech, AutoParts, Instruments)\n- Admin dashboard with product/category management\n- Vercel deployment configured',
        author: DEFAULT_AUTHOR,
        committer: DEFAULT_AUTHOR
      });
      console.log('      ✓ 提交成功! SHA:', sha.substring(0, 8) + '...');
    } catch (e) {
      if (e.message.includes('No changes')) {
        console.log('      ⓘ 无变更可提交');
      } else {
        console.error('      ✗ 提交失败:', e.message);
      }
    }
  }

  // 5. 设置远程并推送
  console.log('[5/5] 推送到 GitHub:', GITHUB_REPO_URL);

  if (!githubToken) {
    console.log('\n========================================');
    console.log('  本地仓库已准备就绪!');
    console.log('========================================\n');
    console.log('  由于缺少 GitHub Token，推送步骤已跳过。');
    console.log('  请使用以下任一方式完成推送：\n');
    console.log('  方式1：再次运行脚本并传入Token:');
    console.log('    node push-to-github.js <your-github-token>');
    console.log('');
    console.log('  方式2：设置环境变量后运行:');
    console.log('    $env:GITHUB_TOKEN="your-token"; node push-to-github.js');
    console.log('');
    console.log('  方式3：安装Git后手动推送:');
    console.log('    git remote add origin ' + GITHUB_REPO_URL);
    console.log('    git branch -M main');
    console.log('    git push -u origin main');
    console.log('\n========================================\n');
    process.exit(0);
  }

  // 检查/添加远程
  try {
    const remotes = await git.listRemotes({ fs, dir: REPO_DIR });
    const originExists = remotes.some(r => r.remote === 'origin');
    if (!originExists) {
      await git.addRemote({ fs, dir: REPO_DIR, remote: 'origin', url: GITHUB_REPO_URL });
      console.log('      ✓ 添加远程 origin:', GITHUB_REPO_URL);
    } else {
      await git.setRemoteUrl({ fs, dir: REPO_DIR, remote: 'origin', url: GITHUB_REPO_URL });
      console.log('      ✓ 更新远程 origin:', GITHUB_REPO_URL);
    }
  } catch (e) {
    console.error('      ✗ 配置远程失败:', e.message);
    process.exit(1);
  }

  console.log('      正在推送中 (首次推送可能需要较长时间)...');
  try {
    const pushResult = await git.push({
      fs,
      http,
      dir: REPO_DIR,
      remote: 'origin',
      ref: 'main',
      auth: {
        username: username,
        password: githubToken
      }
    });

    if (pushResult.ok || pushResult.errors === undefined || (Array.isArray(pushResult.errors) && pushResult.errors.length === 0)) {
      console.log('\n========================================');
      console.log('  ✓ 推送成功!');
      console.log('========================================\n');
      console.log('  项目地址: ' + GITHUB_REPO_URL);
      console.log('\n  温馨提示:');
      console.log('  - 如果是首次推送，GitHub可能需要几分钟显示所有文件');
      console.log('  - 不要将包含真实密钥的 .env 文件提交到公开仓库');
      console.log('  - 如需在 Vercel 部署，按文档配置环境变量即可\n');
    } else {
      console.error('      ✗ 推送返回错误:', JSON.stringify(pushResult.errors, null, 2));
    }
  } catch (e) {
    console.error('\n      ✗ 推送失败!');
    console.error('      错误信息:', e.message);
    if (e.message.includes('401') || e.message.includes('Unauthorized')) {
      console.error('\n      可能原因:');
      console.error('      1. GitHub Token 无效或已过期');
      console.error('      2. Token 没有 repo 权限');
      console.error('      3. 用户名与 Token 不匹配');
    }
    if (e.message.includes('403') || e.message.includes('Forbidden')) {
      console.error('\n      可能原因:');
      console.error('      1. Token 缺少 Repository 写入权限');
      console.error('      2. 账户对该仓库没有写入权限');
    }
    if (e.message.includes('404') || e.message.includes('Not Found')) {
      console.error('\n      可能原因:');
      console.error('      1. 仓库不存在: ' + GITHUB_REPO_URL);
      console.error('      2. 请先在 GitHub 创建空仓库');
      console.error('      3. Token 没有读取权限');
    }
    process.exit(1);
  }
}

main().catch(err => {
  console.error('\n[FATAL] 脚本执行异常:', err.message);
  console.error(err.stack);
  process.exit(1);
});
