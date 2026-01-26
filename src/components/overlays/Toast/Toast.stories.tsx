import { IconCheck, IconLoader2 } from '@tabler/icons-react';
import { useState } from 'react';

import { CheckIcon } from '../../../icons';
import { Button } from '../../actions/Button/Button';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';

import { ToastItem } from './ToastItem';

import { Toast, useProgressToast, useToast } from './index';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Overlays/Toast',
  component: ToastItem,
  args: {
    title: 'Toast message',
    theme: 'default',
  },
  argTypes: {
    /* Content */
    title: {
      control: 'text',
      description: 'Primary content of the toast',
    },
    description: {
      control: 'text',
      description: 'Secondary content of the toast',
    },
    /* Presentation */
    theme: {
      control: { type: 'radio' },
      options: ['default', 'success', 'danger', 'warning', 'note'],
      description: 'Visual theme of the toast',
    },
  },
} satisfies Meta<typeof ToastItem>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic ToastItem component preview
 */
export const Default: Story = {
  args: {
    title: 'This is a toast message',
    theme: 'default',
  },
};

/**
 * Toast with description
 */
export const WithDescription: Story = {
  args: {
    title: 'Success',
    description: 'Your changes have been saved successfully.',
    theme: 'success',
  },
};

/**
 * All toast themes
 */
export const AllThemes = () => (
  <Space gap="1x" flow="column">
    <ToastItem title="Default toast" theme="default" />
    <ToastItem title="Success toast" theme="success" />
    <ToastItem title="Danger toast" theme="danger" />
    <ToastItem title="Warning toast" theme="warning" />
    <ToastItem title="Note toast" theme="note" />
  </Space>
);

/**
 * Using useToast hook to show toasts programmatically
 */
export const UseToastHook = () => {
  const toast = useToast();

  return (
    <Space gap="1x">
      <Button onPress={() => toast.success('Success message!')}>
        Show Success
      </Button>
      <Button onPress={() => toast.danger('Something went wrong!')}>
        Show Danger
      </Button>
      <Button onPress={() => toast.warning('Warning: Check your input')}>
        Show Warning
      </Button>
      <Button onPress={() => toast.note('Note: This is informational')}>
        Show Note
      </Button>
      <Button
        onPress={() =>
          toast({
            title: 'Custom Toast',
            description: 'This toast has both title and description',
            theme: 'success',
          })
        }
      >
        With Description
      </Button>
    </Space>
  );
};

/**
 * Declarative Toast component - visible while mounted
 */
export const DeclarativeToast = () => {
  const [showToast, setShowToast] = useState(false);

  return (
    <Space gap="1x">
      <Button onPress={() => setShowToast(!showToast)}>
        {showToast ? 'Hide Toast' : 'Show Toast'}
      </Button>
      {showToast && (
        <Toast theme="success">This toast is visible while mounted</Toast>
      )}
    </Space>
  );
};

/**
 * Progress toast that changes state
 */
export const ProgressToast = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);

  useProgressToast(
    isLoading
      ? {
          isLoading: true,
          title: 'Saving...',
          description: 'Please wait while we save your changes',
        }
      : isError
        ? {
            isLoading: false,
            title: 'Error',
            description: 'Failed to save changes',
            theme: 'danger',
          }
        : {
            isLoading: false,
            title: 'Saved!',
            description: 'Your changes have been saved',
            theme: 'success',
            icon: <IconCheck />,
          },
  );

  const handleSave = async (simulateError = false) => {
    setIsError(false);
    setIsLoading(true);

    // Simulate async operation
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setIsLoading(false);

    if (simulateError) {
      setIsError(true);
    }
  };

  return (
    <Flex gap="1x">
      <Button onPress={() => handleSave(false)}>Save (Success)</Button>
      <Button onPress={() => handleSave(true)}>Save (Error)</Button>
    </Flex>
  );
};

ProgressToast.parameters = {
  docs: {
    description: {
      story:
        'Progress toast that shows loading state, then switches to success or error state.',
    },
  },
};

/**
 * Interactive progress state toggle
 */
export const ProgressStateToggle = () => {
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>(
    'idle',
  );

  useProgressToast(
    state === 'loading'
      ? {
          isLoading: true,
          title: 'Processing...',
        }
      : state === 'success'
        ? {
            isLoading: false,
            title: 'Success!',
            theme: 'success',
            icon: <IconCheck />,
          }
        : state === 'error'
          ? {
              isLoading: false,
              title: 'Failed',
              theme: 'danger',
            }
          : {
              isLoading: false,
            },
  );

  return (
    <Space gap="1x">
      <Button
        type={state === 'loading' ? 'primary' : 'secondary'}
        onPress={() => setState('loading')}
      >
        Loading
      </Button>
      <Button
        type={state === 'success' ? 'primary' : 'secondary'}
        onPress={() => setState('success')}
      >
        Success
      </Button>
      <Button
        type={state === 'error' ? 'primary' : 'secondary'}
        onPress={() => setState('error')}
      >
        Error
      </Button>
      <Button
        type={state === 'idle' ? 'primary' : 'secondary'}
        onPress={() => setState('idle')}
      >
        Idle (Hide)
      </Button>
    </Space>
  );
};

ProgressStateToggle.parameters = {
  docs: {
    description: {
      story:
        'Click buttons to toggle between different progress states. The toast will show/hide based on the selected state.',
    },
  },
};

/**
 * Deduplication - clicking multiple times refreshes the toast
 */
export const Deduplication = () => {
  const toast = useToast();

  return (
    <Space gap="1x">
      <Button
        onPress={() =>
          toast.success({ icon: <CheckIcon />, title: 'Copied to clipboard' })
        }
      >
        Copy (click multiple times)
      </Button>
    </Space>
  );
};

Deduplication.parameters = {
  docs: {
    description: {
      story:
        'Clicking the button multiple times will deduplicate toasts with the same content, creating a "refresh" effect.',
    },
  },
};

/**
 * Multiple toasts (max 3 visible)
 */
export const MultipleToasts = () => {
  const toast = useToast();
  let counter = 0;

  return (
    <Space gap="1x">
      <Button
        onPress={() => {
          counter++;
          toast({
            title: `Toast ${counter}`,
            description: `This is toast number ${counter}`,
            id: `toast-${counter}`,
          });
        }}
      >
        Add Toast
      </Button>
    </Space>
  );
};

MultipleToasts.parameters = {
  docs: {
    description: {
      story:
        'Maximum 3 toasts are visible at once. Oldest toasts are removed first.',
    },
  },
};
