import { DIRECTIONS, filterMods, parseStyle } from '../utils/styles';

const DIRECTION_MAP: Record<(typeof DIRECTIONS)[number], string> = {
  right: 'to left',
  left: 'to right',
  top: 'to bottom',
  bottom: 'to top',
};

// Default mask colors (standard black with alpha for gradient masks)
const DEFAULT_TRANSPARENT_COLOR = 'rgb(0 0 0 / 0)';
const DEFAULT_OPAQUE_COLOR = 'rgb(0 0 0 / 1)';

interface GroupData {
  values: string[];
  mods: string[];
  colors: string[];
}

/**
 * Process a single group and return gradient strings for its directions.
 */
function processGroup(group: GroupData, isOnlyGroup: boolean): string[] {
  let { values, mods, colors } = group;

  let directions = filterMods(
    mods,
    DIRECTIONS,
  ) as (typeof DIRECTIONS)[number][];

  if (!values.length) {
    values = ['var(--fade-width)'];
  }

  // If this is the only group and no directions specified, apply to all edges
  if (!directions.length) {
    if (isOnlyGroup) {
      directions = ['top', 'right', 'bottom', 'left'];
    } else {
      // For multi-group without explicit direction, skip this group
      return [];
    }
  }

  // Extract colors: first = transparent mask color, second = opaque mask color
  const transparentColor = colors?.[0] || DEFAULT_TRANSPARENT_COLOR;
  const opaqueColor = colors?.[1] || DEFAULT_OPAQUE_COLOR;

  return directions.map(
    (direction: (typeof DIRECTIONS)[number], index: number) => {
      const size = values[index] || values[index % 2] || values[0];

      return `linear-gradient(${DIRECTION_MAP[direction]}, ${transparentColor} 0%, ${opaqueColor} ${size})`;
    },
  );
}

export function fadeStyle({ fade }) {
  if (!fade) return;

  const processed = parseStyle(fade);
  const groups: GroupData[] = processed.groups ?? [];

  if (!groups.length) return;

  const isOnlyGroup = groups.length === 1;

  // Process all groups and collect gradients
  const gradients: string[] = [];

  for (const group of groups) {
    const groupGradients = processGroup(
      {
        values: group.values ?? [],
        mods: group.mods ?? [],
        colors: group.colors ?? [],
      },
      isOnlyGroup,
    );
    gradients.push(...groupGradients);
  }

  if (!gradients.length) return;

  return {
    mask: gradients.join(', '),
    'mask-composite': 'intersect',
  };
}

fadeStyle.__lookupStyles = ['fade'];
