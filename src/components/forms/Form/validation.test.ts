import { applyRules } from './validation';

async function apply(rule, valid: any[] = [], invalid: any[] = []) {
  for (const validCase of valid) {
    await expect(
      applyRules(validCase, [rule], {}).catch((err) => {
        console.error('fails with', err);
      }),
    ).resolves.toBeEmpty;
  }

  for (const invalidCase of invalid) {
    await expect(applyRules(invalidCase, [rule], {})).rejects.toEqual(
      rule.message,
    );
  }
}

describe('Form validation', () => {
  it('"required" rule applying', () => {
    return apply(
      {
        required: true,
        message: 'This field is required',
      },
      ['test'],
      [''],
    );
  });

  it('"validator" rule applying', () => {
    return apply(
      {
        required: true,
        validator(rule, val) {
          return val.length >= 8 ? Promise.resolve() : Promise.reject();
        },
        message: 'This field should be at least 8 symbols long',
      },
      ['verylong'],
      ['short', ''],
    );
  });

  it('"email" rule applying', () => {
    return apply(
      {
        type: 'email',
        message: 'This field should be a valid email address',
      },
      ['test@example.com'],
      ['test@', 'test@example', '@example.com', ''],
    );
  });

  it('"enum" rule applying', () => {
    return apply(
      {
        enum: ['one', 'two', 'three'],
        message: 'This field should one of the following values',
      },
      ['one', 'two', 'three', ''],
      ['four', 'five'],
    );
  });

  it('"min" rule applying', () => {
    return apply(
      {
        min: 6,
        message: 'This field should be more than 5 or equal it',
      },
      [6, 10, 'verylong', [1, 2, 3, 4, 5, 6]],
      [0, 4, 'short', [1, 2, 3]],
    );
  });

  it('"max" rule applying', () => {
    return apply(
      {
        max: 5,
        message: 'This field should be less than 5 or equal it',
      },
      [0, 4, 'short', [1, 2, 3]],
      [6, 10, 'verylong', [1, 2, 3, 4, 5, 6]],
    );
  });

  it('"whitespace" rule applying', () => {
    return apply(
      {
        whitespace: true,
        message: 'This field should contain non-empty symbols',
      },
      ['  12 ', '2'],
      [' ', '\t '],
    );
  });

  it('"pattern" rule applying', () => {
    return apply(
      {
        pattern: /^a.+z$/,
        message: 'This field should match pattern',
      },
      ['abcz', 'a6z'],
      ['abc', '234'],
    );
  });

  it('transformation before validation', () => {
    return apply(
      {
        required: true,
        transform(v) {
          return v.trim();
        },
        message: 'This field should be non-empty',
      },
      [' asd ', 'xc'],
      ['\t  ', ' '],
    );
  });
});
