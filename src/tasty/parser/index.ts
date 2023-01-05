import { tokenize } from './tokenizer';
import { renderStyleTokens, CustomUnitMap } from './renderer';
import { createAST, StyleToken } from './ast';

interface StyleParserProps {
  units: CustomUnitMap;
}

export function CreateStyleParser({ units }: StyleParserProps) {
  return {
    parse(value) {
      return createAST(tokenize(value));
    },
    render(tokens) {
      return renderStyleTokens(tokens, { units });
    },
    excludeMods(tokens: StyleToken[], allMods: string[]) {
      const mods: string[] = [];

      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];

        if (token.type === 'text') {
          const mod = token.value;

          if (allMods.includes(mod)) {
            mods.push(mod);
            tokens.splice(i--, 1);
          }
        }
      }

      return mods;
    },
  };
}
