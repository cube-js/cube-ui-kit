import { useObjectRef } from '@react-aria/utils';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  Styles,
  tasty,
} from '@tenphi/tasty';
import {
  ContextType,
  createContext,
  FormHTMLAttributes,
  forwardRef,
  ReactElement,
  ReactNode,
  Ref,
  useContext,
  useRef,
} from 'react';

import { Provider, useProviderProps } from '../../../provider';
import { FormBaseProps } from '../../../shared/index';
import { timeout } from '../../../utils/promise';
import { useCombinedRefs } from '../../../utils/react/index';
import { extractStyles } from '../../../utils/styles';
import { useValidationProps } from '../validation/index';

import { isModernFormController } from './backend';
import { ModernControllerContext } from './modern/context';
import { ModernFormRoot } from './ModernFormRoot';
import { FieldTypes } from './types';
import { CubeFormData, CubeFormInstance, useForm } from './use-form';

import type { ModernFormProps } from './ModernFormRoot';

/**
 * Public legacy context. Its value is the full legacy scope (presentation
 * props, the instance, `submitError`, `idPrefix`) and is part of the exported
 * contract: wrappers outside the kit read it and Radio/Checkbox groups mask it.
 */
export const FormContext = createContext({});

/**
 * Presentation and configuration that any root — legacy or modern — hands to
 * the fields below it. Backend-neutral by construction: no instance in here.
 */
export interface FormPresentationContextValue {
  labelPosition?: FormBaseProps['labelPosition'];
  labelStyles?: FormBaseProps['labelStyles'];
  orientation?: 'vertical' | 'horizontal';
  necessityIndicator?: FormBaseProps['necessityIndicator'];
  validateTrigger?: FormBaseProps['validateTrigger'];
  requiredMark?: boolean;
  showValid?: boolean;
  idPrefix?: string;
}

const EMPTY_PRESENTATION: FormPresentationContextValue = {};

export const FormPresentationContext =
  createContext<FormPresentationContextValue>(EMPTY_PRESENTATION);

/**
 * Scope the inputs below to a new form context. Radio/Checkbox groups use it
 * for their options: they see the group's validation state, but neither the
 * surrounding form's presentation props nor its instance, so a nested `name`
 * never registers as an independent field. Wrappers that used to override
 * `FormContext` directly for the same purpose should render this instead — a
 * bare `FormContext.Provider` no longer masks the presentation context.
 */
export function FormScopeMask({
  value,
  children,
}: {
  value: ContextType<typeof FormContext>;
  children?: ReactNode;
}) {
  return (
    <ModernControllerContext.Provider value={null}>
      <FormPresentationContext.Provider value={EMPTY_PRESENTATION}>
        <FormContext.Provider value={value}>{children}</FormContext.Provider>
      </FormPresentationContext.Provider>
    </ModernControllerContext.Provider>
  );
}

/** Separate overloads retain contextual callback typing for each backend. */
export interface FormRootComponent {
  <T extends FieldTypes = FieldTypes>(
    props: CubeFormProps<T> & { ref?: Ref<HTMLFormElement> },
  ): ReactElement;
  <T extends FieldTypes = FieldTypes>(
    props: ModernFormProps<T> & { ref?: Ref<HTMLFormElement> },
  ): ReactElement;
}

export const FormElement = tasty({
  as: 'form',
  qa: 'Form',
  styles: {
    display: {
      '': 'block',
      horizontal: 'flex',
    },
    flow: {
      '': 'column',
      horizontal: 'row',
    },
    placeItems: {
      '': 'initial',
      horizontal: 'center',
    },
    gap: '2x',
    '$label-width': '25x',
  },
});

/**
 * Merge order: presentation context, then the legacy `FormContext`, then the
 * props. Under a legacy root the two contexts carry the same presentation
 * values, so the result is exactly `{ ...FormContext, ...props }` as before.
 */
export function useFormProps(props) {
  const presentation = useContext(FormPresentationContext);
  const ctx = useContext(FormContext);
  const modern = useContext(ModernControllerContext);

  return {
    ...presentation,
    ...(modern ? { form: modern } : {}),
    ...ctx,
    ...props,
  };
}

export const formPropNames = new Set([
  'action',
  'autoComplete',
  'encType',
  'method',
  'target',
]);

export interface CubeFormProps<T extends FieldTypes = FieldTypes>
  extends FormBaseProps,
    BaseProps,
    ContainerStyleProps,
    Pick<
      FormHTMLAttributes<HTMLFormElement>,
      'action' | 'autoComplete' | 'encType' | 'method' | 'target'
    > {
  /** Form name */
  name?: string;
  /** Default field values */
  defaultValues?: Partial<T>;
  /** Trigger when any value of the Field is changed */
  onValuesChange?: CubeFormInstance<T>['onValuesChange'];
  /** Trigger on form submit and success */
  onSubmit?: CubeFormInstance<T>['onSubmit'];
  /** Trigger on form submit and failed */
  onSubmitFailed?: (any?) => void | Promise<any>;
  /** Set form instance created by useForm */
  form?: CubeFormInstance<T, CubeFormData<T>>;
  /** The size of the side area with labels. Only for `labelPosition="side"` */
  labelWidth?: Styles['width'];
  orientation?: 'vertical' | 'horizontal';
}

/**
 * The legacy backend's root: the current engine under an internal name. Its
 * role is compatibility; see `legacy-contract/README.md` for what is frozen.
 */
