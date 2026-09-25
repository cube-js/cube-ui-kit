import { renderWithRoot } from '../../../test';
import { Badge } from '../../content/Badge/Badge';
import { Tag } from '../../content/Tag/Tag';
import { TextInput } from '../../fields/TextInput/TextInput';

/**
 * Row height is layout, which jsdom does not compute — hence the browser tier.
 * A `Badge` or `Tag` in `labelSuffix` used to sit in a line box inside a block
 * wrapper, and the line's strut grew the row a pixel past a plain label's, so
 * fields in one form stopped lining up once one of them gained a suffix.
 */
function labelHeight(container: HTMLElement) {
  return container.querySelector('[data-qa="Label"]')!.getBoundingClientRect()
    .height;
}

describe('FieldWrapper label row', () => {
  it.each([
    ['Badge', <Badge key="b">3</Badge>],
    ['Tag', <Tag key="t">3</Tag>],
  ])('keeps its height with a %s suffix', (_, suffix) => {
    const plain = renderWithRoot(<TextInput label="Region" />);
    const withSuffix = renderWithRoot(
      <TextInput label="Region" labelSuffix={suffix} />,
    );

    expect(labelHeight(withSuffix.container)).toBe(
      labelHeight(plain.container),
    );
  });
});
