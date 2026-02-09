const fs = require('fs');
const path = require('path');

function copyRequiredFiles() {
  copyPackageJson();
  ['./README.md', './CHANGELOG.md', './tasty.config.ts'].forEach((file) => includeFileInBuild(file));
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
    license,
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
    license,
    type: 'module',
    module: './es/index.js',
    types: './types/index.d.ts',
    main: './es/index.js',
    exports: {
      '.': {
        import: './es/index.js',
        require: './cjs/index.js',
        types: './types/index.d.ts',
      },
      './tasty/static': {
        import: './es/tasty/static/index.js',
        types: './types/tasty/static/index.d.ts',
      },
      './tasty/zero/babel': {
        import: './es/tasty/zero/babel.js',
        types: './types/tasty/zero/babel.d.ts',
      },
      './tasty.config': './tasty.config.ts',
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
