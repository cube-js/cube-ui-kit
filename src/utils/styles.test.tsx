import { getCSSTextForNode } from '@tenphi/tasty';

import { Disclosure } from '../components/content/Disclosure/Disclosure';
import { HueSlider } from '../components/fields/Slider/HueSlider';
import { Flex } from '../components/layout/Flex';
import { renderWithRoot, screen } from '../test';

import { mergeStyleLayers } from './styles';

/** The CSS of the node's own classes, without its descendants' rules. */
function ownCss(node: Element): string {
  const host = document.createElement('div');

  host.appendChild(node.cloneNode(false));

  return getCSSTextForNode(host);
}

/** The declarations of every rule in `css` whose selector contains `marker`. */
function rulesFor(css: string, marker: string): string {
  return css
    .split('\n')
    .filter((rule) => rule.split('{')[0].includes(marker))
    .join('\n');
}

describe('runtime style layers merge like tasty styles', () => {
  it('extends the group `contentStyles` with the content’s own `styles`', () => {
    renderWithRoot(
      <Disclosure.Group
        contentStyles={{
          fill: { '': '#light', hovered: '#purple' },
          Inner: { padding: '2x', fill: '#dark' },
        }}
      >
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content
            styles={{ fill: { focused: '#danger' }, Inner: { padding: '1x' } }}
          >
            Body
          </Disclosure.Content>
        </Disclosure>
      </Disclosure.Group>,
    );

    const css = ownCss(screen.getByTestId('DisclosureContent'));

    // A state map without `''` adds a state rather than replacing the map.
    expect(css).toContain('var(--light-color)');
    expect(css).toContain('var(--purple-color)');
    expect(css).toContain('var(--danger-color)');

    // A sub-element override replaces one property and keeps the rest.
    const inner = rulesFor(css, '[data-element="Inner"]');

    expect(inner).toContain('padding: var(--gap)');
    expect(inner).not.toContain('calc(2 * var(--gap))');
    expect(inner).toContain('var(--dark-color)');
  });

  it('keeps the HueSlider thumb outline when `thumbStyles` adds a state', () => {
    renderWithRoot(
      <HueSlider
        aria-label="Hue"
        defaultValue={120}
        thumbStyles={{ outline: { hovered: '2bw #purple' } }}
      />,
    );

    const css = ownCss(screen.getByTestId('SliderThumb'));

    expect(css).toContain('var(--slider-thumb-hovered-color)');
    expect(css).toContain('var(--purple-color)');
  });

  it('passes a lone consumer layer through, so `null` still resets', () => {
    // `mergeStyles` over an empty base would drop the `null` before it reached
    // the element, and the element's own `display: flex` would survive.
    renderWithRoot(<Flex qa="Target" styles={{ display: null }} />);

    expect(ownCss(screen.getByTestId('Target'))).not.toContain('display');
  });

  it('carries a consumer `null` past a non-empty layer to the element', () => {
    // `display: block` is `ContentElement`'s own default. Merged over the
    // group's `contentStyles`, the reset used to be deleted at this step, so
    // the element's default survived.
    renderWithRoot(
      <Disclosure.Group contentStyles={{ fill: '#light' }}>
        <Disclosure defaultExpanded>
          <Disclosure.Trigger>Toggle</Disclosure.Trigger>
          <Disclosure.Content styles={{ display: null }}>
            Body
          </Disclosure.Content>
        </Disclosure>
      </Disclosure.Group>,
    );

    const css = ownCss(screen.getByTestId('DisclosureContent'));

    expect(css).toContain('var(--light-color)');
    expect(css).not.toContain('display');
  });
});

describe('mergeStyleLayers', () => {
  it('keeps the last reset of each key, top-level and in sub-elements', () => {
    const base = { padding: '1x', Title: { color: '#dark', preset: 't3' } };

    expect(
      mergeStyleLayers(base, {
        padding: null,
        margin: null,
        Title: { color: null },
        Icon: false,
      }),
    ).toEqual({
      padding: null,
      margin: null,
      Title: { color: null, preset: 't3' },
      Icon: false,
    });
    // The base layer's sub-element object is not written to.
    expect(base.Title).toEqual({ color: '#dark', preset: 't3' });
  });

  it('lets a later value undo an earlier reset', () => {
    expect(
      mergeStyleLayers(
        { padding: '1x' },
        { padding: null, Title: { color: null } },
        { padding: '2x', Title: { color: '#purple' } },
      ),
    ).toEqual({ padding: '2x', Title: { color: '#purple' } });
  });

  it('forgets inner resets once the whole sub-element is reset', () => {
    expect(
      mergeStyleLayers(
        { Title: { color: null } },
        { Title: null },
        { Title: { preset: 't2' } },
      ),
    ).toEqual({ Title: { preset: 't2' } });
  });

  it('skips missing layers and returns a fresh object', () => {
    const only = { fill: '#light' };
    const merged = mergeStyleLayers(undefined, only, null);

    expect(merged).toEqual(only);
    expect(merged).not.toBe(only);
  });
});
