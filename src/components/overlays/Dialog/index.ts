import { CubeDialogProps, Dialog } from './Dialog';
import { CubeDialogTriggerProps, DialogTrigger } from './DialogTrigger';
import { api } from './api';
import { CubeDialogContainerProps, DialogContainer } from './DialogContainer';
import { CubeDialogFormRef, CubeDialogFormProps, DialogForm } from './DialogForm';

const _Dialog = Object.assign(Dialog, {
  confirm: (options) => {
    return api.open({ dialogType: 'confirm', ...options });
  },
  info: (options) => {
    return api.open({ dialogType: 'info', ...options });
  },
  form: (options) => {
    return api.open({ dialogType: 'form', ...options });
  },
});

export { _Dialog as Dialog, DialogContainer, DialogTrigger, DialogForm };

export type {
  CubeDialogProps,
  CubeDialogTriggerProps,
  CubeDialogContainerProps,
  CubeDialogFormRef,
  CubeDialogFormProps,
};
