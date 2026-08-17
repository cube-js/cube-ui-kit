---
'@cube-dev/ui-kit': patch
---

Fix `RadioGroup`'s documented `size` default, which was wrong in a way the lint rule acted on.

`RadioGroup.docs.mdx` contradicted both itself and the implementation: the `## Properties` bullet said `(default: xsmall)` while its own prose said `medium`, and `Radio.tsx` resolves `size ?? contextSize ?? 'medium'`. The default is `medium`.

That annotation is what seeds the `no-redundant-default-prop` registry, so the shipped rule claimed `<RadioGroup size="xsmall">` was redundant and offered to delete it — which silently resized the radios to `medium`. The prover could not catch the drift because `size` only reaches the DOM through the radios and a plain `type="radio"` radio renders identically at every size, so any documented value verified. The fixture now probes under `type="button"` and `type="tabs"` as well, which is what makes a wrong `size` value fail: restoring `xsmall` under the new conditions correctly downgrades the prop to `skip: 'conditional'` instead of passing as a verified default.

Also corrects the tabs-mode size mapping table. It claimed `xlarge` maps to `large` and listed `xsmall` as passing through, but `Radio.tsx` maps only `large`, funnelling every other size through `RADIO_SIZE_MAP.medium` — so `xsmall`, `small`, `medium` and `xlarge` all collapse to `xsmall`.
