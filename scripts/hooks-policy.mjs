import tsParser from '@typescript-eslint/parser';

const isEffectEvent = (node) =>
  (node?.type === 'Identifier' && node.name === 'useEffectEvent') ||
  (node?.type === 'Literal' && node.value === 'useEffectEvent') ||
  (node?.type === 'TemplateLiteral' &&
    node.expressions.length === 0 &&
    node.quasis[0].value.cooked === 'useEffectEvent');

// Inspect syntax rather than raw text so static computed keys, including
// escaped strings, select the strict pass while comments do not.
export function usesEffectEvent(source) {
  const ast = tsParser.parse(source, {
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  });
  const pending = [ast];
  while (pending.length) {
    const node = pending.pop();
    if (isEffectEvent(node)) return true;
    for (const value of Object.values(node)) {
      if (Array.isArray(value))
        pending.push(...value.filter((child) => child?.type));
      else if (value?.type) pending.push(value);
    }
  }
  return false;
}

export const effectEventImports = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      canonical:
        'Import useEffectEvent directly from react and call it without aliases, wrappers or namespace access so the official Hooks rules can enforce its contract.',
    },
  },
  create(context) {
    const report = (node) => context.report({ node, messageId: 'canonical' });
    const sourceCode = context.sourceCode;
    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            isEffectEvent(specifier.imported) &&
            (node.source.value !== 'react' ||
              specifier.local.name !== 'useEffectEvent')
          ) {
            report(specifier);
          } else if (
            specifier.type === 'ImportSpecifier' &&
            isEffectEvent(specifier.imported)
          ) {
            const [binding] = sourceCode.getDeclaredVariables(specifier);
            // The pinned Hooks plugin recognizes only a direct canonical call.
            // Check binding references so assignments and TS wrappers cannot
            // disguise an Effect Event hook as an ordinary function.
            for (const { identifier } of binding.references) {
              const parent = identifier.parent;
              if (
                parent.type !== 'TSTypeQuery' &&
                (parent.type !== 'CallExpression' ||
                  parent.callee !== identifier ||
                  parent.optional)
              )
                report(identifier);
            }
          }
        }
      },
      MemberExpression(node) {
        if (isEffectEvent(node.property)) report(node);
      },
      VariableDeclarator(node) {
        if (node.id.type === 'ObjectPattern') {
          for (const property of node.id.properties)
            if (isEffectEvent(property.key)) report(property);
        }
      },
      ExportNamedDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (
            isEffectEvent(specifier.local) ||
            isEffectEvent(specifier.exported)
          )
            report(specifier);
        }
      },
    };
  },
};
