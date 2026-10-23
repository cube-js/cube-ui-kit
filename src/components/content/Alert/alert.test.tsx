import { getCSSTextForNode } from '@tenphi/tasty';
import { render, renderHook } from '@testing-library/react';

import { Alert } from './Alert';
import { useAlert } from './use-alert';

describe('<Alert /> component', () => {
  beforeAll(() => {
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'group').mockImplementation(() => {});
  });

  afterAll(() => {
    vi.restoreAllMocks();
  });

  it('should correctly render disabled', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', isDisabled: true }),
    );

    expect(result.current.mods.type).toBe('disabled');
  });

  it('should correctly render theme', () => {
    const { result } = renderHook(() => useAlert({ theme: 'danger' }));

    expect(result.current.mods.type).toBe('danger');
  });

  it('should correctly render type', () => {
    const { result } = renderHook(() => useAlert({ type: 'danger' }));

    expect(result.current.mods.type).toBe('danger');
  });

  it('renders its status theme as the type mod, not as data-theme', () => {
    const { container } = render(<Alert theme="danger">Alert</Alert>);
    const alert = container.firstElementChild!;

    expect(alert).toHaveAttribute('data-type', 'danger');
    expect(alert).not.toHaveAttribute('data-theme');
  });

  it('should correctly render theme', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', type: 'note' }),
    );

    expect(result.current.mods.type).toBe('danger');
  });

  it('should add qa', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', qa: 'Test' }),
    );

    expect(result.current.filteredProps.qa).toBe('Test');
  });

  it('should default to card shape', () => {
    const { result } = renderHook(() => useAlert({ theme: 'danger' }));

    expect(result.current.mods.shape).toBe('card');
  });

  it('should correctly render sharp shape', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'danger', shape: 'sharp' }),
    );

    expect(result.current.mods.shape).toBe('sharp');
  });

  it('should correctly render card shape', () => {
    const { result } = renderHook(() =>
      useAlert({ theme: 'success', shape: 'card' }),
    );

    expect(result.current.mods.shape).toBe('card');
  });

  // The rule body tasty emits for one `type=<theme>` state.
  function ruleFor(css: string, theme: string): string {
    return (
      css.match(
        new RegExp(`\\[data-type="${theme}"\\]\\)\\s*\\{([^}]*)\\}`),
      )?.[1] ?? ''
    );
  }

  it('labels the special theme with its white text, not #dark-02', () => {
    const { container } = render(<Alert theme="special">Text</Alert>);

    expect(ruleFor(getCSSTextForNode(container), 'special')).toMatch(
      /(^|[;{\s])color: var\(--primary-accent-surface-text-color\)/,
    );
  });

  // Guards the THEMES → Alert wiring, which no palette test sees.
  it('paints the status themes with their alert fill', () => {
    const { container } = render(<Alert theme="danger">Text</Alert>);

    expect(ruleFor(getCSSTextForNode(container), 'danger')).toContain(
      'background-color: var(--danger-alert-surface-color)',
    );
  });
});
