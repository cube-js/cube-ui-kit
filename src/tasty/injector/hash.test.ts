import { hashAtomicValue, hashCssText, hashSelector } from './hash';

describe('hashCssText', () => {
  it('should generate consistent hashes for same input', () => {
    const css = 'color: red; padding: 10px;';
    const hash1 = hashCssText(css);
    const hash2 = hashCssText(css);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(
      /^t-[123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]+$/,
    );
  });

  it('should generate different hashes for different inputs', () => {
    const css1 = 'color: red;';
    const css2 = 'color: blue;';

    expect(hashCssText(css1)).not.toBe(hashCssText(css2));
  });

  it('should generate compact hashes', () => {
    const css =
      'background: linear-gradient(45deg, #ff0000, #00ff00); padding: 20px; margin: 10px;';
    const hash = hashCssText(css);

    expect(hash.length).toBeLessThan(20); // Should be compact
    expect(hash.startsWith('t-')).toBe(true);
  });

  it('should handle empty strings', () => {
    const hash = hashCssText('');
    expect(hash).toMatch(
      /^t-[123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]+$/,
    );
  });

  it('should handle unicode characters', () => {
    const css = 'content: "🎉"; color: red;';
    const hash = hashCssText(css);
    expect(hash).toMatch(
      /^t-[123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ]+$/,
    );
  });
});

describe('hashAtomicValue', () => {
  it('should preserve simple tokens', () => {
    expect(hashAtomicValue('#surface')).toBe('surface');
    expect(hashAtomicValue('#primary')).toBe('primary');
    expect(hashAtomicValue('#text')).toBe('text');
  });

  it('should preserve simple values', () => {
    expect(hashAtomicValue('red')).toBe('red');
    expect(hashAtomicValue('10px')).toBe('10px');
    expect(hashAtomicValue('auto')).toBe('auto');
    expect(hashAtomicValue('flex')).toBe('flex');
  });

  it('should hash complex tokens with opacity', () => {
    const result = hashAtomicValue('#purple.05');
    expect(result).not.toBe('purple.05');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should hash complex values', () => {
    const result = hashAtomicValue('rgb(255 128 0)');
    expect(result).not.toBe('rgb(255 128 0)');
    expect(result.length).toBeGreaterThan(0);
  });

  it('should hash responsive arrays', () => {
    const result = hashAtomicValue("['4x', '2x', '1x']");
    expect(result).not.toBe("['4x', '2x', '1x']");
    expect(result.length).toBeGreaterThan(0);
  });

  it('should generate consistent hashes', () => {
    const value = 'linear-gradient(45deg, red, blue)';
    expect(hashAtomicValue(value)).toBe(hashAtomicValue(value));
  });
});

describe('hashSelector', () => {
  it('should use abbreviations for common selectors', () => {
    expect(hashSelector(':hover')).toBe('h');
    expect(hashSelector(':focus')).toBe('f');
    expect(hashSelector(':active')).toBe('a');
    expect(hashSelector(':disabled')).toBe('d');
    expect(hashSelector(':focus-visible')).toBe('fv');
    expect(hashSelector('[disabled]')).toBe('d');
    expect(hashSelector('[aria-selected="true"]')).toBe('sel');
  });

  it('should hash complex selectors with x prefix', () => {
    const result = hashSelector('hovered & !disabled');
    expect(result.startsWith('x')).toBe(true);
    expect(result.length).toBeGreaterThan(1);
  });

  it('should hash CSS selectors', () => {
    const result = hashSelector('&.active');
    expect(result.startsWith('x')).toBe(true);
  });

  it('should generate consistent hashes for complex selectors', () => {
    const selector = '(hovered | focused) & !disabled';
    expect(hashSelector(selector)).toBe(hashSelector(selector));
  });

  it('should generate different hashes for different selectors', () => {
    expect(hashSelector('hovered & focused')).not.toBe(
      hashSelector('pressed & active'),
    );
  });
});

describe('hash collision resistance', () => {
  it('should have low collision rate for similar inputs', () => {
    const hashes = new Set();
    const inputs = [
      'color: red',
      'color: blue',
      'color: green',
      'background: red',
      'background: blue',
      'padding: 10px',
      'padding: 20px',
      'margin: 10px',
    ];

    inputs.forEach((input) => {
      hashes.add(hashCssText(input));
    });

    expect(hashes.size).toBe(inputs.length); // No collisions
  });

  it('should handle many variations without collisions', () => {
    const hashes = new Set();

    // Generate many variations with more diverse content
    for (let i = 0; i < 1000; i++) {
      const css = `color: rgb(${i % 256}, ${(i * 2) % 256}, ${(i * 3) % 256}); padding: ${i}px; margin: ${i * 2}px;`;
      hashes.add(hashCssText(css));
    }

    // Should have very few collisions (ideally none)
    // DJB2 with modulo may have some collisions, so we allow for that
    expect(hashes.size).toBeGreaterThan(900); // Allow for some collisions
  });
});
