/**
 * Oxlint rules that only make sense for this repository, so they stay out of
 * the published `src/eslint-plugin`.
 *
 * `require-disable-reason` makes every lint exception say why it exists. A
 * bare `oxlint-disable-next-line react/forbid-dom-props` tells a reviewer that
 * a rule was switched off, not whether the inline style is a library contract
 * or a shortcut; the ` -- reason` suffix is where that decision is recorded.
 */
const DIRECTIVE =
  /^\s*(?:eslint|oxlint)-disable(?:-next-line|-line)?(?=\s|$)(?<rest>[\s\S]*)$/;

// ` -- ` followed by text, the description syntax ESLint and Oxlint both read.
const REASON = /\s--\s+\S/;

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

export default {
  meta: { name: 'repo' },
  rules: { 'require-disable-reason': requireDisableReason },
};
