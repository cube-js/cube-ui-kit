import { useCallback, useEffect, useMemo } from 'react';

import { Button } from '../../components/actions/Button';
import { Text } from '../../components/content/Text';
import { Select } from '../../components/fields/Select';
import { Styles } from '../../tasty/styles/types';
import { useLocalStorage } from '../../utils/react';

import { PLAYGROUND_EXAMPLES } from './examples';
import { PlaygroundEditor } from './PlaygroundEditor';
import { PlaygroundLayout } from './PlaygroundLayout';
import { PlaygroundOutput } from './PlaygroundOutput';
import { PlaygroundPreview } from './PlaygroundPreview';

import type { Meta, StoryObj } from '@storybook/react-vite';
import type { Key } from 'react';

const meta: Meta = {
  title: 'Tasty/Playground',
  tags: ['!autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;

const STORAGE_KEY_EXAMPLE = 'tasty-playground-example';
const STORAGE_KEY_STYLES = 'tasty-playground-styles';

function PlaygroundComponent() {
  // Store selected example index
  const [exampleIndex, setExampleIndex] = useLocalStorage<number>(
    STORAGE_KEY_EXAMPLE,
    0,
  );

  // Store custom styles as JSON string
  const [storedStyles, setStoredStyles] = useLocalStorage<string | null>(
    STORAGE_KEY_STYLES,
    null,
  );

  // Get the selected example
  const selectedExample = useMemo(() => {
    const index = Math.min(
      Math.max(0, exampleIndex ?? 0),
      PLAYGROUND_EXAMPLES.length - 1,
    );
    return PLAYGROUND_EXAMPLES[index];
  }, [exampleIndex]);

  // Parse stored styles or use example styles
  const styles = useMemo((): Styles => {
    if (storedStyles) {
      try {
        return JSON.parse(storedStyles) as Styles;
      } catch {
        return selectedExample.styles;
      }
    }
    return selectedExample.styles;
  }, [storedStyles, selectedExample.styles]);

  // Check if styles have been modified from the original example
  const isModified = useMemo(() => {
    const originalJson = JSON.stringify(selectedExample.styles);
    const currentJson = JSON.stringify(styles);
    return originalJson !== currentJson;
  }, [selectedExample.styles, styles]);

  const component = selectedExample.component;

  const handleExampleChange = useCallback(
    (key: Key | null) => {
      if (key == null) return;
      const index = parseInt(String(key), 10);
      setExampleIndex(index);
      // Reset stored styles when changing example
      const example = PLAYGROUND_EXAMPLES[index];
      setStoredStyles(JSON.stringify(example.styles, null, 2));
    },
    [setExampleIndex, setStoredStyles],
  );

  const handleStylesChange = useCallback(
    (newStyles: Styles) => {
      setStoredStyles(JSON.stringify(newStyles, null, 2));
    },
    [setStoredStyles],
  );

  const handleReset = useCallback(() => {
    setStoredStyles(JSON.stringify(selectedExample.styles, null, 2));
  }, [selectedExample.styles, setStoredStyles]);

  // Initialize stored styles if not set
  useEffect(() => {
    if (storedStyles === null) {
      setStoredStyles(JSON.stringify(selectedExample.styles, null, 2));
    }
  }, [storedStyles, selectedExample.styles, setStoredStyles]);

  const toolbar = (
    <>
      <Text preset="h6" color="#dark-02">
        Tasty Playground
      </Text>
      {isModified && (
        <Button size="small" onPress={handleReset}>
          Reset
        </Button>
      )}
      <Select
        aria-label="Select example"
        selectedKey={String(exampleIndex ?? 0)}
        size="small"
        onSelectionChange={handleExampleChange}
      >
        {PLAYGROUND_EXAMPLES.map((example, index) => (
          <Select.Item key={String(index)}>{example.name}</Select.Item>
        ))}
      </Select>
    </>
  );

  const showPreview = component !== 'raw';

  return (
    <PlaygroundLayout
      toolbar={toolbar}
      editor={<PlaygroundEditor value={styles} onChange={handleStylesChange} />}
      preview={
        showPreview ? (
          <PlaygroundPreview component={component} styles={styles} />
        ) : undefined
      }
      output={<PlaygroundOutput styles={styles} />}
    />
  );
}

export const Playground: StoryObj = {
  render: () => <PlaygroundComponent />,
};
