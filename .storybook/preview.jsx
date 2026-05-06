import { DocsContainer } from '@storybook/addon-docs/blocks';
import isChromatic from 'chromatic/isChromatic';
import { useEffect, useState } from 'react';
import { DARK_MODE_EVENT_NAME } from 'storybook-dark-mode';
import { addons } from 'storybook/preview-api';
import { configure } from 'storybook/test';
import { create, themes } from 'storybook/theming';

import { Root } from '../src/components/Root';
import { setToolbarScheme } from '../src/stories/decorators/colorSchemeBridge';

// Brand both Storybook themes (manager chrome, sidebar selection, toolbar
// active tab, etc.) with the design system's primary purple — the same color
// the `#primary` token resolves to in `src/tokens/palette.ts`.
//
// `colorSecondary` drives the selected-story highlight in the sidebar and the
// "15" count badge on docs panel tabs. `bar*Color` overrides are required
// because both `themes.light` and `themes.dark` hardcode their own blue
// values (`#0063D6` / `#479DFF`) which would otherwise win over the
// `colorSecondary` fallback the `create()` builder applies.
const PRIMARY = 'rgb(98, 96, 206)';

const brandedThemeVars = {
  colorPrimary: PRIMARY,
  colorSecondary: PRIMARY,
  barSelectedColor: PRIMARY,
  barHoverColor: PRIMARY,
};

const lightTheme = create({
  ...themes.light,
  base: 'light',
  ...brandedThemeVars,
});

const darkTheme = create({
  ...themes.dark,
  base: 'dark',
  ...brandedThemeVars,
});

configure({ testIdAttribute: 'data-qa', asyncUtilTimeout: 10000 });

// Bridge the `storybook-dark-mode` toolbar to `<html data-schema>` (the
// attribute the Glaze `@dark` predefined state resolves against). Subscribed
// at module scope so the listener is in place before the addon emits its
// initial event after manager/preview channels connect.
if (typeof document !== 'undefined') {
  addons.getChannel().on(DARK_MODE_EVENT_NAME, (isDark) => {
    setToolbarScheme(isDark ? 'dark' : 'light');
  });
}

// `storybook-dark-mode` themes only the toolbar/manager — the docs page chrome
// (background, prose, code blocks, etc.) is rendered by `DocsContainer` and
// keeps its own `theme` prop. This wrapper subscribes to the same channel
// event the addon emits and re-renders the container with the matching
// Storybook theme so docs pages flip alongside stories.
const ThemedDocsContainer = ({ children, ...props }) => {
  const [isDark, setIsDark] = useState(
    () =>
      typeof document !== 'undefined' &&
      document.documentElement.getAttribute('data-schema') === 'dark',
  );

  useEffect(() => {
    const channel = addons.getChannel();
    const handler = (next) => setIsDark(Boolean(next));

    channel.on(DARK_MODE_EVENT_NAME, handler);

    return () => {
      channel.off(DARK_MODE_EVENT_NAME, handler);
    };
  }, []);

  return (
    <DocsContainer {...props} theme={isDark ? darkTheme : lightTheme}>
      {children}
    </DocsContainer>
  );
};

// Load tasty debug utilities in local Storybook only (exclude Chromatic)
if (!isChromatic() && import.meta.env.DEV) {
  import('@tenphi/tasty').then(({ tastyDebug }) => {
    try {
      tastyDebug.install();
    } catch (e) {
      console.warn('tastyDebug installation failed:', e);
    }
  });
}

export const parameters = {
  options: {
    storySort: {
      order: [
        'Getting Started',
        [
          'Overview',
          'Usage',
          'Create Component',
          'Utilities',
          'Base Properties',
          'Field Properties',
          'Complex Layout',
          'Advanced States',
        ],
        'Actions',
        'Content',
        'Forms',
        'Helpers',
        'Layout',
        'Navigation',
        'Overlays',
        'Status',
        'Components',
        'Other',
        '*',
      ],
    },
  },
  docs: {
    container: ThemedDocsContainer,
  },
  // `storybook-dark-mode` configuration. No `current` so the addon resolves
  // OS `prefers-color-scheme` on first load. `stylePreview: false` keeps the
  // addon from also injecting dark/light classes on the preview body — the
  // `data-schema` attribute set by `colorSchemeBridge` is the only signal
  // we care about (see `src/components/Root.tsx` and `src/tokens/palette.ts`).
  darkMode: {
    dark: darkTheme,
    light: lightTheme,
    stylePreview: false,
  },
  // Storybook's `addon-backgrounds` injects `.sb-show-main { background: … !important }`
  // when an option is selected, which overrides the body's `#surface` fill from
  // `src/components/GlobalStyles.tsx`. Disable it globally so the body's
  // scheme-aware Glaze background shows through (dark/light). Stories can still
  // override via `parameters.backgrounds = { disable: false, … }`.
  // NOTE: the addon's parameter is `disable` (not `disabled`) — the latter is
  // silently ignored, leaving the addon active and its toolbar still able to
  // inject a !important background. See:
  //   https://github.com/storybookjs/storybook/blob/v10.3.4/docs/_snippets/addon-backgrounds-disabled.md
  backgrounds: {
    disable: true,
  },
  actions: {
    // Disable only while the test runner is active
    disable: isChromatic() || process.env.NODE_ENV === 'test',
  },
};

export const decorators = [
  (Story) => (
    <Root fontDisplay="auto">
      <Story />
    </Root>
  ),
];
export const tags = ['autodocs'];
