import { useState } from 'react';

import { CheckIcon } from '../../../icons/CheckIcon';
import { CloseIcon } from '../../../icons/CloseIcon';
import { DownIcon } from '../../../icons/DownIcon';
import { PauseIcon } from '../../../icons/PauseIcon';
import { PlayIcon } from '../../../icons/PlayIcon';
import { UpIcon } from '../../../icons/UpIcon';
import { tasty } from '../../../tasty';
import { Button } from '../../actions/Button';

import { IconSwitch } from './IconSwitch';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Helpers/IconSwitch',
  component: IconSwitch,
  argTypes: {
    contentKey: {
      control: 'text',
      description: 'Override key for detecting icon changes',
    },
  },
} satisfies Meta<typeof IconSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

const Container = tasty({
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '2x',
    placeItems: 'center',
  },
});

const IconContainer = tasty({
  styles: {
    display: 'flex',
    placeItems: 'center',
    gap: '2x',
  },
});

const IconBox = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
    width: '6x',
    height: '6x',
    fill: '#dark.04',
    radius: true,
    preset: 't2',
  },
});

export const Default: Story = {
  render: () => {
    const [isExpanded, setIsExpanded] = useState(false);

    return (
      <Container>
        <Button type="primary" onPress={() => setIsExpanded(!isExpanded)}>
          Toggle Icon
        </Button>

        <IconContainer>
          <span>Current state: {isExpanded ? 'Expanded' : 'Collapsed'}</span>
          <IconBox>
            <IconSwitch contentKey={isExpanded ? 'up' : 'down'}>
              {isExpanded ? <UpIcon /> : <DownIcon />}
            </IconSwitch>
          </IconBox>
        </IconContainer>
      </Container>
    );
  },
};

export const PlayPause: Story = {
  render: () => {
    const [isPlaying, setIsPlaying] = useState(false);

    return (
      <Container>
        <Button type="primary" onPress={() => setIsPlaying(!isPlaying)}>
          {isPlaying ? 'Pause' : 'Play'}
        </Button>

        <IconContainer>
          <span>Status: {isPlaying ? 'Playing' : 'Paused'}</span>
          <IconBox>
            <IconSwitch contentKey={isPlaying ? 'pause' : 'play'}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </IconSwitch>
          </IconBox>
        </IconContainer>
      </Container>
    );
  },
};

export const MultipleStates: Story = {
  render: () => {
    const [state, setState] = useState<'idle' | 'success' | 'error'>('idle');

    const icons = {
      idle: <DownIcon />,
      success: <CheckIcon />,
      error: <CloseIcon />,
    };

    return (
      <Container>
        <IconContainer>
          <Button
            type={state === 'idle' ? 'primary' : 'secondary'}
            onPress={() => setState('idle')}
          >
            Idle
          </Button>
          <Button
            type={state === 'success' ? 'primary' : 'secondary'}
            onPress={() => setState('success')}
          >
            Success
          </Button>
          <Button
            type={state === 'error' ? 'primary' : 'secondary'}
            onPress={() => setState('error')}
          >
            Error
          </Button>
        </IconContainer>

        <IconContainer>
          <span>Current state: {state}</span>
          <IconBox>
            <IconSwitch contentKey={state}>{icons[state]}</IconSwitch>
          </IconBox>
        </IconContainer>
      </Container>
    );
  },
};

export const RapidToggle: Story = {
  render: () => {
    const [count, setCount] = useState(0);
    const icons = [<DownIcon />, <UpIcon />, <PlayIcon />, <PauseIcon />];

    return (
      <Container>
        <Button type="primary" onPress={() => setCount((c) => c + 1)}>
          Next Icon (click rapidly!)
        </Button>

        <IconContainer>
          <span>Count: {count}</span>
          <IconBox>
            <IconSwitch contentKey={count}>{icons[count % 4]}</IconSwitch>
          </IconBox>
        </IconContainer>
      </Container>
    );
  },
};

export const Nullish: Story = {
  render: () => {
    const [shown, setShown] = useState(true);

    return (
      <Container>
        <Button type="primary" onPress={() => setShown((v) => !v)}>
          Toggle icon (nullish ↔ icon)
        </Button>

        <IconContainer>
          <span>Icon is {shown ? 'shown' : 'hidden'}</span>
          <IconBox>
            {/* Intentionally constant key: IconSwitch should still animate icon ↔ nullish */}
            <IconSwitch contentKey="constant">
              {shown ? <PlayIcon /> : null}
            </IconSwitch>
          </IconBox>
        </IconContainer>
      </Container>
    );
  },
};

// Mimics Button's exact usage pattern with noWrapper and changing contentKey
const IconSlotContainer = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center',
    width: '6x',
    height: '6x',
    fill: '#dark.04',
    radius: true,
  },
});

export const NoWrapperWithKeyChange: Story = {
  render: () => {
    const [isLoading, setIsLoading] = useState(false);

    // Mimics Button's iconKey derivation
    const iconKey = isLoading ? 'loading' : 'empty';
    const icon = undefined; // No icon prop, like in Button story

    return (
      <Container>
        <Button type="primary" onPress={() => setIsLoading((v) => !v)}>
          {isLoading ? 'Stop Loading' : 'Start Loading'}
        </Button>

        <IconContainer>
          <span>
            isLoading: {String(isLoading)}, iconKey: {iconKey}
          </span>
          <IconSlotContainer>
            {/* Exact same usage as Button: noWrapper + contentKey changes */}
            <IconSwitch noWrapper contentKey={iconKey}>
              {isLoading ? <PlayIcon /> : icon}
            </IconSwitch>
          </IconSlotContainer>
        </IconContainer>
      </Container>
    );
  },
};
