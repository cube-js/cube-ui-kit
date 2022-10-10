# @cube-dev/ui-kit

## 0.13.5

### Patch Changes

- [#224](https://github.com/cube-js/cube-ui-kit/pull/224) [`6f58989`](https://github.com/cube-js/cube-ui-kit/commit/6f58989b15fb24c0d105d3c24f909f356b925e55) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-1327](https://cubedevinc.atlassian.net/browse/CC-1327): Fixed bug when `onDismiss` doesn't trigger on `ESC` press within `AlertDialog`

- [#221](https://github.com/cube-js/cube-ui-kit/pull/221) [`2721552`](https://github.com/cube-js/cube-ui-kit/commit/2721552429f06e89d05c865c391f629f81da8763) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Add `RangeSlider` component

  ```jsx
  <RangeSlider defaultValue={[10, 40]} minValue={0} maxValue={100} step={2} />
  ```

- [#226](https://github.com/cube-js/cube-ui-kit/pull/226) [`7d9b2d0`](https://github.com/cube-js/cube-ui-kit/commit/7d9b2d0c814371c8e0805fdde3b63f7c7c8a128f) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-1364](https://cubedevinc.atlassian.net/browse/CC-1364) - fixed bug when useNotificationObserver calls callback with already removed notification

## 0.13.4

### Patch Changes

- [#222](https://github.com/cube-js/cube-ui-kit/pull/222) [`b3057c9`](https://github.com/cube-js/cube-ui-kit/commit/b3057c953c5947ed21c327acaca0dca67163f9e8) Thanks [@tenphi](https://github.com/tenphi)! - Fix for the small size of the NumberInput.

## 0.13.3

### Patch Changes

- [#219](https://github.com/cube-js/cube-ui-kit/pull/219) [`d178c72`](https://github.com/cube-js/cube-ui-kit/commit/d178c72abf4d890c9bfbc644961a6aa5bfb2a143) Thanks [@tenphi](https://github.com/tenphi)! - Fix overlapping of LegacyTabs' fades with dialogs.

## 0.13.2

### Patch Changes

- [#218](https://github.com/cube-js/cube-ui-kit/pull/218) [`121e4a0`](https://github.com/cube-js/cube-ui-kit/commit/121e4a0ebdf4ed64720cbc89ce61be8eb2fd3f8d) Thanks [@tenphi](https://github.com/tenphi)! - Set default bold font weight to 700.

- [#217](https://github.com/cube-js/cube-ui-kit/pull/217) [`91092dd`](https://github.com/cube-js/cube-ui-kit/commit/91092dd81c80ab25242cd558214033dcdb7629d3) Thanks [@tenphi](https://github.com/tenphi)! - Fix the bug that didn't allow to type into a ComboBox to the initial value inside a Form.

- [#215](https://github.com/cube-js/cube-ui-kit/pull/215) [`f5b707e`](https://github.com/cube-js/cube-ui-kit/commit/f5b707ebf3b26b9b8f37b5032b0417afb2c0f801) Thanks [@tenphi](https://github.com/tenphi)! - Fix SSR support

## 0.13.1

### Patch Changes

- [#213](https://github.com/cube-js/cube-ui-kit/pull/213) [`04852be`](https://github.com/cube-js/cube-ui-kit/commit/04852be0b17cb2d7ecab80c530128ec957e5cf3e) Thanks [@tenphi](https://github.com/tenphi)! - Fix that allows notifications to be dismissed correctly when they are off the display limit.

## 0.13.0

### Minor Changes

- [#207](https://github.com/cube-js/cube-ui-kit/pull/207) [`fa16cd6`](https://github.com/cube-js/cube-ui-kit/commit/fa16cd6f74190b238583312aec6343a9258bb9b4) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Redesigned close button in `<Notification />` component.

  Added ability to dismiss a notification in `<NotificationList />` component.

  ```typescript jsx
  import { NotificationsList } from '@cube-dev/ui-kit';

  <NotificationList onDismiss={() => console.log('dismissed')}>
    <NotificationsList.Item
      header="Notification title"
      description="Notification description"
    />
  </NotificationList>;
  ```

  Now notifications generates more uniq ids by default.

### Patch Changes

- [#206](https://github.com/cube-js/cube-ui-kit/pull/206) [`11f14c3`](https://github.com/cube-js/cube-ui-kit/commit/11f14c3b8c65c39a91dd6dac6d094a7bd9bfe549) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Added support of keyboard navigation inside Menu component

- [#211](https://github.com/cube-js/cube-ui-kit/pull/211) [`e74374d`](https://github.com/cube-js/cube-ui-kit/commit/e74374d2e9b9bd8b52a0e80ef561815f08d185c3) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Do not render more than 5 notificaitons at the same time

## 0.12.7

### Patch Changes

- [#203](https://github.com/cube-js/cube-ui-kit/pull/203) [`f50b93a`](https://github.com/cube-js/cube-ui-kit/commit/f50b93aa6651f2feca7762345a3c4d54fe3d8ae4) Thanks [@tenphi](https://github.com/tenphi)! - On form submission the `isSubmitting` flag now set to true before the start of the validation.

- [#202](https://github.com/cube-js/cube-ui-kit/pull/202) [`8e6767a`](https://github.com/cube-js/cube-ui-kit/commit/8e6767acc57670e0b7c3e47bcb4f0090cbb1e322) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Improve typings of `onSubmit` and `onValuesChange` callbacks in `<Form />` component. Now they properly match with `FormInstance` and `useForm`.

## 0.12.6

### Patch Changes

- [#200](https://github.com/cube-js/cube-ui-kit/pull/200) [`6b7448a`](https://github.com/cube-js/cube-ui-kit/commit/6b7448a65e8112df2c0b079dbfaae9802922d065) Thanks [@tenphi](https://github.com/tenphi)! - Form is no longer validated on field removal (bugfix)

- [#200](https://github.com/cube-js/cube-ui-kit/pull/200) [`6b7448a`](https://github.com/cube-js/cube-ui-kit/commit/6b7448a65e8112df2c0b079dbfaae9802922d065) Thanks [@tenphi](https://github.com/tenphi)! - Validation rules in Form now allows to return complex markup in error messages.

## 0.12.5

### Patch Changes

- [#198](https://github.com/cube-js/cube-ui-kit/pull/198) [`dec5c65`](https://github.com/cube-js/cube-ui-kit/commit/dec5c65a121a06391d0757b7aee1a43cd17342c6) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed input width in `<Combobox />` and `<Select />` components

## 0.12.4

### Patch Changes

- [#181](https://github.com/cube-js/cube-ui-kit/pull/181) [`1f6220e`](https://github.com/cube-js/cube-ui-kit/commit/1f6220eeb7fc9c28f83f02eb113e92b8542fec89) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Improve display names across all components

- [#195](https://github.com/cube-js/cube-ui-kit/pull/195) [`ee8ab23`](https://github.com/cube-js/cube-ui-kit/commit/ee8ab238ac9d0ca6ed2b35c816cbf155c6eefcf8) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Reduced gap between `label` and `labelSuffix` in `<Field />`

## 0.12.3

### Patch Changes

- [#182](https://github.com/cube-js/cube-ui-kit/pull/182) [`6db0491`](https://github.com/cube-js/cube-ui-kit/commit/6db04916412cbf0150b0cc730451fd7c595571a5) Thanks [@tenphi](https://github.com/tenphi)! - Add `icon` property to Input components. You should use it instead `prefix` property to ensure your icon will have correct paddings.
  Styles of Input components have been rewritten to improve consistency and maintenance.

- [#193](https://github.com/cube-js/cube-ui-kit/pull/193) [`5c3ed68`](https://github.com/cube-js/cube-ui-kit/commit/5c3ed682a967d6bcaa26765b2c839b1d04a0f182) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed alignment between label and suffix in Field component

- [#177](https://github.com/cube-js/cube-ui-kit/pull/177) [`16a213a`](https://github.com/cube-js/cube-ui-kit/commit/16a213a616c4e5d328e344797323abdf910e7a53) Thanks [@tenphi](https://github.com/tenphi)! - ComboBox now respects `onSelectionChange` event while working inside a form.

- [#185](https://github.com/cube-js/cube-ui-kit/pull/185) [`7a7b861`](https://github.com/cube-js/cube-ui-kit/commit/7a7b861ff2f0f50c751b0b73e4da3b4a682379c3) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed types in `onSubmit` and `onValuesChange` types in `Form`

## 0.12.2

### Patch Changes

- [`dcc4edc`](https://github.com/cube-js/cube-ui-kit/commit/dcc4edc3ef560d25062277b5e4f2fcee7afe4168) - Pass `labelSuffix` to all form components

## 0.12.1

### Patch Changes

- [#178](https://github.com/cube-js/cube-ui-kit/pull/178) [`932d401`](https://github.com/cube-js/cube-ui-kit/commit/932d401f5100b92b7635f51054049e6176d672ff) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed bug in button when `isLoading` prop didn't affect on mods

## 0.12.0

### Minor Changes

- [#174](https://github.com/cube-js/cube-ui-kit/pull/174) [`76a9f37`](https://github.com/cube-js/cube-ui-kit/commit/76a9f373253dea98e2099ee2a39199064da7a3d6) Thanks [@tenphi](https://github.com/tenphi)! - Rename `default` size to `medium` and `default` type to `secondary` in the Button component.
  Add `rightIcon` property to the Button component.

- [#175](https://github.com/cube-js/cube-ui-kit/pull/175) [`34b680e`](https://github.com/cube-js/cube-ui-kit/commit/34b680eae60a4fbf9d310a048a8bb53d41cbf1ce) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Added new prop `labelSuffix` in Field component. Using this prop you can add any adornment after the label.

- [#176](https://github.com/cube-js/cube-ui-kit/pull/176) [`4239ef6`](https://github.com/cube-js/cube-ui-kit/commit/4239ef6889956523409c9ff67696331e5ba2229c) Thanks [@tenphi](https://github.com/tenphi)! - Add a loading modifier and `placeholder` property to Select and ComboBox components.

### Patch Changes

- [#163](https://github.com/cube-js/cube-ui-kit/pull/163) [`644812c`](https://github.com/cube-js/cube-ui-kit/commit/644812cef1c6ca8f9e16d614641603a45e23a42b) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Now all icon only buttons have proper sizes

- [#175](https://github.com/cube-js/cube-ui-kit/pull/175) [`34b680e`](https://github.com/cube-js/cube-ui-kit/commit/34b680eae60a4fbf9d310a048a8bb53d41cbf1ce) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Reduced default delay in tooltip to 250ms

- [#169](https://github.com/cube-js/cube-ui-kit/pull/169) [`fe67fcc`](https://github.com/cube-js/cube-ui-kit/commit/fe67fcc96499505dfa31a581eaff9385d06aab6d) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Add `disableRemoveOnUnmount` prop in `<Notificaiton />` and `<Toast />` components

- [#171](https://github.com/cube-js/cube-ui-kit/pull/171) [`3f99948`](https://github.com/cube-js/cube-ui-kit/commit/3f999483bc1cf54f73cd9099f3226e00041eafde) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Adds customization form Menu.Item.
  Now you can pass props like `icon` even if any react element inside `Menu.Item`

- [#166](https://github.com/cube-js/cube-ui-kit/pull/166) [`c9226c6`](https://github.com/cube-js/cube-ui-kit/commit/c9226c68e73f7343c69c27972253ae1e9ac7a532) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Bugfixes in `<Notification />` and `<Toast />` components:

  - Fixed width of notifications in bar
  - Nofifications and toasts now respects duration property
  - Fixed bug when user were unable to select a text inside a description

- [#162](https://github.com/cube-js/cube-ui-kit/pull/162) [`328b664`](https://github.com/cube-js/cube-ui-kit/commit/328b664faff7894f91d34cbaac6e9abaad564a44) Thanks [@tenphi](https://github.com/tenphi)! - Fix font family fallback for `preset` style.

- [#173](https://github.com/cube-js/cube-ui-kit/pull/173) [`34fdefb`](https://github.com/cube-js/cube-ui-kit/commit/34fdefba170c32f091df52ac895bc08f439655a2) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Fixes `childrenchildrenchildren` bug when use `TooltipProvider` component

- [#165](https://github.com/cube-js/cube-ui-kit/pull/165) [`6c53550`](https://github.com/cube-js/cube-ui-kit/commit/6c535506e649c42033d3c0508c5844e8987188b5) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Fixed bug when menu doesn't open within a modal

- [#167](https://github.com/cube-js/cube-ui-kit/pull/167) [`89899c2`](https://github.com/cube-js/cube-ui-kit/commit/89899c220e1cf1b00395f610a17b5bbc0fbaa307) Thanks [@tenphi](https://github.com/tenphi)! - fix(Switch): thumb disabled styles

## 0.11.2

### Patch Changes

- [#161](https://github.com/cube-js/cube-ui-kit/pull/161) [`f5976df`](https://github.com/cube-js/cube-ui-kit/commit/f5976df3e318006ce62b325393f2f86aa9dce9e1) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed description preset in notificaiton

- [#156](https://github.com/cube-js/cube-ui-kit/pull/156) [`f0ac89a`](https://github.com/cube-js/cube-ui-kit/commit/f0ac89aff31626f9aea61cf99dfd397e5ccb7d1a) Thanks [@nikolaykost](https://github.com/nikolaykost)! - pass `isLoading` and `isDisabled` from `Form.Item` to childs

  ```jsx
  <Form.Item isLoading isDisabled>
    <Input />
  </Form.Item>
  ```

## 0.11.1

### Patch Changes

- [#158](https://github.com/cube-js/cube-ui-kit/pull/158) [`e03992b`](https://github.com/cube-js/cube-ui-kit/commit/e03992bcbd79e2ebcfd187b1d9478ac1a4e3c18e) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Fixed bug when notifications displays below the legacy `<Modal />` component

## 0.11.0

### Minor Changes

- [#154](https://github.com/cube-js/cube-ui-kit/pull/154) [`1555c0d`](https://github.com/cube-js/cube-ui-kit/commit/1555c0d454939cebb7dc547d8290165450a7ce5d) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CUK-65](https://cubedevinc.atlassian.net/browse/CUK-65) - Notification component

### Patch Changes

- [#154](https://github.com/cube-js/cube-ui-kit/pull/154) [`1555c0d`](https://github.com/cube-js/cube-ui-kit/commit/1555c0d454939cebb7dc547d8290165450a7ce5d) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - Toast Component

## 0.10.13

### Patch Changes

- [#151](https://github.com/cube-js/cube-ui-kit/pull/151) [`e3eaeba`](https://github.com/cube-js/cube-ui-kit/commit/e3eaebac88a3826ad7b1bb542e72e25af563d367) Thanks [@nikolaykost](https://github.com/nikolaykost)! - Adds prop `selectionType` for `Menu` component. That stands for values `checkbox` or `radio`.

  ```jsx
  <Menu selectionType="checkbox" selectionMode="single">
    <Item key="1">Item 1</Item>
    <Item key="2">Item 2</Item>
  </Menu>
  ```

- [#111](https://github.com/cube-js/cube-ui-kit/pull/111) [`f45b927`](https://github.com/cube-js/cube-ui-kit/commit/f45b927bb34dbc9bd0374a5d55c039bd37fa899e) Thanks [@MrFlashAccount](https://github.com/MrFlashAccount)! - [CC-677](https://cubedevinc.atlassian.net/browse/CC-677) significantly improved performance of the `Spin` component in all browsers.

## 0.10.12

### Patch Changes

- [#149](https://github.com/cube-js/cube-ui-kit/pull/149) [`3ea195c`](https://github.com/cube-js/cube-ui-kit/commit/3ea195c713f880e7d4e45e19b72cc6f4a1b4d5b4) Thanks [@tenphi](https://github.com/tenphi)! - fix(Combobox): error on trigger

## 0.10.11

### Patch Changes

- [#133](https://github.com/cube-js/cube-ui-kit/pull/133) [`943dbc6`](https://github.com/cube-js/cube-ui-kit/commit/943dbc69e7225c9f80c85cc887a1928a9b29b09f) Thanks [@tenphi](https://github.com/tenphi)! - fix(FileTabs): styles

- [#146](https://github.com/cube-js/cube-ui-kit/pull/146) [`77a9c29`](https://github.com/cube-js/cube-ui-kit/commit/77a9c29b2fcefe1d49904b170c133dea530f33e7) Thanks [@tenphi](https://github.com/tenphi)! - fix(tasty): style merging while wrapping
  feat(preset.style): add bold-font-weight token

## 0.10.10

### Patch Changes

- [#140](https://github.com/cube-js/cube-ui-kit/pull/140) [`2b12419`](https://github.com/cube-js/cube-ui-kit/commit/2b12419446e001eb69d923ba0ec4523a87999452) Thanks [@tenphi](https://github.com/tenphi)! - fix(Space): items alignment

## 0.10.9

### Patch Changes

- [#138](https://github.com/cube-js/cube-ui-kit/pull/138) [`e7861d3`](https://github.com/cube-js/cube-ui-kit/commit/e7861d33fd480439a9bbbab3a1a0659ec3af8422) Thanks [@tenphi](https://github.com/tenphi)! - Fix extractStyles() logic.
  Fix label position inside a field.

## 0.10.8

### Patch Changes

- [#131](https://github.com/cube-js/cube-ui-kit/pull/131) [`0f4e39a`](https://github.com/cube-js/cube-ui-kit/commit/0f4e39a98e469ee0ed0757d6fc76a2a0eb9591e1) Thanks [@tenphi](https://github.com/tenphi)! - fix(Field): pass labelStyles prop

## 0.10.7

### Patch Changes

- [#129](https://github.com/cube-js/cube-ui-kit/pull/129) [`facd201`](https://github.com/cube-js/cube-ui-kit/commit/facd2013b2130aa44dcdc3e55540742df464c923) Thanks [@tenphi](https://github.com/tenphi)! - fix(Field): pass labelStyles prop

## 0.10.6

### Patch Changes

- [#127](https://github.com/cube-js/cube-ui-kit/pull/127) [`3c875d6`](https://github.com/cube-js/cube-ui-kit/commit/3c875d60e4bc41be17e12926648c9dcfd2ca858c) Thanks [@tenphi](https://github.com/tenphi)! - fix(Field): pass labelPosition prop

## 0.10.5

### Patch Changes

- [#125](https://github.com/cube-js/cube-ui-kit/pull/125) [`7c457f5`](https://github.com/cube-js/cube-ui-kit/commit/7c457f5cb85983f0ed3870d9b2f78b1bdfd81f9f) Thanks [@tenphi](https://github.com/tenphi)! - fix(Card): pass style props

- [#124](https://github.com/cube-js/cube-ui-kit/pull/124) [`f4ed612`](https://github.com/cube-js/cube-ui-kit/commit/f4ed612289bff0526b61696e3d5c054a2cb578fc) Thanks [@tenphi](https://github.com/tenphi)! - fix(Space): condition for the vertical modifier

## 0.10.4

### Patch Changes

- [#119](https://github.com/cube-js/cube-ui-kit/pull/119) [`bdccbf8`](https://github.com/cube-js/cube-ui-kit/commit/bdccbf8d0bd4762659185b9571efbdc1c1e97f09) Thanks [@tenphi](https://github.com/tenphi)! - Allow `tasty` to extend components with required properties.

## 0.10.3

### Patch Changes

- [#120](https://github.com/cube-js/cube-ui-kit/pull/120) [`6aa6e26`](https://github.com/cube-js/cube-ui-kit/commit/6aa6e2645fc92bd8d7d6ed86f4e2ddff5fc7df62) Thanks [@tenphi](https://github.com/tenphi)! - Fix the display style default value in gap style generator.

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
