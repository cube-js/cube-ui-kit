import { Styles, tasty } from '@tenphi/tasty';
import { ReactNode, useMemo } from 'react';

import { useEvent } from '../../../_internal';
import { Radio } from '../RadioGroup';
import { Slider } from '../Slider';

import {
  CHANNELS,
  COLOR_SPACE_HINTS,
  COLOR_SPACE_LABELS,
  COLOR_SPACES,
  ColorChannel,
  ColorSpace,
} from './channels';
import {
  ColorFormat,
  ColorValue,
  formatColor,
  getContrastingColor,
  toHex,
} from './color';

const PanelElement = tasty({
  qa: 'ColorPanel',
  styles: {
    display: 'grid',
    flow: 'row',
    gap: '1x',
    padding: '1x',
    width: '34x',
  },
});

const PreviewElement = tasty({
  qa: 'ColorPreview',
  styles: {
    display: 'grid',
    placeItems: 'center',
    height: '6x',
    radius: true,
    preset: 's4',
    fill: '(#color-picker, #clear)',
    color: '(#color-picker-contrast, #dark)',
    shadow: 'inset 0 0 0 1bw #dark.1',
  },
});

const ChannelsElement = tasty({
  styles: {
    display: 'grid',
    gridColumns: 'max-content 1sf max-content',
    placeItems: 'center stretch',
    gap: '1x',
  },
});

const ChannelLabelElement = tasty({
  styles: {
    preset: 'c2',
    color: '#dark-03',
    textAlign: 'center',
    width: '2x',
  },
});

const ChannelTrackElement = tasty({
  styles: {
    display: 'grid',
    placeItems: 'center stretch',
  },
});

const ChannelValueElement = tasty({
  styles: {
    preset: 's4',
    color: '#dark-02',
    textAlign: 'right',
    whiteSpace: 'nowrap',
    width: '5.5x',
  },
});

/**
 * The gradient reaches the track through a plain custom property so the track
 * keeps a single cached style rule. A color picker moves its channels
 * continuously, and a fresh `styles` object per frame would emit a fresh CSS
 * rule per frame.
 */
const TRACK_STYLES: Styles = {
  height: '1x',
  top: '.5x',
  radius: '1r',
  fill: '#clear',
  image: '$channel-gradient',
  shadow: 'inset 0 0 0 1bw #dark.1',
  Fill: false,
};

/** A ring keeps the thumb visible wherever it sits on its own gradient. */
const THUMB_STYLES: Styles = {
  shadow: '0 0 0 2bw #surface, 0 0 0 3bw #dark.2',
};

const THUMB_TOKENS = { '#slider-thumb': '(#color-picker, #surface)' };

const SPACE_STYLES: Styles = { width: '100%' };
const TAB_STYLES: Styles = { flexGrow: 1 };

export interface ColorPanelProps {
  color: ColorValue;
  space: ColorSpace;
  isDisabled?: boolean;
  /** Notation used for the preview caption. */
  previewFormat: ColorFormat;
  /** Optional palette rendered under the channels. */
  swatches?: ReactNode;
  onChange: (color: ColorValue) => void;
  onSpaceChange: (space: ColorSpace) => void;
}

interface ChannelRowProps {
  channel: ColorChannel;
  color: ColorValue;
  isDisabled?: boolean;
  onChange: (color: ColorValue) => void;
}

function ChannelRow({ channel, color, isDisabled, onChange }: ChannelRowProps) {
  const max = channel.max(color);

  const handleChange = useEvent((value: number) => {
    onChange(channel.apply(color, value));
  });

  return (
    <>
      <ChannelLabelElement aria-hidden="true">
        {channel.label}
      </ChannelLabelElement>
      <ChannelTrackElement
        style={{
          '--channel-gradient': `linear-gradient(to right, ${channel.stops(
            color,
          )})`,
        }}
      >
        <Slider
          aria-label={channel.title}
          value={Math.min(channel.value(color), max)}
          minValue={channel.min}
          maxValue={max}
          step={channel.step}
          isDisabled={isDisabled}
          trackStyles={TRACK_STYLES}
          thumbStyles={THUMB_STYLES}
          thumbTokens={THUMB_TOKENS}
          onChange={handleChange}
        />
      </ChannelTrackElement>
      <ChannelValueElement>{channel.display(color)}</ChannelValueElement>
    </>
  );
}

/**
 * The popover body shared by `ColorInput` and `ColorPicker`: a preview, a
 * switch between the three color concepts, and one gradient slider per channel
 * of the active one.
 */
export function ColorPanel(props: ColorPanelProps) {
  const {
    color,
    space,
    isDisabled,
    previewFormat,
    swatches,
    onChange,
    onSpaceChange,
  } = props;

  const colorTokens = useMemo(
    () => ({
      '--color-picker-color': toHex(color),
      '--color-picker-contrast-color': getContrastingColor(color),
    }),
    [color],
  );

  const handleSpaceChange = useEvent((value: string) => {
    onSpaceChange(value as ColorSpace);
  });

  return (
    <PanelElement style={colorTokens}>
      <PreviewElement>{formatColor(color, previewFormat)}</PreviewElement>
      <Radio.Tabs
        aria-label="Color space"
        value={space}
        isDisabled={isDisabled}
        styles={SPACE_STYLES}
        onChange={handleSpaceChange}
      >
        {COLOR_SPACES.map((item) => (
          <Radio
            key={item}
            value={item}
            aria-label={COLOR_SPACE_LABELS[item]}
            tooltip={COLOR_SPACE_HINTS[item]}
            styles={TAB_STYLES}
          >
            {COLOR_SPACE_LABELS[item]}
          </Radio>
        ))}
      </Radio.Tabs>
      <ChannelsElement>
        {CHANNELS[space].map((channel) => (
          <ChannelRow
            key={`${space}-${channel.label}`}
            channel={channel}
            color={color}
            isDisabled={isDisabled}
            onChange={onChange}
          />
        ))}
      </ChannelsElement>
      {swatches}
    </PanelElement>
  );
}
