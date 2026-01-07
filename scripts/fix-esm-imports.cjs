/**
 * Post-build script to fix ESM imports by adding .js extensions.
 * TypeScript doesn't add extensions to ESM output, which breaks Node.js ESM resolution.
 */
const fs = require('fs');
const path = require('path');

const ESM_DIR = path.resolve(__dirname, '../dist/es');

// Regex to match relative imports without extensions
// Matches: from './foo' or from '../bar' or from './foo/bar'
// But not: from './foo.js' or from 'package-name'
const IMPORT_REGEX = /from\s+['"](\.[^'"]+)['"]/g;
const EXPORT_REGEX = /export\s+\*\s+from\s+['"](\.[^'"]+)['"]/g;
const DYNAMIC_IMPORT_REGEX = /import\s*\(\s*['"](\.[^'"]+)['"]\s*\)/g;
// Side-effect imports: import './foo' or import 'prismjs/components/prism-javascript'
const SIDE_EFFECT_IMPORT_REGEX = /import\s+['"](\.[^'"]+)['"];/g;

// Package imports that need .js extension (they don't include extensions in their exports)
const PACKAGES_NEEDING_JS_EXTENSION = ['prismjs/components/'];

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  const fixImport = (match, importPath) => {
    // Skip if already has extension
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match;
    }

    // Determine the correct extension
    const absolutePath = path.resolve(path.dirname(filePath), importPath);
    
    // Check if it's a directory (index.js) or file
    if (fs.existsSync(absolutePath) && fs.statSync(absolutePath).isDirectory()) {
      // It's a directory, add /index.js
      modified = true;
      return match.replace(importPath, `${importPath}/index.js`);
    } else if (fs.existsSync(`${absolutePath}.js`)) {
      // It's a file, add .js
      modified = true;
      return match.replace(importPath, `${importPath}.js`);
    }
    
    // Couldn't resolve, leave as-is
    return match;
  };

  // Fix package imports that need .js extension
  const fixPackageImport = (match, importPath) => {
    // Skip if already has extension
    if (importPath.endsWith('.js') || importPath.endsWith('.json')) {
      return match;
    }

    // Check if this package needs .js extension
    for (const pkg of PACKAGES_NEEDING_JS_EXTENSION) {
      if (importPath.startsWith(pkg)) {
        modified = true;
        return match.replace(importPath, `${importPath}.js`);
      }
    }

    return match;
  };

  content = content.replace(IMPORT_REGEX, fixImport);
  content = content.replace(EXPORT_REGEX, fixImport);
  content = content.replace(DYNAMIC_IMPORT_REGEX, fixImport);
  content = content.replace(SIDE_EFFECT_IMPORT_REGEX, fixImport);

  // Fix bare package imports (non-relative)
  // Match: import 'package/path' or from 'package/path'
  const BARE_IMPORT_REGEX = /(?:from|import)\s+['"]([^./][^'"]+)['"]/g;
  content = content.replace(BARE_IMPORT_REGEX, fixPackageImport);

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Fixed: ${path.relative(ESM_DIR, filePath)}`);
  }
}

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && entry.name.endsWith('.js')) {
      processFile(fullPath);
    }
  }
}

console.log('Fixing ESM imports in dist/es...');
processDirectory(ESM_DIR);
console.log('Done!');

