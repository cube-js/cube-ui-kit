import userEvent from '@testing-library/user-event';

import { render } from '../../../../../test';
import { NotificationsBar } from '../NotificationsBar';

describe('<NotificationsBar />', () => {
  it.each(['Delete', 'Esc', 'Backspace'])(
    'should close on keypress %s',
    (key) => {
      const onRemoveToast = jest.fn();
      const onDismiss = jest.fn();

      render(
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

  it('should not render more than 5 notifications at the same time', () => {
    const onRemoveToast = jest.fn(),
      onDismiss = jest.fn();

    render(
      <NotificationsBar
        items={[
          { id: '1', description: 'test' },
          { id: '2', description: 'test2' },
          { id: '3', description: 'test3' },
          { id: '4', description: 'test4' },
          { id: '5', description: 'test5' },
          { id: '6', description: 'test6' },
          { id: '7', description: 'test7' },
        ]}
        onRemoveNotification={onRemoveToast}
        onDismissNotification={onDismiss}
      >
        {(item) => (
          <NotificationsBar.Item key={item.id} duration={null} {...item} />
        )}
      </NotificationsBar>,
    );

    const renderedIds = Array.from(document.querySelectorAll('[data-id]')).map(
      (el) => el.getAttribute('data-id'),
    );

    expect(renderedIds).toHaveLength(5);
    expect(renderedIds).toEqual(['7', '6', '5', '4', '3']);
  });
});
