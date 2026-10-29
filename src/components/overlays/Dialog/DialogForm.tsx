import { useEffect } from 'react';

import { useI18n } from '../../../i18n';
import { Button } from '../../actions/Button/Button';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';
import { isModernFormController } from '../../form/Form/backend';
import { Form } from '../../form/Form/Form';
import { SubmitButton } from '../../form/Form/SubmitButton/SubmitButton';
import { useForm } from '../../form/Form/use-form';

import { useDialogContext } from './context';
import { withDefaultButtonText } from './default-button-text';
import { CubeDialogProps, Dialog } from './Dialog';
import { ModernDialogForm } from './ModernDialogForm';

import type { ReactElement } from 'react';
import type { CubeButtonProps } from '../../actions/Button/Button';
import type { CubeFormProps } from '../../form/Form/Form';
import type { ModernFormProps } from '../../form/Form/ModernFormRoot';
import type { CubeSubmitButtonProps } from '../../form/Form/SubmitButton/SubmitButton';
import type { FieldTypes } from '../../form/Form/types';

export interface CubeDialogFormProps<T extends FieldTypes = FieldTypes>
  extends
    Omit<CubeDialogProps, 'children'>,
    Omit<CubeFormProps<T>, 'role' | 'children' | 'width'> {
  /** Whether the submit button has a `danger` theme */
  danger?: boolean;
  /** Properties for submit button. Use `children` to change text. */
  submitProps?: Omit<CubeButtonProps, 'form'>;
  /** Properties for cancel button. Use `children` to change text. */
  cancelProps?: CubeButtonProps;
  /** Preserve form values after submission or dismissal. */
  preserve?: boolean;
  /**
   * Whether Escape, an outside click and the close button ask "Discard
   * changes?" before they close the dialog. Unset, they ask while a field the
   * user edited differs from its default, unless `preserve` is set. An
   * explicit `confirmDismiss` on the `DialogTrigger` or `DialogContainer` wins.
   */
  confirmDismiss?: boolean;
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
export interface ModernDialogFormProps<T extends FieldTypes = FieldTypes>
  extends
    Omit<CubeDialogFormProps<T>, keyof CubeFormProps<T> | 'submitProps'>,
    Omit<ModernFormProps<T>, 'role' | 'children' | 'width'> {
  width?: CubeDialogProps['width'];
  children?: CubeDialogFormProps<T>['children'];
  submitProps?: Omit<CubeSubmitButtonProps<T>, 'form'>;
}

export function DialogForm<T extends FieldTypes = FieldTypes>(
  props: CubeDialogFormProps<T>,
): ReactElement;
export function DialogForm<T extends FieldTypes = FieldTypes>(
  props: ModernDialogFormProps<T>,
): ReactElement;
export function DialogForm<T extends FieldTypes = FieldTypes>(
  props: CubeDialogFormProps<T> | ModernDialogFormProps<T>,
): ReactElement {
  return isModernFormController(props.form) ? (
    <ModernDialogForm {...(props as ModernDialogFormProps<T>)} />
  ) : (
    <LegacyDialogForm {...(props as CubeDialogFormProps<T>)} />
  );
}

function LegacyDialogForm<T extends FieldTypes>(props: CubeDialogFormProps<T>) {
  'use no memo';
  // Legacy form state is mutable; preserve its render-time reads until migration.

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
    necessityIndicator,
    isReadOnly,
    isInvalid,
    isValid,
    validateTrigger,
    children,
    danger,
    noActions,
    submitProps,
    cancelProps,
    preserve,
    confirmDismiss,
    title,
    size,
    closeIcon,
    ...dialogProps
  } = props;

  [form] = useForm(form);

  const { t } = useI18n();
  const { onClose, registerUnsavedChanges } = useDialogContext();

  // Escape, an outside click and the close button ask before they discard
  // what the user typed: fields they edited away from their defaults. A form
  // filled from code is not an edit. `preserve` keeps the values anyway.
  useEffect(
    () =>
      registerUnsavedChanges?.(
        () =>
          confirmDismiss ??
          (!preserve &&
            form
              .getDirtyFieldNames()
              .some((name) => form.isFieldTouched(name))),
      ),
    [registerUnsavedChanges, form, preserve, confirmDismiss],
  );

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
      {/*
        The form wraps BOTH slots rather than sitting inside `Content`, so the
        actions can live in a pinned `Footer` while the body scrolls. They still
        have to be inside the `<form>` for submit to work, which is why the form
        is the outer one of the two (CUB-4920). A form placed directly in a
        `Dialog` lays itself out as the dialog's column (see `FormElement`).
      */}
      <Form<T>
        qa={qa || 'DialogForm'}
        form={form}
        name={name}
        defaultValues={defaultValues}
        labelStyles={labelStyles}
        labelPosition={labelPosition}
        requiredMark={requiredMark}
        necessityIndicator={necessityIndicator}
        isReadOnly={isReadOnly}
        isInvalid={isInvalid}
        isValid={isValid}
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
        <Content>
          {typeof children === 'function' ? children(onLocalDismiss) : children}
        </Content>

        {!noActions ? (
          <Footer>
            <ButtonGroup>
              <SubmitButton
                qa={`${qa || ''}SubmitButton`}
                theme={danger ? 'danger' : undefined}
                {...withDefaultButtonText(
                  submitProps,
                  t('dialogForm.submit', 'Submit'),
                )}
              />
              <Button
                qa={`${qa || ''}CancelButton`}
                onPress={onLocalDismiss}
                {...withDefaultButtonText(
                  cancelProps,
                  t('dialogForm.cancel', 'Cancel'),
                )}
              />
            </ButtonGroup>
          </Footer>
        ) : undefined}
      </Form>
    </Dialog>
  );
}
