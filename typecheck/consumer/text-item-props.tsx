import { TextItem } from '@cube-dev/ui-kit';

/**
 * TextItem truncates to one line, so it takes none of Text's
 * `ellipsis` or `nowrap`. A consumer must see both as errors, while the rest
 * of Text's props still type-check.
 */
export function TextItemProps() {
  return (
    <>
      <TextItem monospace preset="t3">
        Name
      </TextItem>
      {/* @ts-expect-error TextItem has no `ellipsis` */}
      <TextItem ellipsis>Name</TextItem>
      {/* @ts-expect-error TextItem has no `nowrap` */}
      <TextItem nowrap>Name</TextItem>
    </>
  );
}