function LegacyFormRoot<T extends FieldTypes>(
  props: CubeFormProps<T>,
  ref: Ref<HTMLFormElement>,
) {
  'use no memo';
  // Legacy form state is mutable; preserve its render-time reads until migration.

  props = useValidationProps(useProviderProps(props));
  let {
    qa,
    name,
    children,
    labelPosition,
    orientation,
    necessityIndicator,
    isDisabled,
    isReadOnly,
    isInvalid,
    isValid,
    labelStyles,
    validateTrigger,
    showValid,
    defaultValues,
    onValuesChange,
    requiredMark = true,
    form,
    labelWidth,
    onSubmit,
    onSubmitFailed,
    ...otherProps
  } = props;
  const defaultValuesRef = useRef(defaultValues);
  const firstRunRef = useRef(true);
  const isHorizontal = orientation === 'horizontal';

  if (!orientation) {
    orientation = 'vertical';
  }

  if (!labelPosition) {
    labelPosition = isHorizontal ? 'side' : 'top';
  }

  if (!labelWidth) {
    labelWidth = isHorizontal ? 'auto' : undefined;
  }

  ref = useCombinedRefs(ref);

  let onSubmitCallback;

  if ((onSubmit || onSubmitFailed) && !otherProps.action) {
    onSubmitCallback = async (e) => {
      if (e && e?.preventDefault) {
        e && e?.preventDefault && e?.preventDefault();
        e && e?.stopPropagation && e?.stopPropagation();

        if (e.nativeEvent) {
          const evt = e.nativeEvent;

          if (
            evt.submitter &&
            evt.submitter.getAttribute('type') !== 'submit'
          ) {
            return;
          }
        }
      }

      if (!form || form.isSubmitting) return;

      form.submitError = null;
      form.setSubmitting(true);

      try {
        try {
          await form.validateFields();
        } catch (e) {
          form?.setSubmitting(false);

          return;
        }

        await timeout();
        await onSubmit?.(form.getFormData());
      } catch (e) {
        await timeout();

        // errors are shown
        form.submitError = e as ReactNode;
        // transfer errors to the callback
        onSubmitFailed?.(e);

        if (e instanceof Error) {
          throw e;
        }
      } finally {
        form?.setSubmitting(false);
      }

      // output data from form directly
      // onSubmit(Object.fromEntries(new FormData(e.target).entries()));
    };
  }

  [form] = useForm<T>(form, ref && ref.current, {
    onSubmit: onSubmitCallback,
    onValuesChange,
  });

  let styles = extractStyles(otherProps, CONTAINER_STYLES);

  if (labelWidth) {
    styles['$label-width'] = labelWidth;
  }

  let domRef = useObjectRef(ref);

  const presentation: FormPresentationContextValue = {
    labelPosition,
    labelStyles,
    orientation,
    necessityIndicator,
    validateTrigger,
    requiredMark,
    showValid,
    idPrefix: name,
  };

  let ctx = {
    ...presentation,
    form,
    submitError: form.submitError,
  };

  if (firstRunRef.current && form) {
    if (defaultValues) {
      form.setInitialFieldsValue(defaultValues);
      form.resetFields(undefined, true);
      firstRunRef.current = false;
    }
  }

  if (defaultValuesRef.current !== defaultValues) {
    form?.setInitialFieldsValue(defaultValues ?? {});
    defaultValuesRef.current = defaultValues;
  }

  return (
    <FormElement
      {...filterBaseProps(otherProps, { propNames: formPropNames })}
      ref={domRef}
      noValidate
      qa={qa}
      styles={styles}
      mods={{
        'has-sider': labelPosition === 'side',
        'has-split': labelPosition === 'split',
        horizontal: isHorizontal,
      }}
      onSubmit={onSubmitCallback}
    >
      <ModernControllerContext.Provider value={null}>
        <FormPresentationContext.Provider value={presentation}>
          <FormContext.Provider value={ctx}>
            <Provider
              insideForm={true}
              isDisabled={isDisabled}
              isReadOnly={isReadOnly}
              isInvalid={isInvalid}
              isValid={isValid}
            >
              {children}
            </Provider>
          </FormContext.Provider>
        </FormPresentationContext.Provider>
      </ModernControllerContext.Provider>
    </FormElement>
  );
}

const _LegacyFormRoot = forwardRef(LegacyFormRoot) as unknown as <
  T extends FieldTypes,
>(
  props: CubeFormProps<T> & { ref?: Ref<HTMLFormElement> },
) => ReactElement;

(_LegacyFormRoot as any).displayName = 'LegacyFormRoot';

/**
 * The `<Form>` facade. It chooses the root by the brand of the `form` prop
 * before any backend hook runs. Without an explicit modern controller it is
 * the legacy root, so existing `<Form>` and `Form.useForm()` keep their behavior.
 */
function Form<T extends FieldTypes>(
  props: CubeFormProps<T> | ModernFormProps<T>,
  ref: Ref<HTMLFormElement>,
) {
  if (isModernFormController(props.form)) {
    return <ModernFormRoot {...(props as ModernFormProps<T>)} ref={ref} />;
  }

  return <_LegacyFormRoot {...(props as CubeFormProps<T>)} ref={ref} />;
}

/**
 * Forms allow users to enter data that can be submitted while providing alignment and styling for form fields.
 */
const _Form = forwardRef(Form) as unknown as FormRootComponent;

(_Form as any).displayName = 'Form';

export { _Form as Form, _LegacyFormRoot as LegacyFormRoot };
