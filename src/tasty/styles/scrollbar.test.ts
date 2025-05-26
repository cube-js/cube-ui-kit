import { scrollbarStyle } from './scrollbar';

describe('scrollbarStyle', () => {
  it('returns undefined when scrollbar is not defined', () => {
    expect(scrollbarStyle({})).toBeUndefined();
  });

  it('handles boolean true value as thin', () => {
    const result = scrollbarStyle({ scrollbar: true });
    expect(result['scrollbar-width']).toBe('thin');
  });

  it('handles number value as size', () => {
    const result = scrollbarStyle({ scrollbar: 10 });
    expect(result['&::-webkit-scrollbar']['width']).toBe('10');
    expect(result['&::-webkit-scrollbar']['height']).toBe('10');
  });

  it('handles "none" modifier', () => {
    const result = scrollbarStyle({ scrollbar: 'none' });
    expect(result['scrollbar-width']).toBe('none');
    expect(result['scrollbar-color']).toBe('transparent transparent');
    expect(result['&::-webkit-scrollbar']['width']).toBe('0px');
  });

  it('handles "styled" modifier with proper defaults', () => {
    const result = scrollbarStyle({ scrollbar: 'styled' });
    expect(result['scrollbar-width']).toBe('thin');
    expect(result['&::-webkit-scrollbar']['width']).toBe('8px');
    expect(result['&::-webkit-scrollbar-thumb']['border-radius']).toBe('8px');
    expect(result['&::-webkit-scrollbar-thumb']['min-height']).toBe('24px');
  });

  it('handles custom colors', () => {
    const result = scrollbarStyle({ scrollbar: '#red #blue #green' });
    expect(result['scrollbar-color']).toBe(
      'var(--red-color) var(--blue-color)',
    );
    expect(result['&::-webkit-scrollbar-track']['background']).toBe(
      'var(--blue-color)',
    );
    expect(result['&::-webkit-scrollbar-thumb']['background']).toBe(
      'var(--red-color)',
    );
    expect(result['&::-webkit-scrollbar-corner']['background']).toBe(
      'var(--green-color)',
    );
  });

  it('handles "always" modifier with overflow', () => {
    const result = scrollbarStyle({ scrollbar: 'always', overflow: 'auto' });
    expect(result['overflow']).toBe('auto');
    expect(result['scrollbar-gutter']).toBe('stable');
    expect(result['&::-webkit-scrollbar']['display']).toBe('block');
  });

  it('combines modifiers correctly', () => {
    const result = scrollbarStyle({ scrollbar: 'thin styled #red' });
    expect(result['scrollbar-width']).toBe('thin');
    expect(result['scrollbar-color']).toBe(
      'var(--red-color) var(--scrollbar-track-color, transparent)',
    );
    expect(result['&::-webkit-scrollbar-thumb']['background']).toBe(
      'var(--red-color)',
    );
  });

  it('applies custom colors to styled scrollbars', () => {
    const result = scrollbarStyle({
      scrollbar: 'styled #purple #dark #light-grey',
    });
    expect(result['scrollbar-color']).toBe(
      'var(--purple-color) var(--dark-color)',
    );
    expect(result['&::-webkit-scrollbar']['background']).toBe(
      'var(--dark-color)',
    );
    expect(result['&::-webkit-scrollbar-track']['background']).toBe(
      'var(--dark-color)',
    );
    expect(result['&::-webkit-scrollbar-thumb']['background']).toBe(
      'var(--purple-color)',
    );
    expect(result['&::-webkit-scrollbar-corner']['background']).toBe(
      'var(--light-grey-color)',
    );
  });

  it('applies partial custom colors with defaults', () => {
    const result = scrollbarStyle({ scrollbar: 'styled #danger' });
    // Only thumb color specified, track should use default
    expect(result['scrollbar-color']).toBe(
      'var(--danger-color) var(--scrollbar-track-color, transparent)',
    );
    expect(result['&::-webkit-scrollbar-thumb']['background']).toBe(
      'var(--danger-color)',
    );
    expect(result['&::-webkit-scrollbar-track']['background']).toBe(
      'var(--scrollbar-track-color, transparent)',
    );
  });

  it('ensures all CSS properties are kebab-cased', () => {
    const result = scrollbarStyle({ scrollbar: 'styled thin' });
    // Check that camelCase properties are converted to kebab-case
    expect(result['&::-webkit-scrollbar-thumb']['border-radius']).toBe('8px');
    expect(result['&::-webkit-scrollbar-thumb']['min-height']).toBe('24px');
  });
});
