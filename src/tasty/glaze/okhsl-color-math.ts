/**
 * OKHSL color math primitives for the glaze theme generator.
 *
 * Provides OKHSL → linear sRGB conversion (skipping gamma encoding)
 * and relative luminance computation for WCAG 2 contrast calculations.
 *
 * The math is the same as in `../utils/okhsl-to-rgb.ts` but stops at
 * linear sRGB so the contrast solver can compute luminance directly
 * without unnecessary gamma round-trips.
 */

type Vec3 = [number, number, number];

// ============================================================================
// Matrices (from texel-color / Björn Ottosson's reference)
// ============================================================================

const OKLab_to_LMS_M: Vec3[] = [
  [1.0, 0.3963377773761749, 0.2158037573099136],
  [1.0, -0.1055613458156586, -0.0638541728258133],
  [1.0, -0.0894841775298119, -1.2914855480194092],
];

const LMS_to_linear_sRGB_M: Vec3[] = [
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
// Constants
// ============================================================================

const TAU = 2 * Math.PI;
const K1 = 0.206;
const K2 = 0.03;
const K3 = (1.0 + K1) / (1.0 + K2);

// ============================================================================
// Helpers
// ============================================================================

const constrainAngle = (angle: number): number => ((angle % 360) + 360) % 360;
const toeInv = (x: number): number => (x ** 2 + K1 * x) / (K3 * (x + K2));
const dot3 = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const dotXY = (a: [number, number], b: [number, number]): number =>
  a[0] * b[0] + a[1] * b[1];
const transform = (input: Vec3, matrix: Vec3[]): Vec3 => [
  dot3(input, matrix[0]),
  dot3(input, matrix[1]),
  dot3(input, matrix[2]),
];
const cubed3 = (lms: Vec3): Vec3 => [lms[0] ** 3, lms[1] ** 3, lms[2] ** 3];

// ============================================================================
// Internal OKHSL pipeline
// ============================================================================

const OKLabToLinearSRGB = (lab: Vec3): Vec3 => {
  const lms = transform(lab, OKLab_to_LMS_M);
  return transform(cubed3(lms), LMS_to_linear_sRGB_M);
};

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

  const l = l_ ** 3;
  const m = m_ ** 3;
  const s = s_ ** 3;

  const lds = 3.0 * kl * l_ * l_;
  const mds = 3.0 * km * m_ * m_;
  const sds = 3.0 * ks * s_ * s_;

  const lds2 = 6.0 * kl * kl * l_;
  const mds2 = 6.0 * km * km * m_;
  const sds2 = 6.0 * ks * ks * s_;

  const f = wl * l + wm * m + ws * s;
  const f1 = wl * lds + wm * mds + ws * sds;
  const f2 = wl * lds2 + wm * mds2 + ws * sds2;

  sat = sat - (f * f1) / (f1 * f1 - 0.5 * f * f2);

  return sat;
};

const findCuspOKLCH = (a: number, b: number): [number, number] => {
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
  return [L_cusp, L_cusp * S_cusp];
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

    const L = l0 * (1.0 - t) + t * l1;
    const C = t * c1;

    const l_ = L + C * kl;
    const m_ = L + C * km;
    const s_ = L + C * ks;

    const l = l_ ** 3;
    const m = m_ ** 3;
    const s = s_ ** 3;

    const ldt = 3 * (dl + dc * kl) * l_ * l_;
    const mdt = 3 * (dl + dc * km) * m_ * m_;
    const sdt = 3 * (dl + dc * ks) * s_ * s_;

    const ldt2 = 6 * (dl + dc * kl) ** 2 * l_;
    const mdt2 = 6 * (dl + dc * km) ** 2 * m_;
    const sdt2 = 6 * (dl + dc * ks) ** 2 * s_;

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

const computeSt = (cusp: [number, number]): [number, number] => [
  cusp[1] / cusp[0],
  cusp[1] / (1 - cusp[0]),
];

const computeStMid = (a: number, b: number): [number, number] => [
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
                a * (-4.24894561 + 5.38770819 * b + 4.69891013 * a)))),
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
                a * (0.00299215 - 0.45399568 * b - 0.14661872 * a)))),
];

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

// ============================================================================
// Public API
// ============================================================================

/**
 * Convert OKHSL (h: 0–360, s: 0–1, l: 0–1) to linear sRGB.
 * Channels may exceed [0, 1] near gamut boundaries — caller must clamp if needed.
 */
export function okhslToLinearSrgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  let L = toeInv(l);
  let a = 0;
  let b = 0;

  const hNorm = constrainAngle(h) / 360.0;

  if (L !== 0.0 && L !== 1.0 && s !== 0) {
    const a_ = Math.cos(TAU * hNorm);
    const b_ = Math.sin(TAU * hNorm);

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

  return OKLabToLinearSRGB([L, a, b]);
}

/**
 * Compute relative luminance Y from linear sRGB channels.
 * Per WCAG 2: Y = 0.2126·R + 0.7152·G + 0.0722·B
 */
export function relativeLuminanceFromLinearRgb(
  rgb: [number, number, number],
): number {
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

/**
 * WCAG 2 contrast ratio from two luminance values.
 */
export function contrastRatioFromLuminance(yA: number, yB: number): number {
  const lighter = Math.max(yA, yB);
  const darker = Math.min(yA, yB);
  return (lighter + 0.05) / (darker + 0.05);
}

const sRGBLinearToGamma = (val: number): number => {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs > 0.0031308
    ? sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055)
    : 12.92 * val;
};

/**
 * Convert OKHSL to gamma-encoded sRGB (clamped to 0–1).
 */
export function okhslToSrgb(
  h: number,
  s: number,
  l: number,
): [number, number, number] {
  const lin = okhslToLinearSrgb(h, s, l);
  return [
    Math.max(0, Math.min(1, sRGBLinearToGamma(lin[0]))),
    Math.max(0, Math.min(1, sRGBLinearToGamma(lin[1]))),
    Math.max(0, Math.min(1, sRGBLinearToGamma(lin[2]))),
  ];
}

/**
 * Format OKHSL values as a CSS `okhsl(H S% L%)` string.
 * h: 0–360, s: 0–100, l: 0–100 (percentage scale for s and l).
 */
export function formatOkhsl(h: number, s: number, l: number): string {
  return `okhsl(${h.toFixed(1)} ${s.toFixed(1)}% ${l.toFixed(1)}%)`;
}
