import { RawStyleToken } from './tokenizer';

export type StyleToken = RawStyleToken & {
  children?: StyleToken[];
};

const COLOR_FUNCTIONS = ['rgb', 'rgba', 'hsl', 'hsla'];

export function createAST(
  tokens: StyleToken[],
  startIndex = 0,
): [StyleToken[], number] {
  const ast: StyleToken[] = [];

  for (let i: number = startIndex; i < tokens.length; i++) {
    let token = tokens[i];

    switch (token.type) {
      case 'property':
        const propertyName = `--${token.value.slice(1)}`;

        token.type = 'func';
        token.value = 'var';
        token.children = [
          {
            type: 'propertyName',
            value: propertyName,
          },
        ];
        break;
      case 'func':
        if (COLOR_FUNCTIONS.includes(token.value)) {
          token.type = 'color';

          do {
            i++;
            token.value += tokens[i].value;
          } while (tokens[i] && tokens[i].value !== ')');
        } else {
          [token.children, i] = createAST(tokens, i + 2);
        }
        break;
      case 'bracket':
        if (token.value === '(') {
          token.type = 'func';
          token.value = 'calc';
          [token.children, i] = createAST(tokens, i + 1);
        } else if (token.value === ')') {
          return [ast, i + 1];
        }
        break;
      default:
        break;
    }

    if (token.type !== 'space') {
      ast.push(token);
    }

    if (i === -1) break;
  }

  return [ast, -1];
}
