import { renderWithRoot, screen } from '../../../test';
import { contrast } from '../../../test/contrast';
import { TextInput } from '../TextInput/TextInput';

import { FileInput } from './FileInput';

const boxOf = (qa: string) =>
  screen.getByTestId(qa).closest('[data-qa="FileInputWrapper"]') as HTMLElement;

const textBoxOf = (label: string) =>
  screen
    .getByRole('textbox', { name: label })
    .closest('[data-qa="InputWrapper"]') as HTMLElement;

/**
 * FileInput draws the box text inputs draw, so in a form the two line up: the
 * same height at each size, and the full width of the field. Both are real
 * geometry — the box is a `<button>`, which sizes to its content unless told
 * otherwise — so this needs a browser.
 */
describe('FileInput box', () => {
  it.each([
    ['small', 'small'],
    ['default', 'medium'],
    ['large', 'large'],
  ] as const)(
    'is as tall and as wide as a %s text input',
    (fileSize, textSize) => {
      renderWithRoot(
        <div style={{ width: 360 }}>
          <FileInput qa="File" size={fileSize} label="File" />
          <TextInput size={textSize} label="Text" />
        </div>,
      );

      const file = boxOf('File').getBoundingClientRect();
      const text = textBoxOf('Text').getBoundingClientRect();

      expect(file.height).toBe(text.height);
      expect(file.width).toBe(360);
      expect(text.width).toBe(360);
    },
  );

  it('keeps a consumer width over its own', () => {
    renderWithRoot(
      <div style={{ width: 360 }}>
        <FileInput qa="File" label="File" controlWidth="200px" />
      </div>,
    );

    expect(boxOf('File').getBoundingClientRect().width).toBe(200);
  });

  it('ends a file name that does not fit in an ellipsis', () => {
    renderWithRoot(
      <div style={{ width: 240 }}>
        <FileInput
          qa="File"
          aria-label="File"
          defaultValue={`C:\\fakepath\\${'long-name-'.repeat(10)}.json`}
        />
      </div>,
    );

    const box = boxOf('File');
    const value = box.querySelector('[data-element="Value"]') as HTMLElement;

    expect(box.getBoundingClientRect().width).toBe(240);
    expect(value.scrollWidth).toBeGreaterThan(value.clientWidth);
    expect(getComputedStyle(value).textOverflow).toBe('ellipsis');
  });
});

/**
 * Users could not make out "Choose file" and "No file selected": the label
 * was painted with the accent fill, 2.8:1 on its chip in dark. Only a real
 * engine resolves each scheme's tokens, and axe cannot score text on the
 * chip's translucent fill, so the spec measures it.
 */
describe('FileInput text contrast', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('data-scheme');
    document.documentElement.removeAttribute('data-contrast');
  });

  it.each([
    ['light', 'normal'],
    ['dark', 'normal'],
    ['light', 'high'],
    ['dark', 'high'],
  ])('reaches AA in %s / %s contrast', (scheme, level) => {
    document.documentElement.setAttribute('data-scheme', scheme);
    document.documentElement.setAttribute('data-contrast', level);

    renderWithRoot(
      <>
        <FileInput qa="Empty" aria-label="Empty" />
        <FileInput
          qa="Selected"
          aria-label="Selected"
          defaultValue="C:\\fakepath\\key.json"
        />
      </>,
    );

    const part = (qa: string, element: string) =>
      getComputedStyle(
        boxOf(qa).querySelector(`[data-element="${element}"]`) as HTMLElement,
      );
    const surface = getComputedStyle(boxOf('Empty')).backgroundColor;
    const chip = part('Empty', 'Button');

    expect(
      contrast(chip.color, surface, chip.backgroundColor),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(part('Empty', 'Placeholder').color, surface),
    ).toBeGreaterThanOrEqual(4.5);
    expect(
      contrast(part('Selected', 'Value').color, surface),
    ).toBeGreaterThanOrEqual(4.5);
  });
});
