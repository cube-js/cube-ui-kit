import { DEFAULTS } from '../defaults.generated';
import { DefaultsRegistry, DefaultValue, VerifiedDefault } from '../types';

/**
 * Flag props explicitly set to the value the component already defaults to.
 *
 * Deliberately plain-AST with no type information: the defaults come from a
 * pregenerated registry, which keeps the rule usable under both ESLint and
 * Oxlint (whose JS plugin bridge does not support type-aware rules).
 */

const UI_KIT = '@cube-dev/ui-kit';

/** Minimal structural types — avoids depending on ESLint's own type packages. */
interface Node {
  type: string;
  range: [number, number];
  [key: string]: any;
}

interface Variable {
  name: string;
  defs: { type: string; node: Node; parent?: Node }[];
}

interface Scope {
  variables: Variable[];
  upper: Scope | null;
}

/**
 * Walk the scope chain outward to the nearest binding for `name`.
 *
 * Resolving through the chain — rather than matching the raw JSX name — is what
 * makes shadowing work: a local `function Button() {}` or an inner
 * `const Button = ...` is found before the module-level import, and since its
 * definition is not an `ImportBinding` the rule bails.
 */
function findVariable(scope: Scope | null, name: string): Variable | null {
  for (let current = scope; current; current = current.upper) {
    const found = current.variables.find((variable) => variable.name === name);

    if (found) return found;
  }

  return null;
}

function isAllowedSource(source: string, packages: string[]): boolean {
  return packages.some((pkg) => source === pkg || source.startsWith(`${pkg}/`));
}

/**
 * Resolve a JSX tag to the name it is *exported* under from ui-kit, or `null`
 * when it cannot be proven to come from ui-kit at all.
 *
 * Returning `null` is the default outcome — there is no name-based fallback, so
 * an unrelated component that merely shares a name with a ui-kit export (very
 * likely for `Button`, `Card`, `Text`, `Link`, `Grid`, `Tag`, ...) is never
 * matched, and its props are never rewritten.
 */
function resolveComponentName(
  nameNode: Node,
  scope: Scope,
  isAllowed: (source: string) => boolean,
): string | null {
  const path: string[] = [];
  let current = nameNode;

  while (current.type === 'JSXMemberExpression') {
    path.unshift(current.property.name);
    current = current.object;
  }

  // `<svg:rect>`-style namespaced names are never ui-kit components.
  if (current.type !== 'JSXIdentifier') return null;

  const variable = findVariable(scope, current.name);
  const def = variable?.defs[0];

  if (!def || def.type !== 'ImportBinding') return null;

  const declaration = def.parent;

  if (
    declaration?.type !== 'ImportDeclaration' ||
    typeof declaration.source?.value !== 'string' ||
    !isAllowed(declaration.source.value)
  ) {
    return null;
  }

  const specifier = def.node;

  if (specifier.type === 'ImportSpecifier') {
    // `import { Button as Btn }` -> key the registry on `Button`, the exported
    // name, not on the local alias.
    const imported = specifier.imported?.name;

    if (!imported) return null;

    return [imported, ...path].join('.');
  }

  if (specifier.type === 'ImportNamespaceSpecifier') {
    // `import * as UI` -> the namespace itself is not a component.
    return path.length ? path.join('.') : null;
  }

  // ui-kit has no default export; anything else is not resolvable.
  return null;
}

/** Read a JSX attribute's value, but only when it is a plain literal. */
function literalValue(attribute: Node): DefaultValue | undefined {
  const { value } = attribute;

  // Shorthand `<Button isLoading />` means `true`.
  if (value === null || value === undefined) return true;

  if (value.type === 'Literal') {
    const literal = value.value;

    if (
      typeof literal === 'string' ||
      typeof literal === 'number' ||
      typeof literal === 'boolean'
    ) {
      return literal;
    }

    return undefined;
  }

  if (value.type === 'JSXExpressionContainer') {
    const expression = value.expression;

    if (expression.type === 'Literal') {
      const literal = expression.value;

      if (
        typeof literal === 'string' ||
        typeof literal === 'number' ||
        typeof literal === 'boolean'
      ) {
        return literal;
      }
    }

    // Negative numbers parse as a unary expression, not a literal.
    if (
      expression.type === 'UnaryExpression' &&
      expression.operator === '-' &&
      expression.argument?.type === 'Literal' &&
      typeof expression.argument.value === 'number'
    ) {
      return -expression.argument.value;
    }
  }

  return undefined;
}

