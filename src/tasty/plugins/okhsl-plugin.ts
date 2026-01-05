/**
 * OKHSL Plugin for Tasty
 *
 * Converts OKHSL color syntax to RGB notation.
 * Supports angle units: deg, turn, rad, or unitless (degrees).
 *
 * Examples:
 *   okhsl(240.5 50% 50%)
 *   okhsl(240.5deg 50% 50%)
 *   okhsl(0.25turn 50% 50%)
 *   okhsl(1.57rad 50% 50%)
 *
 * Conversion math inlined from @texel/color to avoid external dependencies.
 */

import { Lru } from '../parser/lru';

import type { StyleDetails } from '../parser/types';
import type { TastyPlugin, TastyPluginFactory } from './types';

// Cache for OKHSL to RGB conversions
const conversionCache = new Lru<string, string>(500);

// ============================================================================
// Conversion Matrices (from texel-color)
// ============================================================================

const OKLab_to_LMS_M: [number, number, number][] = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
];

const LMS_to_linear_sRGB_M: [number, number, number][] = [
  [4.076741636075959, -3.307711539258062, 0.2309699031821041],
  [-1.2684379732850313, 2.6097573492876878, -0.3413193760026569],
  [-0.004196076138675526, -0.703418617935936, 1.7076146940746113],
];

const OKLab_to_linear_sRGB_coefficients: [
  [[number, number], number[]],
  [[number, number], number[]],
  [[number, number], number[]],
] = [
  [
    [-1.8817030993265873, -0.8093650129914302],
    [1.19086277, 1.76576728, 0.59662641, 0.75515197, 0.56771245],
  ],
  [
    [1.8144407988010998, -1.194452667805235],
    [0.73956515, -0.45954404, 0.08285427, 0.12541073, -0.14503204],
  ],
  [
    [0.13110757611180954, 1.813339709266608],
    [1.35733652, -0.00915799, -1.1513021, -0.50559606, 0.00692167],
  ],
];

// ============================================================================
// Math Utilities
// ============================================================================

const TAU = 2 * Math.PI;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(Math.min(value, max), min);

const constrainAngle = (angle: number): number => ((angle % 360) + 360) % 360;

const copySign = (to: number, from: number): number =>
  Math.sign(to) === Math.sign(from) ? to : -to;

const spow = (base: number, exp: number): number =>
  copySign(Math.abs(base) ** exp, base);

// ============================================================================
// sRGB Gamma Conversion
// ============================================================================

const sRGBLinearToGamma = (val: number): number => {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs > 0.0031308
    ? sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055)
    : 12.92 * val;
};

// ============================================================================
// Matrix Operations
// ============================================================================

type Vec3 = [number, number, number];

const dot3 = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const transform = (input: Vec3, matrix: Vec3[]): Vec3 => [
  dot3(input, matrix[0]),
  dot3(input, matrix[1]),
  dot3(input, matrix[2]),
];

const cubed3 = (lms: Vec3): Vec3 => [
  lms[0] * lms[0] * lms[0],
  lms[1] * lms[1] * lms[1],
  lms[2] * lms[2] * lms[2],
];

// ============================================================================
// OKLab Conversion
// ============================================================================

const OKLabToLinearSRGB = (lab: Vec3): Vec3 => {
  const lms = transform(lab, OKLab_to_LMS_M);
  const cubedLms = cubed3(lms);
  return transform(cubedLms, LMS_to_linear_sRGB_M);
};

// ============================================================================
// OKHSL to OKLab Conversion (from texel-color)
// ============================================================================

const K1 = 0.206;
const K2 = 0.03;
const K3 = (1.0 + K1) / (1.0 + K2);

const toe = (x: number): number =>
  0.5 *
  (K3 * x - K1 + Math.sqrt((K3 * x - K1) * (K3 * x - K1) + 4 * K2 * K3 * x));

const toeInv = (x: number): number => (x ** 2 + K1 * x) / (K3 * (x + K2));

const dotXY = (a: [number, number], b: [number, number]): number =>
  a[0] * b[0] + a[1] * b[1];

