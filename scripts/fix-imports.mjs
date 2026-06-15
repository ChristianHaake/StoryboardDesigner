import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../src');

// Recursively find all files
function getAllFiles(dir, extn, files, result, regex) {
  files = files || fs.readdirSync(dir);
  result = result || [];
  regex = regex || new RegExp(`\\${extn}$`);

  for (let i = 0; i < files.length; i++) {
    let file = path.join(dir, files[i]);
    if (fs.statSync(file).isDirectory()) {
      try {
        result = getAllFiles(file, extn, fs.readdirSync(file), result, regex);
      } catch (error) {
        continue;
      }
    } else {
      if (regex.test(file)) {
        result.push(file);
      }
    }
  }
  return result;
}

const allFiles = getAllFiles(srcDir, '.ts').concat(getAllFiles(srcDir, '.tsx')).concat(getAllFiles(srcDir, '.css'));
const allFileBasenames = new Map();
allFiles.forEach(file => {
  const basename = path.basename(file).replace(/\.(tsx?|css)$/, '');
  allFileBasenames.set(basename, file);
});

const dirImports = new Map();
allFiles.forEach(file => {
  if (path.basename(file).startsWith('index.')) {
     dirImports.set(path.basename(path.dirname(file)), file);
  }
});

function resolveImport(currentFilePath, importStr) {
  const basename = path.basename(importStr);
  
  if (allFileBasenames.has(basename)) {
    const targetFile = allFileBasenames.get(basename);
    let relPath = path.relative(path.dirname(currentFilePath), targetFile);
    // remove extension for JS/TS
    if (!relPath.endsWith('.css')) relPath = relPath.replace(/\.tsx?$/, '');
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    return relPath;
  }
  
  if (dirImports.has(basename)) {
    const targetFile = dirImports.get(basename);
    let relPath = path.relative(path.dirname(currentFilePath), path.dirname(targetFile));
    if (!relPath.startsWith('.')) relPath = './' + relPath;
    return relPath;
  }
  
  return null;
}

allFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Replace import ... from '...';
  const importRegex = /(import\s+.*?from\s+['"])([.][./a-zA-Z0-9_-]+)(['"])/g;
  content = content.replace(importRegex, (match, p1, p2, p3) => {
    const absPathTs = path.resolve(path.dirname(file), p2 + '.ts');
    const absPathTsx = path.resolve(path.dirname(file), p2 + '.tsx');
    const absPathIndexTs = path.resolve(path.dirname(file), p2 + '/index.ts');
    const absPathIndexTsx = path.resolve(path.dirname(file), p2 + '/index.tsx');
    
    if (!fs.existsSync(absPathTs) && !fs.existsSync(absPathTsx) && !fs.existsSync(absPathIndexTs) && !fs.existsSync(absPathIndexTsx)) {
      const newImport = resolveImport(file, p2);
      if (newImport) {
        changed = true;
        return p1 + newImport + p3;
      }
    }
    return match;
  });

  // Export from ...
  const exportRegex = /(export\s+.*?from\s+['"])([.][./a-zA-Z0-9_-]+)(['"])/g;
  content = content.replace(exportRegex, (match, p1, p2, p3) => {
    const absPathTs = path.resolve(path.dirname(file), p2 + '.ts');
    const absPathTsx = path.resolve(path.dirname(file), p2 + '.tsx');
    if (!fs.existsSync(absPathTs) && !fs.existsSync(absPathTsx)) {
      const newImport = resolveImport(file, p2);
      if (newImport) {
        changed = true;
        return p1 + newImport + p3;
      }
    }
    return match;
  });

  // Replace side effect imports e.g. import './index.css';
  const sideEffectImportRegex = /(import\s+['"])([.][./a-zA-Z0-9_-]+)(['"])/g;
  content = content.replace(sideEffectImportRegex, (match, p1, p2, p3) => {
    const absPath = path.resolve(path.dirname(file), p2);
    if (!fs.existsSync(absPath)) {
      const newImport = resolveImport(file, p2);
      if (newImport) {
        changed = true;
        return p1 + newImport + p3;
      }
    }
    return match;
  });

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed imports in', path.relative(srcDir, file));
  }
});