function matchesDefault(entry: VerifiedDefault, value: DefaultValue): boolean {
  if (entry.value === value) return true;

  return (entry.aliases ?? []).includes(value);
}

export interface RuleOptions {
  /**
   * Modules whose imports are treated as ui-kit components. Defaults to the
   * package itself; add an internal barrel here if you re-export ui-kit through
   * one. Never a wildcard — provenance has to stay provable.
   */
  packages?: string[];
  /**
   * Also treat *relative* import specifiers as ui-kit provenance.
   *
   * This exists for linting the ui-kit repository itself, where components are
   * reached by path (`../../layout/Space`, `./Button`, `..`) and never by package
   * name, so `packages` matches nothing and the rule silently does nothing. The
   * specifiers share no usable prefix, so `packages` cannot express them either.
   *
   * Never enable it in a consumer project: there, a relative import is the
   * consumer's own component, and trusting it would rewrite props on code this
   * registry knows nothing about. Shadowing still bails — resolution requires an
   * `ImportBinding`, so a local `const Badge = tasty({})` is never matched.
   */
  relativeImports?: boolean;
}

export function createRule(registry: DefaultsRegistry = DEFAULTS) {
  return {
    meta: {
      type: 'suggestion' as const,
      docs: {
        description:
          'Disallow passing a Cube UI Kit prop that is already the component default',
      },
      fixable: 'code' as const,
      schema: [
        {
          type: 'object',
          properties: {
            packages: {
              type: 'array',
              items: { type: 'string' },
              minItems: 1,
            },
            relativeImports: { type: 'boolean' },
          },
          additionalProperties: false,
        },
      ],
      messages: {
        redundant:
          '`{{component}}` already defaults `{{prop}}` to {{value}} — remove the redundant prop.',
      },
    },

    create(context: any) {
      const options: RuleOptions = context.options?.[0] ?? {};
      const packages = options.packages ?? [UI_KIT];
      const relativeImports = options.relativeImports ?? false;
      const sourceCode = context.sourceCode ?? context.getSourceCode();

      const isAllowed = (source: string) =>
        (relativeImports && source.startsWith('.')) ||
        isAllowedSource(source, packages);

      return {
        // Typed as `any` on purpose: the structural `Node`/`Scope` interfaces
        // below are internal, and naming them here would leak them into the
        // published plugin's inferred type (TS4023).
        JSXOpeningElement(node: any) {
          const scope: Scope = sourceCode.getScope
            ? sourceCode.getScope(node)
            : context.getScope();

          const component = resolveComponentName(node.name, scope, isAllowed);

          if (!component) return;

          const entry = registry.components[component];

          if (!entry) return;

          let seenSpread = false;

          for (const attribute of node.attributes as Node[]) {
            if (attribute.type === 'JSXSpreadAttribute') {
              seenSpread = true;
              continue;
            }

            // `<Button {...props} size="medium" />` intentionally *overrides*
            // whatever `props.size` holds. Removing the attribute would hand
            // control back to the spread, so it is not redundant.
            if (seenSpread) continue;

            if (attribute.type !== 'JSXAttribute') continue;
            if (attribute.name?.type !== 'JSXIdentifier') continue;

            const propEntry = entry.props[attribute.name.name];

            if (!propEntry || propEntry.kind !== 'default') continue;

            const value = literalValue(attribute);

            if (value === undefined) continue;
            if (!matchesDefault(propEntry, value)) continue;

            context.report({
              node: attribute,
              messageId: 'redundant',
              data: {
                component,
                prop: attribute.name.name,
                value: JSON.stringify(propEntry.value),
              },
              fix(fixer: any) {
                // Remove the preceding whitespace along with the attribute so
                // the tag does not end up with a double space.
                const before = sourceCode.getTokenBefore(attribute);

                return fixer.removeRange([
                  before ? before.range[1] : attribute.range[0],
                  attribute.range[1],
                ]);
              },
            });
          }
        },
      };
    },
  };
}

export const noRedundantDefaultProp = createRule();
