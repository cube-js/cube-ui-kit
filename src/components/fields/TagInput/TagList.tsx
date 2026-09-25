import { Key, Node } from '@react-types/shared';
import { Styles, tasty } from '@tenphi/tasty';
import { RefObject, useRef } from 'react';
import { useFocusRing, useId, useTag, useTagGroup } from 'react-aria';
import { Item, ListState, useListState } from 'react-stately';

import { useI18n } from '../../../i18n';
import { CloseIcon } from '../../../icons/CloseIcon';
import { mergeProps } from '../../../utils/react';
import { ItemAction } from '../../actions/ItemAction/ItemAction';
import { CubeTagProps, Tag } from '../../content/Tag/Tag';

/** One chip as the list renders it. */
export interface TagListEntry {
  /** The value the chip stands for. Also its collection key. */
  key: string;
  /** The text shown on the chip. */
  label: string;
  /**
   * Why the value failed `validateTag`, when it did. Paints the chip in the
   * danger theme and becomes part of its description.
   */
  invalidMessage?: string;
  /** Extra props for this chip's `Tag`, from the `tagProps` callback. */
  tagProps?: Partial<CubeTagProps>;
}

export interface TagListProps {
  qa?: string;
  id?: string;
  'aria-label': string;
  /** The field's label, read after `aria-label`. */
  'aria-labelledby'?: string;
  tags: TagListEntry[];
  size: CubeTagProps['size'];
  isDisabled?: boolean;
  /** Read-only chips render without a remove button and ignore Delete/Backspace. */
  isReadOnly?: boolean;
  onRemove: (keys: string[]) => void;
  styles?: Styles;
  tagStyles?: Styles;
  listRef?: RefObject<HTMLDivElement | null>;
}

const TagListElement = tasty({
  qa: 'TagInputTags',
  styles: {
    display: 'flex',
    flow: 'row wrap',
    gap: '.5x',
    placeItems: 'center start',
    outline: 0,
  },
});

// The focusable grid row. The chip inside it keeps its own look; the row only
// contributes the focus ring, drawn on the chip's own radius.
const TagRowElement = tasty({
  qa: 'TagInputTag',
  styles: {
    display: 'inline-flex',
    minWidth: 0,
    maxWidth: '100%',
    radius: true,
    outline: {
      '': '0 #primary-accent-text.0',
      focused: '1bw #primary-accent-text',
    },
    outlineOffset: 1,
    transition: 'theme',
    cursor: 'default',
  },
});

interface TagRowProps {
  item: Node<TagListEntry>;
  state: ListState<TagListEntry>;
  size: CubeTagProps['size'];
  isDisabled?: boolean;
  isReadOnly?: boolean;
  tagStyles?: Styles;
}

function TagRow({
  item,
  state,
  size,
  isDisabled,
  isReadOnly,
  tagStyles,
}: TagRowProps) {
  const { t } = useI18n();
  const ref = useRef<HTMLDivElement>(null);
  const { rowProps, gridCellProps, removeButtonProps, allowsRemoving } = useTag(
    { item },
    state,
    ref,
  );
  const { isFocusVisible, focusProps } = useFocusRing();
  const invalidId = useId();
  const entry = item.value as TagListEntry;
  const canRemove = allowsRemoving && !isDisabled && !isReadOnly;
  const describedBy =
    [rowProps['aria-describedby'], entry.invalidMessage ? invalidId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <TagRowElement
      ref={ref}
      {...mergeProps(rowProps, focusProps)}
      aria-describedby={describedBy}
      mods={{ focused: isFocusVisible }}
    >
      {entry.invalidMessage ? (
        <span hidden id={invalidId}>
          {entry.invalidMessage}
        </span>
      ) : null}
      <Tag
        // The cell of the grid row, not the `status` live region a standalone
        // tag is: every chip announcing itself would drown the list.
        {...gridCellProps}
        size={size}
        theme={entry.invalidMessage ? 'danger' : 'default'}
        styles={tagStyles}
        isDisabled={isDisabled}
        // The row takes the one Tab stop and removes on Delete/Backspace, so the
        // remove button stays out of the Tab order.
        disableActionsFocus
        actions={
          canRemove ? (
            <ItemAction
              id={removeButtonProps.id}
              icon={<CloseIcon />}
              aria-label={t('tagInput.remove', 'Remove')}
              // Reads "Remove, <label>": the button's own name, then the row's.
              aria-labelledby={removeButtonProps['aria-labelledby']}
              styles={{ color: '#current' }}
              onPress={removeButtonProps.onPress}
            />
          ) : undefined
        }
        {...entry.tagProps}
        role="gridcell"
      >
        {entry.tagProps?.children ?? entry.label}
      </Tag>
    </TagRowElement>
  );
}

/**
 * The removable chips under a `TagInput`: a React Aria tag group, so the list
 * is one Tab stop, arrow keys move between chips, and Delete or Backspace
 * removes the focused one.
 */
export function TagList(props: TagListProps) {
  const {
    qa,
    id,
    tags,
    size,
    isDisabled,
    isReadOnly,
    onRemove,
    styles,
    tagStyles,
    listRef,
  } = props;
  const localRef = useRef<HTMLDivElement>(null);
  const ref = listRef ?? localRef;

  const canRemove = !isDisabled && !isReadOnly;

  const state = useListState<TagListEntry>({
    items: tags,
    // A disabled field's chips drop out of the Tab order along with its input.
    disabledKeys: isDisabled ? tags.map((tag) => tag.key) : undefined,
    children: (entry) => (
      <Item key={entry.key} textValue={entry.label}>
        {entry.label}
      </Item>
    ),
  });

  const { gridProps } = useTagGroup(
    {
      id,
      'aria-label': props['aria-label'],
      'aria-labelledby': props['aria-labelledby'],
      onRemove: canRemove
        ? (keys: Set<Key>) => onRemove([...keys].map(String))
        : undefined,
    },
    state,
    ref,
  );

  return (
    <TagListElement
      ref={ref}
      qa={qa}
      {...gridProps}
      // Every chip of a disabled field is disabled, and the grid itself would
      // otherwise stay a Tab stop that focuses nothing.
      tabIndex={isDisabled ? -1 : gridProps.tabIndex}
      styles={styles}
    >
      {[...state.collection].map((item) => (
        <TagRow
          key={item.key}
          item={item}
          state={state}
          size={size}
          isDisabled={isDisabled}
          isReadOnly={isReadOnly}
          tagStyles={tagStyles}
        />
      ))}
    </TagListElement>
  );
}
