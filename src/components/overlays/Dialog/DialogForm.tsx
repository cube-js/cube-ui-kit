import { useState, forwardRef, useImperativeHandle, ForwardedRef } from 'react';
import { DialogContainer } from './DialogContainer';
import { Dialog, CubeDialogProps } from './Dialog';
import { Title } from '../../content/Title';
import { Divider } from '../../content/Divider';
import { CubeFormProps, Form } from '../../forms/Form/Form';
import { useForm } from '../../forms/Form/useForm';
import { Content } from '../../content/Content';
import { Submit } from '../../actions/Button/Submit';
import { Button, CubeButtonProps } from '../../actions/Button/Button';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';

export interface CubeDialogFormProps extends CubeDialogProps, Omit<CubeFormProps, 'role'> {
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
}

export interface CubeDialogFormRef {
  open: () => void;
  close: () => void;
}

const DialogForm = (props: CubeDialogFormProps, ref: ForwardedRef<CubeDialogFormRef>) => {
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
  } = props;

  [form] = useForm(form);

  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
  }));

  function onLocalDismiss() {
    onDismiss?.();
    form?.resetFields();
    setOpen(false);
  }

  return <DialogContainer onDismiss={onLocalDismiss}>
    {open && <Dialog qa={`${qa || ''}Dialog`} isDismissable={true}>
      <Title>Delete deployment</Title>
      <Divider/>
      <Content>
        <Form
          qa={qa || 'DialogForm'}
          form={form}
          name={name}
          onSubmit={async(data) => {
            await onSubmit?.(data);
            setOpen(false);

            if (!preserve && form) {
              form.resetFields();
            }
          }}
          onSubmitFailed={onSubmitFailed}
          defaultValues={defaultValues}
          onValuesChange={onValuesChange}
          labelStyles={labelStyles}
          labelPosition={labelPosition}
          requiredMark={requiredMark}
          isRequired={isRequired}
          necessityIndicator={necessityIndicator}
          necessityLabel={necessityLabel}
          isReadOnly={isReadOnly}
          validationState={validationState}
          validateTrigger={validateTrigger}
        >
          {typeof children === 'function' ? children(onLocalDismiss) : children}
          {
            !noActions
              ? <ButtonGroup>
                  <Submit
                    qa={`${qa || ''}SubmitButton`}
                    theme={danger ? 'danger' : undefined}
                    label="Submit"
                    {...(submitProps || {})}
                  />
                  <Button
                    qa={`${qa || ''}CancelButton`}
                    onPress={onLocalDismiss}
                    label="Cancel"
                    {...(cancelProps || {})}
                  />
                </ButtonGroup>
              : undefined
          }
        </Form>
      </Content>
    </Dialog>}
  </DialogContainer>;
};

/**
 * DialogForms are a specific type of Dialog. They contain forms to fill.
 */
let _DialogForm = forwardRef(DialogForm);
export { _DialogForm as DialogForm };
