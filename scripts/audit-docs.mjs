/**
 * audit-docs.mjs
 *
 * Audits component API sync: implementation props (via TypeScript type resolution),
 * documentation (.docs.mdx Properties section), and Storybook argTypes (.stories.tsx).
 *
 * Uses TypeScript Compiler API for full type resolution including inherited props.
 *
 * Run: node scripts/audit-docs.mjs
 * Options:
 *   --component=Button  (audit single component)
 *   --json              (machine-readable output)
 *   --verbose           (debug output)
 *   --all-props         (don't filter inherited props)
 *   --fix-stories       (auto-update argTypes in .stories.tsx files)
 *   --fix-docs          (auto-update ### Style Properties sections in .docs.mdx files)
 */

import fsSync from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  BASE_STYLES,
  POSITION_STYLES,
  DIMENSION_STYLES,
  BLOCK_INNER_STYLES,
  BLOCK_OUTER_STYLES,
  BLOCK_STYLES,
  COLOR_STYLES,
  TEXT_STYLES,
  FLOW_STYLES,
  CONTAINER_STYLES,
  OUTER_STYLES,
  INNER_STYLES,
} from '@tenphi/tasty';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const COMPONENTS = path.join(SRC, 'components');

/* ── Tasty style lists ────────────────────────────────────────────────── */

const KNOWN_LISTS = {
  BASE_STYLES, POSITION_STYLES, DIMENSION_STYLES,
  BLOCK_INNER_STYLES, BLOCK_OUTER_STYLES, BLOCK_STYLES,
  COLOR_STYLES, TEXT_STYLES, FLOW_STYLES,
  CONTAINER_STYLES, OUTER_STYLES, INNER_STYLES,
};

const STYLE_CATEGORIES = [
  { name: 'Base', list: BASE_STYLES },
  { name: 'Position', list: POSITION_STYLES },
  { name: 'Dimension', list: DIMENSION_STYLES },
  { name: 'Block', list: [...BLOCK_OUTER_STYLES, ...BLOCK_INNER_STYLES] },
  { name: 'Color', list: COLOR_STYLES },
  { name: 'Text', list: TEXT_STYLES },
  { name: 'Flow', list: FLOW_STYLES },
];

/* ── Prop classification ──────────────────────────────────────────────── */

const BASE_STYLE_PROPS = new Set([
  'qa', 'qaVal', 'block', 'inline', 'style', 'styles', 'css', 'hidden',
  'disabled', 'mods', 'breakpoints', 'isHidden', 'element',
  'display', 'font', 'preset', 'hide', 'whiteSpace', 'opacity', 'transition',
  'padding', 'paddingInline', 'paddingBlock', 'overflow', 'scrollbar', 'textAlign',
  'border', 'radius', 'shadow', 'outline', 'color', 'fill', 'fade', 'image',
  'width', 'height', 'flexBasis', 'flexGrow', 'flexShrink', 'flex',
  'gridArea', 'order', 'gridColumn', 'gridRow', 'placeSelf', 'alignSelf',
  'justifySelf', 'zIndex', 'margin', 'inset', 'position',
  'flow', 'placeItems', 'placeContent', 'alignItems', 'alignContent',
  'justifyItems', 'justifyContent', 'align', 'justify', 'gap', 'columnGap',
  'rowGap', 'gridColumns', 'gridRows', 'gridTemplate', 'gridAreas',
  'textTransform', 'fontWeight', 'fontStyle', 'className', 'role', 'id', 'tokens',
]);

const ALLBASE_PROPS = new Set([
  ...BASE_STYLE_PROPS,
  'as', 'children', 'isDisabled', 'theme',
]);

const FIELD_PROPS = new Set([
  'label', 'name', 'description', 'extra', 'tooltip', 'errorMessage',
  'necessityIndicator', 'necessityLabel', 'labelSuffix', 'isRequired',
  'isDisabled', 'isReadOnly', 'isLoading', 'isHidden', 'validationState',
  'labelPosition', 'labelStyles', 'labelProps', 'form', 'rules',
  'defaultValue', 'autoFocus',
  'insideForm', 'fieldProps', 'fieldStyles', 'messageStyles', 'forceField',
  'requiredMark', 'validateTrigger', 'showValid', 'idPrefix', 'shouldUpdate',
  'validationDelay', 'message',
]);

const ARIA_REACT_PROPS = new Set([
  'elementType', 'preventFocusOnPress', 'excludeFromTabOrder',
  'isInvalid', 'validationBehavior', 'validate',
  'onPressStart', 'onPressEnd', 'onPressChange', 'onPressUp', 'onFocusChange',
  'selectionBehavior', 'shouldSelectOnPressUp', 'shouldFocusOnHover',
  'focusOnHover', 'disableSelectionToggle', 'shouldFocusWrap',
  'escapeKeyBehavior', 'disallowEmptySelection', 'allowsEmptyCollection',
  'shouldUseVirtualFocus', 'navigationOptions',
  'selectionMode', 'items', 'disabledKeys', 'onAction', 'onClose',
  'selectedKey', 'defaultSelectedKey', 'selectedKeys', 'defaultSelectedKeys',
  'onSelectionChange', 'onOpenChange',
  'isOpen', 'defaultOpen',
  'onFocus', 'onBlur', 'onChange',
  'value', 'defaultValue',
  'isSelected', 'defaultSelected',
  'children',
]);

