import {
  Button,
  Dialog,
  DialogTrigger,
  Menu,
  NumberInput,
  TextArea,
  TextInput,
} from '@cube-dev/ui-kit';

import type { CubeMenuProps } from '@cube-dev/ui-kit';

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

function assertType<T extends true>(): T | void {}

// Adobe's consolidated types must not replace UI Kit's callback contracts.
assertType<
  Equal<
    Parameters<NonNullable<CubeMenuProps<object>['onAction']>>,
    [string | number]
  >
>();

export function AriaUpgradeConsumer() {
  const invalidNumber = (
    // @ts-expect-error numeric validators receive numbers
    <NumberInput validate={(_value: string) => undefined} />
  );
  // @ts-expect-error text validators receive strings
  const invalidText = <TextInput validate={(_value: number) => undefined} />;
  void invalidNumber;
  void invalidText;

  return (
    <>
      <Button htmlType="submit" onBlur={(event) => event.currentTarget.focus()}>
        Save
      </Button>
      <TextInput
        validate={(value) => (value.trim() ? undefined : 'Required')}
      />
      <TextArea
        validate={(value) => (value.length < 100 ? undefined : 'Too long')}
        onKeyDown={(event) => {
          const target: HTMLInputElement | HTMLTextAreaElement =
            event.currentTarget;
          target.select();
        }}
      />
      <NumberInput
        validate={(value) => (value >= 0 ? undefined : 'Negative')}
      />
      <DialogTrigger type="popover" defaultOpen onOpenChange={() => {}}>
        <Button>Open</Button>
        <Dialog aria-label="Details">Content</Dialog>
      </DialogTrigger>
      <Menu onAction={(key) => String(key)}>
        <Menu.Item key="save">Save</Menu.Item>
      </Menu>
    </>
  );
}
