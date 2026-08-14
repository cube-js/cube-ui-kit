import { tasty } from '@tenphi/tasty';
import { ReactNode } from 'react';

import { LeftIcon, RightIcon } from '../../../icons';
import { Button } from '../../actions';
import { Title } from '../../content/Title';
import { Space } from '../../layout/Space';

import { CalendarHeaderElement } from './styled';

import type { Props } from '../../../props';

const CalendarTitleElement = tasty(Title, {
  level: 6,
  preset: 'h6',
  styles: {
    display: 'flex',
    placeItems: 'center',
    gap: '.25x',
    // When the title doubles as the view switcher its buttons carry their own
    // padding — pull them back so the label keeps its original alignment.
    margin: {
      '': 0,
      interactive: '0 -.75x',
    },
  },
});

const CalendarTitleButton = tasty(Button, {
  'data-popover-keep': true,
  type: 'clear',
  size: 'small',
  styles: {
    preset: 'h6',
    padding: '0 .75x',
  },
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
