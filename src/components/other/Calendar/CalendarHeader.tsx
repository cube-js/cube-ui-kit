import { tasty } from '@tenphi/tasty';
import { ReactNode } from 'react';

import { LeftIcon, RightIcon } from '../../../icons';
import { Button } from '../../actions';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { CalendarHeaderElement } from './styled';

import type { Props } from '../../../props';

/**
 * A heading that holds the view switcher. Its own preset matches the type scale
 * of an `xsmall` button so the plain-title fallback (a decade range, or a
 * calendar with navigation turned off) doesn't outweigh the interactive one.
 */
const CalendarTitleElement = tasty(Title, {
  level: 6,
  preset: 't4',
  styles: {
    display: 'flex',
    placeItems: 'center',
    gap: '.25x',
    // Line the plain title up with the label inside a button.
    padding: {
      '': '0 (1x - 1bw)',
      interactive: 0,
    },
  },
});

const CalendarTitleButton = tasty(Button, {
  'data-popover-keep': true,
  type: 'clear',
  size: 'xsmall',
});

export interface CubeCalendarHeaderSegment {
  key: string;
  label: string;
  onPress: () => void;
  isDisabled?: boolean;
}

export interface CubeCalendarHeaderProps {
  /**
   * Interactive title segments (month / year). When omitted the header falls
   * back to a plain `title` — e.g. for a multi-month range.
   */
  segments?: CubeCalendarHeaderSegment[];
  title?: ReactNode;
  prevButtonProps?: Props;
  nextButtonProps?: Props;
}

export function CalendarHeader(props: CubeCalendarHeaderProps) {
  let { segments, title, prevButtonProps, nextButtonProps } = props;

  return (
    <CalendarHeaderElement>
      <CalendarTitleElement mods={{ interactive: !!segments?.length }}>
        {segments?.length
          ? segments.map(({ key, label, onPress, isDisabled }) => (
              <CalendarTitleButton
                key={key}
                isDisabled={isDisabled}
                onPress={onPress}
              >
                {label}
              </CalendarTitleButton>
            ))
          : title}
      </CalendarTitleElement>
      <Space gap=".5x">
        <Button
          data-popover-keep
          size="xsmall"
          {...prevButtonProps}
          icon={<LeftIcon />}
        />
        <Button
          data-popover-keep
          size="xsmall"
          {...nextButtonProps}
          icon={<RightIcon />}
        />
      </Space>
    </CalendarHeaderElement>
  );
}
