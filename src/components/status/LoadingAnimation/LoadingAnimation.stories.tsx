import { Meta, StoryFn } from '@storybook/react-vite';
import { useEffect, useRef, useState } from 'react';

import { NO_SNAPSHOT } from '../../../stories/chromatic';
import {
  withDarkScheme,
  withHighContrast,
} from '../../../stories/decorators/withColorScheme';
import { baseProps } from '../../../stories/lists/baseProps';
import { Button } from '../../actions/Button/Button';
import { Text } from '../../content/Text';
import { Flex } from '../../layout/Flex';
import { Space } from '../../layout/Space';

import {
  CubeLoadingAnimationProps,
  LoadingAnimation,
} from './LoadingAnimation';

export default {
  title: 'Status/LoadingAnimation',
  component: LoadingAnimation,
  parameters: { controls: { exclude: baseProps } },
} as Meta<CubeLoadingAnimationProps>;

const Template: StoryFn<CubeLoadingAnimationProps> = (args) => (
  <LoadingAnimation {...args} />
);

export const Default = Template.bind({});
Default.args = {};
export const Small = Template.bind({});
Small.args = {
  size: 'small',
};
export const Large = Template.bind({});
Large.args = {
  size: 'large',
};

export const DarkScheme = Template.bind({});
DarkScheme.args = {};
DarkScheme.decorators = [withDarkScheme];

export const HighContrast = Template.bind({});
HighContrast.args = {};
HighContrast.decorators = [withHighContrast];

const INSTANCE_COUNT = 4;
const STAGGER_MS = 700;
/** The period of the `dice*` keyframes the cubes run on. */
const CYCLE_MS = 2000;

/** How far into the 2s loop a loader currently is, in ms. */
function readPhase(loader: Element) {
  const [animation] = loader.getAnimations?.({ subtree: true }) ?? [];

  return animation
    ? Math.round(Number(animation.currentTime) % CYCLE_MS)
    : null;
}

/**
 * Four loaders appearing one after another — the situation the timeline sync
 * exists for. A loading page brings its levels up at different moments, and
 * each wrapper that appears above a running loader remounts it; without the
 * sync every one of those events restarted the cubes from the first frame.
 *
 * What to look for: a loader that appears later is already mid-cycle, in step
 * with the ones running next to it, and **Remount all** does not make the
 * cubes jump. The phase readout is the same measurement in numbers — all four
 * loaders report the same offset into the loop, so the spread stays at 0ms.
 */
export const StaggeredInstances: StoryFn<CubeLoadingAnimationProps> = (
  args,
) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [staggerRun, setStaggerRun] = useState(0);
  const [mountKey, setMountKey] = useState(0);
  const [visibleCount, setVisibleCount] = useState(1);
  const [phases, setPhases] = useState<(number | null)[]>([]);

  useEffect(() => {
    setVisibleCount(1);

    const timers = Array.from({ length: INSTANCE_COUNT - 1 }, (_, index) =>
      setTimeout(() => setVisibleCount(index + 2), (index + 1) * STAGGER_MS),
    );

    return () => timers.forEach(clearTimeout);
  }, [staggerRun]);

  useEffect(() => {
    // Every loader is read inside one callback, so the numbers are directly
    // comparable: they resolve against the same reading of the timeline.
    const read = () =>
      setPhases(
        Array.from(
          containerRef.current?.querySelectorAll('[role="img"]') ?? [],
          readPhase,
        ),
      );

    read();

    const interval = setInterval(read, 200);

    return () => clearInterval(interval);
  }, [visibleCount, mountKey]);

  const measured = phases.filter((phase): phase is number => phase != null);
  const spread = measured.length
    ? Math.max(...measured) - Math.min(...measured)
    : 0;

  return (
    <Space flow="column" gap="3x" placeItems="start">
      <Space>
        <Button size="small" onPress={() => setStaggerRun((run) => run + 1)}>
          Replay stagger
        </Button>
        <Button size="small" onPress={() => setMountKey((key) => key + 1)}>
          Remount all
        </Button>
      </Space>

      <Flex ref={containerRef} gap="4x" placeItems="start">
        {Array.from({ length: visibleCount }, (_, index) => (
          <Space key={`${mountKey}-${index}`} flow="column">
            <LoadingAnimation {...args} />
            <Text preset="c2" color="#dark-03">
              +{index * STAGGER_MS}ms
            </Text>
          </Space>
        ))}
      </Flex>

      <Text monospace preset="c1">
        phase: {phases.map((phase) => phase ?? '—').join(' / ')} — spread:{' '}
        {spread}ms
      </Text>
    </Space>
  );
};

StaggeredInstances.args = { size: 'small' };
// The point of the story is temporal (and the loaders are the same cube
// `Default` already photographs), so a still frame of it buys no coverage —
// only a diff whenever the stagger lands differently.
StaggeredInstances.parameters = NO_SNAPSHOT;
