#!/usr/bin/env node
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import prettier from 'prettier';

(async function main() {
  // Run svgo on all svg files in this folder
  try {
    console.log('Optimizing SVGs with svgo...');
    execSync('svgo *.svg', { stdio: 'inherit' });
  } catch (err) {
    console.error('Error running svgo:', err);
    process.exit(1);
  }

  // Get all .svg files in the current directory
  const allFiles = fs.readdirSync(process.cwd());
  const svgFiles = allFiles.filter((file) => file.endsWith('.svg'));

  for (const svgFile of svgFiles) {
    const name = path.basename(svgFile, '.svg');
    const tsxFileName = `${name}Icon.tsx`;

    // Read the original SVG file
    let svgContent = fs.readFileSync(svgFile, 'utf8');

    // Replace '#43436B' with 'currentColor'
    svgContent = svgContent.replace(/(#43436B|#000|#000000)/g, 'currentColor');

    // Ensure the <svg> tag has a viewBox attribute; if not, add one.
    const svgTagMatch = svgContent.match(/<svg\b([^>]*)>/);
    if (svgTagMatch) {
      const svgTag = svgTagMatch[0];
      if (!/viewBox=/.test(svgTag)) {
        // Insert viewBox attribute right after <svg
        const newSvgTag = svgTag.replace('<svg', '<svg viewBox="0 0 24 24"');
        svgContent = svgContent.replace(svgTag, newSvgTag);
      }
    } else {
      console.warn(`No <svg> tag found in ${svgFile}. Skipping file.`);
      continue;
    }

    // Convert dash-case attributes to camelCase (e.g. fill-rule -> fillRule)
    svgContent = svgContent.replace(
      /(\s+)([a-z]+-[a-z0-9-]+)(\s*=)/gi,
      (match, pre, attrName, post) => {
        const camelAttr = attrName.replace(/-([a-z])/g, (_, letter) =>
          letter.toUpperCase(),
        );
        return pre + camelAttr + post;
      },
    );

    // Build the TSX content using the template.
    const tsxTemplate = `
import { wrapIcon } from './wrap-icon';

export const ${name}Icon = wrapIcon(
  '${name}Icon',
  (
    ${svgContent.trim()}
  ),
);
`;

    // Format the content with local Prettier configuration (using babel-ts parser)
    let formattedTSX;
    try {
      formattedTSX = await prettier.format(tsxTemplate, { parser: 'babel-ts' });
    } catch (err) {
      console.error(`Error formatting ${tsxFileName} with Prettier:`, err);
      formattedTSX = tsxTemplate; // Fallback to unformatted version
    }

    // Write the new TSX file
    fs.writeFileSync(tsxFileName, formattedTSX, 'utf8');
    console.log(`Created ${tsxFileName}`);
  }

  // Update index.ts to add new exports and sort them
  const indexPath = path.join(process.cwd(), 'index.ts');
  if (!fs.existsSync(indexPath)) {
    console.error('index.ts not found in the current directory.');
    process.exit(1);
  }

  let indexContent = fs.readFileSync(indexPath, 'utf8');
  const lines = indexContent.split('\n');

  // Locate the line with "export { wrapIcon } from './wrap-icon';"
  const wrapIconLineIndex = lines.findIndex((line) =>
    line.includes("export { wrapIcon } from './wrap-icon';"),
  );
  if (wrapIconLineIndex === -1) {
    console.error("Couldn't find the export { wrapIcon } line in index.ts.");
    process.exit(1);
  }

  // Get the export block above the wrapIcon export
  let headerLines = lines.slice(0, wrapIconLineIndex);
  const footerLines = lines.slice(wrapIconLineIndex);

  // Ensure that for each SVG file there is an export line
  svgFiles.forEach((svgFile) => {
    const name = path.basename(svgFile, '.svg');
    const exportLine = `export { ${name}Icon } from './${name}Icon';`;
    // Add if not already present (ignoring extra whitespace)
    if (!headerLines.some((line) => line.trim() === exportLine)) {
      headerLines.push(exportLine);
    }
  });

  // Remove empty lines and sort the export lines alphabetically
  headerLines = headerLines
    .filter((line) => line.trim() !== '')
    .sort((a, b) => a.localeCompare(b));

  // Reassemble the file content
  const newIndexContent = [...headerLines, ...footerLines].join('\n');

  // Format the updated index.ts with Prettier
  let formattedIndex;
  try {
    formattedIndex = await prettier.format(newIndexContent, {
      parser: 'babel-ts',
    });
  } catch (err) {
    console.error('Error formatting index.ts with Prettier:', err);
    formattedIndex = newIndexContent;
  }

  // Write the updated index.ts
  fs.writeFileSync(indexPath, formattedIndex, 'utf8');
  console.log('Updated index.ts');

  // Remove all initial SVG files
  for (const svgFile of svgFiles) {
    fs.unlinkSync(svgFile);
    console.log(`Removed ${svgFile}`);
  }
})();
