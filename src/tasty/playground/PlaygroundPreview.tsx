import { Styles } from '../styles/types';
import { tasty } from '../tasty';

import { Button } from './components/Button';
import { Card } from './components/Card';

const PreviewContainer = tasty({
  qa: 'PlaygroundPreview',
  styles: {
    display: 'flex',
    flow: 'column',
    height: '100%',
    overflow: 'hidden',
  },
});

const PreviewHeader = tasty({
  styles: {
    display: 'flex',
    placeItems: 'center',
    padding: '1x 2x',
    fill: '#dark.03',
    borderBottom: true,
    preset: 't3',
    fontWeight: 600,
  },
});

const PreviewContent = tasty({
  styles: {
    display: 'flex',
    flex: 1,
    placeContent: 'center',
    placeItems: 'center',
    overflow: 'auto',
    padding: '4x',
    fill: '#light',
    // Checkered pattern to show transparency
    backgroundImage:
      'linear-gradient(45deg, #dark.05 25%, transparent 25%), linear-gradient(-45deg, #dark.05 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #dark.05 75%), linear-gradient(-45deg, transparent 75%, #dark.05 75%)',
    backgroundSize: '20px 20px',
    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
  },
});

const StateRow = tasty({
  styles: {
    display: 'flex',
    gap: '2x',
    placeItems: 'center',
  },
});

const StateLabel = tasty({
  styles: {
    display: 'inline-flex',
    width: '80px',
    preset: 't4',
    color: '#dark-03',
  },
});

const ButtonColumn = tasty({
  styles: {
    display: 'flex',
    flow: 'column',
    gap: '12px',
    padding: '3x',
    radius: '1r',
  },
  styleProps: ['fill'],
});

export interface PlaygroundPreviewProps {
  component: 'card' | 'button';
  styles: Styles;
}

// Button state configurations for forced preview
const BUTTON_STATES = [
  {
    label: 'Default',
    mods: { hovered: false, focused: false, pressed: false, disabled: false },
  },
  {
    label: 'Hovered',
    mods: { hovered: true, focused: false, pressed: false, disabled: false },
  },
  {
    label: 'Focused',
    mods: { hovered: false, focused: true, pressed: false, disabled: false },
  },
  {
    label: 'Pressed',
    mods: { hovered: false, focused: false, pressed: true, disabled: false },
  },
  {
    label: 'Disabled',
    mods: { hovered: false, focused: false, pressed: false, disabled: true },
    isDisabled: true,
  },
  {
    label: 'Hover+Focus',
    mods: { hovered: true, focused: true, pressed: false, disabled: false },
  },
] as const;

export function PlaygroundPreview({
  component,
  styles,
}: PlaygroundPreviewProps) {
  return (
    <PreviewContainer>
      <PreviewHeader>Preview: {component}</PreviewHeader>
      <PreviewContent>
        {component === 'card' ? (
          <Card styles={styles} />
        ) : (
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Labels column */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '24px 0',
              }}
            >
              {BUTTON_STATES.map((state) => (
                <StateLabel key={state.label} style={{ height: '32px' }}>
                  {state.label}
                </StateLabel>
              ))}
            </div>

            {/* Checkered background column */}
            <ButtonColumn>
              {BUTTON_STATES.map((state) => (
                <Button
                  key={state.label}
                  styles={styles}
                  isDisabled={'isDisabled' in state ? state.isDisabled : false}
                  mods={state.mods}
                >
                  Button
                </Button>
              ))}
            </ButtonColumn>

            {/* White background column */}
            <ButtonColumn fill="#white">
              {BUTTON_STATES.map((state) => (
                <Button
                  key={state.label}
                  styles={styles}
                  isDisabled={'isDisabled' in state ? state.isDisabled : false}
                  mods={state.mods}
                >
                  Button
                </Button>
              ))}
            </ButtonColumn>
          </div>
        )}
      </PreviewContent>
    </PreviewContainer>
  );
}
