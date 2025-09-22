import { Button as __Button } from './Button';
import { ButtonGroup } from './ButtonGroup/ButtonGroup';

const Button = Object.assign(
  __Button as typeof __Button & {
    Group: typeof ButtonGroup;
  },
  { Group: ButtonGroup },
);

export * from './Button';
export * from './Action/Action';
export * from './ItemAction';
export * from './ItemButton';
export * from './Menu';
export * from './CommandMenu';
export * from './use-action';
export * from './use-anchored-menu';
export * from './use-context-menu';
export { Button, ButtonGroup };
