export function getCombinations(array, allowEmpty) {
  const result = allowEmpty ? [[]] : [];

  const f = function (prefix = [], array) {
    for (let i = 0; i < array.length; i++) {
      result.push([...prefix, array[i]]);
      f([...prefix, array[i]], array.slice(i + 1));
    }
  };

  f('', array);

  return result;
}

export const COMPUTE_FUNC = [
  (a, b) => a ^ b,
  (a, b) => a | b,
  (a, b) => a & b,
  (a) => (a ? 0 : 1),
];

/**
 *
 * @param {NuComputeUnit} computeUnit
 * @param {Number[]} values
 * @return {Number}
 */
export function computeState(computeUnit, values) {
  const func = COMPUTE_FUNC[computeUnit[0]];

  let a = computeUnit[1];

  if (typeof a === 'object') {
    a = computeState(a, values);
  } else {
    a = values[a];
  }

  if (computeUnit.length === 2) {
    return func(a);
  }

  let b = computeUnit[2];

  if (typeof b === 'object') {
    b = computeState(b, values);
  } else {
    b = values[b];
  }

  return func(a, b);
}
