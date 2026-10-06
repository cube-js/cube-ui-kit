import { Trans } from 'react-i18next';

import { renderWithRoot, screen } from '../../../test';

import { HotKeys } from './HotKeys';

/** The rendered keys, one array per alternative combination. */
const combos = () =>
  screen
    .getAllByRole('group', { name: /^Key combination/ })
    .map((group) =>
      Array.from(group.querySelectorAll('kbd'), (key) => key.textContent),
    );

describe('<HotKeys />', () => {
  it('parses a string child', () => {
    renderWithRoot(<HotKeys>shift+k, shift+enter</HotKeys>);

    expect(combos()).toEqual([
      ['⇧', 'K'],
      ['⇧', '⏎'],
    ]);
  });

  it('joins an array of text children before parsing', () => {
    renderWithRoot(<HotKeys>{['shift+', 'k, f', 1]}</HotKeys>);

    expect(combos()).toEqual([['⇧', 'K'], ['F1']]);
  });

  it('renders in a <Trans> component slot', () => {
    renderWithRoot(
      <Trans
        i18nKey="hotkeys.test"
        defaults="Press <hotkeys>shift+k</hotkeys> to search"
        components={{ hotkeys: <HotKeys type="inherit" /> }}
      />,
    );

    expect(combos()).toEqual([['⇧', 'K']]);
  });
});
