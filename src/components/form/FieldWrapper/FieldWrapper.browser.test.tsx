import { renderWithForm, renderWithRoot } from '../../../test';
import { Badge } from '../../content/Badge/Badge';
import { Tag } from '../../content/Tag/Tag';
import { Switch } from '../../fields/Switch/Switch';
import { TextInput } from '../../fields/TextInput/TextInput';
import { Field } from '../Form/Field';

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

function controlOffset(field: Element) {
  const inputArea = field.querySelector('[data-element="InputArea"]')!;

  return (
    inputArea.getBoundingClientRect().left - field.getBoundingClientRect().left
  );
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

  // `labelSuffix` takes any content. A flex box drops the whitespace between
  // its items, so mixed content must keep flowing inline, or `Up to 10 items`
  // renders as `Up to10items`.
  it('keeps the spaces in a mixed-content suffix', () => {
    const { container } = renderWithRoot(
      <TextInput
        label="Region"
        labelSuffix={
          <>
            <span data-part="lead">Up to</span> <strong>10</strong> items
          </>
        }
      />,
    );

    const lead = container.querySelector('[data-part="lead"]')!;
    const count = container.querySelector('strong')!;

    expect(
      count.getBoundingClientRect().left - lead.getBoundingClientRect().right,
    ).toBeGreaterThan(0);
  });
});

describe('FieldWrapper presentation', () => {
  it.each(['side', 'split'] as const)(
    'uses the full field width without a label in the %s position',
    (labelPosition) => {
      const { container } = renderWithRoot(
        <TextInput
          aria-label="Region"
          labelPosition={labelPosition}
          description="The nearest data center"
          fieldStyles={{ width: '40x', '$label-width': '15x' }}
        />,
      );

      const field = container.querySelector('[data-qa="Field"]')!;
      const inputArea = field.querySelector('[data-element="InputArea"]')!;
      const fieldRect = field.getBoundingClientRect();
      const inputRect = inputArea.getBoundingClientRect();

      expect(inputRect.left).toBeCloseTo(fieldRect.left, 1);
      expect(inputRect.width).toBeCloseTo(fieldRect.width, 1);
    },
  );

  it('keeps a bare supplied label out of layout while the control retains its name', () => {
    const plain = renderWithRoot(
      <div style={{ display: 'flex', width: 320 }}>
        <TextInput isBare aria-label="Unlabeled region" width="100%" />
      </div>,
    );
    const { container, getByRole } = renderWithRoot(
      <div style={{ display: 'flex', width: 320 }}>
        <TextInput
          isBare
          label="Region"
          labelTooltip="Choose the nearest region"
          labelSuffix={<Badge>3</Badge>}
          width="100%"
        />
      </div>,
    );

    const row = container.firstElementChild!;
    const input = getByRole('textbox', { name: 'Region' });
    const plainInput = plain.getByRole('textbox', { name: 'Unlabeled region' });

    expect(container.querySelector('[data-qa="Field"]')).toBeNull();
    expect(input.getBoundingClientRect().width).toBeCloseTo(
      plainInput.getBoundingClientRect().width,
      1,
    );
    expect(row.getBoundingClientRect().height).toBeCloseTo(
      plain.container.firstElementChild!.getBoundingClientRect().height,
      1,
    );
  });
});

describe('FieldWrapper inherited side label layout', () => {
  it('leaves a bound unlabeled Switch at the field left edge', () => {
    const { getByRole } = renderWithForm(
      <Switch name="primary">Primary key</Switch>,
      { formProps: { labelPosition: 'side' } },
    );
    const field = getByRole('switch', { name: 'Primary key' }).closest(
      '[data-qa="Field"]',
    )!;

    expect(controlOffset(field)).toBe(0);
  });

  it('retains the label column of a bound labeled TextInput', () => {
    const { getByRole } = renderWithForm(
      <TextInput name="title" label="Title" />,
      { formProps: { labelPosition: 'side' } },
    );
    const field = getByRole('textbox', { name: 'Title' }).closest(
      '[data-qa="Field"]',
    )!;

    expect(controlOffset(field)).toBeGreaterThan(0);
  });

  it('lets a nameless legacy Form.Item align custom content with explicit padding', () => {
    const { container } = renderWithForm(
      <>
        <TextInput name="title" label="Title" />
        <Field>
          <div>Unindented content</div>
        </Field>
        <Field styles={{ padding: '$full-label-width left' }}>
          <div>Aligned content</div>
        </Field>
      </>,
      { formProps: { labelPosition: 'side' } },
    );
    const [labeled, unpadded, padded] = Array.from(
      container.querySelectorAll('[data-qa="Field"]'),
    );
    const labelOffset = controlOffset(labeled);

    expect(labelOffset).toBeGreaterThan(0);
    expect(controlOffset(unpadded)).toBe(0);
    expect(controlOffset(padded)).toBeCloseTo(labelOffset, 1);
  });
});
