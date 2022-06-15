type Coordinate = 0 | 1;
type WaitSteps = 0 | 1 | 2;
type CoordinatesVector = readonly [Coordinate, Coordinate];

const stepsOrder = [
  [0, 0], // x -> start, y -> start
  [1, 0], // x -> end, y -> start
  [1, 1], // x -> end, y -> end
  [0, 1], // x -> start, y -> end
] as const;

export function buildSpinAnimation(
  [beginX, beginY]: CoordinatesVector,
  beginWait: WaitSteps,
): string {
  const stepsToWait = 3;
  const stepsCount = 12 + Math.min(0, beginWait - 1);

  /**
   * all keyframes are stored here
   */
  let steps = [buildStep(0, [beginX, beginY], stepsCount)];
  let currentIndexInOrder = stepsOrder.findIndex(
    ([x, y]) => beginX === x && beginY === y,
  );

  for (let i = 1; i < stepsCount; i++) {
    const shouldStep =
      (i - (4 - (stepsToWait + beginWait))) % stepsToWait === 0;

    let step: CoordinatesVector = (() => {
      if (i < beginWait) {
        return [beginX, beginY];
      }

      if (shouldStep) {
        currentIndexInOrder = (currentIndexInOrder + 1) % stepsOrder.length;

        return stepsOrder[currentIndexInOrder];
      }

      return stepsOrder[currentIndexInOrder];
    })();

    steps.push(buildStep(i, step, stepsCount));
  }

  steps.push(buildStep(stepsCount, [beginX, beginY], stepsCount));

  return steps.join('');
}

const buildStep = (
  currentStep: number,
  [x, y]: CoordinatesVector,
  stepsCount: number,
) =>
  `${(currentStep / stepsCount) * 100}% {
      transform:translate(${x * 100}%, ${y * 100}%);
    }`;
