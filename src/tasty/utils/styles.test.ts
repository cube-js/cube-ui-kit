import {
  applyStates,
  computeState,
  extractStyles,
  replaceStateValues,
  styleMapToStyleMapStateList,
} from './styles';

describe('applyStates', () => {
  function checkAppliance(list) {
    list.forEach((obj, i) => {
      it(`to list ${i}`, () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        expect(applyStates(...obj.input)).toEqual(obj.output);
      });
    });
  }

  describe('Apply states to selector', () => {
    checkAppliance([
      {
        input: [
          'nu-element',
          [
            {
              mods: [],
              value: 'value1',
            },
            {
              mods: ['mod1'],
              value: 'value2',
            },
            {
              notMods: ['mod2'],
              value: 'value2',
            },
            {
              mods: ['mod1'],
              notMods: ['mod2'],
              value: 'value3',
            },
          ],
        ],
        output: `nu-element{
value1}
nu-element[data-is-mod1]{
value2}
nu-element:not([data-is-mod2]){
value2}
nu-element[data-is-mod1]:not([data-is-mod2]){
value3}
`,
      },
    ]);
  });

  describe('Apply complex case', () => {
    checkAppliance([
      {
        input: [
          'nu-element',
          [
            {
              mods: [],
              notMods: [
                '[data-type="link"]',
                '[data-size="hero"]',
                '[data-size="large"]',
              ],
              value: 'value1',
            },
            {
              mods: ['[data-type="link"]'],
              notMods: ['[data-size="hero"]', '[data-size="large"]'],
              value: '',
            },
            {
              mods: ['[data-type="link"]', '[data-size="hero"]'],
              notMods: ['[data-size="large"]'],
              value: '',
            },
            {
              mods: ['[data-type="link"]', '[data-size="large"]'],
              notMods: ['[data-size="hero"]'],
              value: '',
            },
            {
              mods: ['[data-size="hero"]'],
              notMods: ['[data-type="link"]', '[data-size="large"]'],
              value: 'value2',
            },
            {
              mods: ['[data-size="large"]'],
              notMods: ['[data-type="link"]', '[data-size="hero"]'],
              value: 'value3',
            },
          ],
        ],
        output: `nu-element:not([data-type="link"]):not([data-size="hero"]):not([data-size="large"]){
value1}
nu-element[data-size="hero"]:not([data-type="link"]):not([data-size="large"]){
value2}
nu-element[data-size="large"]:not([data-type="link"]):not([data-size="hero"]){
value3}
`,
      },
    ]);
  });
});

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

describe('replaceStateValues', () => {
  function checkReplacement(list) {
    list.forEach((obj, i) => {
      it(`to list ${i}`, () => {
        // @ts-ignore
        expect(replaceStateValues(...obj.input)).toEqual(obj.output);
      });
    });
  }

  describe('Replace state values', () => {
    checkReplacement([
      {
        input: [
          [
            {
              mods: [],
              value: {
                style1: 'value1',
              },
            },
            {
              mods: ['mod1'],
              value: {
                style2: 'value2',
                style3: 'value3',
              },
            },
            {
              mods: ['mod2'],
              value: {
                style2: 'value4',
                style3: 'value5',
              },
            },
          ],
          ({ style1, style2, style3 }) =>
            `${style1 || ''}${style2 || ''}${style3 || ''}`,
        ],
        output: [
          {
            mods: [],
            value: 'value1',
          },
          {
            mods: ['mod1'],
            value: 'value2value3',
          },
          {
            mods: ['mod2'],
            value: 'value4value5',
          },
        ],
      },
    ]);
  });
});

