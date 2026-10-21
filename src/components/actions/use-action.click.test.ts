// @vitest-environment node
//
// `performClickHandler` touches only `window.location`, `window.history` and
// `document.getElementById`, so these specs replace those three globals with
// stubs. A jsdom window would not allow it: `location` is unforgeable there, and
// under the `vmThreads` pool the jsdom window is the global itself.
import { performClickHandler } from './use-action';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('performClickHandler', () => {
  let mockNavigate: ReturnType<typeof vi.fn>;
  let mockTracking: { event: ReturnType<typeof vi.fn> };
  let mockOnPress: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockNavigate = vi.fn();
    mockTracking = { event: vi.fn() };
    mockOnPress = vi.fn();

    vi.stubGlobal('window', {
      location: { assign: vi.fn(), reload: vi.fn(), href: '' },
      history: { go: vi.fn() },
    });
    vi.stubGlobal('document', {
      getElementById: vi.fn(),
      // `openLink` clicks a temporary anchor for new-tab navigation.
      createElement: vi.fn(() => ({ click: vi.fn() })),
      body: { appendChild: vi.fn(), removeChild: vi.fn() },
    });
  });

  const createMockEvent = (modifiers = {}) => ({
    target: { getAttribute: vi.fn(() => 'TestQa') },
    preventDefault: vi.fn(),
    shiftKey: false,
    metaKey: false,
    ...modifiers,
  });

  it('passes a serializable event to onPress (target preserved, non-enumerable)', () => {
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: undefined,
      to: undefined,
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(mockOnPress).toHaveBeenCalled();
    const arg = mockOnPress.mock.calls[0][0];
    expect(() => JSON.stringify(arg)).not.toThrow();
    expect(arg.target).toBe(evt.target);
    expect(arg.shiftKey).toBe(false);
    expect(arg.metaKey).toBe(false);
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
      { qa: 'TestQa', delta: -1, type: 'router-history' },
      evt.target,
    );
  });

  it('should handle hash navigation with scroll', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    (document.getElementById as ReturnType<typeof vi.fn>).mockReturnValue(
      mockElement,
    );
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
      { qa: 'TestQa', href: '#section', type: 'hash', target: 'section' },
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
      { qa: 'TestQa', href: '/test', type: 'tab' },
      evt.target,
    );

    const link = vi.mocked(document.createElement).mock.results[0].value;

    expect(link).toMatchObject({ href: '/test', target: '_blank' });
    expect(link.click).toHaveBeenCalledTimes(1);
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
      { qa: 'TestQa', href: '/logout', type: 'native' },
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
      { qa: 'TestQa', href: 'https://example.com', type: 'native' },
      evt.target,
    );
  });

  it('opens an external URL with surrounding whitespace natively', () => {
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: 'https://example.com',
      to: ' https://example.com\n',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(mockNavigate).not.toHaveBeenCalled();
    expect(window.location.assign).toHaveBeenCalledWith('https://example.com');
  });

  it('scrolls to the hash target of a whitespace-wrapped hash', () => {
    const mockElement = { scrollIntoView: vi.fn() };
    (document.getElementById as ReturnType<typeof vi.fn>).mockReturnValue(
      mockElement,
    );
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: '#section',
      to: ' #section ',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: {},
    });

    expect(document.getElementById).toHaveBeenCalledWith('section');
    expect(mockElement.scrollIntoView).toHaveBeenCalled();
    expect(mockTracking.event).toHaveBeenCalledWith(
      'Link Press',
      { qa: 'TestQa', href: '#section', type: 'hash', target: 'section' },
      evt.target,
    );
  });

  it('navigates in the router, without a reload, to a path with a colon', () => {
    const evt = createMockEvent();

    performClickHandler(evt, {
      navigate: mockNavigate,
      resolvedHref: '/models/cube:orders',
      to: '/models/cube:orders',
      onPress: mockOnPress,
      tracking: mockTracking,
      navigationOptions: undefined,
    });

    expect(mockNavigate).toHaveBeenCalledWith('/models/cube:orders', undefined);
    expect(window.location.assign).not.toHaveBeenCalled();
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
      { qa: 'TestQa', href: '/test', type: 'router' },
      evt.target,
    );
  });
});
