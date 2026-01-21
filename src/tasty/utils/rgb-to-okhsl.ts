/**
 * RGB to OKHSL Conversion Utility
 *
 * Converts sRGB colors to OKHSL format. This is the reverse of the okhsl-plugin.
 * Used for converting existing RGB color tokens to OKHSL.
 *
 * NOT exported from the main tasty module - for internal/temporary use only.
 */

type Vec3 = [number, number, number];

// ============================================================================
// Conversion Matrices (from texel-color)
// ============================================================================

// Linear sRGB to LMS (used for forward conversion to OKLab)
const linear_sRGB_to_LMS_M: Vec3[] = [
  [0.4122214708, 0.5363325363, 0.0514459929],
  [0.2119034982, 0.6806995451, 0.1073969566],
  [0.0883024619, 0.2817188376, 0.6299787005],
];

// LMS to OKLab
const LMS_to_OKLab_M: Vec3[] = [
  [0.2104542553, 0.793617785, -0.0040720468],
  [1.9779984951, -2.428592205, 0.4505937099],
  [0.0259040371, 0.7827717662, -0.808675766],
];

// For reverse OKHSL calculation (from plugin)
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
// Math Utilities
// ============================================================================

const TAU = 2 * Math.PI;
const EPSILON = 1e-10;

const clamp = (value: number, min: number, max: number): number =>
  Math.max(Math.min(value, max), min);

const constrainAngle = (angle: number): number => ((angle % 360) + 360) % 360;

const copySign = (to: number, from: number): number =>
  Math.sign(to) === Math.sign(from) ? to : -to;

// ============================================================================
// sRGB Gamma Conversion
// ============================================================================

const sRGBGammaToLinear = (val: number): number => {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs <= 0.04045
    ? val / 12.92
    : sign * Math.pow((abs + 0.055) / 1.055, 2.4);
};

// ============================================================================
// Matrix Operations
// ============================================================================

const dot3 = (a: Vec3, b: Vec3): number =>
  a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

const transform = (input: Vec3, matrix: Vec3[]): Vec3 => [
  dot3(input, matrix[0]),
  dot3(input, matrix[1]),
  dot3(input, matrix[2]),
];

const cbrt3 = (lms: Vec3): Vec3 => [
  Math.cbrt(lms[0]),
  Math.cbrt(lms[1]),
  Math.cbrt(lms[2]),
];

const cubed3 = (lms: Vec3): Vec3 => [
  lms[0] * lms[0] * lms[0],
  lms[1] * lms[1] * lms[1],
  lms[2] * lms[2] * lms[2],
];

// ============================================================================
// sRGB to OKLab
// ============================================================================

const sRGBToLinear = (rgb: Vec3): Vec3 => [
  sRGBGammaToLinear(rgb[0]),
  sRGBGammaToLinear(rgb[1]),
  sRGBGammaToLinear(rgb[2]),
];

const linearSRGBToOKLab = (rgb: Vec3): Vec3 => {
  const lms = transform(rgb, linear_sRGB_to_LMS_M);
  const lms_ = cbrt3(lms);
  return transform(lms_, LMS_to_OKLab_M);
};

// ============================================================================
// OKLab to Linear sRGB (for gamut checks)
// ============================================================================

const OKLabToLinearSRGB = (lab: Vec3): Vec3 => {
  const lms = transform(lab, OKLab_to_LMS_M);
  const cubedLms = cubed3(lms);
  return transform(cubedLms, LMS_to_linear_sRGB_M);
};

// ============================================================================
// OKHSL Helper Functions (from plugin, needed for reverse)
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

// ============================================================================
// OKLab to OKHSL Conversion
// ============================================================================

const OKLabToOKHSL = (lab: Vec3): Vec3 => {
  const L = lab[0];
  const a = lab[1];
  const b = lab[2];

  const C = Math.sqrt(a * a + b * b);

  // Handle achromatic colors
  if (C < EPSILON) {
    return [0, 0, toe(L)];
  }

  const a_ = a / C;
  const b_ = b / C;

  // Calculate hue in degrees
  let h = Math.atan2(b, a) * (180 / Math.PI);
  h = constrainAngle(h);

  const cusp = findCuspOKLCH(a_, b_);
  const Cs = getCs(L, a_, b_, cusp);
  const [c0, cMid, cMax] = Cs;

  const mid = 0.8;
  const midInv = 1.25;

  let s: number;

  if (C < cMid) {
    const k1 = mid * c0;
    const k2 = 1.0 - k1 / cMid;

    // Solve for t: C = k0 + (t * k1) / (1.0 - k2 * t) where k0 = 0
    // C = (t * k1) / (1.0 - k2 * t)
    // C * (1.0 - k2 * t) = t * k1
    // C - C * k2 * t = t * k1
    // C = t * k1 + C * k2 * t
    // C = t * (k1 + C * k2)
    // t = C / (k1 + C * k2)
    const t = C / (k1 + C * k2);
    s = t / midInv;
  } else {
    const k0 = cMid;
    const k1 = (0.2 * cMid ** 2 * 1.25 ** 2) / c0;
    const k2 = 1.0 - k1 / (cMax - cMid);

    // Solve for t: C = k0 + (t * k1) / (1.0 - k2 * t)
    // C - k0 = (t * k1) / (1.0 - k2 * t)
    // (C - k0) * (1.0 - k2 * t) = t * k1
    // (C - k0) - (C - k0) * k2 * t = t * k1
    // (C - k0) = t * k1 + (C - k0) * k2 * t
    // (C - k0) = t * (k1 + (C - k0) * k2)
    // t = (C - k0) / (k1 + (C - k0) * k2)
    const cDiff = C - k0;
    const t = cDiff / (k1 + cDiff * k2);
    s = mid + t / 5;
  }

  const l = toe(L);

  return [h, clamp(s, 0, 1), clamp(l, 0, 1)];
};

