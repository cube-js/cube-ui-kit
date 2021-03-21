import React from 'react';
import ReactDOM from 'react-dom';
import Notification from '../molecules/Notification/Notification';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

let ID = 0;

const notification = {
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
  _render(items = this.items) {
    ReactDOM.render(
      <TransitionGroup className="cube-notifications">
        {items.map((item) => (
          <CSSTransition
            key={item.id}
            timeout={400}
            classNames="cube-notification"
          >
            <Notification type={item.type} onClose={() => this.close(item.id)}>
              {item.message}
            </Notification>
          </CSSTransition>
        ))}
      </TransitionGroup>,
      this.root,
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
  success(message, options) {
    this.show('success', message, options);
  },
  danger(message, options) {
    this.show('danger', message, options);
  },
  info(message, options) {
    this.show('info', message, options);
  },
};

export default notification;
