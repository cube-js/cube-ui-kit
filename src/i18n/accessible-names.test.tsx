import { act } from '@testing-library/react';
import { ReactElement } from 'react';

import { ButtonSplit } from '../components/actions/ButtonSplit/ButtonSplit';
import { CommandMenu } from '../components/actions/CommandMenu/CommandMenu';
import { HotKeys } from '../components/content/HotKeys/HotKeys';
import { Layout } from '../components/content/Layout';
import { Tree } from '../components/content/Tree/Tree';
import { ColorInput } from '../components/fields/ColorInput/ColorInput';
import { ColorPicker } from '../components/fields/ColorPicker/ColorPicker';
import { ColorSwatchGroup } from '../components/fields/ColorSwatchGroup/ColorSwatchGroup';
import { TextInputMapper } from '../components/fields/TextInputMapper/TextInputMapper';
import { renderWithRoot, screen, userEvent } from '../test';

import { getI18n } from './index';

/**
 * Accessible names a component sets itself, found by their German text. A
 * name left as an English literal would be read out in English to every
 * screen reader user, whatever their language.
 */
const CASES: [string, ReactElement, string, string][] = [
  [
    'ButtonSplit menu button',
    <ButtonSplit actions={[{ key: 'deploy', label: 'Deploy' }]} />,
    'button',
    'Weitere Optionen',
  ],
  [
    'CommandMenu list',
    <CommandMenu aria-label="Befehle">
      <CommandMenu.Item key="save">Speichern</CommandMenu.Item>
    </CommandMenu>,
    'menu',
    'Befehlsmenü',
  ],
  [
    'CommandMenu loading indicator',
    <CommandMenu isLoading aria-label="Befehle">
      <CommandMenu.Item key="save">Speichern</CommandMenu.Item>
    </CommandMenu>,
    'progressbar',
    'Befehle werden geladen',
  ],
  ['HotKeys', <HotKeys>mod+k</HotKeys>, 'group', 'Tastenkürzel'],
  [
    'HotKeys combination',
    <HotKeys>mod+k</HotKeys>,
    'group',
    'Tastenkombination 1',
  ],
  [
    'Layout.Panel resize handle',
    <Layout>
      <Layout.Panel isResizable side="left" size={200}>
        Inhalt
      </Layout.Panel>
    </Layout>,
    'separator',
    'Größe des linken Panels ändern',
  ],
  [
    'Layout.Pane resize handle',
    <Layout>
      <Layout.Pane isResizable>Inhalt</Layout.Pane>
    </Layout>,
    'separator',
    'Bereichsgröße ändern (rechts)',
  ],
  [
    'Tree',
    <Tree treeData={[{ key: 'root', title: 'Wurzel' }]} />,
    'treegrid',
    'Baum',
  ],
  [
    'ColorInput trigger',
    <ColorInput aria-label="Markenfarbe" />,
    'button',
    'Farbauswahl öffnen',
  ],
  [
    'ColorSwatchGroup without a label',
    <ColorSwatchGroup colors={['#ff0000']} />,
    'radiogroup',
    'Farben',
  ],
  [
    'ColorSwatchGroup custom color',
    <ColorSwatchGroup allowCustom aria-label="Palette" colors={['#ff0000']} />,
    'button',
    'Benutzerdefinierte Farbe',
  ],
  [
    'TextInputMapper add button',
    <TextInputMapper aria-label="Variablen" />,
    'button',
    'Zuordnung',
  ],
];

describe('accessible names in another language', () => {
  beforeEach(async () => {
    await act(async () => {
      await getI18n().changeLanguage('de-DE');
    });
  });

  afterEach(async () => {
    await act(async () => {
      await getI18n().changeLanguage('en-US');
    });
  });

  it.each(CASES)('translates the %s', async (_, element, role, name) => {
    renderWithRoot(element);

    expect(await screen.findByRole(role, { name })).toBeInTheDocument();
  });

  it('translates the open ColorPicker', async () => {
    renderWithRoot(
      <ColorPicker aria-label="Markenfarbe" swatches={['#ff0000']} />,
    );

    await userEvent.click(screen.getByRole('button', { name: /Markenfarbe/ }));

    expect(
      await screen.findByRole('dialog', { name: 'Farbauswahl' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Farbwert' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Palette' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('radiogroup', { name: 'Farbraum' }),
    ).toBeInTheDocument();
  });

  it('translates the word between two HotKeys combinations', () => {
    renderWithRoot(<HotKeys>mod+k, ctrl+k</HotKeys>);

    expect(screen.getByText('oder')).toBeInTheDocument();
  });
});
