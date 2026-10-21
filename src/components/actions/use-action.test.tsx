import { fireEvent, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import { NavigationAdapter } from '../../providers/navigation.types';
import { renderWithRoot } from '../../test/render';
import { Root } from '../Root';

import { parseTo, performClickHandler, useAction } from './use-action';

// Mock navigation adapter for testing
const createMockNavigationAdapter = (): {
  adapter: NavigationAdapter;
  mockNavigate: ReturnType<typeof vi.fn>;
  mockUseHref: ReturnType<typeof vi.fn>;
} => {
  const mockNavigate = vi.fn();
  const mockUseHref = vi.fn((to) => {
    if (typeof to === 'string') return to;
    const { pathname = '', search = '', hash = '' } = to;
    return `${pathname}${search ? (search.startsWith('?') ? search : `?${search}`) : ''}${hash ? (hash.startsWith('#') ? hash : `#${hash}`) : ''}`;
  });

  const adapter: NavigationAdapter = {
    useHref: mockUseHref,
    useNavigate: () => mockNavigate,
  };

  return { adapter, mockNavigate, mockUseHref };
};

function TestWrapper({
  children,
  navigation,
}: {
  children: ReactNode;
  navigation?: NavigationAdapter;
}) {
  return <Root navigation={navigation}>{children}</Root>;
}

describe('parseTo', () => {
  it('should parse history navigation (numbers)', () => {
    expect(parseTo(-1)).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: undefined,
      isHistoryNavigation: true,
      historyDelta: -1,
      isHashNavigation: false,
      isExternal: false,
    });

    expect(parseTo(0)).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: undefined,
      isHistoryNavigation: true,
      historyDelta: 0,
      isHashNavigation: false,
      isExternal: false,
    });
  });

  it('should parse new tab prefix (!)', () => {
    expect(parseTo('!/pricing')).toEqual({
      newTab: true,
      nativeRoute: false,
      cleanTo: '/pricing',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: false,
    });

    expect(parseTo('!https://example.com')).toEqual({
      newTab: true,
      nativeRoute: false,
      cleanTo: 'https://example.com',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: true,
    });
  });

  it('should parse native route prefix (@)', () => {
    expect(parseTo('@/logout')).toEqual({
      newTab: false,
      nativeRoute: true,
      cleanTo: '/logout',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: false,
    });
  });

  it('should parse hash navigation', () => {
    expect(parseTo('#section')).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: '#section',
      isHistoryNavigation: false,
      isHashNavigation: true,
      isExternal: false,
    });
  });

  it('should parse object paths', () => {
    const pathObj = { pathname: '/search', search: 'q=test', hash: 'top' };
    expect(parseTo(pathObj)).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: pathObj,
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: false,
    });
  });

  it('should detect external URLs', () => {
    expect(parseTo('https://example.com')).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: 'https://example.com',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: true,
    });

    expect(parseTo('mailto:test@example.com')).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: 'mailto:test@example.com',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: true,
    });

    expect(parseTo('//example.com')).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo: '//example.com',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: true,
    });
  });

  it.each(['tel:+15550100', '!//example.com'])(
    'treats %s as external',
    (to) => {
      expect(parseTo(to).isExternal).toBe(true);
    },
  );

  it.each(['/a:b', '..?t=a:b', '/models/cube:orders', '!/a:b', '@/a:b'])(
    'keeps a literal colon in %s as router navigation',
    (to) => {
      expect(parseTo(to).isExternal).toBe(false);
    },
  );

  // Strip what the URL parser strips, so classification and the router
  // target match the URL a browser would open.
  it.each([
    [' https://example.com', 'https://example.com'],
    ['https://example.com\n', 'https://example.com'],
    ['\u0001https://example.com\u0000 ', 'https://example.com'],
    ['\t//example.com', '//example.com'],
  ])('cleans the external URL %j', (to, cleanTo) => {
    expect(parseTo(to)).toEqual({
      newTab: false,
      nativeRoute: false,
      cleanTo,
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: true,
    });
  });

  it('cleans before reading the ! prefix', () => {
    expect(parseTo(' !https://example.com ')).toEqual({
      newTab: true,
      nativeRoute: false,
      cleanTo: 'https://example.com',
      isHistoryNavigation: false,
      isHashNavigation: false,
      isExternal: true,
    });
    expect(parseTo('! https://example.com').cleanTo).toBe(
      'https://example.com',
    );
  });

  it('cleans before reading the @ and # prefixes', () => {
    expect(parseTo('\n@/logout ')).toMatchObject({
      nativeRoute: true,
      cleanTo: '/logout',
      isExternal: false,
    });
    expect(parseTo(' #section')).toMatchObject({
      isHashNavigation: true,
      cleanTo: '#section',
    });
  });

  it('cleans an app path and keeps it in the router', () => {
    expect(parseTo(' /path\t')).toMatchObject({
      cleanTo: '/path',
      isExternal: false,
    });
  });

  it.each(['  ', '\n\t'])('treats the blank %j as no destination', (to) => {
    expect(parseTo(to)).toMatchObject({
      cleanTo: undefined,
      isExternal: false,
    });
  });

  it('keeps a no-break space, which the URL parser keeps', () => {
    expect(parseTo('\u00a0https://example.com')).toMatchObject({
      cleanTo: '\u00a0https://example.com',
      isExternal: false,
    });
  });
});

