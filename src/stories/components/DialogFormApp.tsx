import { Button } from '../../components/actions/Button/Button';
import { DialogTrigger } from '../../components/overlays/Dialog/DialogTrigger';

import { ConfirmDeletionDialogForm } from './ConfirmDeletionDialogForm';

export function DialogFormApp() {
  return (
    <DialogTrigger>
      <Button>Delete the instance</Button>

      <ConfirmDeletionDialogForm name="instanceName" />
    </DialogTrigger>
  );
}
