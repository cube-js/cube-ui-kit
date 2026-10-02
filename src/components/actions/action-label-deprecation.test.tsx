import { IconTrash } from '@tabler/icons-react';

import { renderWithRoot, screen } from '../../test';
import { AlertDialog } from '../overlays/AlertDialog/AlertDialog';
import { DialogContainer } from '../overlays/Dialog/DialogContainer';
import { DialogForm } from '../overlays/Dialog/DialogForm';

import { Button } from './Button/Button';
import { ItemAction } from './ItemAction/ItemAction';

/**
 * `label` on the action components is deprecated in favour of `aria-label`
 * (accessible name) and `children` (visible text) (CUB-5268). The kit's own
 * dialogs must not trip the warning, and a consumer still on `label` must keep
 * the text it passed. The warning is global and fires once per page, so the
 * cases that expect silence run first.
 */

const DEPRECATION = 'is deprecated';

function deprecationWarnings(spy: ReturnType<typeof vi.spyOn>) {
  return spy.mock.calls.filter((args) =>
    args.some((arg) => String(arg).includes(DEPRECATION)),
  );
}

describe('action `label` deprecation', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('gives DialogForm its default button text without the deprecated prop', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm title="Edit" onSubmit={() => {}}>
          Body
        </DialogForm>
      </DialogContainer>,
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toHaveTextContent(
      'Submit',
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveTextContent(
      'Cancel',
    );
    expect(deprecationWarnings(warnSpy)).toHaveLength(0);
  });

  it('gives AlertDialog its default button text without the deprecated prop', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <AlertDialog
          title="Delete?"
          content="This can't be undone."
          actions={{ cancel: true }}
        />
      </DialogContainer>,
    );

    expect(screen.getByRole('button', { name: 'Ok' })).toHaveTextContent('Ok');
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveTextContent(
      'Cancel',
    );
    expect(deprecationWarnings(warnSpy)).toHaveLength(0);
  });

  it('names an icon-only AlertDialog button with its default text', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <AlertDialog
          title="Delete?"
          content="This can't be undone."
          actions={{ confirm: { icon: <IconTrash /> } }}
        />
      </DialogContainer>,
    );

    const confirm = screen.getByRole('button', { name: 'Ok' });

    expect(confirm).not.toHaveTextContent('Ok');
    expect(deprecationWarnings(warnSpy)).toHaveLength(0);
  });

  it('keeps the default text on a dialog button named by `aria-label`', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm
          title="Edit"
          submitProps={{ 'aria-label': 'Save the draft' }}
          onSubmit={() => {}}
        >
          Body
        </DialogForm>
      </DialogContainer>,
    );

    expect(
      screen.getByRole('button', { name: 'Save the draft' }),
    ).toHaveTextContent('Submit');
  });

  it('keeps the default text beside an icon given as a function', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <DialogForm
          title="Edit"
          submitProps={{
            icon: ({ loading }) => (loading ? <IconTrash /> : null),
          }}
          onSubmit={() => {}}
        >
          Body
        </DialogForm>
      </DialogContainer>,
    );

    expect(screen.getByRole('button', { name: 'Submit' })).toHaveTextContent(
      'Submit',
    );
  });

  it('lets `children` set a dialog button text', () => {
    renderWithRoot(
      <DialogContainer isOpen onDismiss={() => {}}>
        <AlertDialog
          title="Delete?"
          content="This can't be undone."
          actions={{ confirm: { children: 'Delete' } }}
        />
      </DialogContainer>,
    );

    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ok' })).toBeNull();
  });

  it('keeps a consumer `label` on dialog buttons, and warns once', () => {
    renderWithRoot(
      <>
        <DialogContainer isOpen onDismiss={() => {}}>
          <DialogForm
            title="Edit"
            submitProps={{ label: 'Save' }}
            cancelProps={{ label: 'Discard' }}
            onSubmit={() => {}}
          >
            Body
          </DialogForm>
        </DialogContainer>
        <Button label="Plain" />
      </>,
    );

    // The consumer's text wins over the dialog's default.
    expect(screen.getByRole('button', { name: 'Save' })).toHaveTextContent(
      'Save',
    );
    expect(screen.getByRole('button', { name: 'Discard' })).toHaveTextContent(
      'Discard',
    );
    expect(screen.queryByRole('button', { name: 'Submit' })).toBeNull();
    // A Button still shows and is named by its deprecated `label`.
    expect(screen.getByRole('button', { name: 'Plain' })).toHaveTextContent(
      'Plain',
    );
    expect(deprecationWarnings(warnSpy)).toHaveLength(1);
  });

  it('points ItemAction users at aria-label', () => {
    renderWithRoot(
      <ItemAction icon={<IconTrash />} aria-label="Delete row" qa="Action" />,
    );

    expect(
      screen.getByRole('button', { name: 'Delete row' }),
    ).toBeInTheDocument();
  });
});
