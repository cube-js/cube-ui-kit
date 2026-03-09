#!/usr/bin/env node

/**
 * Replaces every `<Controls ... />` tag in *.docs.mdx files with an explicit
 * definition-list of properties extracted from the matching *.stories.tsx argTypes.
 *
 * Re-runnable: `git checkout -- $(git diff --name-only -- '*.docs.mdx')`
 * then run this script again.
 */

import { parse } from '@babel/parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── helpers ───────────────────────────────────────────────────────────

function findMdxFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory() && entry.name !== 'node_modules') {
      results.push(...findMdxFiles(full));
    } else if (entry.name.endsWith('.docs.mdx')) {
      results.push(full);
    }
  }
  return results;
}

// ─── AST value extraction ──────────────────────────────────────────────

function astToJS(node) {
  if (!node) return undefined;

  switch (node.type) {
    case 'StringLiteral':
      return node.value;
    case 'NumericLiteral':
      return node.value;
    case 'BooleanLiteral':
      return node.value;
    case 'NullLiteral':
      return null;
    case 'Identifier':
      if (node.name === 'undefined') return undefined;
      return node.name;
    case 'UnaryExpression':
      if (node.operator === '-' && node.argument.type === 'NumericLiteral') {
        return -node.argument.value;
      }
      return undefined;
    case 'ArrayExpression':
      return node.elements.map(astToJS);
    case 'ObjectExpression': {
      const obj = {};
      for (const prop of node.properties) {
        if (prop.type === 'ObjectProperty') {
          const key =
            prop.key.type === 'Identifier' ? prop.key.name : prop.key.value;
          obj[key] = astToJS(prop.value);
        }
      }
      return obj;
    }
    case 'TemplateLiteral':
      if (
        node.expressions.length === 0 &&
        node.quasis.length === 1
      ) {
        return node.quasis[0].value.cooked;
      }
      return undefined;
    default:
      return undefined;
  }
}

function extractArgTypes(storiesPath) {
  const code = fs.readFileSync(storiesPath, 'utf-8');
  let ast;
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['typescript', 'jsx'],
    });
  } catch {
    return null;
  }

  // Find default export -> argTypes
  for (const stmt of ast.program.body) {
    let objectExpr;

    if (
      stmt.type === 'ExportDefaultDeclaration' &&
      stmt.declaration.type === 'ObjectExpression'
    ) {
      objectExpr = stmt.declaration;
    } else if (
      stmt.type === 'ExportDefaultDeclaration' &&
      stmt.declaration.type === 'TSAsExpression'
    ) {
      objectExpr = stmt.declaration.expression;
    } else if (
      stmt.type === 'ExportDefaultDeclaration' &&
      stmt.declaration.type === 'TSSatisfiesExpression'
    ) {
      objectExpr = stmt.declaration.expression;
    }

    if (!objectExpr || objectExpr.type !== 'ObjectExpression') continue;

    const argTypesProp = objectExpr.properties.find(
      (p) =>
        p.type === 'ObjectProperty' &&
        p.key.type === 'Identifier' &&
        p.key.name === 'argTypes',
    );

    if (!argTypesProp) return null;

    const argTypesObj = argTypesProp.value;
    if (argTypesObj.type !== 'ObjectExpression') return null;

    const result = {};
    for (const prop of argTypesObj.properties) {
      if (prop.type !== 'ObjectProperty') continue;
      const name =
        prop.key.type === 'Identifier' ? prop.key.name : String(prop.key.value);
      result[name] = astToJS(prop.value);
    }
    return result;
  }
  return null;
}

// ─── type inference ────────────────────────────────────────────────────

function inferType(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // table.type.summary takes priority
  if (entry.table?.type?.summary) {
    return `\`${entry.table.type.summary}\``;
  }

  // options array (may be at top level or inside control)
  const options = entry.options ?? entry.control?.options;
  if (Array.isArray(options) && options.length) {
    const formatted = options.map((o) => {
      if (o === undefined || o === null) return String(o);
      if (typeof o === 'boolean') return String(o);
      return `'${o}'`;
    });
    return `\`${formatted.join(' | ')}\``;
  }

  // action -> function
  if (entry.action != null) return '`function`';

  // control.type
  const ct = entry.control?.type;
  if (ct === 'boolean') return '`boolean`';
  if (ct === 'text') return '`string`';
  if (ct === 'number') return '`number`';
  if (ct === 'object') return '`object`';

  return null;
}