const computeMaxSaturationOKLC = (a: number, b: number): number => {
  const okCoeff = OKLab_to_linear_sRGB_coefficients;
  const lmsToRgb = LMS_to_linear_sRGB_M;
  const tmp2: [number, number] = [a, b];
  const tmp3: Vec3 = [0, a, b];

  let chnlCoeff: number[];
  let chnlLMS: Vec3;

  if (dotXY(okCoeff[0][0], tmp2) > 1) {
    chnlCoeff = okCoeff[0][1];
    chnlLMS = lmsToRgb[0];
  } else if (dotXY(okCoeff[1][0], tmp2) > 1) {
    chnlCoeff = okCoeff[1][1];
    chnlLMS = lmsToRgb[1];
  } else {
    chnlCoeff = okCoeff[2][1];
    chnlLMS = lmsToRgb[2];
  }

  const [k0, k1, k2, k3, k4] = chnlCoeff;
  const [wl, wm, ws] = chnlLMS;

  let sat = k0 + k1 * a + k2 * b + k3 * (a * a) + k4 * a * b;

  const dotYZ = (mat: Vec3, vec: Vec3): number =>
    mat[1] * vec[1] + mat[2] * vec[2];

  const kl = dotYZ(OKLab_to_LMS_M[0], tmp3);
  const km = dotYZ(OKLab_to_LMS_M[1], tmp3);
  const ks = dotYZ(OKLab_to_LMS_M[2], tmp3);

  let l_ = 1.0 + sat * kl;
  let m_ = 1.0 + sat * km;
  let s_ = 1.0 + sat * ks;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lds = 3.0 * kl * (l_ * l_);
  const mds = 3.0 * km * (m_ * m_);
  const sds = 3.0 * ks * (s_ * s_);

  const lds2 = 6.0 * (kl * kl) * l_;
  const mds2 = 6.0 * (km * km) * m_;
  const sds2 = 6.0 * (ks * ks) * s_;

  const f = wl * l + wm * m + ws * s;
  const f1 = wl * lds + wm * mds + ws * sds;
  const f2 = wl * lds2 + wm * mds2 + ws * sds2;

  sat = sat - (f * f1) / (f1 * f1 - 0.5 * f * f2);

  return sat;
};

const findCuspOKLCH = (a: number, b: number): [number, number] => {
  const lmsToRgb = LMS_to_linear_sRGB_M;
  const S_cusp = computeMaxSaturationOKLC(a, b);

  const lab: Vec3 = [1, S_cusp * a, S_cusp * b];
  const rgb_at_max = OKLabToLinearSRGB(lab);

  const L_cusp = Math.cbrt(
    1 /
      Math.max(
        Math.max(rgb_at_max[0], rgb_at_max[1]),
        Math.max(rgb_at_max[2], 0.0),
      ),
  );
  const C_cusp = L_cusp * S_cusp;

  return [L_cusp, C_cusp];
};

