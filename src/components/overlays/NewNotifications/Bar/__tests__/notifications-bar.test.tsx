import userEvent from '@testing-library/user-event';
import { renderWithRoot } from '../../../../../test';
import { NotificationsBar } from '../NotificationsBar';

describe('<NotificationsBar />', () => {
  it.each(['Delete', 'Esc', 'Backspace'])(
    'should close on keypress %s',
    (key) => {
      const onRemoveToast = jest.fn();
      const onDismiss = jest.fn();

      renderWithRoot(
        <NotificationsBar
          items={[
            { id: '1', description: 'test' },
            { id: '2', description: 'test2' },
          ]}
          onRemoveNotification={onRemoveToast}
          onDismissNotification={onDismiss}
        >
          {(item) => (
            <NotificationsBar.Item key={item.id} duration={null} {...item} />
          )}
        </NotificationsBar>,
      );

      (document.querySelector('[data-id="1"]') as HTMLElement)?.focus();
      userEvent.keyboard(`{${key}}`);

      expect(onDismiss).toHaveBeenCalledWith('1');
    },
  );
});
