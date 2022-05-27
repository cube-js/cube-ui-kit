import { Button, DialogTrigger } from '../../index';
import { ConfirmDeletionDialogForm } from './ConfirmDeletionDialogForm';

export function DialogFormApp() {
  return (
    <DialogTrigger>
      <Button>Delete the instance</Button>

      <ConfirmDeletionDialogForm name="instanceName" />
    </DialogTrigger>
  );
}
