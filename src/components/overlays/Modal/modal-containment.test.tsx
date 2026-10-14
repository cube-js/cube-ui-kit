import { ReactElement, useEffect, useState } from 'react';

import { renderWithRoot, screen, userEvent, waitFor } from '../../../test';
import { readWithScreenReader } from '../../../test/screen-reader';
import { hoverWithPointer } from '../../../test/utils/hover';
import { Button } from '../../actions/Button';
import { Menu } from '../../actions/Menu/Menu';
import { MenuTrigger } from '../../actions/Menu/MenuTrigger';
import { Content } from '../../content/Content';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';
import { ComboBox } from '../../fields/ComboBox/ComboBox';
import { FilterPicker } from '../../fields/FilterPicker/FilterPicker';
import { Picker } from '../../fields/Picker/Picker';
import { Select } from '../../fields/Select/Select';
import { Dialog } from '../Dialog/Dialog';
import { DialogContainer } from '../Dialog/DialogContainer';
import { DialogTrigger } from '../Dialog/DialogTrigger';
import { useToast } from '../Toast/useToast';

vi.mock('../../../_internal/hooks/use-warn');

const BEHIND = 'Text behind the dialog';

function renderDialog(
  content: ReactElement | null = null,
  type?: 'modal' | 'popover' | 'panel' | 'fullscreen' | 'tray',
) {
  return renderWithRoot(
    <>
      <p>{BEHIND}</p>
      <DialogTrigger type={type}>
        <Button>Rename</Button>
        <Dialog>
          <Header>
            <Title>Rename file</Title>
          </Header>
          <Content>
            <p>Pick a new name</p>
            {content}
          </Content>
        </Dialog>
      </DialogTrigger>
    </>,
  );
}

async function open(name: string | RegExp) {
  await userEvent.click(screen.getByRole('button', { name }));
}