describe('useAction', () => {
  it('should use navigation adapter hooks', () => {
    const { adapter, mockUseHref } = createMockNavigationAdapter();

    renderHook(() => useAction({ to: '/test' }, { current: null }), {
      wrapper: ({ children }) => (
        <TestWrapper navigation={adapter}>{children}</TestWrapper>
      ),
    });

    expect(mockUseHref).toHaveBeenCalledWith('/test', undefined);
  });

  it('should call hooks with fallback when no to prop', () => {
    const { adapter, mockUseHref } = createMockNavigationAdapter();

    renderHook(() => useAction({}, { current: null }), {
      wrapper: ({ children }) => (
        <TestWrapper navigation={adapter}>{children}</TestWrapper>
      ),
    });

    expect(mockUseHref).toHaveBeenCalledWith('.', undefined);
  });

  it('should return button element for history navigation', () => {
    const { adapter } = createMockNavigationAdapter();

    const { result } = renderHook(
      () => useAction({ to: -1 }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    expect(result.current.actionProps.as).toBe('button');
    expect(result.current.actionProps.href).toBeUndefined();
  });

  it.each(['', '  '])('renders a button for the blank to %j', (to) => {
    const { adapter } = createMockNavigationAdapter();

    const { result } = renderHook(() => useAction({ to }, { current: null }), {
      wrapper: ({ children }) => (
        <TestWrapper navigation={adapter}>{children}</TestWrapper>
      ),
    });

    expect(result.current.actionProps.as).toBe('button');
    expect(result.current.actionProps.href).toBeUndefined();
  });

  it('should return anchor element for navigation', () => {
    const { adapter } = createMockNavigationAdapter();

    const { result } = renderHook(
      () => useAction({ to: '/test' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    expect(result.current.actionProps.as).toBe('a');
    expect(result.current.actionProps.href).toBe('/test');
  });

  it('should set target="_blank" for new tab navigation', () => {
    const { adapter } = createMockNavigationAdapter();

    const { result } = renderHook(
      () => useAction({ to: '!/external' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    expect(result.current.actionProps.target).toBe('_blank');
    expect(result.current.actionProps.rel).toBe('noopener noreferrer');
  });

  it('should respect explicit target when no prefix conflicts', () => {
    const { adapter } = createMockNavigationAdapter();

    const { result } = renderHook(
      () => useAction({ to: '/test', target: '_parent' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    expect(result.current.actionProps.target).toBe('_parent');
  });

  it('should override explicit target with prefix', () => {
    const { adapter } = createMockNavigationAdapter();

    const { result } = renderHook(
      () => useAction({ to: '!/test', target: '_parent' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    expect(result.current.actionProps.target).toBe('_blank');
  });

  // A HashRouter warns for every path it cannot make sense of, so resolving
  // the raw `!https://…` warned on every render of every such link.
  it.each([
    ['!https://cube.dev', 'https://cube.dev'],
    ['!/docs', '/docs'],
    ['@/docs', '/docs'],
  ])('never hands the router the prefixed %s', (to, href) => {
    const { adapter, mockUseHref } = createMockNavigationAdapter();

    const { result } = renderHook(() => useAction({ to }, { current: null }), {
      wrapper: ({ children }) => (
        <TestWrapper navigation={adapter}>{children}</TestWrapper>
      ),
    });

    for (const [arg] of mockUseHref.mock.calls) {
      expect(String(arg)).not.toMatch(/^[!@]/);
    }

    expect(result.current.actionProps.href).toBe(href);
  });

  it('hands the router the cleaned destination', () => {
    const { adapter, mockUseHref } = createMockNavigationAdapter();

    const { result } = renderHook(
      () => useAction({ to: ' https://example.com ' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    for (const [arg] of mockUseHref.mock.calls) {
      expect(arg).toBe('https://example.com');
    }

    expect(result.current.actionProps.href).toBe('https://example.com');
  });
});

describe('Equivalence guarantees', () => {
  it('!path should behave like path + target="_blank"', () => {
    const { adapter } = createMockNavigationAdapter();

    // Test !path case
    const { result: bangResult } = renderHook(
      () => useAction({ to: '!/test' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    // Test path + target="_blank" case
    const { result: targetResult } = renderHook(
      () => useAction({ to: '/test', target: '_blank' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    // Both should result in target="_blank" (prefix takes priority)
    expect(bangResult.current.actionProps.target).toBe('_blank');
    expect(bangResult.current.actionProps.rel).toBe('noopener noreferrer');
    expect(bangResult.current.actionProps.as).toBe('a');

    // The target prop case should be overridden if there was a ! prefix, but here there's none
    // so this tests the "normal" case behavior
    expect(targetResult.current.actionProps.target).toBe('_blank');
    expect(targetResult.current.actionProps.as).toBe('a');
  });

  it('@path should behave like path + target="_self"', () => {
    const { adapter } = createMockNavigationAdapter();

    // Test @path case
    const { result: atResult } = renderHook(
      () => useAction({ to: '@/test' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    // Test path + target="_self" case
    const { result: targetResult } = renderHook(
      () => useAction({ to: '/test', target: '_self' }, { current: null }),
      {
        wrapper: ({ children }) => (
          <TestWrapper navigation={adapter}>{children}</TestWrapper>
        ),
      },
    );

    // Both should behave similarly (though @ forces native navigation)
    expect(atResult.current.actionProps.target).toBeUndefined(); // defaults to _self
    expect(atResult.current.actionProps.as).toBe('a');

    expect(targetResult.current.actionProps.target).toBe('_self');
    expect(targetResult.current.actionProps.as).toBe('a');
  });
});
