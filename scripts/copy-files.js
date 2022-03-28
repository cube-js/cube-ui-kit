const fs = require('fs');
const path = require('path');

function copyRequiredFiles() {
  copyPackageJson();
  ['./README.md'].forEach((file) => includeFileInBuild(file));
}

function copyPackageJson() {
  const packageData = fs.readFileSync(
    path.resolve(__dirname, '../package.json'),
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
    },
    private: false,
  };
  const targetPath = path.resolve(
    __dirname,
    '../',
    './dist/',
    './package.json',
  );

  fs.writeFileSync(targetPath, JSON.stringify(newPackageData, null, 2), 'utf8');
  console.log(`Created package.json in ${targetPath}`);
}

function includeFileInBuild(file) {
  const sourcePath = path.resolve(__dirname, '../', file);
  const targetPath = path.resolve(
    __dirname,
    '../',
    './dist/',
    path.basename(file),
  );

  fs.copyFileSync(sourcePath, targetPath);

  console.log(`Copied ${sourcePath} to ${targetPath}`);
}

copyRequiredFiles();