const DOM_PROPS = new Set([
  'cite', 'data', 'slot', 'span', 'summary', 'accept',
  'acceptCharset', 'action', 'allowFullScreen', 'allowTransparency', 'alt', 'async',
  'autoComplete', 'autoPlay', 'capture', 'cellPadding', 'cellSpacing', 'charSet',
  'challenge', 'checked', 'classID', 'cols', 'colSpan', 'controls', 'coords',
  'crossOrigin', 'dateTime', 'default', 'defer', 'download', 'encType',
  'formAction', 'formEncType', 'formMethod', 'formNoValidate', 'formTarget',
  'frameBorder', 'headers', 'high', 'href', 'hrefLang', 'htmlFor', 'httpEquiv',
  'integrity', 'keyParams', 'keyType', 'kind', 'list', 'loop', 'low', 'manifest',
  'marginHeight', 'marginWidth', 'max', 'maxLength', 'media', 'mediaGroup',
  'method', 'min', 'minLength', 'multiple', 'muted', 'noValidate', 'open',
  'optimum', 'pattern', 'placeholder', 'playsInline', 'poster', 'preload',
  'readOnly', 'required', 'reversed', 'rows', 'rowSpan', 'sandbox', 'scope',
  'scoped', 'scrolling', 'seamless', 'selected', 'shape', 'sizes', 'src',
  'srcDoc', 'srcLang', 'srcSet', 'start', 'step', 'target', 'useMap', 'value',
  'wmode', 'wrap', 'defaultChecked', 'defaultValue', 'suppressContentEditableWarning',
  'suppressHydrationWarning', 'accessKey', 'autoCapitalize', 'contentEditable',
  'contextMenu', 'dir', 'draggable', 'enterKeyHint', 'lang', 'nonce', 'spellCheck',
  'tabIndex', 'radioGroup', 'dangerouslySetInnerHTML', 'popover',
  'popoverTargetAction', 'popoverTarget', 'inert', 'inputMode', 'is',
  'exportparts', 'part', 'about', 'datatype', 'inlist', 'property', 'rel',
  'resource', 'rev', 'typeof', 'vocab', 'autoCorrect', 'autoSave',
  'itemProp', 'itemScope', 'itemType', 'itemID', 'itemRef', 'results',
  'security', 'unselectable',
]);

function isDomProp(name) {
  if (name.startsWith('aria-') || name.startsWith('data-')) return true;
  if (/^on[A-Z]/.test(name)) return true;
  return DOM_PROPS.has(name);
}

const HTML_PASSTHROUGH_PROPS = new Set([
  'label', 'title', 'type', 'name', 'autoFocus', 'form',
  'to', 'htmlType', 'download', 'onPress',
]);

const INTERNAL_PROPS = new Set([
  'insideWrapper', 'labelProps', 'descriptionProps', 'keyboardShortcutProps',
  'loadingSlot', 'defaultTooltipPlacement', 'labelRef', 'highlightStyles',
  'variant', 'insideForm', 'fieldProps', 'fieldStyles', 'messageStyles',
  'forceField', 'requiredMark', 'validateTrigger', 'showValid', 'idPrefix',
  'shouldUpdate', 'validationDelay', 'message', 'showActions',
  'childItems', 'hasChildItems', 'ping', 'referrerPolicy', 'routerOptions',
  'allValueProps', 'listStateRef', '_internalCollection', '_forceShowDevWarning',
  'descriptionPlacement', 'isDummy', 'activeWrap', 'targetRef',
  'disableFocusableProvider', 'multiLine', 'trigger',
  'resize', 'loadingIndicator', 'customValueProps', 'newCustomValueProps',
  'autocomplete',
  'isSelected', 'actions', 'autoHideActions', 'preserveActionsSpace',
  'disableActionsFocus', 'level', 'highlight', 'highlightCaseSensitive',
  'rightIcon',
]);

const REF_PROPS = new Set([
  'inputRef', 'wrapperRef', 'listBoxRef', 'popoverRef', 'triggerRef',
  'searchInputRef', 'listRef', 'stateRef', 'ref',
]);

function isInheritedProp(name, isFieldComponent) {
  if (BASE_STYLE_PROPS.has(name)) return true;
  if (ALLBASE_PROPS.has(name)) return true;
  if (isDomProp(name)) return true;
  if (ARIA_REACT_PROPS.has(name)) return true;
  if (HTML_PASSTHROUGH_PROPS.has(name)) return true;
  if (INTERNAL_PROPS.has(name)) return true;
  if (REF_PROPS.has(name)) return true;
  if (name.startsWith('_')) return true;
  if (isFieldComponent && FIELD_PROPS.has(name)) return true;
  return false;
}

/* ── File helpers ─────────────────────────────────────────────────────── */

async function glob(dir, pattern) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      results.push(...(await glob(full, pattern)));
    } else if (pattern.test(e.name)) {
      results.push(full);
    }
  }
  return results;
}

/* ── MDX/Stories parsing ──────────────────────────────────────────────── */

/**
 * Returns { names: Set<string>, details: Map<string, { type: string, defaultValue: string, description: string }> }
 * Note: `details` is converted to a plain object before storing in results (for JSON serialization).
 */
