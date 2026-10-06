import { HotKeys, Trans } from '@cube-dev/ui-kit';

/**
 * `<Trans>` fills a component slot by cloning it with the translated text as
 * children, so the slot element itself is written without children (CUB-5359).
 */
export function TransHotKeys() {
  return (
    <>
      <Trans
        i18nKey="search.hint"
        defaults="Press <hotkeys>mod+k</hotkeys> to search"
        components={{ hotkeys: <HotKeys type="inherit" /> }}
      />
      <HotKeys>mod+k, ctrl+k</HotKeys>
      <HotKeys>{['mod+', 'k']}</HotKeys>
      {/* @ts-expect-error keys are text, not elements */}
      <HotKeys>
        <span>mod+k</span>
      </HotKeys>
    </>
  );
}
