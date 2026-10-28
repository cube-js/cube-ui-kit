// @vitest-environment node
import { checkShare } from './measure-size.js';

describe('checkShare', () => {
  const full = { name: 'All', size: 1000 };

  it('passes a partial import at 35% of the full bundle', () => {
    expect(checkShare({ name: 'Button', size: 350 }, full)).toBeNull();
  });

  it('fails one above it as broken tree-shaking', () => {
    expect(checkShare({ name: 'Button', size: 351 }, full)).toMatch(
      /^"Button" is 35\.1% of the full bundle, over 35%: tree-shaking/,
    );
  });
});
