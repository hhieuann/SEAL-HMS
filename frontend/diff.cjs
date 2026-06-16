const fs = require('fs');
const path = require('path');

const dir1 = 'C:\\Users\\steve\\.gemini\\antigravity\\scratch\\seal-hackathon-app\\src';
const dir2 = 'C:\\Users\\steve\\OneDrive\\Máy tính\\seal-hackathon-app\\src';

function getFiles(dir, fileList = []) {
  if (!fs.existsSync(dir)) return fileList;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const stat = fs.statSync(path.join(dir, file));
    if (stat.isDirectory()) {
      if (file !== 'node_modules') {
        getFiles(path.join(dir, file), fileList);
      }
    } else {
      fileList.push(path.join(dir, file));
    }
  }
  return fileList;
}

const files1 = getFiles(dir1).map(f => path.relative(dir1, f));
const files2 = getFiles(dir2).map(f => path.relative(dir2, f));

const allFiles = new Set([...files1, ...files2]);
const added = [];
const removed = [];
const modified = [];

for (const f of allFiles) {
  const f1 = path.join(dir1, f);
  const f2 = path.join(dir2, f);
  
  if (!fs.existsSync(f1)) {
    added.push(f);
  } else if (!fs.existsSync(f2)) {
    removed.push(f);
  } else {
    const content1 = fs.readFileSync(f1, 'utf8');
    const content2 = fs.readFileSync(f2, 'utf8');
    if (content1 !== content2) {
      modified.push(f);
    }
  }
}

console.log('--- Added ---');
console.log(added.join('\n'));
console.log('\n--- Removed ---');
console.log(removed.join('\n'));
console.log('\n--- Modified ---');
console.log(modified.join('\n'));
