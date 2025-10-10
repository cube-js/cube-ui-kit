import { useState } from 'react';
import { CSSProperties } from 'styled-components';

import { tasty } from '../../../tasty';
import { Button } from '../../actions/Button';
import { Card } from '../../content/Card/Card';

import { DisplayTransition } from './DisplayTransition';

import type { Meta, StoryObj } from '@storybook/react-vite';

const meta = {
  title: 'Helpers/DisplayTransition',
  component: DisplayTransition,
  argTypes: {
    duration: {
      control: { type: 'number', min: 0, max: 1000, step: 50 },
      description: 'Transition duration in milliseconds',
    },
    animateOnMount: {
      control: 'boolean',
      description: 'Whether to animate on first mount',
    },
    respectReducedMotion: {
      control: 'boolean',
      description: 'Respect prefers-reduced-motion setting',
    },
  },
} satisfies Meta<typeof DisplayTransition>;

export default meta;
type Story = StoryObj<typeof meta>;

const AnimatedCard = tasty(Card, {
  styles: {
    $transition: '150ms',
    transition: 'opacity $transition, transform $transition',
    opacity: {
      '': '0',
      entered: '1',
    },
    transform: {
      '': 'translateY(-8px)',
      entered: 'translateY(0)',
      exit: 'translateY(8px)',
    },
  },
});

const Container = tasty({
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '2x',
    placeItems: 'center',
  },
});

export const Default: Story = {
  render: (args) => {
    const [isShown, setIsShown] = useState(false);

    return (
      <Container>
        <Button type="primary" onPress={() => setIsShown(!isShown)}>
          {isShown ? 'Hide Card' : 'Show Card'}
        </Button>

        <DisplayTransition
          isShown={isShown}
          duration={args.duration}
          animateOnMount={args.animateOnMount}
          respectReducedMotion={args.respectReducedMotion}
        >
          {({ phase, isShown: isShownNow, ref: transitionRef }) => (
            <AnimatedCard
              ref={transitionRef}
              mods={{
                entered: phase === 'entered',
                enter: phase === 'enter',
                exit: phase === 'exit',
              }}
              width="300px"
            >
              <strong>Animated Card</strong>
              <br />
              Phase: {phase}
              <br />
              Is Shown: {isShownNow ? 'Yes' : 'No'}
            </AnimatedCard>
          )}
        </DisplayTransition>
      </Container>
    );
  },
  args: {
    duration: 150,
    animateOnMount: true,
    respectReducedMotion: true,
  },
};

export const SlowTransition: Story = {
  render: (args) => {
    const [isShown, setIsShown] = useState(false);

    return (
      <Container>
        <Button type="primary" onPress={() => setIsShown(!isShown)}>
          {isShown ? 'Hide Card' : 'Show Card'}
        </Button>

        <DisplayTransition
          isShown={isShown}
          duration={args.duration}
          animateOnMount={args.animateOnMount}
          respectReducedMotion={args.respectReducedMotion}
        >
          {({ phase, isShown: isShownNow, ref: transitionRef }) => (
            <AnimatedCard
              ref={transitionRef}
              mods={{
                entered: phase === 'entered',
                enter: phase === 'enter',
                exit: phase === 'exit',
              }}
              width="300px"
              style={{ '--transition': '.5s' } as CSSProperties}
            >
              <strong>Animated Card (Slow)</strong>
              <br />
              Phase: {phase}
              <br />
              Is Shown: {isShownNow ? 'Yes' : 'No'}
            </AnimatedCard>
          )}
        </DisplayTransition>
      </Container>
    );
  },
  args: {
    duration: 500,
    animateOnMount: true,
    respectReducedMotion: true,
  },
};

export const NoAnimation: Story = {
  ...Default,
  args: {
    duration: 0,
    animateOnMount: true,
    respectReducedMotion: true,
  },
};

export const NoMountAnimation: Story = {
  render: (args) => {
    const [isShown, setIsShown] = useState(true);

    return (
      <Container>
        <Button type="primary" onPress={() => setIsShown(!isShown)}>
          {isShown ? 'Hide Card' : 'Show Card'}
        </Button>

        <DisplayTransition
          isShown={isShown}
          duration={args.duration}
          animateOnMount={false}
          respectReducedMotion={args.respectReducedMotion}
        >
          {({ phase, isShown: isShownNow, ref: transitionRef }) => (
            <AnimatedCard
              ref={transitionRef}
              mods={{
                entered: phase === 'entered',
                enter: phase === 'enter',
                exit: phase === 'exit',
              }}
              width="300px"
            >
              <strong>Card (no mount animation)</strong>
              <br />
              Phase: {phase}
              <br />
              Is Shown: {isShownNow ? 'Yes' : 'No'}
            </AnimatedCard>
          )}
        </DisplayTransition>
      </Container>
    );
  },
  args: {
    duration: 150,
    animateOnMount: false,
    respectReducedMotion: true,
  },
};

export const NativeEventDetection: Story = {
  render: (args) => {
    const [isShown, setIsShown] = useState(false);

    return (
      <Container>
        <Button type="primary" onPress={() => setIsShown(!isShown)}>
          {isShown ? 'Hide Card' : 'Show Card'}
        </Button>

        <DisplayTransition
          isShown={isShown}
          animateOnMount={args.animateOnMount}
          respectReducedMotion={args.respectReducedMotion}
        >
          {({ phase, isShown: isShownNow, ref: transitionRef }) => (
            <AnimatedCard
              ref={transitionRef}
              mods={{
                entered: phase === 'entered',
                enter: phase === 'enter',
                exit: phase === 'exit',
              }}
              width="300px"
            >
              <strong>Native Event Detection</strong>
              <br />
              Phase: {phase}
              <br />
              Is Shown: {isShownNow ? 'Yes' : 'No'}
              <br />
              <em>Duration auto-detected from CSS</em>
            </AnimatedCard>
          )}
        </DisplayTransition>
      </Container>
    );
  },
  args: {
    animateOnMount: true,
    respectReducedMotion: true,
  },
};
