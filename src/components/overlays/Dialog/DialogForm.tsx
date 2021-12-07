import { useState, forwardRef, useImperativeHandle, ForwardedRef } from 'react';
import { DialogContainer } from './DialogContainer';
import { Dialog, CubeDialogProps } from './Dialog';
import { Title } from '../../content/Title';
import { Divider } from '../../content/Divider';
import { CubeFormProps, Form } from '../../forms/Form/Form';
import { Content } from '../../content/Content';
import { Submit } from '../../actions/Button/Submit';
import { Button, CubeButtonProps } from '../../actions/Button/Button';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';

export interface CubeDialogFormProps extends CubeDialogProps, Omit<CubeFormProps, 'role'> {
  danger?: boolean;
  submitProps?: CubeButtonProps;
  cancelProps?: CubeButtonProps;
  preserve?: boolean;
}

export interface CubeDialogFormRef {
  open: () => void;
  close: () => void;
}

const DialogForm = (props, ref: ForwardedRef<CubeDialogFormRef>) => {
  let {
    qa,
    name,
    form,
    defaultValues,
    onDismiss,
    onSubmit,
    onValuesChange,
    onSubmitFailed,
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

  [form] = Form.useForm(form);

  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open() {
      setOpen(true);
    },
    close() {
      setOpen(false);
    },
  }));

  return <DialogContainer onDismiss={() => {
    onDismiss();
    setOpen(false);
  }}>
    {open && <Dialog qa={`${qa || ''}Dialog`} isDismissable={true}>
      <Title>Delete deployment</Title>
      <Divider/>
      <Content>
        <Form
          qa={qa || 'DialogForm'}
          form={form}
          name={name}
          onSubmit={async(data) => {
            await onSubmit(data);
            setOpen(false);

            if (!preserve) {
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
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
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
                    onPress={() => setOpen(false)}
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