function inferDefault(entry) {
  if (!entry || typeof entry !== 'object') return null;

  // table.defaultValue.summary (most common)
  const tableDef = entry.table?.defaultValue?.summary;
  if (tableDef != null) return `\`${tableDef}\``;

  // top-level defaultValue (legacy Card pattern)
  if ('defaultValue' in entry && entry.defaultValue != null) {
    return `\`${entry.defaultValue}\``;
  }

  return null;
}

// ─── generate definition list ──────────────────────────────────────────

function generatePropsList(argTypes) {
  const lines = [];
  for (const [name, entry] of Object.entries(argTypes)) {
    const type = inferType(entry);
    const def = inferDefault(entry);
    const desc = entry?.description;

    let line = `- **\`${name}\`**`;
    if (type) line += ` ${type}`;
    if (def) line += ` (default: ${def})`;
    if (desc) line += ` — ${desc}`;
    lines.push(line);
  }
  return lines.join('\n');
}

// ─── resolve stories path from MDX imports ─────────────────────────────

function resolveStoriesPath(mdxPath, mdxContent) {
  // Match:  import * as Foo from './Something.stories';
  //         import * as Foo from './Something.stories.tsx';
  const importRe =
    /import\s+\*\s+as\s+\w+\s+from\s+['"]([^'"]+\.stories(?:\.tsx)?)['"]/;
  const m = mdxContent.match(importRe);
  if (!m) return null;

  let rel = m[1];
  if (!rel.endsWith('.tsx')) rel += '.tsx';
  return path.resolve(path.dirname(mdxPath), rel);
}

// ─── main ──────────────────────────────────────────────────────────────

const controlsTagRe = /<Controls\b[^/>]*\/>/g;

const mdxFiles = findMdxFiles(path.join(ROOT, 'src'));
let migrated = 0;
let skipped = 0;

for (const mdxPath of mdxFiles) {
  let content = fs.readFileSync(mdxPath, 'utf-8');
  const matches = [...content.matchAll(controlsTagRe)];
  if (!matches.length) continue;

  const storiesPath = resolveStoriesPath(mdxPath, content);
  if (!storiesPath || !fs.existsSync(storiesPath)) {
    const rel = path.relative(ROOT, mdxPath);
    console.warn(`⚠  No stories file found for ${rel} — skipping`);
    skipped++;
    continue;
  }

  const argTypes = extractArgTypes(storiesPath);
  if (!argTypes || Object.keys(argTypes).length === 0) {
    const rel = path.relative(ROOT, mdxPath);
    console.warn(
      `⚠  No argTypes in ${path.relative(ROOT, storiesPath)} — skipping ${rel}`,
    );
    skipped++;
    continue;
  }

  const propsList = generatePropsList(argTypes);

  for (const match of matches) {
    content = content.replace(match[0], propsList);
  }

  // Remove Controls from import if no longer referenced
  if (!content.includes('<Controls')) {
    content = content.replace(
      /,\s*Controls\b/g,
      '',
    );
    content = content.replace(
      /\bControls\s*,\s*/g,
      '',
    );
    content = content.replace(
      /\bControls\b/g,
      '',
    );
    // Clean up empty imports or trailing commas
    content = content.replace(
      /import\s*\{\s*,/g,
      'import {',
    );
    content = content.replace(
      /,\s*\}\s*from/g,
      ' } from',
    );
  }

  fs.writeFileSync(mdxPath, content, 'utf-8');
  const rel = path.relative(ROOT, mdxPath);
  console.log(`✓  ${rel} (${Object.keys(argTypes).length} props)`);
  migrated++;
}

console.log(
  `\nDone: ${migrated} migrated, ${skipped} skipped.\nRevert: git checkout -- $(git diff --name-only -- '*.docs.mdx')`,
);
