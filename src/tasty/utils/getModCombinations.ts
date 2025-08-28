// Enhanced conflict detection function that can accept a custom conflict checker
export type ConflictChecker = (combination: string[]) => boolean;

/**
 * Efficient iterative combination generator with early pruning
 * Generates combinations one by one and prunes branches early when conflicts are detected
 * @param array - Array of mod strings to generate combinations from
 * @param allowEmpty - Whether to include empty combination
 * @param conflictChecker - Function to detect conflicting combinations (required)
 */
export function getModCombinationsIterative(
  array: string[],
  allowEmpty?: boolean,
  conflictChecker?: ConflictChecker,
): string[][] {
  if (!conflictChecker) {
    throw new Error(
      'getModCombinationsIterative requires a conflictChecker function',
    );
  }

  if (array.length === 0) {
    return allowEmpty ? [[]] : [];
  }

  // Use iterative approach with early pruning for better performance
  const combinations: string[][] = [[]];

  for (let i = 0; i < array.length; i++) {
    const currentLength = combinations.length;
    for (let j = 0; j < currentLength; j++) {
      const newCombination = [...combinations[j], array[i]];

      // Early conflict detection - only add if no conflicts
      if (!conflictChecker(newCombination)) {
        combinations.push(newCombination);
      }
    }
  }

  // Filter out empty combination if not allowed, but keep others
  return combinations.filter((combo) => allowEmpty || combo.length > 0);
}
