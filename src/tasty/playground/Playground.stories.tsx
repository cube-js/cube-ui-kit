import { useCallback, useState } from 'react';

import { Text } from '../../components/content/Text';
import { Select } from '../../components/fields/Select';
import { Styles } from '../styles/types';

import { PLAYGROUND_EXAMPLES, PlaygroundExample } from './examples';
import { PlaygroundEditor } from './PlaygroundEditor';
import { PlaygroundLayout } from './PlaygroundLayout';
import { PlaygroundOutput } from './PlaygroundOutput';
import { PlaygroundPreview } from './PlaygroundPreview';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Key } from 'react';

const meta: Meta = {
  title: 'Styling/Playground',
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
Interactive playground for experimenting with tasty styles.

- Edit JSON styles in the left panel
- See the component preview on the right
- View generated CSS at the bottom

Use the example picker to load preset styles for Card or Button components.
        `,
      },
    },
  },
};

export default meta;

function PlaygroundComponent() {
  const [selectedExample, setSelectedExample] = useState<PlaygroundExample>(
    PLAYGROUND_EXAMPLES[0],
  );
  const [styles, setStyles] = useState<Styles>(selectedExample.styles);
  const [component, setComponent] = useState<'card' | 'button'>(
    selectedExample.component,
  );

  const handleExampleChange = useCallback((key: Key | null) => {
    if (key == null) return;
    const index = parseInt(String(key), 10);
    const example = PLAYGROUND_EXAMPLES[index];
    setSelectedExample(example);
    setStyles(example.styles);
    setComponent(example.component);
  }, []);

  const handleStylesChange = useCallback((newStyles: Styles) => {
    setStyles(newStyles);
  }, []);

  const toolbar = (
    <>
      <Text preset="t3" fontWeight={600} color="#dark-02">
        Tasty Playground
      </Text>
      <Select
        aria-label="Select example"
        selectedKey={String(PLAYGROUND_EXAMPLES.indexOf(selectedExample))}
        size="small"
        onSelectionChange={handleExampleChange}
      >
        {PLAYGROUND_EXAMPLES.map((example, index) => (
          <Select.Item key={String(index)}>{example.name}</Select.Item>
        ))}
      </Select>
    </>
  );

  return (
    <PlaygroundLayout
      toolbar={toolbar}
      editor={<PlaygroundEditor value={styles} onChange={handleStylesChange} />}
      preview={<PlaygroundPreview component={component} styles={styles} />}
      output={<PlaygroundOutput styles={styles} />}
    />
  );
}

export const Playground: StoryObj = {
  render: () => <PlaygroundComponent />,
  parameters: {
    docs: {
      story: {
        inline: false,
        height: '600px',
      },
    },
  },
};
