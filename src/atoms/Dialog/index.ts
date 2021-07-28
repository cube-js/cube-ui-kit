import { Dialog } from './Dialog';
import { DialogTrigger } from './DialogTrigger';
import { api } from './api';
import { DialogContainer } from './DialogContainer';

Dialog.confirm = (options) => {
  return api.open({ dialogType: 'confirm', ...options });
};

Dialog.info = (options) => {
  return api.open({ dialogType: 'info', ...options });
};

export { Dialog, DialogContainer, DialogTrigger };
