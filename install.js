// Installation script - run with: node install.js
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const nodeDir = 'D:\\Program Files\\nodejs';
const projectDir = __dirname;

console.log('=== XuanJi Technology Website Installer ===\n');

// Check node_modules
const nodeModulesPath = path.join(projectDir, 'node_modules');
if (fs.existsSync(nodeModulesPath)) {
  console.log('[1/2] node_modules already exists, skipping installation.');
} else {
  console.log('[1/2] Installing dependencies...');
  try {
    // Set PATH for child process
    const env = { ...process.env, PATH: nodeDir + ';' + (process.env.PATH || '') };
    execSync('npm install --no-audit --no-fund', {
      cwd: projectDir,
      env: env,
      stdio: 'inherit',
      timeout: 300000
    });
    console.log('Dependencies installed successfully!\n');
  } catch (error) {
    console.error('\nERROR: Failed to install dependencies.');
    console.error(error.message);
    process.exit(1);
  }
}

console.log('[2/2] Installation complete!');
console.log('\n=== Next Steps ===');
console.log('1. Run: node server.js');
console.log('2. Visit: http://localhost:8000/');
console.log('3. Admin: http://localhost:8000/admin (admin / admin123)');
