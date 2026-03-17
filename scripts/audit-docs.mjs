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
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const COMPONENTS = path.join(SRC, 'components');

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

function extractPropsFromDocs(content) {
  const props = new Set();
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

    const bulletMatch = line.match(/^\s*-\s+\*\*`([^`]+)`\*\*/);
    if (bulletMatch) {
      props.add(bulletMatch[1]);
      continue;
    }

    const headingMatch = line.match(/^####\s+(\w+)/);
    if (headingMatch) {
      const name = headingMatch[1];
      if (name !== 'styles' && (name.endsWith('Styles') || name.endsWith('Props') || name.endsWith('Tokens'))) {
        props.add(name);
      }
    }
  }
  return props;
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
      i = content.indexOf('*/', i) + 2;
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

/* ── Main ─────────────────────────────────────────────────────────────── */

async function main() {
  const args = process.argv.slice(2);
  const componentFilter = args.find((a) => a.startsWith('--component='))?.split('=')[1];
  const jsonOutput = args.includes('--json');
  const verbose = args.includes('--verbose');
  const allProps = args.includes('--all-props');

  const docFiles = await glob(COMPONENTS, /\.docs\.mdx$/);
  const docFilesFiltered = componentFilter
    ? docFiles.filter((f) =>
        path.basename(f, '.docs.mdx').toLowerCase().includes(componentFilter.toLowerCase()),
      )
    : docFiles;

  const tsConfigPath = path.join(ROOT, 'tsconfig.json');
  const configFile = ts.readConfigFile(tsConfigPath, (p) => fs.readFileSync(p, 'utf8'));
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

    const docsProps = extractPropsFromDocs(docContent);
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
    const inDocsNotCode = [...docsProps].filter((p) => !codeProps.has(p));
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
      issues.push('Type resolution failed');
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
      issues.push(`In docs, not in code: ${inDocsNotCode.join(', ')}`);
    }
    if (inArgTypesNotDocs.length > 0) {
      issues.push(`In argTypes, not in docs: ${inArgTypesNotDocs.join(', ')}`);
    }
    if (inDocsNotArgTypes.length > 0 && argTypes.size > 0) {
      info.push(`In docs, not in argTypes (info only): ${inDocsNotArgTypes.join(', ')}`);
    }

    results.push({
      component: componentName,
      docPath: relDoc,
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
      issues,
      info,
      ok: issues.length === 0,
    });
    if (issues.length > 0) hasErrors = true;
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results, null, 2));
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

  process.exit(hasErrors ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
