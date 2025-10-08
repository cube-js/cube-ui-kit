import {
  ComponentType,
  ForwardedRef,
  forwardRef,
  KeyboardEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks';
import { CloseIcon, PlusIcon } from '../../../icons';
import { FieldBaseProps } from '../../../shared';
import { mergeProps, useCombinedRefs } from '../../../utils/react';
import { Button } from '../../actions';
import { Block } from '../../Block';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { Flow } from '../../layout/Flow';
import { Grid } from '../../layout/Grid';
import { Space } from '../../layout/Space';
import { LegacyComboBox } from '../LegacyComboBox';
import { PasswordInput } from '../PasswordInput/PasswordInput';
import { TextArea } from '../TextArea/index';
import { TextInput } from '../TextInput';

type Mapping = {
  key: string;
  value: string;
  id: number;
};

export interface CubeTextInputMapperProps extends FieldBaseProps {
  actionLabel?: string;
  isDisabled?: boolean;
  value?: Record<string, string>;
  onChange?: (value: Record<string, string> | undefined) => void;
  KeyComponent?: ComponentType<CubeTextInputMapperInputProps>;
  ValueComponent?: ComponentType<CubeTextInputMapperInputProps>;
  keyProps?: Partial<CubeTextInputMapperInputProps>;
  valueProps?: Partial<CubeTextInputMapperInputProps>;
  allowsCustomValue?: boolean;
  size?: 'small' | 'medium' | 'large' | (string & {});
}

// Rewrites upper level field component styles
// @TODO: Remove this after the release of new Element API
const PROPS_GRID_HACK = {
  styles: {
    InputArea: {
      gridColumn: {
        '': 'auto',
        'has-sider': 'auto',
      },
    },
  },
};

// remove duplicates in mappings
function removeDuplicates(mappings: Mapping[]) {
  const keys = new Set<string>();

  return mappings.filter(({ key }) => {
    if (keys.has(key)) {
      return false;
    }

    keys.add(key);

    return true;
  });
}

function TextInputMapper(
  props: CubeTextInputMapperProps,
  ref: ForwardedRef<HTMLDivElement>,
) {
  ref = useCombinedRefs(ref);

  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value != null ? value : {},
      onChange: onChange,
    }),
  });

  const counterRef = useRef(0);

  let {
    isDisabled,
    actionLabel,
    value,
    onChange,
    keyProps,
    valueProps,
    KeyComponent,
    ValueComponent,
    size = 'medium',
  } = props;

  function extractLocalValues(
    value: Record<string, string>,
    localValues: Mapping[],
  ) {
    const valueKeys = Object.keys(value);
    const localKeys = localValues.map(({ key }) => key);

    localKeys.forEach((key) => {
      if (!valueKeys.includes(key) && key !== '') {
        localValues = localValues.filter(({ key: k }) => k !== key);
      }
    });

    Object.entries(value ?? {}).forEach(([key, value]) => {
      const exist = localValues.find(({ key: k }) => k === key);

      if (exist) {
        exist.value = value;
      } else {
        localValues.push({ key, value, id: counterRef.current++ });
      }
    });

    return removeDuplicates(localValues);
  }

  const [mappings, setMappings] = useState(() => {
    return extractLocalValues(value ?? {}, []);
  });

  useEffect(() => {
    setMappings(extractLocalValues(value ?? {}, mappings));
  }, [JSON.stringify(value)]);

  const onMappingsChange = useEvent((newMappings: Mapping[]) => {
    const newValue = newMappings.reduce(
      (acc, { key, value }) => {
        acc[key.trim()] = value.trim();

        return acc;
      },
      {} as Record<string, string>,
    );

    const keys = Object.keys(newValue);

    if (!keys.length) {
      onChange?.(undefined);
    } else {
      onChange?.(newValue);
    }

    const updatedMappings = extractLocalValues(newValue ?? {}, newMappings);

    if (JSON.stringify(updatedMappings) !== JSON.stringify(mappings)) {
      setMappings(updatedMappings);
    }
  });

  // useEffect(() => {
  //   // focus on the last non-disabled input
  //   setTimeout(() => {
  //     (
  //       ref?.current?.querySelector(
  //         '[data-qa="Mapping"]:last-child input:not([disabled])',
  //       ) as HTMLInputElement
  //     )?.focus();
  //   }, 100);
  // }, [mappings.length]);

  const addNewMapping = useEvent(() => {
    setMappings((prev) => {
      return [...prev, { key: '', value: '', id: counterRef.current++ }];
    });
  });

  const showNewButton = useMemo(() => {
    return (
      !mappings.length || !mappings.some(({ key, value }) => !key || !value)
    );
  }, [mappings]);

  KeyComponent = KeyComponent ?? TextInputMapperInput;
  ValueComponent = ValueComponent ?? TextInputMapperInput;

  const onKeyChange = useEvent((id: number, value: string) => {
    mappings.forEach((mapping) => {
      if (mapping.id === id) {
        mapping.key = value;
      }
    });

    setMappings([...mappings]);
  });

  const onValueChange = useEvent((id: number, value: string) => {
    mappings.forEach((mapping) => {
      if (mapping.id === id) {
        mapping.value = value;
      }
    });

    setMappings([...mappings]);
  });

  const onSubmit = useEvent(() => {
    onMappingsChange(mappings);
  });

  const onKeyDown = useEvent((e: KeyboardEvent<HTMLDivElement>) => {
    // if Ctrl+Enter or Cmd+Enter is pressed then add new mapping if that's enabled
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && showNewButton) {
      addNewMapping();
    }
  });

  const renderedMappings = useMemo(() => {
    return mappings.map((mapping, index) => {
      const { key, value, id } = mapping;

      return (
        <Grid
          key={id}
          qa="Mapping"
          columns="minmax(0, 1fr) minmax(0, 1fr) min-content"
          gap="1x"
        >
          <KeyComponent
            autoFocus={index === mappings.length - 1}
            id={id}
            isDisabled={isDisabled}
            fieldType="key"
            value={key}
            placeholder="Key"
            size={size}
            onChange={onKeyChange}
            onSubmit={onSubmit}
            {...keyProps}
          />
          <ValueComponent
            id={id}
            fieldType="value"
            isDisabled={!key || isDisabled}
            value={value}
            placeholder="Value"
            size={size}
            onChange={onValueChange}
            onSubmit={onSubmit}
            {...valueProps}
          />
          <Button
            aria-label="Remove mapping"
            theme="danger"
            type="clear"
            size={size}
            icon={<CloseIcon />}
            onPress={() => {
              setMappings(mappings.filter((m) => m.id !== id));
              onMappingsChange(mappings.filter((m) => m.id !== id));
            }}
          />
        </Grid>
      );
    });
  }, [JSON.stringify(mappings)]);

  const element = (
    <Flow ref={ref} gap="1x" onKeyDown={onKeyDown}>
      {[...renderedMappings]}
      {showNewButton ? (
        <Space gap={0}>
          {/** Hotfix for inconsistent alignment with the label **/}
          <Block styles={{ overflow: 'clip', width: 'max 0px' }}>&nbsp;</Block>
          <Button
            isDisabled={isDisabled}
            size={size}
            icon={<PlusIcon />}
            onPress={addNewMapping}
          >
            {actionLabel ? actionLabel : 'Mapping'}
          </Button>
        </Space>
      ) : null}
    </Flow>
  );

  return wrapWithField(element, ref, props);
}

