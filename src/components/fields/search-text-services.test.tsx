import { renderWithRoot, userEvent, waitFor } from '../../test';
import { CommandMenu } from '../actions/CommandMenu/CommandMenu';

import { FilterListBox } from './FilterListBox/FilterListBox';
import { FilterPicker } from './FilterPicker/FilterPicker';
import { SearchComboBox } from './SearchComboBox/SearchComboBox';
import { SearchInput } from './SearchInput/SearchInput';

import type { ReactElement } from 'react';
import type { CubeSearchInputAttributes } from './search-text-services';

vi.mock('../../_internal/hooks/use-warn');

/**
 * A query is often an identifier, and a phone keyboard treats a field as prose
 * unless told otherwise: Return in place of Search, a capital first letter and
 * corrections. Every search input says otherwise by default, and a caller can
 * still change each attribute.
 */
const SEARCH_INPUTS: {
  name: string;
  render: (props?: CubeSearchInputAttributes) => ReactElement;
  open?: boolean;
}[] = [
  {
    name: 'SearchInput',
    render: (props) => <SearchInput aria-label="Search" inputProps={props} />,
  },
  {
    name: 'SearchComboBox',
    render: (props) => (
      <SearchComboBox aria-label="Search" inputProps={props}>
        <SearchComboBox.Item key="a">A</SearchComboBox.Item>
      </SearchComboBox>
    ),
  },
  {
    name: 'FilterListBox',
    render: (props) => (
      <FilterListBox aria-label="Search" searchInputProps={props}>
        <FilterListBox.Item key="a">A</FilterListBox.Item>
      </FilterListBox>
    ),
  },
  {
    name: 'FilterPicker',
    open: true,
    render: (props) => (
      <FilterPicker aria-label="Pick" searchInputProps={props}>
        <FilterPicker.Item key="a">A</FilterPicker.Item>
      </FilterPicker>
    ),
  },
  {
    name: 'FilterPicker with treeData',
    open: true,
    render: (props) => (
      <FilterPicker
        aria-label="Pick"
        treeData={[{ key: 'a', title: 'A', isLeaf: true }]}
        searchInputProps={props}
      />
    ),
  },
  {
    name: 'CommandMenu',
    render: (props) => (
      <CommandMenu aria-label="Commands" searchInputProps={props}>
        <CommandMenu.Item key="a">A</CommandMenu.Item>
      </CommandMenu>
    ),
  },
];

async function renderSearchInput(
  { render, open }: (typeof SEARCH_INPUTS)[number],
  props?: CubeSearchInputAttributes,
) {
  const { getByRole } = renderWithRoot(render(props));

  if (open) await userEvent.click(getByRole('button'));

  let input: HTMLInputElement | null = null;

  await waitFor(() => {
    input = document.querySelector<HTMLInputElement>('input[type="search"]');
    expect(input).toBeInTheDocument();
  });

  return input!;
}

describe.each(SEARCH_INPUTS)('<$name /> search input', (field) => {
  it('asks a phone keyboard for a Search key and no corrections', async () => {
    const input = await renderSearchInput(field);

    expect(input).toHaveAttribute('enterkeyhint', 'search');
    expect(input).toHaveAttribute('autocapitalize', 'none');
    expect(input).toHaveAttribute('autocorrect', 'off');
    expect(input).toHaveAttribute('spellcheck', 'false');
  });

  it('lets the caller override each of them', async () => {
    const input = await renderSearchInput(field, {
      enterKeyHint: 'go',
      autoCapitalize: 'sentences',
      autoCorrect: 'on',
      spellCheck: true,
      inputMode: 'email',
    });

    expect(input).toHaveAttribute('enterkeyhint', 'go');
    expect(input).toHaveAttribute('autocapitalize', 'sentences');
    expect(input).toHaveAttribute('autocorrect', 'on');
    expect(input).toHaveAttribute('spellcheck', 'true');
    expect(input).toHaveAttribute('inputmode', 'email');
  });
});

it('lets a SearchInput prop win over the search default', async () => {
  const { container } = renderWithRoot(
    <SearchInput aria-label="Search" autoCorrect="on" enterKeyHint="done" />,
  );
  const input = container.querySelector('input')!;

  expect(input).toHaveAttribute('autocorrect', 'on');
  expect(input).toHaveAttribute('enterkeyhint', 'done');
  expect(input).toHaveAttribute('autocapitalize', 'none');
});

// Every key the type takes must reach the input, so it leaves out what any of
// the components owns or takes as a prop of its own.
it('takes no attribute a search component owns', () => {
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('value');
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('id');
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('placeholder');
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('autoFocus');
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('disabled');
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('className');
  expectTypeOf<CubeSearchInputAttributes>().not.toHaveProperty('onKeyDown');
  expectTypeOf<CubeSearchInputAttributes>().toHaveProperty('enterKeyHint');
});

it('passes a data attribute through, as the fields’ inputProps do', async () => {
  const input = await renderSearchInput(SEARCH_INPUTS[1], {
    'data-custom': 'yes',
  });

  expect(input).toHaveAttribute('data-custom', 'yes');
});
