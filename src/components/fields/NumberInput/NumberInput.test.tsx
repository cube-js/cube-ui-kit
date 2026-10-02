import { render, userEvent } from '../../../test';

import { NumberInput } from './NumberInput';

vi.mock('../../../_internal/hooks/use-warn');

describe('<NumberInput />', () => {
  it('calls onKeyDown and onKeyUp with the key', async () => {
    const onKeyDown = vi.fn((e) => e.key);
    const onKeyUp = vi.fn((e) => e.key);
    const { getByRole } = render(
      <NumberInput label="test" onKeyDown={onKeyDown} onKeyUp={onKeyUp} />,
    );

    await userEvent.type(getByRole('textbox'), '4{ArrowUp}');

    expect(onKeyDown.mock.results.map((r) => r.value)).toEqual([
      '4',
      'ArrowUp',
    ]);
    expect(onKeyUp.mock.results.map((r) => r.value)).toEqual(['4', 'ArrowUp']);
    expect(getByRole('textbox')).toHaveValue('5');
  });

  // React Aria runs the number field's own keys before the user handler, so
  // `preventDefault()` there cannot cancel them — see "Keyboard Events" in the
  // docs. That order is what lets an Enter handler read the committed number.
  it('commits the typed number before onKeyDown sees Enter', async () => {
    const calls: string[] = [];
    const { getByRole } = render(
      <NumberInput
        label="test"
        onChange={(value) => calls.push(`change:${value}`)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') calls.push('keydown:Enter');
        }}
      />,
    );

    await userEvent.type(getByRole('textbox'), '42{Enter}');

    expect(calls).toEqual(['change:42', 'keydown:Enter']);
  });

  it('steps on ArrowUp even when onKeyDown prevents the key', async () => {
    const onKeyDown = vi.fn((e) => e.preventDefault());
    const { getByRole } = render(
      <NumberInput label="test" defaultValue={1} onKeyDown={onKeyDown} />,
    );

    await userEvent.type(getByRole('textbox'), '{ArrowUp}');

    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(getByRole('textbox')).toHaveValue('2');
  });
});
