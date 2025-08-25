import { flattenNestedCss, wrapWithAtRules } from './flatten';

describe('flattenNestedCss', () => {
  const baseClassName = 't-abc123';

  it('should handle empty CSS', () => {
    expect(flattenNestedCss('', baseClassName)).toEqual([]);
    expect(flattenNestedCss('   ', baseClassName)).toEqual([]);
  });

  it('should handle simple declarations without selectors', () => {
    const css = '&{ color: red; padding: 10px; }';
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName}`,
        declarations: 'color: red; padding: 10px;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle & selector replacement', () => {
    const css = `
      &{ color: red; }
      &:hover{ color: blue; }
      &:focus{ color: green; }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName}`,
        declarations: 'color: red;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName}:hover`,
        declarations: 'color: blue;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName}:focus`,
        declarations: 'color: green;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle complex & selectors', () => {
    const css = `
      &.active{ background: blue; }
      & > .child{ margin: 10px; }
      & + &{ border: 1px solid red; }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName}.active`,
        declarations: 'background: blue;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName} > .child`,
        declarations: 'margin: 10px;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName} + .${baseClassName}.${baseClassName}`,
        declarations: 'border: 1px solid red;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle .Class descendant selectors', () => {
    const css = `
      .child{ color: blue; }
      .header{ font-size: 18px; }
      .footer .text{ color: gray; }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName} .child`,
        declarations: 'color: blue;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName} .header`,
        declarations: 'font-size: 18px;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName} .footer .text`,
        declarations: 'color: gray;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle SubElement (uppercase) selectors', () => {
    const css = `
      Title{ color: blue; font-weight: bold; }
      Header{ background: gray; }
      Content{ padding: 20px; }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName} [data-element="Title"]`,
        declarations: 'color: blue; font-weight: bold;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName} [data-element="Header"]`,
        declarations: 'background: gray;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName} [data-element="Content"]`,
        declarations: 'padding: 20px;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle pseudo-classes and attributes', () => {
    const css = `
      :hover{ color: red; }
      :focus-visible{ outline: 2px solid blue; }
      [disabled]{ opacity: 0.5; }
      [aria-selected="true"]{ background: highlight; }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName}:hover`,
        declarations: 'color: red;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName}:focus-visible`,
        declarations: 'outline: 2px solid blue;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName}[disabled]`,
        declarations: 'opacity: 0.5;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName}[aria-selected="true"]`,
        declarations: 'background: highlight;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle media queries', () => {
    const css = `
      &{ color: red; }
      @media (min-width: 768px){ &{ color: blue; } }
      @media (max-width: 480px){ &{ color: green; } }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result.length).toBe(3);

    // Base rule without at-rules
    expect(
      result.some(
        (r) =>
          r.selector === `.${baseClassName}.${baseClassName}` &&
          r.declarations.includes('color: red') &&
          !r.atRules,
      ),
    ).toBe(true);

    // Media query rules with at-rules context
    expect(
      result.some(
        (r) =>
          r.selector === `.${baseClassName}.${baseClassName}` &&
          r.declarations.includes('color: blue') &&
          r.atRules?.includes('@media (min-width: 768px)'),
      ),
    ).toBe(true);

    expect(
      result.some(
        (r) =>
          r.selector === `.${baseClassName}.${baseClassName}` &&
          r.declarations.includes('color: green') &&
          r.atRules?.includes('@media (max-width: 480px)'),
      ),
    ).toBe(true);
  });

  it('should handle complex nested structure from renderStyles', () => {
    // This simulates output from renderStyles with base wrapper and nested selectors
    const css = `
      &{
        padding: 2x;
        color: red;
      }
      &:hover{
        color: blue;
      }
      Title{
        font-size: 18px;
        color: inherit;
      }
      .child{
        margin: 1x;
      }
      @media (min-width: 768px){
        &{
          padding: 4x;
        }
        Title{
          font-size: 20px;
        }
      }
    `;

    const result = flattenNestedCss(css, baseClassName);

    expect(result.length).toBeGreaterThan(0);
    expect(
      result.some((r) => r.selector === `.${baseClassName}.${baseClassName}`),
    ).toBe(true);
    expect(
      result.some(
        (r) => r.selector === `.${baseClassName}.${baseClassName}:hover`,
      ),
    ).toBe(true);
    expect(
      result.some(
        (r) =>
          r.selector ===
          `.${baseClassName}.${baseClassName} [data-element="Title"]`,
      ),
    ).toBe(true);
    expect(
      result.some(
        (r) => r.selector === `.${baseClassName}.${baseClassName} .child`,
      ),
    ).toBe(true);
  });

  it('should preserve declaration formatting', () => {
    const css = `
      &{
        color: var(--primary-color);
        padding: calc(var(--gap) * 2);
        background: linear-gradient(45deg, red, blue);
      }
    `;
    const result = flattenNestedCss(css, baseClassName);

    expect(result[0].declarations).toContain('var(--primary-color)');
    expect(result[0].declarations).toContain('calc(var(--gap) * 2)');
    expect(result[0].declarations).toContain(
      'linear-gradient(45deg, red, blue)',
    );
  });

  it('should handle malformed CSS gracefully', () => {
    const css = `
      &{ color: red;
      &:hover{ color: blue
      .child{ margin: 10px; }
    `;

    // Should not throw
    expect(() => flattenNestedCss(css, baseClassName)).not.toThrow();

    const result = flattenNestedCss(css, baseClassName);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle CSS with comments', () => {
    const css = `
      /* Base styles */
      &{
        color: red; /* Primary color */
        padding: 10px;
      }
      /* Hover state */
      &:hover{
        color: blue;
      }
    `;

    const result = flattenNestedCss(css, baseClassName);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle single-line CSS', () => {
    const css = '&{ color: red; } &:hover{ color: blue; }';
    const result = flattenNestedCss(css, baseClassName);

    expect(result).toEqual([
      {
        selector: `.${baseClassName}.${baseClassName}`,
        declarations: 'color: red;',
        atRules: undefined,
      },
      {
        selector: `.${baseClassName}.${baseClassName}:hover`,
        declarations: 'color: blue;',
        atRules: undefined,
      },
    ]);
  });

  it('should handle CSS with multiple declarations per line', () => {
    const css =
      '&{ color: red; background: blue; padding: 10px; margin: 5px; }';
    const result = flattenNestedCss(css, baseClassName);

    expect(result[0].declarations).toContain('color: red');
    expect(result[0].declarations).toContain('background: blue');
    expect(result[0].declarations).toContain('padding: 10px');
    expect(result[0].declarations).toContain('margin: 5px');
  });
});

describe('wrapWithAtRules', () => {
  it('should return rule as-is when no at-rules', () => {
    const rule = '.test { color: red; }';
    expect(wrapWithAtRules(rule)).toBe(rule);
    expect(wrapWithAtRules(rule, [])).toBe(rule);
  });

  it('should wrap rule with single at-rule', () => {
    const rule = '.test { color: red; }';
    const atRules = ['@media (min-width: 768px)'];

    const result = wrapWithAtRules(rule, atRules);
    expect(result).toBe('@media (min-width: 768px) { .test { color: red; } }');
  });

  it('should wrap rule with multiple nested at-rules', () => {
    const rule = '.test { color: red; }';
    const atRules = ['@media (min-width: 768px)', '@supports (display: grid)'];

    const result = wrapWithAtRules(rule, atRules);
    expect(result).toBe(
      '@media (min-width: 768px) { @supports (display: grid) { .test { color: red; } } }',
    );
  });

  it('should handle complex rules', () => {
    const rule = '.component:hover { background: blue; transition: all 0.2s; }';
    const atRules = ['@media (prefers-reduced-motion: no-preference)'];

    const result = wrapWithAtRules(rule, atRules);
    expect(result).toBe(
      '@media (prefers-reduced-motion: no-preference) { .component:hover { background: blue; transition: all 0.2s; } }',
    );
  });
});
