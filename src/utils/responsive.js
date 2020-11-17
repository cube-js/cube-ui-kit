export function mediaWrapper(cssRules, points) {
  return points
    .map((point, i) => `@media ${point.mediaQuery} {${cssRules[i]}}`)
    .join('\n');
}

export function pointsToZones(points) {
  const zones = [];

  points.forEach((point, i) => {
    const zone = {};

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
    const queries = [];

    if (zone.min) {
      queries.push(`(min-width: ${zone.min}px)`);
    }

    if (zone.max) {
      queries.push(`(max-width: ${zone.max}px)`);
    }

    zone.mediaQuery = queries.join(' and ');
  });

  return zones;
}

// export function getResponsiveValue(values, zoneNumber) {
//   for (let i = zoneNumber; i >= 0; i--) {
//     if (values[i] != null)
//   }
// }

export function normalizeStyleZones(value, zoneNumber) {
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
