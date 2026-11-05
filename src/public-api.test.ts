/**
 * Public API surface snapshot.
 *
 * Guards every subpath declared in `package.json` `exports` against accidental
 * additions, removals and renames, such as a file move that drops a re-export.
 * The snapshot lives in `src/__snapshots__/public-api.md` and is meant to be
 * read in a PR diff: a rename shows up as an adjacent `-`/`+` pair, a removal
 * as a lone `-`. Any diff in that file must be reflected in a changeset.
 *
 * Exports are enumerated with the TypeScript compiler API rather than a runtime
 * `import()`, so types are covered too (they vanish at runtime). A runtime
 * cross-check of the main entry catches a value that silently became
 * type-only.
 *
 * A package the entry re-exports whole (`export * from '@tenphi/tasty'`) is
 * recorded as that one line, not name by name, so a dependency bump that adds
 * names to it does not rewrite this snapshot. Names re-exported explicitly
 * (`export { Section } from 'react-stately'`) are listed like our own.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import ts from 'typescript';

const REPO_ROOT = resolve(__dirname, '..');

interface Subpath {
  /** Import specifier, e.g. `@cube-dev/ui-kit/probe`. */
  specifier: string;
  /** Absolute path of the source entry. */
  source: string;
}

type ExportKind = 'value' | 'type' | 'value+type';

interface ExportEntry {
  name: string;
  kind: ExportKind;
}

interface EntryExports {
  /** Packages re-exported whole with `export *`. */
  starPackages: string[];
  entries: ExportEntry[];
}

/** `./dist/probe/index.d.ts` -> `src/probe/index.ts`. */
function distTypesToSource(distPath: string): string {
  const rel = distPath.replace(/^\.\/dist\//, '').replace(/\.d\.ts$/, '.ts');

  return resolve(REPO_ROOT, 'src', rel);
}

/** Derive the subpaths from `package.json`, so a new one cannot skip this snapshot. */
function readSubpaths(): Subpath[] {
  const pkg = JSON.parse(
    readFileSync(resolve(REPO_ROOT, 'package.json'), 'utf8'),
  ) as { name: string; exports: Record<string, { types?: string } | string> };

  return Object.entries(pkg.exports).map(([key, value]) => {
    if (typeof value === 'string' || !value.types) {
      throw new Error(
        `[public-api] Export "${key}" has no "types" entry; cannot map it to a source file.`,
      );
    }

    return {
      specifier: key === '.' ? pkg.name : `${pkg.name}${key.slice(1)}`,
      source: distTypesToSource(value.types),
    };
  });
}

function resolveAlias(symbol: ts.Symbol, checker: ts.TypeChecker): ts.Symbol {
  if (!(symbol.flags & ts.SymbolFlags.Alias)) return symbol;

  const resolved = checker.getAliasedSymbol(symbol);

  // A re-export of a missing file resolves to the checker's `unknown` symbol,
  // which has no declarations and would be recorded as a value.
  if (!resolved.declarations?.length) {
    throw new Error(
      `[public-api] Export "${symbol.getName()}" does not resolve to a declaration.`,
    );
  }

  return resolved;
}

function isTypeOnlyDeclaration(declaration: ts.Declaration): boolean {
  if (ts.isExportSpecifier(declaration)) {
    return declaration.isTypeOnly || declaration.parent.parent.isTypeOnly;
  }

  if (ts.isImportSpecifier(declaration)) {
    return (
      declaration.isTypeOnly || declaration.parent.parent.isTypeOnly === true
    );
  }

  if (ts.isImportClause(declaration)) return declaration.isTypeOnly;

  if (ts.isNamespaceImport(declaration)) return declaration.parent.isTypeOnly;

  return false;
}

/** Whether an `export type` or `import type` sits anywhere in the alias chain. */
function isTypeOnlyAlias(symbol: ts.Symbol, checker: ts.TypeChecker): boolean {
  let current: ts.Symbol | undefined = symbol;

  while (current && current.flags & ts.SymbolFlags.Alias) {
    if (current.declarations?.some(isTypeOnlyDeclaration)) return true;

    current = checker.getImmediateAliasedSymbol(current);
  }

  return false;
}

/**
 * Classify a symbol as value / type / both, by what its alias chain ends at.
 * A type-only link in the chain makes it a type, since that is all a consumer
 * receives (a class exported with `export type`, for one).
 */
function classify(symbol: ts.Symbol, checker: ts.TypeChecker): ExportKind {
  if (isTypeOnlyAlias(symbol, checker)) return 'type';

  const resolved = resolveAlias(symbol, checker);
  const isValue = (resolved.flags & ts.SymbolFlags.Value) !== 0;
  const isType = (resolved.flags & ts.SymbolFlags.Type) !== 0;

  if (isValue && isType) return 'value+type';
  if (isType) return 'type';

  return 'value';
}

function createProgram(rootNames: string[]): ts.Program {
  const configPath = resolve(REPO_ROOT, 'tsconfig.json');
  const parsed = ts.getParsedCommandLineOfConfigFile(configPath, undefined, {
    ...ts.sys,
    onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
      throw new Error(
        `[public-api] Failed to read tsconfig.json: ${ts.flattenDiagnosticMessageText(diagnostic.messageText, ' ')}`,
      );
    },
  });

  return ts.createProgram({
    rootNames,
    options: { ...parsed!.options, noEmit: true },
  });
}

