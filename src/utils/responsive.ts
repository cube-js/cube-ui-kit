import { NuResponsiveStyleValue } from './styles';

export function mediaWrapper(cssRules, points) {
  return points
    .filter((point) => point.mediaQuery)
    .map((point, i) => `@media ${point.mediaQuery} {${cssRules[i]}}`)
    .join('\n');
}

export interface ResponsiveZone {
  max?: number;
  min?: number;
  mediaQuery?: string;
}

const zonesCache = {};

export function pointsToZones(points: number[]) {
  const cacheKey = points.join('|');

  if (!zonesCache[cacheKey]) {
    const zones: ResponsiveZone[] = [];

    points.forEach((point, i) => {
      const zone: ResponsiveZone = {};

      if (i) {
        zone.max = points[i - 1] - 1;
      }

      zone.min = point;

      zones.push(zone);
    });

    zones.push({
      max: points[points.length - 1] - 1,
    });

    zones.forEach((zone) => {
      const queries: string[] = [];

      if (zone.min) {
        queries.push(`(min-width: ${zone.min}px)`);
      }

      if (zone.max) {
        queries.push(`(max-width: ${zone.max}px)`);
      }

      zone.mediaQuery = queries.join(' and ');
    });

    zonesCache[cacheKey] = zones;
  }

  return zonesCache[cacheKey];
}

// export function getResponsiveValue(values, zoneNumber) {
//   for (let i = zoneNumber; i >= 0; i--) {
//     if (values[i] != null)
//   }
// }

export function normalizeStyleZones(
  value: NuResponsiveStyleValue,
  zoneNumber: number,
) {
  if (value == null) return value;

  const arr = Array.from(Array(zoneNumber));

  if (typeof value === 'string') return arr.map(() => value);

  if (Array.isArray(value)) {
    let prevValue = null;

    for (let i = 0; i < arr.length; i++) {
      arr[i] = value[i] == null ? prevValue : value[i];

      prevValue = arr[i];
    }

    return arr;
  }

  return [];
}