// ============================================================================
// Public API
// ============================================================================

/**
 * Parse an RGB string like "rgb(R G B)" or "rgb(R, G, B)" where R, G, B are 0-255.
 */
export function parseRgbString(rgb: string): Vec3 | null {
  // Match both "rgb(R G B)" and "rgb(R, G, B)" formats
  const match = rgb.match(/rgb\(\s*(\d+)\s*[,\s]\s*(\d+)\s*[,\s]\s*(\d+)\s*\)/);
  if (!match) return null;

  return [
    parseInt(match[1]) / 255,
    parseInt(match[2]) / 255,
    parseInt(match[3]) / 255,
  ];
}

/**
 * Convert sRGB values (0-1 range) to OKHSL.
 * Returns [H, S, L] where H is 0-360, S is 0-1, L is 0-1.
 */
export function sRGBToOKHSL(rgb: Vec3): Vec3 {
  const linear = sRGBToLinear(rgb);
  const oklab = linearSRGBToOKLab(linear);
  return OKLabToOKHSL(oklab);
}

/**
 * Convert an RGB string to OKHSL string format.
 * Input: "rgb(R G B)" or "rgb(R, G, B)" where R, G, B are 0-255
 * Output: "okhsl(H S% L%)" where H is degrees, S and L are percentages
 */
export function rgbStringToOkhslString(
  rgb: string,
  options?: {
    hueDecimals?: number;
    percentDecimals?: number;
  },
): string | null {
  const parsed = parseRgbString(rgb);
  if (!parsed) return null;

  const okhsl = sRGBToOKHSL(parsed);

  const hueDecimals = options?.hueDecimals ?? 1;
  const percentDecimals = options?.percentDecimals ?? 0;

  const h = okhsl[0].toFixed(hueDecimals);
  const s = (okhsl[1] * 100).toFixed(percentDecimals);
  const l = (okhsl[2] * 100).toFixed(percentDecimals);

  return `okhsl(${h} ${s}% ${l}%)`;
}

/**
 * Verify conversion by round-tripping: RGB → OKHSL → RGB
 * Returns the difference in RGB values (0-255 scale).
 */
export function verifyConversion(rgb: string): {
  original: Vec3;
  okhsl: Vec3;
  roundTrip: Vec3;
  maxDiff: number;
} | null {
  const parsed = parseRgbString(rgb);
  if (!parsed) return null;

  const okhsl = sRGBToOKHSL(parsed);

  // Forward conversion (OKHSL → RGB) using the same math as okhsl-plugin
  const oklab = OKHSLToOKLabReverse(okhsl);
  const linearRGB = OKLabToLinearSRGB(oklab);
  const roundTrip: Vec3 = [
    clamp(sRGBLinearToGamma(linearRGB[0]), 0, 1),
    clamp(sRGBLinearToGamma(linearRGB[1]), 0, 1),
    clamp(sRGBLinearToGamma(linearRGB[2]), 0, 1),
  ];

  const diff = [
    Math.abs(parsed[0] - roundTrip[0]) * 255,
    Math.abs(parsed[1] - roundTrip[1]) * 255,
    Math.abs(parsed[2] - roundTrip[2]) * 255,
  ];

  return {
    original: parsed,
    okhsl,
    roundTrip,
    maxDiff: Math.max(...diff),
  };
}

// For verification: OKHSL → OKLab (forward direction, same as plugin)
const OKHSLToOKLabReverse = (hsl: Vec3): Vec3 => {
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

const sRGBLinearToGamma = (val: number): number => {
  const sign = val < 0 ? -1 : 1;
  const abs = Math.abs(val);
  return abs > 0.0031308
    ? sign * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055)
    : 12.92 * val;
};
