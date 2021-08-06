export function getCombinations(array: string[], allowEmpty?: boolean) {
  const result: string[][] = allowEmpty ? [[]] : [];

  const f = function(prefix: string[] = [], array: string[]) {
    for (let i = 0; i < array.length; i++) {
      result.push([...prefix, array[i]]);
      f([...prefix, array[i]], array.slice(i + 1));
    }
  };

  f([], array);

  return result;
}
