import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../');

function getAllFiles(dir, extns, files, result) {
  files = files || fs.readdirSync(dir);
  result = result || [];

  for (let i = 0; i < files.length; i++) {
    let file = path.join(dir, files[i]);
    if (fs.statSync(file).isDirectory()) {
      if (file.includes('node_modules') || file.includes('.git') || file.includes('dist')) continue;
      result = getAllFiles(file, extns, fs.readdirSync(file), result);
    } else {
      if (extns.some(ext => file.endsWith(ext))) {
        result.push(file);
      }
    }
  }
  return result;
}

const allFiles = getAllFiles(rootDir, ['.ts', '.tsx', '.json', '.jsonc', '.md', '.html']);

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  if (content.includes('StoryboardDesigner')) {
    content = content.replace(/StoryboardDesigner/g, 'Storyboard-Creator');
    changed = true;
  }
  
  if (content.includes('storyboarddesigner')) {
    content = content.replace(/storyboarddesigner/g, 'storyboard-creator');
    changed = true;
  }
  
  if (content.includes('StoryboardDesigners')) {
    content = content.replace(/StoryboardDesigners/g, 'Storyboard-Creators');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Renamed in', path.relative(rootDir, file));
  }
});