const findGamutIntersectionOKLCH = (
  a: number,
  b: number,
  l1: number,
  c1: number,
  l0: number,
  cusp: [number, number],
): number => {
  const lmsToRgb = LMS_to_linear_sRGB_M;
  const tmp3: Vec3 = [0, a, b];
  const floatMax = Number.MAX_VALUE;

  let t: number;

  const dotYZ = (mat: Vec3, vec: Vec3): number =>
    mat[1] * vec[1] + mat[2] * vec[2];
  const dotXYZ = (vec: Vec3, x: number, y: number, z: number): number =>
    vec[0] * x + vec[1] * y + vec[2] * z;

  if ((l1 - l0) * cusp[1] - (cusp[0] - l0) * c1 <= 0.0) {
    const denom = c1 * cusp[0] + cusp[1] * (l0 - l1);
    t = denom === 0 ? 0 : (cusp[1] * l0) / denom;
  } else {
    const denom = c1 * (cusp[0] - 1.0) + cusp[1] * (l0 - l1);
    t = denom === 0 ? 0 : (cusp[1] * (l0 - 1.0)) / denom;

    const dl = l1 - l0;
    const dc = c1;

    const kl = dotYZ(OKLab_to_LMS_M[0], tmp3);
    const km = dotYZ(OKLab_to_LMS_M[1], tmp3);
    const ks = dotYZ(OKLab_to_LMS_M[2], tmp3);

    const ldt_ = dl + dc * kl;
    const mdt_ = dl + dc * km;
    const sdt_ = dl + dc * ks;

    const L = l0 * (1.0 - t) + t * l1;
    const C = t * c1;

    const l_ = L + C * kl;
    const m_ = L + C * km;
    const s_ = L + C * ks;

    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;

    const ldt = 3 * ldt_ * l_ * l_;
    const mdt = 3 * mdt_ * m_ * m_;
    const sdt = 3 * sdt_ * s_ * s_;

    const ldt2 = 6 * ldt_ * ldt_ * l_;
    const mdt2 = 6 * mdt_ * mdt_ * m_;
    const sdt2 = 6 * sdt_ * sdt_ * s_;

    const r_ = dotXYZ(lmsToRgb[0], l, m, s) - 1;
    const r1 = dotXYZ(lmsToRgb[0], ldt, mdt, sdt);
    const r2 = dotXYZ(lmsToRgb[0], ldt2, mdt2, sdt2);

    const ur = r1 / (r1 * r1 - 0.5 * r_ * r2);
    let tr = -r_ * ur;

    const g_ = dotXYZ(lmsToRgb[1], l, m, s) - 1;
    const g1 = dotXYZ(lmsToRgb[1], ldt, mdt, sdt);
    const g2 = dotXYZ(lmsToRgb[1], ldt2, mdt2, sdt2);

    const ug = g1 / (g1 * g1 - 0.5 * g_ * g2);
    let tg = -g_ * ug;

    const b_ = dotXYZ(lmsToRgb[2], l, m, s) - 1;
    const b1 = dotXYZ(lmsToRgb[2], ldt, mdt, sdt);
    const b2 = dotXYZ(lmsToRgb[2], ldt2, mdt2, sdt2);

    const ub = b1 / (b1 * b1 - 0.5 * b_ * b2);
    let tb = -b_ * ub;

    tr = ur >= 0.0 ? tr : floatMax;
    tg = ug >= 0.0 ? tg : floatMax;
    tb = ub >= 0.0 ? tb : floatMax;

    t += Math.min(tr, Math.min(tg, tb));
  }

  return t;
};

const computeSt = (cusp: [number, number]): [number, number] => {
  const l = cusp[0];
  const c = cusp[1];
  return [c / l, c / (1 - l)];
};

const computeStMid = (a: number, b: number): [number, number] => {
  const s =
    0.11516993 +
    1.0 /
      (7.4477897 +
        4.1590124 * b +
        a *
          (-2.19557347 +
            1.75198401 * b +
            a *
              (-2.13704948 -
                10.02301043 * b +
                a * (-4.24894561 + 5.38770819 * b + 4.69891013 * a))));

  const t =
    0.11239642 +
    1.0 /
      (1.6132032 -
        0.68124379 * b +
        a *
          (0.40370612 +
            0.90148123 * b +
            a *
              (-0.27087943 +
                0.6122399 * b +
                a * (0.00299215 - 0.45399568 * b - 0.14661872 * a))));

  return [s, t];
};

const getCs = (
  L: number,
  a: number,
  b: number,
  cusp: [number, number],
): [number, number, number] => {
  const cMax = findGamutIntersectionOKLCH(a, b, L, 1, L, cusp);
  const stMax = computeSt(cusp);

  const k = cMax / Math.min(L * stMax[0], (1 - L) * stMax[1]);

  const stMid = computeStMid(a, b);

  let ca = L * stMid[0];
  let cb = (1.0 - L) * stMid[1];
  const cMid =
    0.9 * k * Math.sqrt(Math.sqrt(1.0 / (1.0 / ca ** 4 + 1.0 / cb ** 4)));

  ca = L * 0.4;
  cb = (1.0 - L) * 0.8;
  const c0 = Math.sqrt(1.0 / (1.0 / ca ** 2 + 1.0 / cb ** 2));

  return [c0, cMid, cMax];
};