export interface CubeTextInputMapperInputProps {
  id: number;
  fieldType: 'key' | 'value';
  inputType?: 'input' | 'combobox' | 'password' | 'textarea';
  size?: 'small' | 'medium' | 'large' | (string & {});
  value?: string;
  options?: string[];
  placeholder?: string;
  onChange?: (id: number, newValue: string) => void;
  onSubmit?: (id: number) => void;
  isDisabled?: boolean;
  autoFocus?: boolean;
  allowsCustomValue?: boolean;
}

function TextInputMapperInput(props: CubeTextInputMapperInputProps) {
  const {
    id,
    fieldType,
    inputType = 'input',
    options,
    value,
    size = 'medium',
    placeholder,
    allowsCustomValue,
    ...rest
  } = props;

  const onChange = useEvent((newValue: string) => {
    props.onChange?.(id, newValue);
  });

  const onBlur = useEvent(() => {
    props.onSubmit?.(id);
  });

  const onSelectionChange = useEvent((newValue: string) => {
    if (!allowsCustomValue && !options?.includes(newValue)) {
      props.onChange?.(id, '');
    } else {
      props.onChange?.(id, newValue);
    }

    props.onSubmit?.(id);
  });

  const Component = {
    input: TextInput,
    textarea: TextArea,
    password: PasswordInput,
  }[inputType];

  if (inputType === 'combobox') {
    return (
      <LegacyComboBox
        qa="AddMapping"
        data-type={fieldType}
        width="auto"
        size={size}
        {...mergeProps(rest, PROPS_GRID_HACK)}
        id={undefined}
        inputValue={value}
        selectedKey={value}
        labelPosition="top"
        aria-label={placeholder}
        placeholder={placeholder}
        onInputChange={onChange}
        onSelectionChange={(val) => onSelectionChange(val ?? '')}
      >
        {(options ?? []).map((option) => (
          <LegacyComboBox.Item key={option}>{option}</LegacyComboBox.Item>
        ))}
      </LegacyComboBox>
    );
  }

  return (
    <Component
      qa="AddMapping"
      data-type={fieldType}
      width="auto"
      rows={1}
      size={size}
      {...mergeProps(rest, PROPS_GRID_HACK)}
      id={undefined}
      value={value}
      labelPosition="top"
      aria-label={placeholder}
      placeholder={placeholder}
      onChange={onChange}
      onBlur={onBlur}
    />
  );
}

const _TextInputMapper = forwardRef(TextInputMapper);

_TextInputMapper.displayName = 'TextInputMapper';

export { _TextInputMapper as TextInputMapper };
