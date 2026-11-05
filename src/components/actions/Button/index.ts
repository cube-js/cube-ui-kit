import { ButtonGroup } from '../ButtonGroup/ButtonGroup';
import { ButtonSplit } from '../ButtonSplit/ButtonSplit';

import { Button as __Button } from './Button';

// The compound lives in the entry, not in `Button.tsx`: `ButtonSplit` renders
// the base `Button`, so assembling it there would be an import cycle.
const Button = Object.assign(
  __Button as typeof __Button & {
    Group: typeof ButtonGroup;
    Split: typeof ButtonSplit;
  },
  { Group: ButtonGroup, Split: ButtonSplit },
);

export * from './Button';
export { Button, ButtonGroup };
