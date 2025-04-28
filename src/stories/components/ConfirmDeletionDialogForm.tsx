import {
  CubeDialogFormProps,
  DialogForm,
  Field,
  FieldTypes,
  Input,
  Paragraph,
  Text,
} from '../../index';

interface ConfirmDeletionDialogFormProps<T extends FieldTypes>
  extends Pick<CubeDialogFormProps<T>, 'onSubmit' | 'onDismiss' | 'form'> {
  name?: string;
}

export function ConfirmDeletionDialogForm<T extends FieldTypes>(
  props: ConfirmDeletionDialogFormProps<T>,
) {
  let { name, onSubmit, onDismiss } = props;

  return (
    <DialogForm
      title="Delete Deployment"
      submitProps={{
        label: 'Delete',
        theme: 'danger',
      }}
      cancelProps={{
        label: 'I changed my mind',
      }}
      onSubmit={onSubmit}
      onDismiss={onDismiss}
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