function extractPropsFromDocs(content) {
  const props = new Set();
  const details = new Map();
  const lines = content.split('\n');
  const PROP_SECTIONS = /^#{2,3}\s+[\w-]*\s*Properties\s*$/;
  const STOP_H2 = /^##\s+(?!.*Properties)/;
  const STOP_H3 = /^###\s+(Modifiers|Variants|Base Properties|Field Properties|HTML Form Properties)\s*$/;

  let inPropSection = false;

  for (const line of lines) {
    if (STOP_H2.test(line)) {
      inPropSection = false;
      continue;
    }
    if (STOP_H3.test(line)) {
      inPropSection = false;
      continue;
    }
    if (PROP_SECTIONS.test(line)) {
      inPropSection = true;
      continue;
    }
    if (!inPropSection) continue;

    const bulletMatch = line.match(
      /^\s*-\s+\*\*`([^`]+)`\*\*/,
    );
    if (bulletMatch) {
      const name = bulletMatch[1];
      const rest = line.slice(bulletMatch[0].length);

      const typeMatch = rest.match(/^\s+`([^`]*)`/);
      const type = typeMatch ? typeMatch[1] : '';

      const defMatch = rest.match(/\(default:\s+`([^`]*)`/);
      const defaultValue = defMatch ? defMatch[1] : '';

      const descMatch = rest.match(/—\s*(.*)$/);
      const description = descMatch ? descMatch[1].trim() : '';

      props.add(name);
      details.set(name, { type, defaultValue, description });
      continue;
    }

    const headingMatch = line.match(/^####\s+(\w+)/);
    if (headingMatch) {
      const name = headingMatch[1];
      if (name !== 'styles' && (name.endsWith('Styles') || name.endsWith('Props') || name.endsWith('Tokens'))) {
        props.add(name);
        details.set(name, { type: 'Styles', defaultValue: '', description: '' });
      }
    }
  }
  return { names: props, details };
}

function extractArgTypesFromStories(content) {
  const keys = new Set();
  const idx = content.indexOf('argTypes:');
  if (idx === -1) return keys;

  let i = content.indexOf('{', idx) + 1;
  let depth = 1;
  const len = content.length;

  while (i < len && depth > 0) {
    const c = content[i];
    if (c === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i);
      i = end === -1 ? len : end + 2;
      continue;
    }
    if (c === '/' && content[i + 1] === '/') {
      i = content.indexOf('\n', i) + 1 || len;
      continue;
    }
    if ((c === '"' || c === "'" || c === '`') && depth >= 1) {
      const q = c;
      i++;
      while (i < len && content[i] !== q) {
        if (content[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === '{') { depth++; i++; continue; }
    if (c === '}') { depth--; i++; continue; }
    if (depth === 1 && /[a-zA-Z_$]/.test(c)) {
      const start = i;
      while (i < len && /[a-zA-Z0-9_$]/.test(content[i])) i++;
      keys.add(content.slice(start, i));
      continue;
    }
    i++;
  }
  return keys;
}

/* ── TypeScript type resolution ───────────────────────────────────────── */

function getResolvedProps(program, checker, componentPath, interfaceName) {
  const props = new Map();
  const normalizedPath = path.normalize(componentPath).replace(/\\/g, '/');
  const resolvedPath = path.isAbsolute(componentPath)
    ? componentPath
    : path.resolve(ROOT, componentPath);

  function visitFile(sf) {
    if (!sf) return false;
    let found = false;
    ts.forEachChild(sf, (node) => {
      if (
        (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) &&
        node.name?.text === interfaceName
      ) {
        const symbol = checker.getSymbolAtLocation(node.name);
        if (!symbol) return;
        const type = ts.isInterfaceDeclaration(node)
          ? checker.getDeclaredTypeOfSymbol(symbol)
          : checker.getTypeAtLocation(node.name);
        for (const p of type.getProperties()) {
          if (p.escapedName === 'prototype') continue;
          const name = p.getName();
          const propType = p.valueDeclaration
            ? checker.getTypeOfSymbolAtLocation(p, p.valueDeclaration)
            : checker.getTypeOfSymbolAtLocation(p, node);
          props.set(name, checker.typeToString(propType));
        }
        found = true;
      }
    });
    return found;
  }

  const relPath = path.relative(ROOT, resolvedPath).replace(/\\/g, '/');
  const targetName = path.basename(resolvedPath);
  const targetDirRel = path.dirname(relPath).replace(/\\/g, '/');
  const targetBase = path.basename(path.dirname(relPath));

  for (const file of program.getSourceFiles()) {
    const fn = file.fileName.replace(/\\/g, '/');
    if (fn.includes('node_modules')) continue;
    const inDir = fn.includes(targetDirRel) || fn.includes(targetBase + '/' + targetName);
    const isComponentFile = fn.endsWith(`${targetBase}.tsx`) || fn === relPath || fn.endsWith(targetName);
    const isTypesFile = fn.endsWith('types.ts') && (fn.includes(targetDirRel) || fn.includes(targetBase));
    if (inDir && (isComponentFile || isTypesFile)) {
      if (visitFile(file)) return props;
    }
  }

  for (const p of [relPath, resolvedPath, normalizedPath]) {
    if (visitFile(program.getSourceFile(p))) return props;
  }
  return props;
}

/* ── Field component detection ────────────────────────────────────────── */

const FIELD_COMPONENT_DIRS = new Set([
  'fields', 'Checkbox', 'ComboBox', 'DatePicker', 'FileInput',
  'FilterListBox', 'FilterPicker', 'ListBox', 'NumberInput',
  'PasswordInput', 'Picker', 'RadioGroup', 'SearchInput', 'Select',
  'Slider', 'Switch', 'TextArea', 'TextInput', 'TextInputMapper',
]);

function isFieldComponent(docPath) {
  const parts = path.relative(COMPONENTS, docPath).split(path.sep);
  return parts.some((p) => FIELD_COMPONENT_DIRS.has(p));
}

/* ── argType generation from docs ──────────────────────────────────────── */

function inferControlType(typeStr) {
  if (!typeStr) return '{ type: null }';
  const t = typeStr.trim();
  if (t === 'boolean') return "'boolean'";
  if (t === 'string') return "{ type: 'text' }";
  if (t === 'number') return "{ type: 'number' }";
  if (t === 'ReactNode') return '{ type: null }';
  if (t === 'Styles') return '{ type: null }';
  if (/^function\b|=>/.test(t)) return '{ type: null }';
  if (/^\(/.test(t)) return '{ type: null }';
  if (/\|/.test(t)) {
    const parts = t.split('|').map((s) => s.trim().replace(/^'|'$/g, ''));
    const allStrings = parts.every((p) => !p.includes(' ') && p !== 'true' && p !== 'false' && !/^\d/.test(p));
    if (allStrings && parts.length <= 8) return "{ type: 'radio' }";
    return '{ type: null }';
  }
  return '{ type: null }';
}

function inferOptions(typeStr) {
  if (!typeStr) return null;
  if (!/\|/.test(typeStr)) return null;
  const parts = typeStr.split('|').map((s) => s.trim());
  const quoted = parts.filter((p) => /^'[^']+'$/.test(p));
  if (quoted.length === parts.length && quoted.length >= 2) {
    return quoted.map((p) => p.replace(/^'|'$/g, ''));
  }
  return null;
}

function isEventProp(name) {
  return /^on[A-Z]/.test(name);
}

function jsStringLiteral(value) {
  return JSON.stringify(String(value));
}

function generateArgTypeEntry(name, info) {
  const lines = [];
  const indent = '    ';

  lines.push(`${indent}${name}: {`);

  if (isEventProp(name)) {
    const eventName = name.replace(/^on/, '').replace(/([A-Z])/g, (m, c, i) =>
      i === 0 ? c.toLowerCase() : '-' + c.toLowerCase(),
    );
    lines.push(`${indent}  action: '${eventName}',`);
  } else {
    const control = inferControlType(info.type);
    const options = inferOptions(info.type);
    if (options) {
      lines.push(`${indent}  options: [${options.map((o) => `'${o}'`).join(', ')}],`);
    }
    lines.push(`${indent}  control: ${control},`);
  }

  if (info.description) {
    lines.push(`${indent}  description: ${jsStringLiteral(info.description)},`);
  }

  if (info.defaultValue || info.type) {
    lines.push(`${indent}  table: {`);
    if (info.defaultValue) {
      lines.push(`${indent}    defaultValue: { summary: ${jsStringLiteral(info.defaultValue)} },`);
    }
    if (info.type) {
      lines.push(`${indent}    type: { summary: ${jsStringLiteral(info.type)} },`);
    }
    lines.push(`${indent}  },`);
  }

  lines.push(`${indent}},`);
  return lines.join('\n');
}

async function fixStoriesFiles(results, verbose) {
  let totalAdded = 0;
  let totalRemoved = 0;
  let filesModified = 0;

  for (const r of results) {
    if (!r.storiesPath) continue;
    const storiesExists = await fs.access(r.storiesPath).then(() => true).catch(() => false);
    if (!storiesExists) continue;
    if (!r.docsDetails) continue;

    const toAdd = (r.inDocsNotArgTypes || []).filter((p) => p in r.docsDetails);
    const toRemove = r.inArgTypesNotDocs || [];

    if (toAdd.length === 0 && toRemove.length === 0) continue;

    let content = await fs.readFile(r.storiesPath, 'utf8');
    let modified = false;

    if (toRemove.length > 0) {
      for (const propName of toRemove) {
        const removed = removeArgType(content, propName);
        if (removed !== content) {
          content = removed;
          modified = true;
          totalRemoved++;
          if (verbose) console.log(`  [${r.component}] Removed argType: ${propName}`);
        }
      }
    }

    if (toAdd.length > 0) {
      const argTypesIdx = content.indexOf('argTypes:');
      if (argTypesIdx !== -1) {
        const openBrace = content.indexOf('{', argTypesIdx);
        if (openBrace !== -1) {
          const entries = toAdd.map((name) => {
            const info = r.docsDetails[name] || { type: '', defaultValue: '', description: '' };
            return generateArgTypeEntry(name, info);
          });

          const insertPos = findArgTypesInsertPosition(content, openBrace);
          const newBlock = '\n' + entries.join('\n') + '\n';
          content = content.slice(0, insertPos) + newBlock + content.slice(insertPos);
          modified = true;
          totalAdded += toAdd.length;
          if (verbose) {
            for (const name of toAdd) {
              console.log(`  [${r.component}] Added argType: ${name}`);
            }
          }
        }
      }
    }

    if (modified) {
      await fs.writeFile(r.storiesPath, content, 'utf8');
      filesModified++;
      console.log(`  Updated: ${path.relative(ROOT, r.storiesPath)} (+${toAdd.length} -${toRemove.length})`);
    }
  }

  if (filesModified > 0) {
    console.log(`\n=== Stories fix summary ===`);
    console.log(`Files modified: ${filesModified}`);
    console.log(`ArgTypes added: ${totalAdded}`);
    console.log(`ArgTypes removed: ${totalRemoved}\n`);
  } else {
    console.log('\nNo story files needed changes.\n');
  }
}

function findArgTypesInsertPosition(content, openBrace) {
  let depth = 1;
  let i = openBrace + 1;
  const len = content.length;

  while (i < len && depth > 0) {
    const c = content[i];
    if (c === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i);
      i = end === -1 ? len : end + 2;
      continue;
    }
    if (c === '/' && content[i + 1] === '/') {
      i = content.indexOf('\n', i) + 1 || len;
      continue;
    }
    if ((c === '"' || c === "'" || c === '`')) {
      const q = c;
      i++;
      while (i < len && content[i] !== q) {
        if (content[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === '{') { depth++; i++; continue; }
    if (c === '}') {
      if (depth === 1) return i;
      depth--;
      i++;
      continue;
    }
    i++;
  }
  return openBrace + 1;
}

function removeArgType(content, propName) {
  const argTypesIdx = content.indexOf('argTypes:');
  if (argTypesIdx === -1) return content;

  const openBrace = content.indexOf('{', argTypesIdx);
  if (openBrace === -1) return content;

  let depth = 1;
  let i = openBrace + 1;
  const len = content.length;

  while (i < len && depth > 0) {
    const c = content[i];
    if (c === '/' && content[i + 1] === '*') {
      const end = content.indexOf('*/', i);
      i = end === -1 ? len : end + 2;
      continue;
    }
    if (c === '/' && content[i + 1] === '/') {
      i = content.indexOf('\n', i) + 1 || len;
      continue;
    }
    if ((c === '"' || c === "'" || c === '`')) {
      const q = c;
      i++;
      while (i < len && content[i] !== q) {
        if (content[i] === '\\') i++;
        i++;
      }
      i++;
      continue;
    }
    if (c === '{') { depth++; i++; continue; }
    if (c === '}') { depth--; i++; continue; }

    if (depth === 1 && /[a-zA-Z_$]/.test(c)) {
      const keyStart = i;
      while (i < len && /[a-zA-Z0-9_$]/.test(content[i])) i++;
      const key = content.slice(keyStart, i);

      if (key === propName) {
        while (i < len && /\s/.test(content[i])) i++;
        if (content[i] === ':') {
          i++;
          while (i < len && /\s/.test(content[i])) i++;
          if (content[i] === '{') {
            let d = 1;
            i++;
            while (i < len && d > 0) {
              if (content[i] === '{') d++;
              else if (content[i] === '}') d--;
              else if ((content[i] === '"' || content[i] === "'" || content[i] === '`')) {
                const q2 = content[i];
                i++;
                while (i < len && content[i] !== q2) {
                  if (content[i] === '\\') i++;
                  i++;
                }
              }
              i++;
            }
          } else {
            while (i < len && content[i] !== ',' && content[i] !== '}') i++;
          }
          if (content[i] === ',') i++;
          while (i < len && content[i] === ' ') i++;
          if (content[i] === '\n') i++;
        }

        let lineStart = keyStart;
        while (lineStart > 0 && content[lineStart - 1] !== '\n') lineStart--;
        if (content.slice(lineStart, keyStart).trim() === '') {
          return content.slice(0, lineStart) + content.slice(i);
        }
        return content.slice(0, keyStart) + content.slice(i);
      }
      continue;
    }
    i++;
  }
  return content;
}

/* ── Style property detection from source ─────────────────────────────── */

function resolveListIdentifier(name) {
  if (KNOWN_LISTS[name]) return [...KNOWN_LISTS[name]];
  return null;
}

function resolveArrayExpression(arrayContent, fileContent) {
  const props = [];
  const spreadPattern = /\.\.\.(\w+)/g;
  const stringPattern = /'([^']+)'/g;

  let m;
  while ((m = spreadPattern.exec(arrayContent)) !== null) {
    const listName = m[1];
    const resolved = resolveListIdentifier(listName);
    if (resolved) {
      props.push(...resolved);
    } else {
      const localDef = resolveLocalConst(listName, fileContent);
      if (localDef) props.push(...localDef);
    }
  }
  while ((m = stringPattern.exec(arrayContent)) !== null) {
    props.push(m[1]);
  }
  return props;
}

function resolveLocalConst(constName, fileContent) {
  const assignRe = new RegExp(
    `const\\s+${constName}\\s*=\\s*(\\w+_STYLES)\\s*;`,
  );
  const assignMatch = fileContent.match(assignRe);
  if (assignMatch) {
    return resolveListIdentifier(assignMatch[1]);
  }

  const arrayRe = new RegExp(
    `const\\s+${constName}\\s*(?::\\s*[^=]+)?=\\s*\\[([^\\]]+)\\]`,
  );
  const arrayMatch = fileContent.match(arrayRe);
  if (arrayMatch) {
    return resolveArrayExpression(arrayMatch[1], fileContent);
  }

  return null;
}

function extractStylePropsFromFile(fileContent) {
  const extractCallRe =
    /extractStyles\(\s*\w+\s*,\s*(\[[\s\S]*?\]|\w+)/g;
  let match;
  while ((match = extractCallRe.exec(fileContent)) !== null) {
    const arg = match[1];

    if (arg.startsWith('[')) {
      const props = resolveArrayExpression(arg, fileContent);
      if (props.length > 0) return props;
    } else {
      const resolved = resolveListIdentifier(arg);
      if (resolved) return resolved;

      const localResolved = resolveLocalConst(arg, fileContent);
      if (localResolved && localResolved.length > 0) return localResolved;
    }
  }
  return null;
}

function resolveImportPaths(fileContent, fileDir) {
  const paths = [];
  const importRe = /import\s*\{([^}]*)\}\s*from\s*'([^']+)'/g;
  let m;
  while ((m = importRe.exec(fileContent)) !== null) {
    const importedNames = m[1];
    const importPath = m[2];
    if (importPath.startsWith('.') && !importPath.includes('node_modules')) {
      const hasBaseComponent = /\w+Base\b/.test(importedNames);
      paths.push({
        fullPath: path.resolve(fileDir, importPath),
        priority: hasBaseComponent ? 0 : 1,
      });
    }
  }
  paths.sort((a, b) => a.priority - b.priority);
  return paths.map((p) => p.fullPath);
}

async function readTsxFile(filePath) {
  for (const ext of ['', '.tsx', '.ts', '/index.tsx', '/index.ts']) {
    const p = filePath + ext;
    try {
      return { content: await fs.readFile(p, 'utf8'), path: p };
    } catch { /* file not found, try next extension */ }
  }
  return null;
}

async function detectStyleProps(componentDir, componentName, verbose) {
  const mainFile = path.join(componentDir, `${componentName}.tsx`);
  let content;
  try {
    content = await fs.readFile(mainFile, 'utf8');
  } catch {
    return null;
  }

  let result = extractStylePropsFromFile(content);
  if (result) return [...new Set(result)];

  const entries = await fs.readdir(componentDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.tsx') && !entry.name.endsWith('.ts')) continue;
    if (entry.name === `${componentName}.tsx`) continue;
    if (entry.name.endsWith('.stories.tsx') || entry.name.endsWith('.test.tsx') || entry.name.endsWith('.docs.mdx')) continue;

    const filePath = path.join(componentDir, entry.name);
    const fileContent = await fs.readFile(filePath, 'utf8');
    result = extractStylePropsFromFile(fileContent);
    if (result) {
      if (verbose) console.log(`  [${componentName}] Found extractStyles in ${entry.name}`);
      return [...new Set(result)];
    }
  }

  const importPaths = resolveImportPaths(content, componentDir);
  for (const importPath of importPaths) {
    const file = await readTsxFile(importPath);
    if (!file) continue;

    result = extractStylePropsFromFile(file.content);
    if (result) {
      if (verbose) console.log(`  [${componentName}] Found extractStyles via import ${path.relative(ROOT, file.path)}`);
      return [...new Set(result)];
    }

    const reExportRe = /export\s+\*\s+from\s+'([^']+)'/g;
    let reMatch;
    while ((reMatch = reExportRe.exec(file.content)) !== null) {
      const reExportPath = path.resolve(path.dirname(file.path), reMatch[1]);
      const reFile = await readTsxFile(reExportPath);
      if (!reFile) continue;
      result = extractStylePropsFromFile(reFile.content);
      if (result) {
        if (verbose) console.log(`  [${componentName}] Found extractStyles via re-export ${path.relative(ROOT, reFile.path)}`);
        return [...new Set(result)];
      }
    }
  }

  return null;
}

