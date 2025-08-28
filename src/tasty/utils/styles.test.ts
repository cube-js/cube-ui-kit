import { computeState, extractStyles } from './styles';

describe('computeState', () => {
  function checkNormalization(list) {
    list.forEach((obj, i) => {
      it(`input ${i}`, () => {
        // @ts-ignore
        expect(computeState(...obj.input)).toEqual(obj.output);
      });
    });
  }

  const AND = '&';
  const OR = '|';
  const XOR = '^';

  describe('State normalization', () => {
    checkNormalization([
      {
        input: [
          [XOR, [OR, [AND, 2, 2], 1], 0],
          [1, 0, 1],
        ],
        output: !!(((1 & 1) | 0) ^ 1),
      },
      {
        input: [
          [OR, [AND, [XOR, 2, 2], 1], 0],
          [1, 0, 1],
        ],
        output: !!(((1 ^ 1) & 0) | 1),
      },
      {
        input: [
          [AND, [OR, [XOR, 2, 2], 1], 0],
          [1, 0, 1],
        ],
        output: !!(((1 ^ 1) | 0) & 1),
      },
    ]);
  });
});

describe('extractStyles', () => {
  function checkExtraction(list) {
    list.forEach((obj, i) => {
      it(`to list ${i}`, () => {
        // @ts-ignore
        expect(extractStyles(...obj.input)).toEqual(obj.output);
      });
    });
  }

  describe('Should extract styles from props', () => {
    checkExtraction([
      {
        input: [
          {
            fill: '#black',
            border: false,
            styles: { fill: '#clear', border: true, color: '#dark' },
          },
          ['fill', 'border'],
        ],
        output: {
          fill: '#black',
          border: false,
          color: '#dark',
        },
      },
    ]);
  });
});
