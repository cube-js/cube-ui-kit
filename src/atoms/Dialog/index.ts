import { Dialog } from './Dialog';
import { DialogTrigger } from './DialogTrigger';
import { api } from './api';
import { DialogContainer } from './DialogContainer';

const _Dialog = Object.assign(Dialog, {
  confirm: (options) => {
    return api.open({ dialogType: 'confirm', ...options });
  },
  info: (options) => {
    return api.open({ dialogType: 'info', ...options });
  },
});

export { _Dialog as Dialog, DialogContainer, DialogTrigger };
