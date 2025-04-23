import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('Replacing version in compiled files...');

// Read package.json and extract the version
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version;

// Define the directory where compiled files are located
const distDir = path.resolve(__dirname, '../dist');

// Function to replace version in all .js files in the dist directory
function replaceVersionInFiles(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      replaceVersionInFiles(filePath); // Recurse into subdirectories
    } else if (file.endsWith('.js')) {
      let content = fs.readFileSync(filePath, 'utf8');
      // Replace placeholder with version, wrapped in quotes
      content = content.replace(/__UIKIT_VERSION__/g, `${version}`);
      fs.writeFileSync(filePath, content);
    }
  });
}

// Execute the replacement
replaceVersionInFiles(distDir);