const OKHSLToOKLab = (hsl: Vec3): Vec3 => {
  let h = hsl[0];
  const s = hsl[1];
  const l = hsl[2];

  let L = toeInv(l);
  let a = 0;
  let b = 0;

  h = constrainAngle(h) / 360.0;

  if (L !== 0.0 && L !== 1.0 && s !== 0) {
    const a_ = Math.cos(TAU * h);
    const b_ = Math.sin(TAU * h);

    const cusp = findCuspOKLCH(a_, b_);
    const Cs = getCs(L, a_, b_, cusp);
    const [c0, cMid, cMax] = Cs;

    const mid = 0.8;
    const midInv = 1.25;
    let t: number, k0: number, k1: number, k2: number;

    if (s < mid) {
      t = midInv * s;
      k0 = 0.0;
      k1 = mid * c0;
      k2 = 1.0 - k1 / cMid;
    } else {
      t = 5 * (s - 0.8);
      k0 = cMid;
      k1 = (0.2 * cMid ** 2 * 1.25 ** 2) / c0;
      k2 = 1.0 - k1 / (cMax - cMid);
    }

    const c = k0 + (t * k1) / (1.0 - k2 * t);

    a = c * a_;
    b = c * b_;
  }

  return [L, a, b];
};

// ============================================================================
// OKHSL to sRGB Conversion
// ============================================================================

const okhslToSRGB = (h: number, s: number, l: number): Vec3 => {
  // h: 0-360, s: 0-1, l: 0-1
  const oklab = OKHSLToOKLab([h, s, l]);
  const linearRGB = OKLabToLinearSRGB(oklab);

  // Apply gamma correction and clamp
  return [
    clamp(sRGBLinearToGamma(linearRGB[0]), 0, 1),
    clamp(sRGBLinearToGamma(linearRGB[1]), 0, 1),
    clamp(sRGBLinearToGamma(linearRGB[2]), 0, 1),
  ];
};

// ============================================================================
// Parsing Utilities
// ============================================================================

/**
 * Parse an angle value with optional unit.
 * Supports: deg, turn, rad, or unitless (treated as degrees).
 */
const parseAngle = (value: string): number => {
  const match = value.match(/^([+-]?\d*\.?\d+)(deg|turn|rad)?$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  const unit = match[2];

  switch (unit) {
    case 'turn':
      return num * 360;
    case 'rad':
      return (num * 180) / Math.PI;
    case 'deg':
    default:
      return num;
  }
};

/**
 * Parse a percentage value (e.g., "50%") to a 0-1 range.
 */
const parsePercentage = (value: string): number => {
  const match = value.match(/^([+-]?\d*\.?\d+)%?$/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  // If the value includes %, divide by 100, otherwise assume 0-1 range
  return value.includes('%') ? num / 100 : num;
};

// ============================================================================
// Plugin Implementation
// ============================================================================

/**
 * The okhsl function handler for tasty parser.
 * Receives parsed style groups and returns an RGB color string.
 */
const okhslFunc = (groups: StyleDetails[]): string => {
  // We expect a single group with 3 values: H, S, L
  if (groups.length === 0 || groups[0].all.length < 3) {
    console.warn('[okhsl] Expected 3 values (H S L), got:', groups);
    return 'rgb(0% 0% 0%)';
  }

  const tokens = groups[0].all;

  // Create cache key from input tokens
  const cacheKey = tokens.slice(0, 3).join(' ');
  const cached = conversionCache.get(cacheKey);
  if (cached) return cached;

  const h = parseAngle(tokens[0]);
  const s = parsePercentage(tokens[1]);
  const l = parsePercentage(tokens[2]);

  const [r, g, b] = okhslToSRGB(h, clamp(s, 0, 1), clamp(l, 0, 1));

  // Return as rgb() with percentage syntax for best compatibility
  const format = (n: number): string => {
    const pct = n * 100;
    return parseFloat(pct.toFixed(1)).toString() + '%';
  };
  const result = `rgb(${format(r)} ${format(g)} ${format(b)})`;

  conversionCache.set(cacheKey, result);
  return result;
};

/**
 * OKHSL Plugin for Tasty.
 *
 * Adds support for the `okhsl()` color function in tasty styles.
 *
 * @example
 * ```ts
 * import { configure } from '@cube-dev/ui-kit';
 * import { okhslPlugin } from '@cube-dev/ui-kit/tasty/plugins';
 *
 * configure({
 *   plugins: [okhslPlugin()],
 * });
 *
 * // Now you can use okhsl in styles:
 * const Box = tasty({
 *   styles: {
 *     fill: 'okhsl(240 50% 50%)',
 *   },
 * });
 * ```
 */
export const okhslPlugin: TastyPluginFactory = (): TastyPlugin => ({
  name: 'okhsl',
  funcs: {
    okhsl: okhslFunc,
  },
});

// Export the raw function for direct use if needed
export { okhslFunc };
