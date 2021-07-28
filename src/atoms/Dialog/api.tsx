import React from 'react';
import ReactDOM from 'react-dom';
import { AlertDialog } from '../../molecules/AlertDialog/AlertDialog';
import { DialogContainer } from './DialogContainer';
import { ModalProvider } from '@react-aria/overlays';

let ID = 0;

export const api = {
  items: [],
  init() {
    if (this.root) return;

    this.root = document.createElement('div');

    this.root.classList.add('cube-dialog-container');

    document.body.appendChild(this.root);

    this._render([]);
  },
  render() {
    this.init();

    this._render();
  },
  _render(items = this.items) {
    ReactDOM.render(
      <ModalProvider>
        {items.map((item) => {
          const {
            id,
            type,
            mobileType,
            placement,
            isDismissable = true,
            primaryProps,
            cancelProps,
            onDismiss,
            content,
            ...options
          } = item;

          return (
            <DialogContainer
              key={id}
              isDismissable={isDismissable}
              type={type}
              mobileType={mobileType}
              placement={placement}
              onDismiss={() => {
                if (item.dialogType === 'info') {
                  this.resolve(item);
                } else {
                  this.reject(item);
                }
              }}
            >
              {item.isVisible ? (
                <AlertDialog
                  primaryProps={{
                    ...primaryProps,
                    onPress: () => {
                      this.resolve(item);
                    },
                  }}
                  cancelProps={
                    cancelProps
                      ? {
                          ...cancelProps,
                          onPress: () => {
                            this.reject(item);
                          },
                        }
                      : null
                  }
                  {...options}
                  key={id}
                >
                  {content}
                </AlertDialog>
              ) : null}
            </DialogContainer>
          );
        })}
      </ModalProvider>,
      this.root,
    );
  },
  open(item) {
    item.isVisible = false;
    item.id = ++ID;

    this.items.push(item);

    this.render();

    setTimeout(() => {
      item.isVisible = true;

      this.render();
    });

    return new Promise((resolve, reject) => {
      item.resolve = resolve;
      item.reject = reject;
    });
  },
  close(item) {
    item.isVisible = false;

    this.render();

    setTimeout(() => {
      this.items = this.items.filter((modal) => item.id !== modal.id);

      this.render();
    }, 1000);
  },
  resolve(item, arg) {
    item.resolve(arg);

    this.close(item);
  },
  reject(item, arg) {
    item.reject(arg);

    this.close(item);
  },
};
