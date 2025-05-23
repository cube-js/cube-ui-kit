import { Button, ButtonGroup, CubeButtonProps } from '../../actions';
import { Content } from '../../content/Content';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';
import {
  CubeFormProps,
  FieldTypes,
  Form,
  SubmitButton,
  useForm,
} from '../../form';

import { useDialogContext } from './context';
import { CubeDialogProps, Dialog } from './Dialog';

export interface CubeDialogFormProps<T extends FieldTypes = FieldTypes>
  extends Omit<CubeDialogProps, 'children'>,
    Omit<CubeFormProps<T>, 'role' | 'children'> {
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
  /** Children nodes or render function  */
  children?:
    | CubeFormProps['children']
    | ((onLocalDismiss: () => void) => CubeFormProps['children']);
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
      // let animations finish before resetting the form
      setTimeout(() => {
        form?.resetFields();
      }, 250);
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
        <Title ellipsis>{title}</Title>
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
              // let animations finish before resetting the form
              setTimeout(() => {
                form.resetFields();
              }, 250);
            }
          }}
          onSubmitFailed={onSubmitFailed}
          onValuesChange={onValuesChange}
        >
          {typeof children === 'function' ? children(onLocalDismiss) : children}

          {!noActions ? (
            <ButtonGroup>
              <SubmitButton
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
