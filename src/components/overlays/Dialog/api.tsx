import ReactDOM from 'react-dom';
import { AlertDialog, CubeAlertDialogProps } from '../AlertDialog/AlertDialog';
import { CubeDialogContainerProps, DialogContainer } from './DialogContainer';
import { ModalProvider } from '@react-aria/overlays';
import { ReactNode } from 'react';

let ID = 0;

export interface DialogData
  extends Omit<CubeDialogContainerProps, 'onDismiss'>,
    Omit<CubeAlertDialogProps, 'type' | 'id'> {
  id?: number;
  placement: 'top' | 'bottom';
  resolve: (any) => void;
  reject: (any) => void;
  content: ReactNode;
  isVisible?: boolean;
  dialogType?: 'info' | 'confirm' | 'form';
}

export interface DialogService {
  root: Element | null;
  items: DialogData[];
  init: () => void;
  render: () => void;
  _render: (items?: DialogData[]) => void;
  open: (DialogData) => void;
  close: (DialogData) => void;
  resolve: (item: DialogData, arg?: any) => void;
  reject: (item: DialogData, arg?: any) => void;
}

export const api: DialogService = {
  root: null,
  items: [],
  init() {
    if (this.root) return;

    const uikitRoot = document.getElementById('cube-ui-kit-root');

    this.root = document.createElement('div');

    this.root.classList.add('cube-dialog-container');

    if (uikitRoot) {
      uikitRoot.appendChild(this.root);

      this._render([]);
    } else {
      console.warn(
        'Cube UI Kit: unable to create a Modal because the Root component is not found.',
      );
    }
  },
  render() {
    this.init();

    this._render();
  },
  _render(items) {
    if (!items) {
      items = this.items;
    }

    ReactDOM.render(
      <ModalProvider>
        {items.map((item) => {
          const {
            id,
            type,
            placement,
            isDismissable = true,
            actions,
            onDismiss,
            content,
            ...options
          } = item;

          let { confirm: confirmProps, cancel: cancelProps } = actions || {};

          if (confirmProps === true) {
            confirmProps = {};
          }

          if (confirmProps === false) {
            confirmProps = undefined;
          }

          if (cancelProps === true) {
            cancelProps = {};
          }

          if (cancelProps === false) {
            cancelProps = undefined;
          }

          return (
            <DialogContainer
              key={id}
              isDismissable={isDismissable}
              type={type}
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
                  noActions={item.dialogType === 'form'}
                  actions={{
                    confirm: confirmProps
                      ? {
                          ...confirmProps,
                          onPress: () => {
                            this.resolve(item);
                          },
                        }
                      : false,
                    cancel: cancelProps
                      ? {
                          ...cancelProps,
                          onPress: () => {
                            this.reject(item);
                          },
                        }
                      : false,
                  }}
                  {...options}
                  key={id}
                >
                  {typeof content === 'function'
                    ? content(
                        () => this.resolve(item),
                        () => this.reject(item),
                      )
                    : content}
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