describe('styleMapToStyleMapStateList', () => {
  function checkStyleMapNormalization(list) {
    list.forEach((obj, i) => {
      it(`input ${i}`, () => {
        // @ts-ignore
        // console.log('!', styleMapToStyleMapStateList(...obj.input));
        // @ts-ignore
        expect(styleMapToStyleMapStateList(...obj.input)).toEqual(obj.output);
      });
    });
  }

  describe('State normalization', () => {
    checkStyleMapNormalization([
      {
        input: [
          {
            one: {
              '': 'value1',
              'mod1 & mod2': 'value2',
            },
            two: {
              '': 'value1',
              'mod1 | mod2 & mod3': 'value2',
            },
          },
          ['one'],
        ],
        output: [
          { mods: [], notMods: ['mod1', 'mod2'], value: { one: 'value1' } },
          { mods: ['mod1'], notMods: ['mod2'], value: { one: 'value1' } },
          { mods: ['mod1', 'mod2'], notMods: [], value: { one: 'value2' } },
          { mods: ['mod2'], notMods: ['mod1'], value: { one: 'value1' } },
        ],
      },
      {
        input: [
          {
            one: {
              '': 'value1',
              'mod1 & mod2': 'value2',
            },
            two: {
              '': 'value3',
              'mod1 | mod2 & mod3': 'value4',
            },
          },
          ['one', 'two'],
        ],
        output: [
          {
            mods: [],
            notMods: ['mod1', 'mod2', 'mod3'],
            value: { one: 'value1', two: 'value3' },
          },
          {
            mods: ['mod1'],
            notMods: ['mod2', 'mod3'],
            value: { one: 'value1', two: 'value4' },
          },
          {
            mods: ['mod1', 'mod2'],
            notMods: ['mod3'],
            value: { one: 'value2', two: 'value4' },
          },
          {
            mods: ['mod1', 'mod2', 'mod3'],
            notMods: [],
            value: { one: 'value2', two: 'value4' },
          },
          {
            mods: ['mod1', 'mod3'],
            notMods: ['mod2'],
            value: { one: 'value1', two: 'value4' },
          },
          {
            mods: ['mod2'],
            notMods: ['mod1', 'mod3'],
            value: { one: 'value1', two: 'value3' },
          },
          {
            mods: ['mod2', 'mod3'],
            notMods: ['mod1'],
            value: { one: 'value1', two: 'value4' },
          },
          {
            mods: ['mod3'],
            notMods: ['mod1', 'mod2'],
            value: { one: 'value1', two: 'value3' },
          },
        ],
      },
      {
        input: [
          {
            one: {
              '': 'value2',
              '!mod2 | mod1': 'value1',
            },
          },
          ['one'],
        ],
        output: [
          { mods: [], notMods: ['mod2', 'mod1'], value: { one: 'value1' } },
          { mods: ['mod2'], notMods: ['mod1'], value: { one: 'value2' } },
          { mods: ['mod2', 'mod1'], notMods: [], value: { one: 'value1' } },
          { mods: ['mod1'], notMods: ['mod2'], value: { one: 'value1' } },
        ],
      },
      {
        input: [
          {
            one: {
              '': 'default',
              '[type="one"]': 'one',
              '[type="two"]': 'two',
              '[type="three"]': 'three',
              mod: 'modvalue',
            },
          },
          ['one'],
        ],
        output: [
          {
            mods: [],
            notMods: ['mod', '[type="three"]', '[type="two"]', '[type="one"]'],
            value: { one: 'default' },
          },
          {
            mods: ['mod'],
            notMods: ['[type="three"]', '[type="two"]', '[type="one"]'],
            value: { one: 'modvalue' },
          },
          {
            mods: ['mod', '[type="three"]'],
            notMods: ['[type="two"]', '[type="one"]'],
            value: { one: 'modvalue' },
          },
          {
            mods: ['mod', '[type="two"]'],
            notMods: ['[type="three"]', '[type="one"]'],
            value: { one: 'modvalue' },
          },
          {
            mods: ['mod', '[type="one"]'],
            notMods: ['[type="three"]', '[type="two"]'],
            value: { one: 'modvalue' },
          },
          {
            mods: ['[type="three"]'],
            notMods: ['mod', '[type="two"]', '[type="one"]'],
            value: { one: 'three' },
          },
          {
            mods: ['[type="two"]'],
            notMods: ['mod', '[type="three"]', '[type="one"]'],
            value: { one: 'two' },
          },
          {
            mods: ['[type="one"]'],
            notMods: ['mod', '[type="three"]', '[type="two"]'],
            value: { one: 'one' },
          },
        ],
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
