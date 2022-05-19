const fs = require('fs');
const { copy } = require('fs-extra');
const path = require('path');

const rootDir = path.resolve(__dirname, '../');
const outputFolder = path.resolve(rootDir, './dist/');

async function copyRequiredFiles() {
  ['./README.md', './CHANGELOG.md'].forEach((file) => includeFileInBuild(file));

  await copyPackageJson();
  await copyFonts();
}

async function copyFonts() {
  const fontsFolder = path.resolve(rootDir, 'public/fonts');

  return copy(fontsFolder, path.resolve(outputFolder, 'fonts'));
}

async function copyPackageJson() {
  const packageData = fs.readFileSync(
    path.resolve(rootDir, 'package.json'),
    'utf8',
  );
  const {
    author,
    engines,
    peerDependencies,
    dependencies,
    name,
    version,
    description,
    keywords,
    repository,
    sideEffects,
  } = JSON.parse(packageData);
  const newPackageData = {
    name,
    version,
    description,
    keywords,
    repository,
    author,
    engines,
    sideEffects,
    peerDependencies,
    dependencies,
    module: './es/index.js',
    types: './types/index.d.ts',
    main: './cjs/index.js',
    exports: {
      '.': {
        import: './es/index.js',
        require: './cjs/index.js',
      },
      './fonts': {
        default: './fonts',
      },
    },
    private: false,
  };
  const targetPath = path.resolve(outputFolder, './package.json');

  fs.writeFileSync(targetPath, JSON.stringify(newPackageData, null, 2), 'utf8');
  console.log(`Created package.json in ${targetPath}`);
}

function includeFileInBuild(file) {
  const sourcePath = path.resolve(rootDir, file);
  const targetPath = path.resolve(outputFolder, path.basename(file));

  fs.copyFileSync(sourcePath, targetPath);

  console.log(`Copied ${sourcePath} to ${targetPath}`);
}

copyRequiredFiles();
