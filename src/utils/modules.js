export function extractModule(promise) {
  return promise.then((module) => module.default || module);
}
