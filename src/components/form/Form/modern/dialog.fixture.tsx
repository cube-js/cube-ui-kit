import { useState } from 'react';

import { Button } from '../../../actions/Button/Button';
import { TextInput } from '../../../fields/TextInput/TextInput';
import { DialogContainer } from '../../../overlays/Dialog/DialogContainer';
import { DialogForm } from '../../../overlays/Dialog/DialogForm';
import { Form } from '../index';

import type { ModernDialogFormProps } from '../../../overlays/Dialog/DialogForm';

export interface DialogValues {
  profile: { name: string | null };
  hidden?: string;
}

/** The compiler gate asserts that this consumer actually gets compiled. */
export function DialogFixture({
  required = false,
  hideOnClose = true,
  ...props
}: ModernDialogFormProps<DialogValues> & {
  required?: boolean;
  hideOnClose?: boolean;
}) {
  const [open, setOpen] = useState(true);
  return (
    <>
      <Button onPress={() => setOpen(true)}>Open</Button>
      <Button onPress={() => setOpen(false)}>Close externally</Button>
      <DialogContainer
        isOpen={open}
        onDismiss={() => setOpen(false)}
        hideOnClose={hideOnClose}
      >
        <DialogForm title="Profile" {...props}>
          {(dismiss) => (
            <>
              <TextInput
                name={['profile', 'name']}
                label="Name"
                isRequired={required}
              />
              <Form.Subscribe selector={(state) => state.isDirty}>
                {(dirty) => <output>{dirty ? 'Modified' : 'Unchanged'}</output>}
              </Form.Subscribe>
              <Form.SubmitError />
              {typeof props.children === 'function'
                ? props.children(dismiss)
                : props.children}
            </>
          )}
        </DialogForm>
      </DialogContainer>
    </>
  );
}
