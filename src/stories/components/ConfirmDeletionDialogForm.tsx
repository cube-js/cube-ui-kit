import {
  DialogForm,
  Field,
  Paragraph,
  Input,
  Text,
  CubeDialogFormProps,
} from '../../index';

interface ConfirmDeletionDialogFormProps
  extends Pick<CubeDialogFormProps, 'onSubmit' | 'onDismiss' | 'form'> {
  name?: string;
}

export function ConfirmDeletionDialogForm(
  props: ConfirmDeletionDialogFormProps,
) {
  let { name, onSubmit, onDismiss } = props;

  return (
    <DialogForm
      title="Delete Deployment"
      onSubmit={onSubmit}
      onDismiss={onDismiss}
      submitProps={{
        label: 'Delete',
        theme: 'danger',
      }}
      cancelProps={{
        label: 'I changed my mind',
      }}
    >
      <Paragraph>
        To delete the instance, please, enter its full name:{' '}
        <Text.Strong>{name}</Text.Strong>
      </Paragraph>

      <Field
        name="name"
        rules={[
          {
            required: true,
            message: 'This field is required',
          },
          {
            async validator(rule, value) {
              if (value !== name) {
                throw new Error('Incorrect name');
              }
            },
          },
        ]}
      >
        <Input.Text placeholder="Enter the name of the instance" />
      </Field>
    </DialogForm>
  );
}