/* ── Style Properties docs section parsing ────────────────────────────── */

function extractStylePropsFromDocs(content) {
  const lines = content.split('\n');
  const props = new Set();
  let inSection = false;

  const SKIP_WORDS = new Set(['styles', 'prop', 'the', 'without', 'using', 'application']);

  for (const line of lines) {
    if (/^###\s+Style Properties\s*$/.test(line)) {
      inSection = true;
      continue;
    }
    if (inSection && /^#{2,3}\s+/.test(line)) {
      break;
    }
    if (!inSection) continue;

    const backtickRe = /`([a-zA-Z]+)`/g;
    let m;
    while ((m = backtickRe.exec(line)) !== null) {
      const name = m[1];
      if (SKIP_WORDS.has(name)) continue;
      props.add(name);
    }
  }
  return props;
}

/* ── Style Properties docs section generation ─────────────────────────── */

function groupStyleProps(props) {
  const propSet = new Set(props);
  const groups = [];

  for (const cat of STYLE_CATEGORIES) {
    const matching = cat.list.filter((p) => propSet.has(p));
    if (matching.length > 0) {
      groups.push({ name: cat.name, props: matching });
      for (const p of matching) propSet.delete(p);
    }
  }

  if (propSet.size > 0) {
    groups.push({ name: 'Other', props: [...propSet] });
  }

  return groups;
}

