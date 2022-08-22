import { Title } from '../../content/Title';
import { CubeFormProps, Form } from '../../forms/Form/Form';
import { useForm } from '../../forms';
import { Content } from '../../content/Content';
import { Submit } from '../../actions/Button/Submit';
import { Button, CubeButtonProps } from '../../actions';
import { ButtonGroup } from '../../actions';
import { Header } from '../../content/Header';
import { FieldTypes } from '../../forms';

import { useDialogContext } from './context';
import { Dialog, CubeDialogProps } from './Dialog';

export interface CubeDialogFormProps<T extends FieldTypes = FieldTypes>
  extends CubeDialogProps,
    Omit<CubeFormProps<T>, 'role'> {
  /** Whether the submit button has a `danger` theme */
  danger?: boolean;
  /** Properties for submit button. Use `label` to change text. */
  submitProps?: CubeButtonProps;
  /** Properties for cancel button. Use `label` to change text. */
  cancelProps?: CubeButtonProps;
  /** WIP. Preserve form values even if field is deleted */
  preserve?: boolean;
  /** Whether to hide action button so developer can manually specify them */
  noActions?: boolean;
  /** The title of the dialog */
  title?: string;
}

export interface CubeDialogFormRef {
  open: () => void;
  close: () => void;
}

/**
 * DialogForms are a specific type of Dialog. They contain forms to fill.
 */
export function DialogForm<T extends FieldTypes = FieldTypes>(
  props: CubeDialogFormProps<T>,
) {
  let {
    qa,
    name,
    form,
    defaultValues,
    onDismiss,
    onSubmit,
    onSubmitFailed,
    onValuesChange,
    labelStyles,
    labelPosition,
    requiredMark,
    isRequired,
    necessityIndicator,
    necessityLabel,
    isReadOnly,
    validationState,
    validateTrigger,
    children,
    danger,
    noActions,
    submitProps,
    cancelProps,
    preserve,
    title,
    size,
    closeIcon,
    ...dialogProps
  } = props;

  [form] = useForm(form);

  const { onClose } = useDialogContext();

  function onLocalDismiss() {
    onClose?.();
    onDismiss?.();

    if (!preserve) {
      form?.resetFields();
    }
  }

  return (
    <Dialog
      qa={`${qa || ''}Dialog`}
      size={size}
      closeIcon={closeIcon}
      {...dialogProps}
    >
      <Header>
        <Title>{title}</Title>
      </Header>
      <Content>
        <Form<T>
          qa={qa || 'DialogForm'}
          form={form}
          name={name}
          defaultValues={defaultValues}
          labelStyles={labelStyles}
          labelPosition={labelPosition}
          requiredMark={requiredMark}
          isRequired={isRequired}
          necessityIndicator={necessityIndicator}
          necessityLabel={necessityLabel}
          isReadOnly={isReadOnly}
          validationState={validationState}
          validateTrigger={validateTrigger}
          onSubmit={async (data) => {
            await onSubmit?.(data);

            onClose?.();

            if (!preserve) {
              form?.resetFields();
            }
          }}
          onSubmitFailed={onSubmitFailed}
          onValuesChange={onValuesChange}
        >
          {typeof children === 'function' ? children(onLocalDismiss) : children}

          {!noActions ? (
            <ButtonGroup>
              <Submit
                qa={`${qa || ''}SubmitButton`}
                theme={danger ? 'danger' : undefined}
                label="Submit"
                {...(submitProps || {})}
              />
              <Button
                qa={`${qa || ''}CancelButton`}
                label="Cancel"
                onPress={onLocalDismiss}
                {...(cancelProps || {})}
              />
            </ButtonGroup>
          ) : undefined}
        </Form>
      </Content>
    </Dialog>
  );
}
