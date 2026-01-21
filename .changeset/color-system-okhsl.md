---
"@cube-dev/ui-kit": minor
---

Refactor color system to use OKHSL format with unified constants

### What's changed:
- Converted all color tokens from RGB to OKHSL format for perceptually uniform color manipulation
- Added color constants (`PURPLE_HUE`, `DANGER_HUE`, `MAIN_SATURATION`, etc.) for consistent color values across themes
- Moved color conversion utilities (`hslToRgb`, `okhslToRgb`) to separate files (`hsl-to-rgb.ts`, `okhsl-to-rgb.ts`)
- Renamed utility files to kebab-case for consistency (`filter-base-props.ts`, `get-display-name.ts`, etc.)
- Removed unused color tokens (`#draft`, `#dark-75`, `#pink-02`, `#pink-8`, `#pink-9`)
- Fixed hardcoded RGB value in `FileTabs` component to use `#border` token

### Why:
OKHSL provides perceptually uniform color space, making it easier to create consistent color variations. Using constants ensures all theme colors maintain consistent saturation and lightness values.

### Technical details:
- All color tokens now use `okhsl()` format
- Color conversion utilities properly handle OKHSL → RGB conversion for CSS variable generation
- Internal file organization improved with consistent naming conventions