function generateStylePropsSection(props) {
  const groups = groupStyleProps(props);
  const lines = [
    '### Style Properties',
    '',
    'These properties allow direct style application without using the `styles` prop:',
    '',
  ];

  for (const group of groups) {
    const formatted = group.props.map((p) => `\`${p}\``).join(', ');
    lines.push(`- **${group.name}:** ${formatted}`);
  }

  return lines.join('\n');
}

/* ── Fix docs files ───────────────────────────────────────────────────── */

function replaceSection(content, newSection) {
  const lines = content.split('\n');
  let sectionStart = -1;
  let sectionEnd = -1;

  for (let i = 0; i < lines.length; i++) {
    if (/^### Style Properties\s*$/.test(lines[i])) {
      sectionStart = i;
      for (let j = i + 1; j < lines.length; j++) {
        if (/^#{2,3}\s+/.test(lines[j])) {
          sectionEnd = j;
          break;
        }
      }
      if (sectionEnd === -1) sectionEnd = lines.length;
      break;
    }
  }

  if (sectionStart === -1) return null;

  const before = lines.slice(0, sectionStart);
  const after = lines.slice(sectionEnd);
  return [...before, newSection, '', ...after].join('\n');
}

async function fixDocFiles(results, verbose) {
  let filesModified = 0;

  for (const r of results) {
    if (!r.expectedStyleProps || r.expectedStyleProps.length === 0) continue;

    const docPath = path.resolve(ROOT, r.docPath);
    let content;
    try {
      content = await fs.readFile(docPath, 'utf8');
    } catch {
      continue;
    }

    const newSection = generateStylePropsSection(r.expectedStyleProps);
    let newContent = replaceSection(content, newSection);

    if (!newContent) {
      const insertPoints = [
        /^### Modifiers\s*$/m,
        /^## Variants\s*$/m,
        /^## Examples\s*$/m,
      ];

      let inserted = false;
      for (const re of insertPoints) {
        const match = content.match(re);
        if (match) {
          const idx = match.index;
          newContent = content.slice(0, idx) + newSection + '\n\n' + content.slice(idx);
          inserted = true;
          break;
        }
      }

      if (!inserted) {
        newContent = content + '\n\n' + newSection + '\n';
      }
    }

    if (newContent !== content) {
      await fs.writeFile(docPath, newContent, 'utf8');
      filesModified++;
      if (verbose) {
        console.log(`  Updated style props: ${r.docPath}`);
      }
    }
  }

  if (filesModified > 0) {
    console.log(`\n=== Docs fix summary ===`);
    console.log(`Files modified: ${filesModified}\n`);
  } else {
    console.log('\nNo doc files needed style property changes.\n');
  }
}

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  const args = process.argv.slice(2);
  const componentFilter = args.find((a) => a.startsWith('--component='))?.split('=')[1];
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');
  const allProps = args.includes('--all-props');
  const fixStories = args.includes('--fix-stories');
  const fixDocs = args.includes('--fix-docs');

  const docFiles = await glob(COMPONENTS, /\.docs\.mdx$/);
  const docFilesFiltered = componentFilter
    ? docFiles.filter((f) =>
        path.basename(f, '.docs.mdx').toLowerCase().includes(componentFilter.toLowerCase()),
      )
    : docFiles;

  const tsConfigPath = path.join(ROOT, 'tsconfig.json');
  const configFile = ts.readConfigFile(tsConfigPath, (p) => fsSync.readFileSync(p, 'utf8'));
  const parsed = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(tsConfigPath));

  const program = ts.createProgram(parsed.fileNames, {
    ...parsed.options,
    noEmit: true,
    skipLibCheck: true,
  });
  const checker = program.getTypeChecker();

  const results = [];
  let hasErrors = false;

  for (const docPath of docFilesFiltered) {
    const relDoc = path.relative(ROOT, docPath);
    const componentName = path.basename(docPath, '.docs.mdx');
    const dir = path.dirname(docPath);
    const componentPath = path.join(dir, `${componentName}.tsx`);
    const storiesPath = path.join(dir, `${componentName}.stories.tsx`);
    const isField = isFieldComponent(docPath);

    const interfaceNames = [
      `Cube${componentName}Props`,
      `${componentName}Props`,
      `Cube${componentName}`,
      componentName === 'Link' ? 'CubeButtonProps' : null,
    ].filter(Boolean);

    const exists = await fs.access(componentPath).then(() => true).catch(() => false);
    if (!exists) {
      results.push({
        component: componentName, docPath: relDoc,
        issues: [],
        info: ['Docs-only page (no .tsx)'],
        ok: true,
      });
      continue;
    }

    const [docContent, storiesContent] = await Promise.all([
      fs.readFile(docPath, 'utf8').catch(() => ''),
      fs.readFile(storiesPath, 'utf8').catch(() => ''),
    ]);

    const { names: docsProps, details: docsDetails } = extractPropsFromDocs(docContent);
    const argTypes = extractArgTypesFromStories(storiesContent);
    const hasBaseRef = /Base properties/i.test(docContent);
    const hasFieldRef = /Field properties/i.test(docContent);

    const resolvedPath = path.resolve(ROOT, componentPath);
    const relPathFromRoot = path.relative(ROOT, resolvedPath).replace(/\\/g, '/');
    let codeProps = new Map();
    for (const iface of interfaceNames) {
      codeProps = getResolvedProps(program, checker, relPathFromRoot, iface);
      if (codeProps.size > 0) break;
    }
    if (codeProps.size === 0) {
      for (const iface of interfaceNames) {
        codeProps = getResolvedProps(program, checker, resolvedPath, iface);
        if (codeProps.size > 0) break;
      }
    }

    if (verbose && componentFilter) {
      console.log(`[${componentName}] resolved ${codeProps.size} props, isField=${isField}, hasBaseRef=${hasBaseRef}, hasFieldRef=${hasFieldRef}`);
    }

    const shouldExclude = allProps
      ? () => false
      : (p) => isInheritedProp(p, isField);

    const inCodeNotDocs = [...codeProps.keys()].filter(
      (p) => !docsProps.has(p) && !shouldExclude(p),
    );
    const inDocsNotCode = [...docsProps].filter(
      (p) => !codeProps.has(p) && !shouldExclude(p),
    );
    const inArgTypesNotDocs = [...argTypes].filter(
      (p) => !docsProps.has(p) && !shouldExclude(p),
    );
    const inDocsNotArgTypes = [...docsProps].filter(
      (p) => !argTypes.has(p) && !shouldExclude(p),
    );

    const isHook = componentName.startsWith('use-') || componentName.startsWith('use');
    const issues = [];
    const info = [];
    if (codeProps.size === 0 && docsProps.size > 0) {
      info.push('Type resolution incomplete (may use generics or external types)');
    }
    if (!hasBaseRef && !isHook) {
      issues.push('Missing "Base properties" reference');
    }
    if (isField && !hasFieldRef) {
      issues.push('Missing "Field properties" reference (field component)');
    }
    if (inCodeNotDocs.length > 0) {
      issues.push(`In code, not in docs: ${inCodeNotDocs.join(', ')}`);
    }
    if (inDocsNotCode.length > 0) {
      info.push(`In docs, not in code (info only — may be from generics/Aria): ${inDocsNotCode.join(', ')}`);
    }
    if (inArgTypesNotDocs.length > 0) {
      issues.push(`In argTypes, not in docs: ${inArgTypesNotDocs.join(', ')}`);
    }
    if (inDocsNotArgTypes.length > 0 && argTypes.size > 0) {
      info.push(`In docs, not in argTypes (info only): ${inDocsNotArgTypes.join(', ')}`);
    }

    const expectedStyleProps = await detectStyleProps(dir, componentName, verbose && !!componentFilter);
    const docsStyleProps = extractStylePropsFromDocs(docContent);
    let stylePropsInCodeNotDocs = [];
    let stylePropsInDocsNotCode = [];

    if (expectedStyleProps && expectedStyleProps.length > 0) {
      const expectedSet = new Set(expectedStyleProps);
      stylePropsInCodeNotDocs = expectedStyleProps.filter((p) => !docsStyleProps.has(p));
      stylePropsInDocsNotCode = [...docsStyleProps].filter((p) => !expectedSet.has(p));

      if (stylePropsInCodeNotDocs.length > 0) {
        issues.push(`Style props in code, not in docs: ${stylePropsInCodeNotDocs.join(', ')}`);
      }
      if (stylePropsInDocsNotCode.length > 0) {
        issues.push(`Style props in docs, not in code: ${stylePropsInDocsNotCode.join(', ')}`);
      }
    } else if (docsStyleProps.size > 0) {
      info.push('Style props listed in docs but detection failed (may need manual review)');
    }

    results.push({
      component: componentName,
      docPath: relDoc,
      storiesPath: path.resolve(ROOT, storiesPath),
      codePropsCount: codeProps.size,
      docsPropsCount: docsProps.size,
      argTypesCount: argTypes.size,
      isField,
      hasBaseRef,
      hasFieldRef,
      inCodeNotDocs,
      inDocsNotCode,
      inArgTypesNotDocs,
      inDocsNotArgTypes,
      expectedStyleProps,
      stylePropsInCodeNotDocs,
      stylePropsInDocsNotCode,
      docsDetails: Object.fromEntries(docsDetails),
      issues,
      info,
      ok: issues.length === 0,
    });
    if (issues.length > 0) hasErrors = true;
  }

  if (jsonOutput) {
    const replacer = (key, value) =>
      value instanceof Map ? Object.fromEntries(value) : value;
    console.log(JSON.stringify(results, replacer, 2));
  } else {
    const failed = results.filter((r) => !r.ok);
    const passed = results.filter((r) => r.ok);

    console.log('\n=== Component API / Docs Audit ===\n');
    console.log(`Total: ${results.length} components`);
    console.log(`Passed: ${passed.length}`);
    console.log(`Issues: ${failed.length}\n`);

    if (failed.length > 0) {
      console.log('--- Components with issues ---\n');
      for (const r of failed) {
        console.log(`${r.component} (${r.docPath})`);
        for (const i of r.issues || []) {
          console.log(`  - ${i}`);
        }
        for (const i of r.info || []) {
          console.log(`  * ${i}`);
        }
        console.log('');
      }
    }

    const withInfo = passed.filter((r) => r.info?.length > 0);
    if (withInfo.length > 0) {
      console.log('--- Passed with info ---\n');
      for (const r of withInfo) {
        console.log(`${r.component} (${r.docPath})`);
        for (const i of r.info || []) {
          console.log(`  * ${i}`);
        }
        console.log('');
      }
    }
  }

  if (fixStories) {
    await fixStoriesFiles(results, verbose);
  }

  if (fixDocs) {
    await fixDocFiles(results, verbose);
  }

  process.exit(hasErrors ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
