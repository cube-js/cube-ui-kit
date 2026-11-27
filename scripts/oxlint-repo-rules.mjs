/**
 * Oxlint rules that only make sense for this repository, so they stay out of
 * the published `src/eslint-plugin`.
 *
 * `require-disable-reason` makes every lint exception say why it exists. A
 * bare `oxlint-disable-next-line tasty/no-style-prop` tells a reviewer that
 * a rule was switched off, not whether the inline style is a library contract
 * or a shortcut; the ` -- reason` suffix is where that decision is recorded.
 *
 * `no-barrel-import` keeps barrels out of the library's own dependency graph:
 * a relative import that resolves to an `index.ts` puts everything that barrel
 * re-exports into the importer's graph. See docs/rules/coding.md#imports.
 *
 * `filename-case` gives every file one naming rule: PascalCase when its main
 * export is a component, class or provider, kebab-case otherwise, kebab-case
 * for each dotted part after the name, and `index.ts` for a barrel. Lint can't
 * tell which export is the main one, so it checks what it can: a PascalCase
 * file exports a PascalCase value, a kebab-case one defines no context or
 * provider, and a kebab-case spec, story or fixture isn't named after the
 * component beside it. See docs/rules/coding.md#files.
 */
import { readdirSync, statSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

const DIRECTIVE =
  /^\s*(?:eslint|oxlint)-disable(?:-next-line|-line)?(?=\s|$)(?<rest>[\s\S]*)$/;

// Two or more dashes between spaces, then text: the description syntax ESLint
// and Oxlint both read.
const REASON = /\s-{2,}\s+\S/;

const requireDisableReason = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Require a `-- reason` on every lint disable directive',
    },
    schema: [],
  },
  create(context) {
    return {
      Program() {
        for (const comment of context.sourceCode.getAllComments()) {
          const match = DIRECTIVE.exec(comment.value);

          if (!match || REASON.test(match.groups.rest)) continue;

          context.report({
            loc: comment.loc,
            message:
              'Say why this rule is disabled: end the directive with ` -- <reason>`.',
          });
        }
      },
    };
  },
};

const SOURCE_EXTENSIONS = ['.ts', '.tsx'];
const INDEX = /^index\.tsx?$/;

function isFile(path) {
  try {
    return statSync(path).isFile();
  } catch {
    return false;
  }
}

// `.`, `..` and `./dir/` name a directory, so a file of the same name beside
// it does not count, as in TypeScript's resolution.
const DIRECTORY = /(?:^|\/)\.{1,2}$|\/$/;

function indexIn(dir) {
  return (
    SOURCE_EXTENSIONS.map((ext) => resolve(dir, `index${ext}`)).find(isFile) ??
    null
  );
}

/** The barrel a relative specifier resolves to, or `null` when it names a file. */
function resolveBarrel(importer, specifier) {
  const target = resolve(dirname(importer), specifier);

  if (DIRECTORY.test(specifier)) return indexIn(target);

  const file = [target, ...SOURCE_EXTENSIONS.map((ext) => target + ext)].find(
    isFile,
  );

  if (file) return INDEX.test(basename(file)) ? file : null;

  return indexIn(target);
}

/** Type-only imports are erased at build time, so they add nothing to the graph. */
function isTypeOnly(node) {
  if (node.importKind === 'type' || node.exportKind === 'type') return true;

  const specifiers = node.specifiers ?? [];

  return (
    specifiers.length > 0 &&
    specifiers.every(
      ({ importKind, exportKind }) =>
        importKind === 'type' || exportKind === 'type',
    )
  );
}

/** `Button/index.ts`: a component's own entry, as opposed to a category or package barrel. */
function isComponentEntry(barrel) {
  return /^[A-Z]/.test(basename(dirname(barrel)));
}

