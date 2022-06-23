# @cube-dev/ui-kit

## 0.10.2

### Patch Changes

- [#116](https://github.com/cube-js/cube-ui-kit/pull/116) [`3967bd0`](https://github.com/cube-js/cube-ui-kit/commit/3967bd05c7a810ab4d83b71236b33f9382f00329) Thanks [@tenphi](https://github.com/tenphi)! - Pass `styles` prop to Field component.
  Add stories for Field component.
  Export `CubeRadioGroupProps` type.

## 0.10.1

### Patch Changes

- [#113](https://github.com/cube-js/cube-ui-kit/pull/113) [`d6e2f46`](https://github.com/cube-js/cube-ui-kit/commit/d6e2f46c15aad30a102e070412e570fbc39ac725) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed transparent background of `<Select />` component

- [#112](https://github.com/cube-js/cube-ui-kit/pull/112) [`7432820`](https://github.com/cube-js/cube-ui-kit/commit/743282055b923d841d9caab34361a4f4df2e987f) Thanks [@tenphi](https://github.com/tenphi)! - Stabilize Form behavior.
  Fix Switch component styles.

## 0.10.0

### Minor Changes

- [#84](https://github.com/cube-js/cube-ui-kit/pull/84) [`9af598c`](https://github.com/cube-js/cube-ui-kit/commit/9af598c08a0f1e2ea2a5e4a00118367428262e27) Thanks [@tenphi](https://github.com/tenphi)! - [CUK-72](https://cubedevinc.atlassian.net/jira/software/projects/CUK/boards/3?selectedIssue=CUK-72) Move all style engine logic into a single folder `tasty` and export new `tasty()` helper as `styled` replacement but with simplified and optimized API.

- [#99](https://github.com/cube-js/cube-ui-kit/pull/99) [`8be45cd`](https://github.com/cube-js/cube-ui-kit/commit/8be45cddb565cc093b4d3b421de6984d5646a91b) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-484](https://cubedevinc.atlassian.net/browse/CC-484) This PR removes several organisms from ui-kit: TopBar, StatsCard, SearchResults, DirectoryTree.

### Patch Changes

- [#110](https://github.com/cube-js/cube-ui-kit/pull/110) [`52fbee3`](https://github.com/cube-js/cube-ui-kit/commit/52fbee3bef49c96182ca735770db5dca1e7338f4) Thanks [@tenphi](https://github.com/tenphi)! - Update `Select` & `Combobox` selected option styles.

- [#105](https://github.com/cube-js/cube-ui-kit/pull/105) [`8ce1f2d`](https://github.com/cube-js/cube-ui-kit/commit/8ce1f2dd84a0f4f1e11b7e0e65212ac73bdf3cd0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-33](https://cubedevinc.atlassian.net/browse/CUK-33) Now you can use the `<DialogForm />` component together with `<DialogTrigger />` 🎉

  ```tsx
  <DialogTrigger>
    <Button>Open dialog</Button>
    <DialogForm>...</DialogForm>
  </DialogTrigger>
  ```

- [#105](https://github.com/cube-js/cube-ui-kit/pull/105) [`8ce1f2d`](https://github.com/cube-js/cube-ui-kit/commit/8ce1f2dd84a0f4f1e11b7e0e65212ac73bdf3cd0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-33](https://cubedevinc.atlassian.net/browse/CUK-33) Removed unused `type` property in the `<DialogForm />`component

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Deprecation of StyleProvider

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Fix paddings and `size` prop typings in Dialog Component.

- [#105](https://github.com/cube-js/cube-ui-kit/pull/105) [`8ce1f2d`](https://github.com/cube-js/cube-ui-kit/commit/8ce1f2dd84a0f4f1e11b7e0e65212ac73bdf3cd0) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-33](https://cubedevinc.atlassian.net/browse/CUK-33) Added documentation for the `<DialogForm />` component

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Fix neutral pressed fill style for Button component

- [#109](https://github.com/cube-js/cube-ui-kit/pull/109) [`57a4cd3`](https://github.com/cube-js/cube-ui-kit/commit/57a4cd319eb8f7a9259772c289c218fce8a6e649) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Rework design of `Menu` component with _sections_.
  Now _sections_ more readable and has convenient design.

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Support for `element` prop in `tasty` helper.

- [#104](https://github.com/cube-js/cube-ui-kit/pull/104) [`cead470`](https://github.com/cube-js/cube-ui-kit/commit/cead4704c8fb03bfba70c8652fde7cd8c814bf9a) Thanks [@tenphi](https://github.com/tenphi)! - Fix Legacy Modal component to correctly pass theme prop

## 0.9.12

### Patch Changes

- [#90](https://github.com/cube-js/cube-ui-kit/pull/90) [`ed07084`](https://github.com/cube-js/cube-ui-kit/commit/ed070842d46e5b448d1f88a9eeaee01b27d46467) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - this is a test release. will be removed

## 0.9.11

### Patch Changes

- [#89](https://github.com/cube-js/cube-ui-kit/pull/89) [`da511c5`](https://github.com/cube-js/cube-ui-kit/commit/da511c5749c6cb85272852fc323caf02a9177eba) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - this is a test release
