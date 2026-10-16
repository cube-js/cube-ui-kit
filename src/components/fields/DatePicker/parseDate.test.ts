import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

import { parseAbsoluteDate } from './parseDate';

const ZONELESS = {
  '2024-01-05': '2024-01-05T00:00:00+00:00[UTC]',
  '2024-01-05T10:30': '2024-01-05T10:30:00+00:00[UTC]',
  '2024-01-05T10:30:15': '2024-01-05T10:30:15+00:00[UTC]',
  '2024-01-05T10:30:15.250': '2024-01-05T10:30:15.25+00:00[UTC]',
  '2024-01-05 10:30': '2024-01-05T10:30:00+00:00[UTC]',
  '2024-01-05 10:30:15.250': '2024-01-05T10:30:15.25+00:00[UTC]',
  '2024-01-05t10:30': '2024-01-05T10:30:00+00:00[UTC]',
  // Shapes `parseDateTime` rejects reach `Date`, which must still read UTC.
  '2024-01-05T24:00': '2024-01-06T00:00:00+00:00[UTC]',
  '2024-02-30T10:00': '2024-03-01T10:00:00+00:00[UTC]',
};

/**
 * Runs `parseAbsoluteDate` over `values` in a fresh Node process started in
 * `timeZone`. The zone has to be set when the process starts: assigning
 * `process.env.TZ` inside a Vitest worker thread does not move `Date`, and a
 * machine or CI runner in UTC reads local and UTC wall time the same way.
 */
function parseInZone(timeZone: string, values: string[]): string[] {
  const source = pathToFileURL(join(__dirname, 'parseDate.ts')).href;

  return JSON.parse(
    execFileSync(
      process.execPath,
      [
        '--input-type=module',
        '-e',
        `import { parseAbsoluteDate } from ${JSON.stringify(source)};` +
          `console.log(JSON.stringify(${JSON.stringify(values)}` +
          `.map((value) => String(parseAbsoluteDate(value)))));`,
      ],
      { env: { ...process.env, TZ: timeZone }, encoding: 'utf-8' },
    ),
  );
}

describe('parseAbsoluteDate()', () => {
  it.each([undefined, null, '', '   '])('returns undefined for %j', (value) => {
    expect(parseAbsoluteDate(value)).toBeUndefined();
  });

  it('returns a UTC ZonedDateTime for a Date', () => {
    expect(
      parseAbsoluteDate(new Date(Date.UTC(2024, 0, 5, 10, 30)))?.toString(),
    ).toBe('2024-01-05T10:30:00+00:00[UTC]');
  });

  it.each([
    ['2024-01-05T00:00:00Z', '2024-01-05T00:00:00+00:00[UTC]'],
    ['2024-01-05T00:00:00.500Z', '2024-01-05T00:00:00.5+00:00[UTC]'],
    ['2024-01-05T00:00:00+02:00', '2024-01-04T22:00:00+00:00[UTC]'],
    ['2024-01-05T00:00:00-05:00', '2024-01-05T05:00:00+00:00[UTC]'],
  ])('returns the UTC instant of the zoned string %s', (value, expected) => {
    expect(parseAbsoluteDate(value)?.toString()).toBe(expected);
  });

  it.each(Object.entries(ZONELESS))(
    'reads the zoneless string %s as UTC wall time',
    (value, expected) => {
      expect(parseAbsoluteDate(value)?.toString()).toBe(expected);
    },
  );

  it.each(['Asia/Tokyo', 'America/Los_Angeles'])(
    'reads zoneless strings as UTC wall time when the process runs in %s',
    (timeZone) => {
      expect(parseInZone(timeZone, Object.keys(ZONELESS))).toEqual(
        Object.values(ZONELESS),
      );
    },
  );

  it('still parses strings that are not ISO 8601 through Date', () => {
    expect(parseAbsoluteDate('Fri, 05 Jan 2024 10:30:00 GMT')?.toString()).toBe(
      '2024-01-05T10:30:00+00:00[UTC]',
    );
  });

  it.each([
    'not a date',
    '2024-13-05',
    '2024-01-00',
    '2024-01-00T10:00',
    '2024-01-00T10:00Z',
  ])('reports %j as invalid and returns undefined', (value) => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});

    try {
      expect(parseAbsoluteDate(value)).toBeUndefined();
      expect(error).toHaveBeenCalledWith('Invalid date format', value);
    } finally {
      error.mockRestore();
    }
  });
});
