import {
  ComponentType,
  forwardRef,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { useEvent } from '../../../_internal/hooks';
import { FieldBaseProps } from '../../../shared';
import { useFieldProps, useFormProps, wrapWithField } from '../../form';
import { CloseIcon, PlusIcon } from '../../../icons';
import { Button } from '../../actions';
import { Block } from '../../Block';
import { Flow } from '../../layout/Flow';
import { Grid } from '../../layout/Grid';
import { Space } from '../../layout/Space';
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
  InputComponent?: ComponentType<CubeTextInputMapperInputProps>;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

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

function TextInputMapper(props: CubeTextInputMapperProps, ref: any) {
  props = useFormProps(props);
  props = useFieldProps(props, {
    defaultValidationTrigger: 'onChange',
    valuePropsMapper: ({ value, onChange }) => ({
      value: value != null ? value : {},
      onChange: onChange,
    }),
  });

  const counterRef = useRef(0);

  let { isDisabled, actionLabel, value, onChange, InputComponent } = props;

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
        acc[key] = value;

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
  });

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

  InputComponent = InputComponent ?? TextInputMapperInput;

  const onKeyChange = useEvent((id: number, value: string) => {
    mappings.find((mapping) => {
      if (mapping.id === id) {
        mapping.key = value;
      }
    });

    setMappings([...mappings]);
  });

  const onValueChange = useEvent((id: number, value: string) => {
    mappings.find((mapping) => {
      if (mapping.id === id) {
        mapping.value = value;
      }
    });

    setMappings([...mappings]);
  });

  const onSubmit = useEvent(() => {
    onMappingsChange(mappings);
  });

  const renderedMappings = useMemo(() => {
    return mappings.map((mapping) => {
      const { key, value, id } = mapping;

      return (
        <Grid
          key={id}
          columns="minmax(0, 1fr) minmax(0, 1fr) min-content"
          gap="1x"
        >
          <TextInputMapperInput
            id={id}
            isDisabled={isDisabled}
            type="name"
            value={key}
            placeholder={props.keyPlaceholder || 'Key'}
            onChange={onKeyChange}
            onSubmit={onSubmit}
          />
          <InputComponent
            id={id}
            type="value"
            isDisabled={!key || isDisabled}
            value={value}
            placeholder={props.valuePlaceholder || 'Value'}
            onChange={onValueChange}
            onSubmit={onSubmit}
          />
          <Button
            aria-label="Remove mapping"
            theme="danger"
            type="clear"
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
    <Flow gap="1x">
      {[...renderedMappings]}
      {showNewButton ? (
        <Space gap={0}>
          {/** Hotfix for inconsistent alignment with the label **/}
          <Block styles={{ overflow: 'clip', width: 'max 0px' }}>&nbsp;</Block>
          <Button
            isDisabled={isDisabled}
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
  type: 'name' | 'value';
  value?: string;
  placeholder?: string;
  onChange?: (id: number, newValue: string) => void;
  onSubmit?: (id: number) => void;
  isDisabled?: boolean;
}

function TextInputMapperInput(props: CubeTextInputMapperInputProps) {
  const { id, type, value, placeholder, ...rest } = props;

  const onChange = useEvent((newValue: string) => {
    props.onChange?.(id, newValue);
  });

  const onBlur = useEvent(() => {
    props.onSubmit?.(id);
  });

  return (
    <TextInput
      width="auto"
      {...rest}
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

export { _TextInputMapper as TextInputMapper };
