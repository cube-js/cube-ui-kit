/**
 * Phase 2 spike — TanStack Form's own React layer, measured the same way as
 * the internal adapter (plan §11 render-count rows).
 */
import { writeFileSync } from 'node:fs';

import { useForm } from '@tanstack/react-form';

import { act, render, screen, userEvent } from '../../../src/test/index';

const renders: Record<string, number> = {};
const count = (id: string) => {
  renders[id] = (renders[id] ?? 0) + 1;
};
const snapshot = () => ({ ...renders });
const since = (before: Record<string, number>) => {
  const delta: Record<string, number> = {};
  for (const key of new Set([
    ...Object.keys(before),
    ...Object.keys(renders),
  ])) {
    const d = (renders[key] ?? 0) - (before[key] ?? 0);
    if (d !== 0) delta[key] = d;
  }
  return delta;
};

beforeEach(() => {
  for (const key of Object.keys(renders)) delete renders[key];
});

describe('TanStack Form React layer', () => {
  it('a keystroke rerenders only the changed field and dirty-flipping subscribers; unrelated meta keeps identity', async () => {
    let api!: ReturnType<
      typeof useForm<any, any, any, any, any, any, any, any, any, any, any, any>
    >;

    function Owner() {
      count('owner');
      const form = useForm({ defaultValues: { a: '', b: '' } });
      api = form as typeof api;
      return (
        <form>
          <form.Field name="a">
            {(field) => {
              count('field:a');
              return (
                <input
                  data-qa="input-a"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              );
            }}
          </form.Field>
          <form.Field name="b">
            {(field) => {
              count('field:b');
              return (
                <input
                  data-qa="input-b"
                  value={field.state.value}
                  onChange={(event) => field.handleChange(event.target.value)}
                  onBlur={field.handleBlur}
                />
              );
            }}
          </form.Field>
          <form.Subscribe selector={(state) => state.isDirty}>
            {(isDirty) => {
              count('status');
              return <span data-qa="status">{String(isDirty)}</span>;
            }}
          </form.Subscribe>
        </form>
      );
    }

    render(<Owner />);
    const mount = snapshot();

    const metaBefore = api.state.fieldMeta.b;
    const before = snapshot();
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'x');
    });
    const firstKeystroke = since(before);

    const again = snapshot();
    await act(async () => {
      await userEvent.type(screen.getByTestId('input-a'), 'yz');
    });
    const nextKeystrokes = since(again);

    // Reported in the spike README; assertions pin what the engine does today.
    writeFileSync(
      '.tmp-tanstack-react.json',
      JSON.stringify({ mount, firstKeystroke, nextKeystrokes }),
    );

    expect(firstKeystroke.owner ?? 0).toBe(0);
    expect(firstKeystroke['field:b'] ?? 0).toBe(0);
    expect(firstKeystroke['field:a']).toBeGreaterThanOrEqual(1);
    expect(nextKeystrokes['field:a']).toBeGreaterThanOrEqual(2);
    expect(api.state.fieldMeta.b).toBe(metaBefore);
    expect(api.state.values).toEqual({ a: 'xyz', b: '' });
  });
});
