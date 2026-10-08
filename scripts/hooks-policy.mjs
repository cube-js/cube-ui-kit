import tsParser from '@typescript-eslint/parser';

const isEffectEvent = (node) =>
  node?.name === 'useEffectEvent' || node?.value === 'useEffectEvent';

// Comments are not tokens. Aliased imports and computed member access still
// contain this token, so they cannot evade selection for the strict pass.
export function usesEffectEvent(source) {
  const { tokens } = tsParser.parse(source, {
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
    tokens: true,
  });
  return tokens.some(
    (token) => token.value.replaceAll(/["']/g, '') === 'useEffectEvent',
  );
}

export const effectEventImports = {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      canonical:
        'Import useEffectEvent directly from react without aliases or namespace access so the official Hooks rules can enforce its contract.',
    },
  },
  create(context) {
    const report = (node) => context.report({ node, messageId: 'canonical' });
    return {
      ImportDeclaration(node) {
        for (const specifier of node.specifiers) {
          if (
            specifier.type === 'ImportSpecifier' &&
            isEffectEvent(specifier.imported) &&
            (node.source.value !== 'react' ||
              specifier.local.name !== 'useEffectEvent')
          )
            report(specifier);
        }
      },
      MemberExpression(node) {
        if (isEffectEvent(node.property)) report(node);
      },
      VariableDeclarator(node) {
        if (node.init?.name === 'useEffectEvent') report(node);
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
