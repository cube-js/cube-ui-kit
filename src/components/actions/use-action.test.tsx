import { fireEvent, renderHook } from '@testing-library/react';
import { ReactNode } from 'react';

import { NavigationAdapter } from '../../providers/navigation.types';
import { renderWithRoot } from '../../test/render';
import { Root } from '../Root';

import { parseTo, performClickHandler, useAction } from './use-action';

// Mock navigation adapter for testing
const createMockNavigationAdapter = (): {
  adapter: NavigationAdapter;
  mockNavigate: jest.Mock;
  mockUseHref: jest.Mock;
} => {
  const mockNavigate = jest.fn();
  const mockUseHref = jest.fn((to) => {
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
});

describe('useAction', () => {
  it('should use navigation adapter hooks', () => {
    const { adapter, mockUseHref } = createMockNavigationAdapter();

    renderHook(() => useAction({ to: '/test' }, { current: null }), {
      wrapper: ({ children }) => (
        <TestWrapper navigation={adapter}>{children}</TestWrapper>
      ),
    });

    expect(mockUseHref).toHaveBeenCalledWith('/test');
  });

  it('should call hooks with fallback when no to prop', () => {
    const { adapter, mockUseHref } = createMockNavigationAdapter();

    renderHook(() => useAction({}, { current: null }), {
      wrapper: ({ children }) => (
        <TestWrapper navigation={adapter}>{children}</TestWrapper>
      ),
    });

    expect(mockUseHref).toHaveBeenCalledWith('.');
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
});

describe('performClickHandler', () => {
  let mockNavigate: jest.Mock;
  let mockTracking: { event: jest.Mock };
  let mockOnPress: jest.Mock;

  beforeEach(() => {
    mockNavigate = jest.fn();
    mockTracking = { event: jest.fn() };
    mockOnPress = jest.fn();

    // Mock DOM APIs
    Object.defineProperty(window, 'location', {
      value: { assign: jest.fn(), reload: jest.fn(), href: '' },
      writable: true,
    });

    global.window.history.go = jest.fn();
    global.document.getElementById = jest.fn();
  });

  const createMockEvent = (modifiers = {}) => ({
    target: { getAttribute: jest.fn(() => 'test-qa') },
    preventDefault: jest.fn(),
    shiftKey: false,
    metaKey: false,
    ...modifiers,
  });

  it('should handle history navigation', () => {
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: undefined,
      to: -1,
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(mockNavigate).toHaveBeenCalledWith(-1);
    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'test-qa', delta: -1, type: 'router-history' },
      evt.target,
    );
  });

  it('should handle hash navigation with scroll', () => {
    const mockElement = { scrollIntoView: jest.fn() };
    (global.document.getElementById as jest.Mock).mockReturnValue(mockElement);
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: '#section',
      to: '#section',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'start',
      inline: 'nearest',
    });
    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'test-qa', href: '#section', type: 'hash', target: 'section' },
      evt.target,
    );
  });

  it('should handle new tab navigation', () => {
    const evt = createMockEvent({ shiftKey: true });

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: '/test',
      to: '/test',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'test-qa', href: '/test', type: 'tab' },
      evt.target,
    );
  });

  it('should handle @ prefix navigation', () => {
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: '/logout',
      to: '@/logout',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(window.location.assign).toHaveBeenCalledWith('/logout');
    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'test-qa', href: '/logout', type: 'native' },
      evt.target,
    );
  });

  it('should handle external URL navigation', () => {
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: 'https://example.com',
      to: 'https://example.com',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(window.location.assign).toHaveBeenCalledWith('https://example.com');
    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'test-qa', href: 'https://example.com', type: 'native' },
      evt.target,
    );
  });

  it('should handle router navigation with options', () => {
    const evt = createMockEvent();
    const navigationOptions = {
      replace: true,
      state: { test: true },
      preventScrollReset: true,
    };

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: '/test',
      to: '/test',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions,
    });

    expect(mockNavigate).toHaveBeenCalledWith('/test', navigationOptions);
    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'test-qa', href: '/test', type: 'router' },
      evt.target,
    );
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
