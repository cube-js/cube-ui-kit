import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

import {
  CubeNotificationProps,
  Notification,
} from '../components/overlays/Notification/Notification';

let ID = 0;

export interface NotificationData {
  id: number;
  type?: CubeNotificationProps['type'];
  message?: string;
}

export interface NotificationService {
  root: Element | null;
  defaultOptions: {
    duration: number;
  };
  items: NotificationData[];
  init: () => void;
  render: () => void;
  _render: (items?: NotificationData[]) => void;
  show: (
    type: CubeNotificationProps['type'],
    message: string,
    options?: CubeNotificationOptions,
  ) => void;
  close: (number) => void;
  success: (message: string, options?: CubeNotificationOptions) => void;
  info: (message: string, options?: CubeNotificationOptions) => void;
  danger: (message: string, options?: CubeNotificationOptions) => void;
}

export interface CubeNotificationOptions {
  duration?: number;
}

/**
 * @deprecated consider using `useNotificationsApi` instead
 */
export const notification: NotificationService = {
  root: null,
  defaultOptions: {
    duration: 5000,
  },
  items: [],
  init() {
    if (this.root) return;

    this.root = document.createElement('div');

    this.root.classList.add('cube-notification-container');

    document.body.appendChild(this.root);

    this._render([]);
  },
  render() {
    this.init();

    this._render();
  },
  _render(items) {
    if (!items) {
      items = this.items;
    }

    if (!this.root) return;

    const root = createRoot(this.root);

    root.render(
      <TransitionGroup className="cube-notifications">
        {items.map((item) => {
          const nodeRef = createRef<HTMLDivElement>();
          return (
            <CSSTransition
              key={item.id}
              nodeRef={nodeRef}
              timeout={400}
              classNames="cube-notification"
            >
              <div ref={nodeRef}>
                <Notification
                  type={item.type}
                  onClose={() => this.close(item.id)}
                >
                  {item.message}
                </Notification>
              </div>
            </CSSTransition>
          );
        })}
      </TransitionGroup>,
    );
  },
  show(type, message, options = {}) {
    options = Object.assign({}, this.defaultOptions, options);

    const id = ++ID;

    this.items.push({ id, type, message });

    this.render();

    setTimeout(() => {
      this.close(id);
    }, options.duration);
  },
  close(id) {
    this.items = this.items.filter((item) => item.id !== id);

    this.render();
  },
  success(message, options?) {
    this.show('success', message, options);
  },
  danger(message, options?) {
    this.show('danger', message, options);
  },
  info(message, options?) {
    this.show('note', message, options);
  },
};
