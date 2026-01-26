import { act, waitFor } from '@testing-library/react';

import { renderWithRoot } from '../../../test/render';
import { Button } from '../../actions/Button/Button';

import { ToastItem } from './ToastItem';

import { Toast, useProgressToast, useToast } from './index';

jest.mock('../../../_internal/hooks/use-warn');

describe('Toast', () => {
  describe('ToastItem', () => {
    it('should render with title', () => {
      const { getByText } = renderWithRoot(<ToastItem title="Test toast" />);

      expect(getByText('Test toast')).toBeInTheDocument();
    });

    it('should render with description', () => {
      const { getByText } = renderWithRoot(
        <ToastItem title="Title" description="Description text" />,
      );

      expect(getByText('Title')).toBeInTheDocument();
      expect(getByText('Description text')).toBeInTheDocument();
    });

    it('should render description as primary content when no title', () => {
      const { getByText } = renderWithRoot(
        <ToastItem description="Only description" />,
      );

      expect(getByText('Only description')).toBeInTheDocument();
    });

    it('should render with different themes', () => {
      const { rerender, container } = renderWithRoot(
        <ToastItem title="Test" theme="success" />,
      );

      expect(
        container.querySelector('[data-theme="success"]'),
      ).toBeInTheDocument();

      rerender(<ToastItem title="Test" theme="danger" />);
      expect(
        container.querySelector('[data-theme="danger"]'),
      ).toBeInTheDocument();

      rerender(<ToastItem title="Test" theme="warning" />);
      expect(
        container.querySelector('[data-theme="warning"]'),
      ).toBeInTheDocument();

      rerender(<ToastItem title="Test" theme="note" />);
      expect(
        container.querySelector('[data-theme="note"]'),
      ).toBeInTheDocument();
    });
  });

  describe('useToast', () => {
    function TestComponent() {
      const toast = useToast();

      return (
        <div>
          <Button onPress={() => toast.success('Success message')}>
            Show Success
          </Button>
          <Button onPress={() => toast.danger('Danger message')}>
            Show Danger
          </Button>
          <Button onPress={() => toast.warning('Warning message')}>
            Show Warning
          </Button>
          <Button onPress={() => toast.note('Note message')}>Show Note</Button>
          <Button
            onPress={() =>
              toast({ title: 'Custom', description: 'Description' })
            }
          >
            Show Custom
          </Button>
        </div>
      );
    }

    it('should show success toast', async () => {
      const { getByRole, getByText } = renderWithRoot(<TestComponent />);

      await act(async () => {
        getByRole('button', { name: 'Show Success' }).click();
      });

      await waitFor(() => {
        expect(getByText('Success message')).toBeInTheDocument();
      });
    });

    it('should show danger toast', async () => {
      const { getByRole, getByText } = renderWithRoot(<TestComponent />);

      await act(async () => {
        getByRole('button', { name: 'Show Danger' }).click();
      });

      await waitFor(() => {
        expect(getByText('Danger message')).toBeInTheDocument();
      });
    });

    it('should show warning toast', async () => {
      const { getByRole, getByText } = renderWithRoot(<TestComponent />);

      await act(async () => {
        getByRole('button', { name: 'Show Warning' }).click();
      });

      await waitFor(() => {
        expect(getByText('Warning message')).toBeInTheDocument();
      });
    });

    it('should show note toast', async () => {
      const { getByRole, getByText } = renderWithRoot(<TestComponent />);

      await act(async () => {
        getByRole('button', { name: 'Show Note' }).click();
      });

      await waitFor(() => {
        expect(getByText('Note message')).toBeInTheDocument();
      });
    });

    it('should show toast with title and description', async () => {
      const { getByRole, getByText } = renderWithRoot(<TestComponent />);

      await act(async () => {
        getByRole('button', { name: 'Show Custom' }).click();
      });

      await waitFor(() => {
        expect(getByText('Custom')).toBeInTheDocument();
        expect(getByText('Description')).toBeInTheDocument();
      });
    });
  });

  describe('Declarative Toast', () => {
    it('should render toast while mounted', async () => {
      const { getByText } = renderWithRoot(
        <Toast theme="success">Mounted toast</Toast>,
      );

      await waitFor(() => {
        expect(getByText('Mounted toast')).toBeInTheDocument();
      });
    });

    it('should remove toast when unmounted', async () => {
      const { queryByText, rerender } = renderWithRoot(
        <Toast theme="success">Mounted toast</Toast>,
      );

      await waitFor(() => {
        expect(queryByText('Mounted toast')).toBeInTheDocument();
      });

      rerender(<div />);

      await waitFor(() => {
        expect(queryByText('Mounted toast')).not.toBeInTheDocument();
      });
    });
  });

  describe('useProgressToast', () => {
    function ProgressTestComponent({ isLoading }: { isLoading: boolean }) {
      useProgressToast(
        isLoading
          ? { isLoading: true, title: 'Loading...' }
          : { isLoading: false, title: 'Complete!', theme: 'success' },
      );

      return null;
    }

    it('should show loading toast when isLoading is true', async () => {
      const { getByText } = renderWithRoot(
        <ProgressTestComponent isLoading={true} />,
      );

      await waitFor(() => {
        expect(getByText('Loading...')).toBeInTheDocument();
      });
    });

    it('should update toast when isLoading changes', async () => {
      const { getByText, rerender } = renderWithRoot(
        <ProgressTestComponent isLoading={true} />,
      );

      await waitFor(() => {
        expect(getByText('Loading...')).toBeInTheDocument();
      });

      rerender(<ProgressTestComponent isLoading={false} />);

      await waitFor(() => {
        expect(getByText('Complete!')).toBeInTheDocument();
      });
    });
  });

  describe('Deduplication', () => {
    function DedupeTestComponent() {
      const toast = useToast();

      return (
        <Button onPress={() => toast.success('Same message')}>
          Show Toast
        </Button>
      );
    }

    it('should deduplicate toasts with same content', async () => {
      const { getByRole, getAllByText } = renderWithRoot(
        <DedupeTestComponent />,
      );
      const button = getByRole('button');

      // Click multiple times
      await act(async () => {
        button.click();
      });
      await act(async () => {
        button.click();
      });
      await act(async () => {
        button.click();
      });

      await waitFor(() => {
        // Should only have one toast, not three
        expect(getAllByText('Same message')).toHaveLength(1);
      });
    });
  });
});
