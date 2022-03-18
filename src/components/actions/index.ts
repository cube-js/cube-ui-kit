import { Button as __Button } from './Button';
import { ButtonGroup } from './ButtonGroup/ButtonGroup';

const Button = Object.assign(
  __Button as typeof __Button & { Group: typeof ButtonGroup },
  { Group: ButtonGroup },
);

export * from './Button';
export * from './Action';
export { Button };
