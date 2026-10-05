# Item / Button theme styles — knowledge

## Authored state priority

Tasty 3.9.6 preserves authored priority when state-map values repeat: the last matching key wins, with the default (`''`) first. Use the intended visual values directly; do not perturb alpha values to make strings unique or restructure states to accommodate the old equal-value merge bug.

For non-solid brand and special themes, `selected & disabled` keeps exactly the resting selected fill and fades only the label. The `current` theme has a separate inherited-color contract: its disabled alphas compensate for the label's faded `currentcolor`, so preserve that tuning.

`item-themes.test.ts` checks these contracts, and `item-themes.browser.test.tsx` checks intersecting states through the installed Tasty engine across light, dark and high-contrast schemes. For one-off styling questions, use the configured `pnpm probe` or `pnpm probe:browser` described in the repo rules.