/** Every `export * from '<package>'` in an entry, with the symbols each one brings. */
function starPackageSymbols(
  sourceFile: ts.SourceFile,
  checker: ts.TypeChecker,
): Map<string, Set<ts.Symbol>> {
  const result = new Map<string, Set<ts.Symbol>>();

  for (const statement of sourceFile.statements) {
    if (
      !ts.isExportDeclaration(statement) ||
      statement.exportClause ||
      !statement.moduleSpecifier ||
      !ts.isStringLiteral(statement.moduleSpecifier) ||
      statement.moduleSpecifier.text.startsWith('.')
    ) {
      continue;
    }

    const moduleSymbol = checker.getSymbolAtLocation(statement.moduleSpecifier);
    const symbols = new Set(
      moduleSymbol
        ? checker
            .getExportsOfModule(moduleSymbol)
            .map((symbol) => resolveAlias(symbol, checker))
        : [],
    );

    result.set(statement.moduleSpecifier.text, symbols);
  }

  return result;
}

function collectExports(subpaths: Subpath[]): Map<string, EntryExports> {
  const program = createProgram(subpaths.map(({ source }) => source));
  const checker = program.getTypeChecker();
  const result = new Map<string, EntryExports>();

  for (const { specifier, source } of subpaths) {
    const sourceFile = program.getSourceFile(source);

    if (!sourceFile) {
      throw new Error(`[public-api] Source file not found: ${source}`);
    }

    const moduleSymbol = checker.getSymbolAtLocation(sourceFile);
    const starPackages = starPackageSymbols(sourceFile, checker);
    const fromStarPackage = new Set(
      [...starPackages.values()].flatMap((symbols) => [...symbols]),
    );

    const entries = moduleSymbol
      ? checker
          .getExportsOfModule(moduleSymbol)
          .filter(
            (symbol) => !fromStarPackage.has(resolveAlias(symbol, checker)),
          )
          .map((symbol) => ({
            name: symbol.getName(),
            kind: classify(symbol, checker),
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'en'))
      : [];

    result.set(specifier, {
      starPackages: [...starPackages.keys()].sort(),
      entries,
    });
  }

  return result;
}

function formatSnapshot(exportsBySubpath: Map<string, EntryExports>): string {
  const lines: string[] = [
    '# Public API surface',
    '',
    '<!-- Generated by src/public-api.test.ts. Do not edit by hand. -->',
    '',
    'Every export of every `package.json` subpath, grouped by import specifier. A package re-exported whole is one `export *` line. A diff here is a public API change and must be reflected in a changeset.',
    '',
  ];

  for (const [specifier, { starPackages, entries }] of exportsBySubpath) {
    lines.push(`## ${specifier}`, '');

    for (const pkg of starPackages) {
      lines.push(`export *   ${pkg}`);
    }

    if (starPackages.length) lines.push('');

    for (const { name, kind } of entries) {
      lines.push(`${kind.padEnd(10)} ${name}`);
    }

    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

describe('public API surface', () => {
  const subpaths = readSubpaths();
  const exportsBySubpath = collectExports(subpaths);

  it('matches the recorded snapshot', async () => {
    await expect(formatSnapshot(exportsBySubpath)).toMatchFileSnapshot(
      resolve(__dirname, '__snapshots__/public-api.md'),
    );
  });

  // The compiler pass above cannot tell a value that was accidentally turned
  // into a type-only export from one that still exists at runtime. The main
  // entry is safe to evaluate here, and its own values must all be present.
  // The generous timeout is for the dynamic import, which transforms the
  // whole library.
  it('evaluates every value the main entry declares', async () => {
    const { entries } = exportsBySubpath.get('@cube-dev/ui-kit')!;
    const expected = entries
      .filter(({ kind }) => kind !== 'type')
      .map(({ name }) => name);
    const actual = new Set(Object.keys(await import('./index')));

    expect(expected.filter((name) => !actual.has(name))).toEqual([]);
  }, 30_000);
});
