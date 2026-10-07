import { renderWithRoot, screen } from '../../../test';
import { Card } from '../Card/Card';
import { Item } from '../Item/Item';

import { ItemCard } from './ItemCard';

const THEMES = ['success', 'danger', 'warning', 'note', 'current'] as const;

function surface(element: Element) {
  const style = getComputedStyle(element);

  return [style.backgroundColor, style.borderTopColor, style.borderTopStyle];
}

describe('ItemCard surface customization', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.removeAttribute('data-contrast');
  });

  // Chromium resolves the live palette and Tasty's variant/state cascade.
  it.each([
    ['light', 'normal'],
    ['dark', 'normal'],
    ['light', 'high'],
    ['dark', 'high'],
  ])('preserves styling contracts in %s / %s', async (scheme, contrast) => {
    document.documentElement.setAttribute('data-scheme', scheme);
    document.documentElement.setAttribute('data-contrast', contrast);

    renderWithRoot(
      <>
        <ItemCard qa="Neutral" title="Neutral card" />
        <Card qa="NeutralReference">Neutral container</Card>
        {THEMES.map((theme) => (
          <div key={theme}>
            <ItemCard qa={`Card-${theme}`} theme={theme} title={theme} />
            <Item qa={`Item-${theme}`} theme={theme} type="card">
              {theme}
            </Item>
          </div>
        ))}
        <ItemCard qa="Variant" variant="danger.card" title="Explicit variant" />
        <Item qa="VariantReference" variant="danger.card" type="card">
          Explicit variant
        </Item>
        <ItemCard
          qa="StyleProps"
          title="Style props"
          fill="transparent"
          border="#danger-border"
        />
        <Card
          qa="StylePropsReference"
          fill="transparent"
          border="#danger-border"
        />
        <ItemCard
          qa="Styles"
          title="Styles map"
          styles={{
            fill: { 'theme=default': '#success-surface' },
            border: { 'theme=default': '#success-border' },
          }}
        />
        <Card
          qa="StylesReference"
          fill="#success-surface"
          border="#success-border"
        />
        <ItemCard
          qa="Reset"
          title="Reset styles"
          styles={{ fill: null, border: null }}
        />
        <Item
          qa="ResetReference"
          type="card"
          styles={{ fill: null, border: null }}
        >
          Reset styles
        </Item>
      </>,
    );

    expect(surface(await screen.findByTestId('Neutral'))).toEqual(
      surface(screen.getByTestId('NeutralReference')),
    );
    for (const theme of THEMES) {
      expect(surface(screen.getByTestId(`Card-${theme}`))).toEqual(
        surface(screen.getByTestId(`Item-${theme}`)),
      );
    }
    for (const name of ['Variant', 'StyleProps', 'Styles', 'Reset']) {
      expect(surface(screen.getByTestId(name))).toEqual(
        surface(screen.getByTestId(`${name}Reference`)),
      );
    }
  });
});
