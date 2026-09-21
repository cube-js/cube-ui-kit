import { act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithRoot } from '../../../test/render';

import { FileInput } from './FileInput';

describe('FileInput value and selection lifecycle', () => {
  it.each(['file', 'text'] as const)(
    'keeps uncontrolled %s uploads usable without a form',
    async (type) => {
      const onChange = vi.fn();
      const view = renderWithRoot(
        <FileInput label="Attachment" type={type} onChange={onChange} />,
      );
      const input = view.getByLabelText('Attachment', {
        selector: 'input',
      }) as HTMLInputElement;
      await userEvent.upload(
        input,
        new File(['contents'], 'report.txt', { type: 'text/plain' }),
      );
      await waitFor(() =>
        expect(view.getByText('report.txt')).toBeInTheDocument(),
      );
      expect(input.files).toHaveLength(1);
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(onChange.mock.calls[0][0]).toContain(
        type === 'file' ? 'report.txt' : 'contents',
      );
    },
  );

  it('updates a controlled filename without emitting a change or restoring native file bytes', () => {
    const onChange = vi.fn();
    const view = renderWithRoot(
      <FileInput label="Attachment" value="initial.txt" onChange={onChange} />,
    );
    expect(view.getByText('initial.txt')).toBeInTheDocument();
    view.rerender(
      <FileInput
        label="Attachment"
        value="replacement.txt"
        onChange={onChange}
      />,
    );
    expect(view.queryByText('initial.txt')).not.toBeInTheDocument();
    expect(view.getByText('replacement.txt')).toBeInTheDocument();
    expect(
      (
        view.getByLabelText('Attachment', {
          selector: 'input',
        }) as HTMLInputElement
      ).files,
    ).toHaveLength(0);
    expect(onChange).not.toHaveBeenCalled();
  });

  it('aborts a pending text read when replaced or unmounted', async () => {
    const readers: FileReader[] = [];
    const original = globalThis.FileReader;
    const read = vi
      .spyOn(original.prototype, 'readAsText')
      .mockImplementation(() => {});
    const abort = vi.spyOn(original.prototype, 'abort');
    vi.stubGlobal(
      'FileReader',
      class extends original {
        constructor() {
          super();
          readers.push(this);
        }
      },
    );
    try {
      const onChange = vi.fn();
      const view = renderWithRoot(
        <FileInput label="Attachment" type="text" onChange={onChange} />,
      );
      const input = view.getByLabelText('Attachment', { selector: 'input' });
      await userEvent.upload(input, new File(['one'], 'one.txt'));
      await userEvent.upload(input, new File(['two'], 'two.txt'));
      expect(read).toHaveBeenCalledTimes(2);
      expect(abort.mock.contexts).toContain(readers[0]);
      act(() => view.unmount());
      expect(abort.mock.contexts).toContain(readers[1]);
      expect(onChange).not.toHaveBeenCalled();
    } finally {
      vi.unstubAllGlobals();
      vi.restoreAllMocks();
    }
  });
});
