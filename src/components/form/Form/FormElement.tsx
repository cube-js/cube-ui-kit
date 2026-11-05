import { tasty } from '@tenphi/tasty';

export const FormElement = tasty({
  as: 'form',
  qa: 'Form',
  styles: {
    // A form placed directly in a `Dialog` sits between the dialog and its
    // slots (`Dialog > Form > Content + Footer`), so it takes over the dialog's
    // own slot layout: a flex column that grows into the dialog, lets `Content`
    // shrink and scroll (`min-height: 0` — a flex item's default `auto` refuses
    // to shrink below its content), and adds no space between the slots, whose
    // padding already spaces them. Direct child only: a form nested inside
    // `Content` is an ordinary form.
    //
    // It lives here, in the form's own styles, so a consumer's `styles` on the
    // form replace it key by key, inside a dialog as anywhere else — and can
    // name `@in-dialog` themselves. Last in each map, so
    // `orientation="horizontal"` cannot turn the slots into a row.
    '@in-dialog': '@parent(id=Dialog, >)',

    display: {
      '': 'block',
      horizontal: 'flex',
      '@in-dialog': 'flex',
    },
    flow: {
      '': 'column',
      horizontal: 'row',
      '@in-dialog': 'column',
    },
    placeItems: {
      '': 'initial',
      horizontal: 'center',
      '@in-dialog': 'initial',
    },
    gap: {
      '': '2x',
      '@in-dialog': 0,
    },
    flexGrow: {
      '': false,
      '@in-dialog': 1,
    },
    height: {
      '': false,
      '@in-dialog': 'min 0',
    },
    '$label-width': '25x',
  },
});

export const formPropNames = new Set([
  'action',
  'autoComplete',
  'encType',
  'method',
  'target',
] as const);
