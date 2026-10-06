import { ComboBox, Select } from '@cube-dev/ui-kit';

/**
 * `Select` keeps its item type through `items`, as `ComboBox` does, so a
 * render-function child reads the item's own fields (CUB-5382).
 */
type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

function assertType<T extends true>(): T | void {}

interface Resource {
  id: string;
  type: 'table' | 'view';
}

export function ResourceSelect({ resources }: { resources: Resource[] }) {
  return (
    <Select label="Resource" items={resources}>
      {(item) => {
        assertType<Equal<typeof item, Resource>>();

        return <Select.Item key={item.id}>{item.type}</Select.Item>;
      }}
    </Select>
  );
}

export function ResourceComboBox({ resources }: { resources: Resource[] }) {
  return (
    <ComboBox label="Resource" items={resources}>
      {(item) => {
        assertType<Equal<typeof item, Resource>>();

        return <ComboBox.Item key={item.id}>{item.type}</ComboBox.Item>;
      }}
    </ComboBox>
  );
}
