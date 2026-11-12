import { ReactElement, ReactNode } from 'react';
import { page } from 'vitest/browser';

import { PlusIcon } from '../icons/PlusIcon';
import { act, renderWithRoot, screen, waitFor } from '../test';

import { Button } from './actions/Button/Button';
import { Alert } from './content/Alert/Alert';
import { Card } from './content/Card/Card';
import { Layout } from './content/Layout/Layout';
import { LayoutCenter } from './content/Layout/LayoutCenter';
import { LayoutContainer } from './content/Layout/LayoutContainer';
import { LayoutContent } from './content/Layout/LayoutContent';
import { Result } from './content/Result/Result';
import { Panel } from './layout/Panel';
import { Space } from './layout/Space';
import { Dialog } from './overlays/Dialog/Dialog';
import { DialogContainer } from './overlays/Dialog/DialogContainer';
import { DialogTrigger } from './overlays/Dialog/DialogTrigger';

/** Lets the overlays mount and the container queries apply. */
function settle() {
  return act(async () => {
    await new Promise(requestAnimationFrame);
    await new Promise(requestAnimationFrame);
  });
}

/** A collapsed icon-only button is square; an expanded one is wider. */
async function expectCollapsed(button: HTMLElement, isCollapsed: boolean) {
  await waitFor(() => {
    const { width, height } = button.getBoundingClientRect();

    // Laid out first: a Layout shows its content once it has measured.
    expect(height).toBeGreaterThan(0);
    expect(Math.round(width) === Math.round(height)).toBe(isCollapsed);
  });
}

/** A button that collapses while the container named `name` is narrow. */
function CollapsingButton({ name }: { name: string }) {
  return (
    <Button icon={<PlusIcon />} collapseState={`@(${name}, w < 400px)`}>
      Add item
    </Button>
  );
}

/** A box whose width comes from outside, so it can hold a container. */
function Frame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div style={{ width, height: 200, display: 'flex', flexFlow: 'column' }}>
      {children}
    </div>
  );
}

describe('query containers', () => {
  // Wide enough that the viewport caps nothing at 600px.
  beforeEach(async () => {
    await page.viewport(1200, 900);
  });

  afterEach(async () => {
    // Other specs in this project assume the default 414x896.
    await page.viewport(414, 896);
  });

  it.each<[string, string, (width: number) => ReactElement]>([
    [
      'Layout.Content',
      'content',
      (width) => (
        <Frame width={width}>
          <Layout>
            <LayoutContent>
              <CollapsingButton name="content" />
            </LayoutContent>
          </Layout>
        </Frame>
      ),
    ],
    [
      'Layout.Container',
      'content',
      (width) => (
        <Frame width={width}>
          <Layout>
            <LayoutContainer>
              <CollapsingButton name="content" />
            </LayoutContainer>
          </Layout>
        </Frame>
      ),
    ],
    [
      'Layout.Center',
      'content',
      (width) => (
        <Frame width={width}>
          <Layout>
            <LayoutCenter>
              <CollapsingButton name="content" />
            </LayoutCenter>
          </Layout>
        </Frame>
      ),
    ],
    [
      'Panel',
      'panel',
      (width) => (
        <Frame width={width}>
          <Panel>
            <CollapsingButton name="panel" />
          </Panel>
        </Frame>
      ),
    ],
    [
      'Dialog',
      'dialog',
      (width) => (
        <DialogContainer isOpen>
          <Dialog width={`${width}px`}>
            <CollapsingButton name="dialog" />
          </Dialog>
        </DialogContainer>
      ),
    ],
    [
      'Card with isQueryContainer',
      'card',
      (width) => (
        <Frame width={width}>
          <Card isQueryContainer>
            <CollapsingButton name="card" />
          </Card>
        </Frame>
      ),
    ],
    [
      'Alert with isQueryContainer',
      'alert',
      (width) => (
        <Frame width={width}>
          <Alert isQueryContainer>
            <CollapsingButton name="alert" />
          </Alert>
        </Frame>
      ),
    ],
    [
      'Result with isQueryContainer',
      'result',
      (width) => (
        <Frame width={width}>
          <Result isQueryContainer layout="stacked" title="Done">
            <CollapsingButton name="result" />
          </Result>
        </Frame>
      ),
    ],
  ])(
    '%s is the `%s` container a collapsing Button reads',
    async (_, __, render) => {
      const { rerender } = renderWithRoot(render(600));

      await settle();

      const button = screen.getByRole('button', { name: 'Add item' });

      await expectCollapsed(button, false);

      rerender(render(300));

      await expectCollapsed(button, true);
    },
  );

  it('leaves a Card, an Alert and a Result as wide as their content without the prop', async () => {
    renderWithRoot(
      <Space>
        <Card qa="RowCard">Card sized by its content</Card>
        <Alert qa="RowAlert">Alert sized by its content</Alert>
        <Result qa="RowResult" title="Result sized by its content" />
      </Space>,
    );

    await settle();

    for (const qa of ['RowCard', 'RowAlert', 'RowResult']) {
      const element = screen.getByTestId(qa);

      expect(getComputedStyle(element).containerType).toBe('normal');
      // Shrunk to its padding, it would be about 3x wide.
      expect(element.getBoundingClientRect().width).toBeGreaterThan(80);
    }
  });

  it('makes a popover a container only on request, so it keeps sizing to its content', async () => {
    renderWithRoot(
      <>
        <DialogTrigger defaultOpen type="popover">
          <Button>Open sized by content</Button>
          <Dialog qa="ContentPopover" width="max-content">
            A popover as wide as this line of content
          </Dialog>
        </DialogTrigger>
        <DialogTrigger defaultOpen type="popover">
          <Button>Open container</Button>
          <Dialog isQueryContainer qa="ContainerPopover">
            A popover that is a query container
          </Dialog>
        </DialogTrigger>
      </>,
    );

    await settle();

    const contentPopover = screen.getByTestId('ContentPopover');

    expect(getComputedStyle(contentPopover).containerType).toBe('normal');
    expect(contentPopover.getBoundingClientRect().width).toBeGreaterThan(80);
    expect(
      getComputedStyle(screen.getByTestId('ContainerPopover')).containerName,
    ).toBe('dialog');
  });

  it('keeps a popover shown as a tray on a phone sized to its content', async () => {
    // Below `DialogTrigger`'s 700px `mobileViewport`, `mobileType` applies.
    await page.viewport(414, 896);

    renderWithRoot(
      <DialogTrigger defaultOpen type="popover" mobileType="tray">
        <Button>Open</Button>
        <Dialog qa="TrayPopover" width="max-content">
          A popover shown as a tray, as wide as this line
        </Dialog>
      </DialogTrigger>,
    );

    await settle();

    const dialog = screen.getByTestId('TrayPopover');

    expect(getComputedStyle(dialog).containerType).toBe('normal');
    expect(dialog.getBoundingClientRect().width).toBeGreaterThan(80);
  });

  it('gives a panel dialog without a width its size, not its content width', async () => {
    renderWithRoot(
      <DialogContainer isOpen type="panel">
        <Dialog qa="PanelDialog">Panel content</Dialog>
      </DialogContainer>,
    );

    await settle();

    const dialog = screen.getByTestId('PanelDialog');

    expect(getComputedStyle(dialog).containerType).toBe('inline-size');
    // `$min-dialog-size` at the least, never its padding.
    expect(dialog.getBoundingClientRect().width).toBeGreaterThanOrEqual(288);
  });
});
