function filterCombinations(combinations) {
  return combinations.filter((combination) => {
    const list: string[] = [];

    return !combination.find((mod) => {
      const match = mod.match(/\[(.+?)[=\]]/);

      if (match) {
        if (list.includes(match[1])) {
          return true;
        }

        list.push(match[1]);

        return false;
      }

      return false;
    });
  });
}

export function getModCombinations(array: string[], allowEmpty?: boolean) {
  const result: string[][] = allowEmpty ? [[]] : [];

  if (array.length < 2) {
    return result.concat([array]);
  }

  const f = function(prefix: string[] = [], array: string[]) {
    for (let i = 0; i < array.length; i++) {
      result.push([...prefix, array[i]]);
      f([...prefix, array[i]], array.slice(i + 1));
    }
  };

  f([], array);

  return filterCombinations(result);
}
