import { useRef } from 'react';
import { CubeDialogFormRef, Button } from '../../index';
import { ConfirmDeletionDialogForm } from './ConfirmDeletionDialogForm';

export function DialogFormApp() {
  const ConfirmDeletionDialogFormRef = useRef<CubeDialogFormRef>(null);

  function onConfirm() {
    console.log('Deletion is confirmed');
  }

  function onDismiss() {
    console.log('Deletion is cancelled');
  }

  return <>
    <Button onPress={() => ConfirmDeletionDialogFormRef?.current?.open()}>
      Delete the instance
    </Button>
    <ConfirmDeletionDialogForm
      ref={ConfirmDeletionDialogFormRef}
      name="instanceName"
      onSubmit={onConfirm}
      onDismiss={onDismiss}
    />
  </>
}