describe('a modal Dialog, read by a screen reader', () => {
  it.each(['modal', 'fullscreen', 'tray'] as const)(
    'a %s dialog hides the page behind it until it closes',
    async (type) => {
      renderDialog(null, type);

      await open('Rename');
      await screen.findByRole('dialog');

      const reading = await readWithScreenReader();

      expect(reading).toContain('Pick a new name');
      expect(reading).not.toContain(BEHIND);

      await userEvent.keyboard('{Escape}');
      await waitFor(() =>
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      );

      expect(await readWithScreenReader()).toContain(BEHIND);
    },
  );

  it('hides the page behind a dialog open from the first render', async () => {
    // Portaled before `<Root>` is ready, then again into it.
    renderWithRoot(
      <>
        <p>{BEHIND}</p>
        <DialogContainer isOpen>
          <Dialog>
            <Content>Pick a new name</Content>
          </Dialog>
        </DialogContainer>
      </>,
    );

    await screen.findByRole('dialog');

    const reading = await readWithScreenReader();

    expect(reading).toContain('Pick a new name');
    expect(reading).not.toContain(BEHIND);
  });

  it.each(['popover', 'panel'] as const)(
    'a %s dialog leaves the page readable',
    async (type) => {
      renderDialog(null, type);

      await open('Rename');
      await screen.findByRole('dialog');

      const reading = await readWithScreenReader();

      expect(reading).toContain('Pick a new name');
      expect(reading).toContain(BEHIND);
    },
  );

  // Each list renders in a portal outside the dialog's element.
  it.each<[string, ReactElement, () => Promise<void>, RegExp]>([
    [
      'Picker',
      <Picker label="Fruit">
        <Picker.Item key="apple">Apple</Picker.Item>
      </Picker>,
      () => open(/Fruit/),
      /^option, Apple/,
    ],
    [
      'FilterPicker',
      <FilterPicker label="Fruit">
        <FilterPicker.Item key="apple">Apple</FilterPicker.Item>
      </FilterPicker>,
      () => open(/Fruit/),
      /^option, Apple/,
    ],
    [
      'Select',
      <Select label="Fruit">
        <Select.Item key="apple">Apple</Select.Item>
      </Select>,
      () => open(/Fruit/),
      /^option, Apple/,
    ],
    [
      'ComboBox',
      <ComboBox label="Fruit">
        <ComboBox.Item key="apple">Apple</ComboBox.Item>
      </ComboBox>,
      () => userEvent.type(screen.getByRole('combobox'), 'A'),
      /^option, Apple/,
    ],
    [
      'Menu',
      <MenuTrigger>
        <Button>Actions</Button>
        <Menu>
          <Menu.Item key="copy">Copy</Menu.Item>
        </Menu>
      </MenuTrigger>,
      () => open('Actions'),
      /^menuitem, Copy/,
    ],
    [
      'popover Dialog',
      <DialogTrigger type="popover">
        <Button>Details</Button>
        <Dialog>
          <Content>More details</Content>
        </Dialog>
      </DialogTrigger>,
      () => open('Details'),
      /^More details/,
    ],
    [
      'panel Dialog',
      <DialogTrigger type="panel">
        <Button>Details</Button>
        <Dialog>
          <Content>More details</Content>
        </Dialog>
      </DialogTrigger>,
      () => open('Details'),
      /^More details/,
    ],
    [
      'list in a panel Dialog',
      <DialogTrigger type="panel">
        <Button>Details</Button>
        <Dialog>
          <Content>
            <Picker label="Fruit">
              <Picker.Item key="apple">Apple</Picker.Item>
            </Picker>
          </Content>
        </Dialog>
      </DialogTrigger>,
      async () => {
        await open('Details');
        await open(/Fruit/);
      },
      /^option, Apple/,
    ],
  ])(
    'keeps a %s opened inside it readable',
    async (_, content, openList, phrase) => {
      renderDialog(content);

      await open('Rename');
      await screen.findByRole('dialog');
      await openList();

      await waitFor(async () =>
        expect(await readWithScreenReader()).toContainEqual(
          expect.stringMatching(phrase),
        ),
      );

      const reading = await readWithScreenReader();

      expect(reading).toContain('Pick a new name');
      expect(reading).not.toContain(BEHIND);
    },
  );

  it('hides the first dialog behind a second one opened from it', async () => {
    renderDialog(
      <DialogTrigger>
        <Button>Delete</Button>
        <Dialog>
          <Header>
            <Title>Delete file</Title>
          </Header>
          <Content>Delete for good?</Content>
        </Dialog>
      </DialogTrigger>,
    );

    await open('Rename');
    await open('Delete');
    await waitFor(() => expect(screen.getAllByRole('dialog')).toHaveLength(1));

    let reading = await readWithScreenReader();

    expect(reading).toContain('Delete for good?');
    expect(reading).not.toContain('Pick a new name');
    expect(reading).not.toContain(BEHIND);

    await userEvent.keyboard('{Escape}');
    await waitFor(() =>
      expect(screen.queryByText('Delete for good?')).not.toBeInTheDocument(),
    );

    reading = await readWithScreenReader();

    expect(reading).toContain('Pick a new name');
    expect(reading).not.toContain(BEHIND);
  });

  it('shows a dialog opened elsewhere over it', async () => {
    // The second dialog is not rendered from inside the first, as with
    // `useDialogContainer` or the alert dialog API, so it is not one of the
    // first one's layers.
    function Page() {
      const [step, setStep] = useState(0);

      return (
        <>
          <p>{BEHIND}</p>
          <DialogContainer isOpen={step >= 1} onDismiss={() => setStep(0)}>
            <Dialog>
              <Content>
                <p>Pick a new name</p>
                <Button onPress={() => setStep(2)}>Next</Button>
              </Content>
            </Dialog>
          </DialogContainer>
          <DialogContainer isOpen={step === 2} onDismiss={() => setStep(1)}>
            <Dialog>
              <Content>Second step</Content>
            </Dialog>
          </DialogContainer>
          <Button onPress={() => setStep(1)}>Start</Button>
        </>
      );
    }

    renderWithRoot(<Page />);

    await open('Start');
    await open('Next');

    await waitFor(async () =>
      expect(await readWithScreenReader()).toContain('Second step'),
    );

    const reading = await readWithScreenReader();

    expect(reading).not.toContain('Pick a new name');
    expect(reading).not.toContain(BEHIND);
  });

  it('shows the second of two dialogs opened in the same commit', async () => {
    function Page() {
      const [step, setStep] = useState(0);

      return (
        <>
          <p>{BEHIND}</p>
          <DialogContainer isOpen={step >= 1} onDismiss={() => setStep(0)}>
            <Dialog>
              <Content>Pick a new name</Content>
            </Dialog>
          </DialogContainer>
          <DialogContainer isOpen={step === 2} onDismiss={() => setStep(1)}>
            <Dialog>
              <Content>Second step</Content>
            </Dialog>
          </DialogContainer>
          <Button onPress={() => setStep(2)}>Skip ahead</Button>
        </>
      );
    }

    renderWithRoot(<Page />);

    await open('Skip ahead');

    await waitFor(async () =>
      expect(await readWithScreenReader()).toContain('Second step'),
    );

    const reading = await readWithScreenReader();

    expect(reading).not.toContain('Pick a new name');
    expect(reading).not.toContain(BEHIND);
  });

  it('keeps hiding what is behind a later dialog when one under it changes', async () => {
    // Once the second dialog is open, a popover opens in the first, so the
    // first hides the page anew while the second is on top.
    function Page() {
      const [step, setStep] = useState(0);
      const [isLate, setIsLate] = useState(false);

      useEffect(() => {
        if (step === 2) setIsLate(true);
      }, [step]);

      return (
        <>
          <p>{BEHIND}</p>
          <DialogContainer isOpen={step >= 1} onDismiss={() => setStep(0)}>
            <Dialog>
              <Content>
                <p>Pick a new name</p>
                <Button onPress={() => setStep(2)}>Next</Button>
                <DialogTrigger type="popover" isOpen={isLate}>
                  <Button>Details</Button>
                  <Dialog>
                    <Content>Late details</Content>
                  </Dialog>
                </DialogTrigger>
              </Content>
            </Dialog>
          </DialogContainer>
          <DialogContainer isOpen={step === 2} onDismiss={() => setStep(1)}>
            <Dialog>
              <Content>Second step</Content>
            </Dialog>
          </DialogContainer>
          <Button onPress={() => setStep(1)}>Start</Button>
        </>
      );
    }

    renderWithRoot(<Page />);

    await open('Start');
    await open('Next');
    await waitFor(() =>
      expect(screen.getByText('Late details')).toBeInTheDocument(),
    );

    const reading = await readWithScreenReader();

    expect(reading).toContain('Second step');
    expect(reading).not.toContainEqual(expect.stringMatching(/Late details/));
    expect(reading).not.toContain('Pick a new name');
  });

  it('keeps a tooltip opened inside it readable', async () => {
    renderDialog(<Button tooltip="Explains the rename">Help</Button>);

    await open('Rename');
    await hoverWithPointer(await screen.findByRole('button', { name: 'Help' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(
      'Explains the rename',
    );
  });

  it('keeps a toast readable over it', async () => {
    function Saver() {
      const toast = useToast();

      return (
        <Button onPress={() => toast({ title: 'Saved', duration: null })}>
          Save
        </Button>
      );
    }

    renderDialog(<Saver />);

    await open('Rename');
    await open('Save');

    await waitFor(async () =>
      expect(await readWithScreenReader()).toContainEqual(
        expect.stringContaining('Saved'),
      ),
    );
  });
});