const noBarrelImport = {
  meta: {
    type: 'problem',
    docs: {
      description:
        'Import the file that defines a thing, not a barrel that re-exports it',
    },
    schema: [
      {
        type: 'object',
        properties: { allowComponentEntries: { type: 'boolean' } },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const importer = resolve(context.cwd, context.filename);
    const { allowComponentEntries = false } = context.options[0] ?? {};

    // Assembling the public surface is what an index file is for.
    if (INDEX.test(basename(importer))) return {};

    function check(node) {
      const { source } = node;
      // `import(`./x`)` with no substitutions is a plain path too.
      const specifier =
        source?.type === 'TemplateLiteral' && source.expressions.length === 0
          ? source.quasis[0].value.cooked
          : source?.value;

      if (typeof specifier !== 'string' || !specifier.startsWith('.')) return;
      if (isTypeOnly(node)) return;

      const barrel = resolveBarrel(importer, specifier);

      if (!barrel) return;
      if (allowComponentEntries && isComponentEntry(barrel)) return;

      context.report({
        node: node.source,
        message: allowComponentEntries
          ? `\`${specifier}\` is a barrel. A story imports what it shows from the file that defines it, or a component's compound API from that component's own entry (\`../Button\`), never a category barrel or the package root. See docs/rules/coding.md#imports.`
          : `\`${specifier}\` is a barrel: import the file that defines what you need. A barrel puts everything it re-exports into this file's dependency graph. See docs/rules/coding.md#imports.`,
      });
    }

    return {
      ImportDeclaration: check,
      ExportNamedDeclaration: check,
      ExportAllDeclaration: check,
      ImportExpression: check,
    };
  },
};

const PASCAL = /^[A-Z][A-Za-z0-9]*$/;
const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
/** A component, class, provider or context: PascalCase, unlike an `UPPER_CASE` constant. */
const PASCAL_VALUE = /^[A-Z][A-Z0-9]*[a-z][A-Za-z0-9]*$/;

const toKebab = (name) =>
  name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();

/**
 * The names of a module's value exports, or `null` when one can't be named
 * (`export *`, a default export).
 */
function exportedValues(program) {
  const names = [];

  for (const node of program.body) {
    if (node.exportKind === 'type') continue;
    if (
      node.type === 'ExportAllDeclaration' ||
      node.type === 'ExportDefaultDeclaration'
    )
      return null;
    if (node.type !== 'ExportNamedDeclaration') continue;

    const { declaration } = node;

    names.push(
      ...(node.specifiers ?? [])
        .filter(({ exportKind }) => exportKind !== 'type')
        .map(({ exported }) => exported.name ?? exported.value),
      ...(declaration?.type === 'VariableDeclaration'
        ? declaration.declarations.map(({ id }) => id.name)
        : []),
      ...(declaration?.type === 'FunctionDeclaration' ||
      declaration?.type === 'ClassDeclaration'
        ? [declaration.id?.name]
        : []),
    );
  }

  return names.filter(Boolean);
}

const filenameCase = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Name a file in PascalCase for a component, class or provider, in kebab-case otherwise',
    },
    schema: [],
  },
  create(context) {
    const path = resolve(context.cwd, context.filename);
    const file = basename(path);
    const [name, ...rest] = file.split('.');
    const parts = rest.slice(0, -1);
    const extension = rest.at(-1);

    return {
      Program(node) {
        const report = (message) =>
          context.report({
            node,
            message: `${message} See docs/rules/coding.md#files.`,
          });
        const values = parts.length ? [] : exportedValues(node);

        if (file === 'index.tsx')
          report(
            'A barrel is `index.ts`: it only re-exports, so it has no JSX.',
          );
        if (!PASCAL.test(name) && !KEBAB.test(name))
          report(
            `\`${name}\` is neither PascalCase nor kebab-case. Name a component, class or provider in PascalCase and anything else in kebab-case: \`${toKebab(name)}\`.`,
          );
        for (const part of parts.filter((part) => !KEBAB.test(part)))
          report(
            `\`.${part}\` is not kebab-case: every part after the name is (\`.${toKebab(part)}\`).`,
          );
        if (
          PASCAL.test(name) &&
          !parts.length &&
          values &&
          !values.some((value) => PASCAL_VALUE.test(value))
        )
          report(
            `\`${file}\` exports no component, class or provider, so it is named in kebab-case: \`${toKebab(name)}.${extension}\`.`,
          );

        // A file that defines a context or provider is named after it. A
        // barrel only re-exports one.
        const provider =
          KEBAB.test(name) &&
          name !== 'index' &&
          values?.find(
            (value) =>
              PASCAL_VALUE.test(value) && /(?:Context|Provider)$/.test(value),
          );

        if (provider)
          report(
            `\`${file}\` defines \`${provider}\`, so it is named after it: \`${provider}.${extension}\`.`,
          );

        // A spec, story or fixture of the component beside it takes its
        // name. Only a PascalCase file counts, so that `store.test.ts` beside
        // `store.ts` passes, and `textarea` finds `TextArea.tsx`.
        const key =
          KEBAB.test(name) && parts.length && name.replaceAll('-', '');
        const subject =
          key &&
          readdirSync(dirname(path))
            .map((entry) => /^([A-Za-z0-9]+)\.tsx?$/.exec(entry)?.[1])
            .find(
              (stem) => stem && PASCAL.test(stem) && stem.toLowerCase() === key,
            );

        if (subject)
          report(
            `\`${file}\` covers \`${subject}\`, so it takes its name: \`${[subject, ...rest].join('.')}\`.`,
          );
      },
    };
  },
};

export default {
  meta: { name: 'repo' },
  rules: {
    'require-disable-reason': requireDisableReason,
    'no-barrel-import': noBarrelImport,
    'filename-case': filenameCase,
  },
};
