import { useRef } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { Button } from '../../actions/Button/Button';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';
import { Content } from '../../content/Content';
import { Footer } from '../../content/Footer';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';
import { getControllerInternals } from '../../form/Form/modern/controller';
import { ModernFormRoot } from '../../form/Form/ModernFormRoot';
import { SubmitButton } from '../../form/Form/SubmitButton/SubmitButton';
import { useOpenTransitionContext } from '../Modal/OpenTransitionContext';

import { useDialogContext } from './context';
import { Dialog } from './Dialog';

import type { FormController } from '../../form/Form/modern/controller';
import type { ModernDialogFormProps } from './DialogForm';

interface DialogSession<T extends object> {
  form: FormController<T>;
  preserve?: boolean;
  ended: boolean;
  wasOpen: boolean;
}

function finishSession<T extends object>(session?: DialogSession<T>) {
  if (!session || session.ended) return;
  session.ended = true;
  getControllerInternals(session.form, '<DialogForm>').store.cancelSubmission();
  if (!session.preserve) session.form.reset();
}

/** Modern dialogs own the editing session, including retained/hidden roots. */
export function ModernDialogForm<T extends object>(
  props: ModernDialogFormProps<T>,
) {
  const {
    form,
    qa,
    title,
    danger,
    submitProps,
    cancelProps,
    noActions,
    preserve,
    children,
    onDismiss,
    name,
    defaultValues,
    onSubmit,
    onSubmitFailed,
    onValuesChange,
    onReset,
    onResetCapture,
    submitValues,
    labelStyles,
    labelPosition,
    labelWidth,
    orientation,
    requiredMark,
    necessityIndicator,
    isDisabled,
    isReadOnly,
    isInvalid,
    isValid,
    validationState,
    validateTrigger,
    showValid,
    action,
    method,
    target,
    encType,
    autoComplete,
    ...dialogProps
  } = props;
  const { t } = useI18n();
  const { onClose, isOpen } = useDialogContext();
  const internals = getControllerInternals(form, '<DialogForm>');
  const transition = useOpenTransitionContext();
  const isClosing =
    isOpen === undefined
      ? transition?.transitionState === 'exit' ||
        transition?.transitionState === 'unmounted'
      : !isOpen;
  const session = useRef<DialogSession<T> | undefined>(undefined);
  const dismiss = useEvent(() => {
    finishSession(session.current);
    onClose?.();
    onDismiss?.();
  });
  const submitted = useEvent(() => {
    finishSession(session.current);
    onClose?.();
  });

  // Escape, outside clicks, and controlled closing belong to the container.
  // Only an open -> closed transition ends a session; hidden initial mounts
  // must not discard a controller that the caller has already populated.
  useLayoutEffect(() => {
    if (session.current?.form !== form) {
      session.current = { form, preserve, ended: false, wasOpen: !isClosing };
    }
    const current = session.current;
    current.preserve = preserve;
    if (isClosing && current.wasOpen) finishSession(current);
    if (!isClosing && !current.wasOpen) current.ended = false;
    current.wasOpen = !isClosing;
  });

  // Portals may relocate (remounting this component) and Strict Mode reconnects
  // effects. A replacement root owns the same session; only a detached
  // controller should reset after real removal. Capture that controller's
  // session, so replacing it cannot apply the new controller's preserve policy.
  useLayoutEffect(() => {
    const own = session.current;
    return () => {
      queueMicrotask(() => {
        if (!internals.getRootElement()) finishSession(own);
      });
    };
  }, [form, internals]);

  return (
    <Dialog {...dialogProps} qa={`${qa || ''}Dialog`} onDismiss={dismiss}>
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
      <ModernFormRoot
        data-popover-keep
        form={form}
        qa={qa || 'DialogForm'}
        name={name}
        defaultValues={defaultValues}
        onSubmit={onSubmit}
        onSubmitted={submitted}
        onSubmitFailed={onSubmitFailed}
        onValuesChange={onValuesChange}
        onReset={onReset}
        onResetCapture={onResetCapture}
        submitValues={submitValues}
        labelStyles={labelStyles}
        labelPosition={labelPosition}
        labelWidth={labelWidth}
        orientation={orientation}
        requiredMark={requiredMark}
        necessityIndicator={necessityIndicator}
        isDisabled={isDisabled}
        isReadOnly={isReadOnly}
        isInvalid={isInvalid}
        isValid={isValid}
        validationState={validationState}
        validateTrigger={validateTrigger}
        showValid={showValid}
        action={action}
        method={method}
        target={target}
        encType={encType}
        autoComplete={autoComplete}
      >
        <Content>
          {typeof children === 'function' ? children(dismiss) : children}
        </Content>

        {!noActions && (
          <Footer>
            <ButtonGroup>
              <SubmitButton
                qa={`${qa || ''}SubmitButton`}
                theme={danger ? 'danger' : undefined}
                label={t('dialogForm.submit', 'Submit')}
                {...submitProps}
              />
              <Button
                qa={`${qa || ''}CancelButton`}
                label={t('dialogForm.cancel', 'Cancel')}
                onPress={dismiss}
                {...cancelProps}
              />
            </ButtonGroup>
          </Footer>
        )}
      </ModernFormRoot>
    </Dialog>
  );
}
