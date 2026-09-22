import { useRef } from 'react';

import { useEvent } from '../../../_internal/hooks/use-event';
import { useI18n } from '../../../i18n';
import { useLayoutEffect } from '../../../utils/react/useLayoutEffect';
import { Button } from '../../actions/Button/Button';
import { ButtonGroup } from '../../actions/ButtonGroup/ButtonGroup';
import { Content } from '../../content/Content';
import { Header } from '../../content/Header';
import { Title } from '../../content/Title';
import { getControllerInternals } from '../../form/Form/modern/controller';
import { ModernFormRoot } from '../../form/Form/ModernFormRoot';
import { SubmitButton } from '../../form/Form/SubmitButton/SubmitButton';
import { useOpenTransitionContext } from '../Modal/OpenTransitionContext';

import { useDialogContext } from './context';
import { Dialog } from './Dialog';

import type { ModernDialogFormProps } from './DialogForm';

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
  const sessionEnded = useRef(false);
  const finishSession = useEvent((target = form) => {
    if (target !== form || sessionEnded.current) return;
    sessionEnded.current = true;
    getControllerInternals(target, '<DialogForm>').store.cancelSubmission();
    if (!preserve) target.reset();
  });
  const dismiss = useEvent(() => {
    finishSession(form);
    onClose?.();
    onDismiss?.();
  });
  const submitted = useEvent(() => {
    finishSession(form);
    onClose?.();
  });

  // Escape, outside clicks, and controlled closing belong to the container.
  // Only an open -> closed transition ends a session; hidden initial mounts
  // must not discard a controller that the caller has already populated.
  const wasOpen = useRef(!isClosing);
  useLayoutEffect(() => {
    if (isClosing && wasOpen.current) finishSession(form);
    wasOpen.current = !isClosing;
    if (!isClosing) sessionEnded.current = false;
  }, [isClosing, form, finishSession]);

  // Portals may relocate (remounting this component) and Strict Mode reconnects
  // effects. A replacement root owns the same session; only a detached
  // controller should reset after real removal.
  useLayoutEffect(
    () => () => {
      queueMicrotask(() => {
        if (!internals.getRootElement()) finishSession(form);
      });
    },
    [form, internals, finishSession],
  );

  return (
    <Dialog {...dialogProps} qa={`${qa || ''}Dialog`} onDismiss={dismiss}>
      <Header>
        <Title ellipsis>{title}</Title>
      </Header>
      <Content>
        <ModernFormRoot
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
          {typeof children === 'function' ? children(dismiss) : children}
          {!noActions && (
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
          )}
        </ModernFormRoot>
      </Content>
    </Dialog>
  );
}
