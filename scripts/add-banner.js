const { readdir, readFile, writeFile } = require('fs/promises');
const { resolve } = require('path');

const dedent = require('dedent');

const pkg = require('../package.json');

const banner = dedent`
  /**
   * @license ${pkg.license}
   * author: ${pkg.author}
   * ${pkg.name} v${pkg.version}
   * Released under the ${pkg.license} license.
   */
`;
const distFolder = resolve(__dirname, '../', 'dist') + '/';

async function getFiles(path = distFolder) {
  const entries = await readdir(path, {
    withFileTypes: true,
  });

  // Get files within the current directory and add a path key to the file objects
  const files = entries
    .filter((file) => !file.isDirectory())
    .filter((file) => file.name.endsWith('.js'))
    .map((file) => ({ ...file, path: path + file.name }));

  // Get folders within the current directory
  const folders = entries.filter((folder) => folder.isDirectory());

  /*
      Add the found files within the subdirectory to the files array by calling the
      current function itself
    */
  for (const folder of folders)
    files.push(...(await getFiles(`${path}${folder.name}/`)));

  return files;
}
getFiles().then((files) =>
  Promise.all(
    files.map(({ path }) =>
      readFile(path)
        .then(
          (file) => `${banner}\n\n${file.toString()}
        `,
        )
        .then((text) => writeFile(path, text, { encoding: 'utf-8' })),
    ),
  ),
);
