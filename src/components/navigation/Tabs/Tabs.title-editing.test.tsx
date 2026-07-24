import { fireEvent } from '@testing-library/react';

import { act, renderWithRoot, userEvent, waitFor } from '../../../test';

import { Tab, Tabs } from './Tabs';

vi.mock('../../../_internal/hooks/use-warn');

describe('<Tabs /> title editing', () => {
  it('should enter edit mode on double-click when isEditable', async () => {
    const user = userEvent.setup();
    const { getByRole } = renderWithRoot(
      <Tabs defaultActiveKey="tab1" onTitleChange={vi.fn()}>
        <Tab key="tab1" isEditable title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab');
    const titleSpan = tab.querySelector('span');

    expect(titleSpan).toBeInTheDocument();

    await user.dblClick(titleSpan!);

    await waitFor(() => {
      expect(getByRole('textbox')).toBeInTheDocument();
    });

    expect(getByRole('textbox')).toHaveValue('Tab 1');
  });

  it('should call onTitleChange when Enter is pressed', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
        <Tab key="tab1" isEditable title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab');
    const titleSpan = tab.querySelector('span');

    await user.dblClick(titleSpan!);

    await waitFor(() => {
      expect(getByRole('textbox')).toBeInTheDocument();
    });

    const input = getByRole('textbox') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: 'New Title' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(handleTitleChange).toHaveBeenCalledWith('tab1', 'New Title');
    });
  });

  it('should cancel editing when Escape is pressed', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();
    const { getByRole, queryByRole } = renderWithRoot(
      <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
        <Tab key="tab1" isEditable title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab');
    const titleSpan = tab.querySelector('span');

    await user.dblClick(titleSpan!);

    await waitFor(() => {
      expect(getByRole('textbox')).toBeInTheDocument();
    });

    const input = getByRole('textbox');

    await act(async () => {
      await user.type(input, 'Changed{Escape}');
    });

    await waitFor(() => {
      expect(queryByRole('textbox')).not.toBeInTheDocument();
    });

    expect(handleTitleChange).not.toHaveBeenCalled();
  });

  it('should not submit empty title', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
        <Tab key="tab1" isEditable title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab');
    const titleSpan = tab.querySelector('span');

    await user.dblClick(titleSpan!);

    await waitFor(() => {
      expect(getByRole('textbox')).toBeInTheDocument();
    });

    const input = getByRole('textbox');

    await act(async () => {
      await user.clear(input);
      await user.type(input, '   {Enter}');
    });

    expect(handleTitleChange).not.toHaveBeenCalled();
  });

  it('should trim title on submit', async () => {
    const user = userEvent.setup();
    const handleTitleChange = vi.fn();
    const { getByRole } = renderWithRoot(
      <Tabs defaultActiveKey="tab1" onTitleChange={handleTitleChange}>
        <Tab key="tab1" isEditable title="Tab 1">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab');
    const titleSpan = tab.querySelector('span');

    await user.dblClick(titleSpan!);

    await waitFor(() => {
      expect(getByRole('textbox')).toBeInTheDocument();
    });

    const input = getByRole('textbox') as HTMLInputElement;

    await act(async () => {
      fireEvent.change(input, { target: { value: '  Trimmed Title  ' } });
      fireEvent.keyDown(input, { key: 'Enter' });
    });

    await waitFor(() => {
      expect(handleTitleChange).toHaveBeenCalledWith('tab1', 'Trimmed Title');
    });
  });

  it('forwards an explicit tab tooltip to InlineInput and suppresses Item tooltip for editable tabs', () => {
    const { getByTestId, getByRole } = renderWithRoot(
      <Tabs defaultActiveKey="tab1" onTitleChange={vi.fn()}>
        <Tab key="tab1" isEditable title="Tab 1" tooltip="Click to rename">
          Content 1
        </Tab>
      </Tabs>,
    );

    const tab = getByRole('tab');
    const inlineInput = getByTestId('InlineInput');

    expect(tab).toContainElement(inlineInput);
    expect(inlineInput).toHaveAttribute('data-qa', 'InlineInput');
  });
});
