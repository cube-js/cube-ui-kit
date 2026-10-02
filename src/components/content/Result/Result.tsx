import { FocusableRef } from '@react-types/shared';
import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconInfoCircleFilled,
} from '@tabler/icons-react';
import {
  BaseProps,
  CONTAINER_STYLES,
  ContainerStyleProps,
  filterBaseProps,
  tasty,
} from '@tenphi/tasty';
import {
  ComponentType,
  createContext,
  forwardRef,
  ReactNode,
  useContext,
} from 'react';

import { mergeProps, wrapNodeIfPlain } from '../../../utils/react';
import { extractStyles } from '../../../utils/styles';
import { Button, CubeButtonProps } from '../../actions/Button/Button';
import { Title } from '../Title';

export interface CubeResultProps extends BaseProps, ContainerStyleProps {
  /** Free content between the text and the actions, e.g. an alert or details */
  children?: ReactNode;
  /** Custom icon element */
  icon?: ReactNode;
  /**
   * Result status from ready-made templates
   * @default 'info'
   */
  status?: CubeResultStatus;
  /**
   * The subTitle
   * @deprecated The subTitle prop is deprecated and will be removed in next major release. consider using subtitle instead
   */
  subTitle?: ReactNode;
  /**
   * Subtitle of the Result component
   */
  subtitle?: ReactNode;
  /** The title */
  title?: ReactNode;
  /**
   * Action buttons, as `Result.Action` elements so they follow the Result's size.
   * A centered row by default, a full-width column in the `stacked` layout
   */
  actions?: ReactNode;
  /**
   * Visual scale: the icon size and the title and subtitle presets. Does not change the layout.
   * Ignored when `isCompact` is set
   * @default 'medium'
   */
  size?: CubeResultSize;
  /**
   * Arrangement of the block. `stacked` fills the container and stacks the actions to the full width,
   * as in a confirmation or result dialog. Combine with `size="large"` for the dialog card.
   * Ignored when `isCompact` is set
   * @default 'default'
   */
  layout?: CubeResultLayout;
  /** Whether the result component has a compact presentation. Overrides `size` and `layout` */
  isCompact?: boolean;
}

export type CubeResultSize = 'medium' | 'large';

export type CubeResultLayout = 'default' | 'stacked';

export type CubeResultStatus =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 404
  | 403
  | 500;

// `null` for a status without an icon, so no empty slot is rendered
type StatusIconMap = Record<CubeResultStatus, ComponentType | null>;

const Container = tasty({
  qa: 'ResultContainer',
  as: 'section',
  styles: {
    display: {
      '': 'flex',
      compact: 'grid',
    },
    gridAreas: '"icon title" "content content" "actions actions"',
    flow: 'column',
    placeContent: {
      '': 'center',
      compact: 'start',
    },
    placeItems: {
      '': 'center',
      compact: 'start',
    },
    // Outside compact the blocks below the title space themselves, so the
    // icon's own room is the whole distance to the title
    gap: {
      '': '0',
      compact: '2x 1x',
    },
    padding: {
      '': '6x 4x',
      // The host pads: a dialog `Content` or the page section the card fills
      compact: '0',
      // Adds to the host's padding, e.g. a dialog `Content`
      'layout=stacked': '1.5x',
    },
    textAlign: {
      '': 'center',
      compact: 'left',
    },
    boxSizing: 'border-box',
    width: {
      '': 'max 80ch',
      // Fill the container so stacked actions share one width wherever the card sits
      'layout=stacked': '0 100% 80ch',
    },
    margin: {
      '': '0 auto',
      compact: '0',
    },
    '--icon-size': {
      '': '6x',
      'size=large': '10x',
    },

    Icon: {
      $: '>',
      display: 'grid',
      gridArea: 'icon',
      // Room around the icon grows with it, so the large icon is not crowded
      padding: {
        '': '($icon-size / 4)',
        compact: '0',
      },
      // A custom icon keeps its own color
      color: {
        '': 'inherit',
        'status=info': '#purple',
        'status=success': '#success',
        'status=error': '#danger',
        'status=warning': '#warning',
      },
    },

    Title: {
      $: '>',
      gridArea: 'title',
      display: 'flex',
      flow: 'column',
      placeItems: 'inherit',
      gap: '1x',
      placeSelf: 'center',
      textWrap: 'balance',
    },

    Content: {
      $: '>',
      gridArea: 'content',
      display: 'block',
      margin: {
        '': 'top 3x',
        compact: '0',
      },
      placeSelf: {
        '': 'auto',
        'layout=stacked': 'stretch',
      },
    },

    Actions: {
      $: '>',
      gridArea: 'actions',
      display: 'flex',
      margin: {
        '': 'top 3x',
        compact: '0',
      },
      flow: {
        '': 'row wrap',
        'layout=stacked': 'column',
      },
      gap: '1x',
      placeContent: {
        '': 'center',
        compact: 'start',
      },
      placeItems: {
        '': 'center',
        'layout=stacked': 'stretch',
      },
      placeSelf: {
        '': 'auto',
        'layout=stacked': 'stretch',
      },
    },
  },
});

