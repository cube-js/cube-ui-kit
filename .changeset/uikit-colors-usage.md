---
"@cube-dev/ui-kit": patch
---

`npx -y @tenphi/harnesspm help uikit:colors` now shows the arguments and options of UI Kit's color lookup tool: `[<part of a token name>...] [--on <surface>] [--format hex|okhsl|okhst|rgb|hsl|oklch] [--json]`. This needs harnesspm 0.8.0 or later; older versions ignore it.
