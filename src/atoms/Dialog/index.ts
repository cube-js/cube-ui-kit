import { CubeDialogProps, Dialog } from './Dialog';
import { CubeDialogTriggerProps, DialogTrigger } from './DialogTrigger';
import { api } from './api';
import { CubeDialogContainerProps, DialogContainer } from './DialogContainer';

const _Dialog = Object.assign(Dialog, {
  confirm: (options) => {
    return api.open({ dialogType: 'confirm', ...options });
  },
  info: (options) => {
    return api.open({ dialogType: 'info', ...options });
  },
});

export { _Dialog as Dialog, DialogContainer, DialogTrigger };

export type {
  CubeDialogProps,
  CubeDialogTriggerProps,
  CubeDialogContainerProps,
};