const ResultSizeContext = createContext<CubeResultSize | undefined>(undefined);

export type CubeResultActionProps = CubeButtonProps;

/**
 * A `Button` for the Result `actions` slot. Its size follows the Result's `size` unless set.
 * A link keeps Button's own `inline` size
 */
const ResultAction = forwardRef(function ResultAction(
  { size, ...props }: CubeResultActionProps,
  ref: FocusableRef<HTMLElement>,
) {
  const resultSize = useContext(ResultSizeContext);

  return (
    <Button
      ref={ref}
      {...props}
      size={size ?? (props.type === 'link' ? undefined : resultSize)}
    />
  );
});

const statusIconMap: StatusIconMap = {
  success: () => <IconCircleCheckFilled />,
  error: () => <IconCircleXFilled />,
  info: () => <IconInfoCircleFilled />,
  warning: () => <IconAlertTriangleFilled />,
  // TODO: Needs to be implemented in the future
  404: null,
  403: null,
  500: null,
};

function Result(props: CubeResultProps, ref) {
  let {
    children,
    isCompact,
    icon,
    status,
    subTitle,
    subtitle,
    title,
    actions,
    size = 'medium',
    layout = 'default',
    ...otherProps
  } = props;

  subtitle = subtitle ?? subTitle;

  if (icon && status) {
    console.warn(
      'Don\'t use "icon" and "status" together, it can lead to possible errors.',
    );
  }

  // The compact grid has its own scale and arrangement; `size` and `layout`
  // describe the centered column only, so they are dropped rather than mixed in
  if (isCompact) {
    size = 'medium';
    layout = 'default';
  }

  const isLarge = size === 'large';

  // An unknown status falls back to `info` for the color too, not only the icon
  const knownStatus: CubeResultStatus =
    status && statusIconMap.hasOwnProperty(status) ? status : 'info';
  const StatusIcon = statusIconMap[knownStatus];

  // A custom icon shares the status icon's wrapper, so it gets the same room
  const iconContent = icon || (StatusIcon && <StatusIcon />);
  const iconNode = iconContent && <div data-element="Icon">{iconContent}</div>;

  const styles = extractStyles(otherProps, CONTAINER_STYLES);

  return (
    <Container
      {...mergeProps(filterBaseProps(otherProps, { eventProps: true }), {
        mods: {
          compact: isCompact,
          size,
          layout,
          status: icon ? undefined : knownStatus,
        },
      })}
      ref={ref}
      styles={styles}
    >
      {iconNode}
      {(title || subtitle) && (
        <div data-element="Title">
          {wrapNodeIfPlain(title, () => (
            <Title level={2} preset={isCompact ? 'h5' : isLarge ? 'h2' : 'h4'}>
              {title}
            </Title>
          ))}
          {wrapNodeIfPlain(subtitle, () => (
            <Title
              // A name no provider defines: the dialog `title` slot must reach
              // the title only, or both headings get the dialog's label id
              slot="subtitle"
              level={3}
              preset={isCompact ? 't3m' : isLarge ? 't2' : 't2m'}
            >
              {subtitle}
            </Title>
          ))}
        </div>
      )}
      {children && <div data-element="Content">{children}</div>}
      {actions && (
        <div data-element="Actions">
          <ResultSizeContext.Provider value={size}>
            {actions}
          </ResultSizeContext.Provider>
        </div>
      )}
    </Container>
  );
}

const _Result = Object.assign(forwardRef(Result), { Action: ResultAction });

_Result.displayName = 'Result';

export { _Result as Result, ResultAction };
