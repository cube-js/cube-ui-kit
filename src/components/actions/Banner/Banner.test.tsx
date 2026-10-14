import { render } from '../../../test';

import { Banner } from './Banner';

describe('<Banner />', () => {
  it.each(['danger', 'warning', 'note', 'success'] as const)(
    'hides the %s icon from screen readers',
    (theme) => {
      const { container } = render(
        <Banner theme={theme}>Billing is overdue</Banner>,
      );
      const icon = container.querySelector('svg');

      // The text carries the message; an exposed `<svg>` is read out as an
      // unnamed graphic.
      expect(icon).not.toBeNull();
      expect(icon!.closest('[aria-hidden="true"]')).not.toBeNull();
    },
  );
});
