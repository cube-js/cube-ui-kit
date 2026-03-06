import { Button as __Button } from './Button';
import { ButtonGroup } from './ButtonGroup/ButtonGroup';
import { ButtonSplit } from './ButtonSplit/ButtonSplit';

const Button = Object.assign(
  __Button as typeof __Button & {
    Group: typeof ButtonGroup;
    Split: typeof ButtonSplit;
  },
  { Group: ButtonGroup, Split: ButtonSplit },
);

export * from './Banner';
export * from './Button';
export * from './ButtonSplit';
export * from './Action/Action';
export * from './ItemAction';
export * from './ItemActionContext';
export * from './ItemButton';
export * from './Menu';
export * from './CommandMenu';
export * from './use-action';
export * from './use-anchored-menu';
export * from './use-context-menu';
export { Button, ButtonGroup, ButtonSplit };
