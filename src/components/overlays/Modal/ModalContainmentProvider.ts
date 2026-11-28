import {
  createContext,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
// React Aria's own modal overlays hide the page with this; the public barrel
// does not export it. Sharing React Aria's copy shares its reference counts and
// observer stack, so this and React Aria's own calls nest correctly.
import { ariaHideOutside } from 'react-aria/private/overlays/ariaHideOutside';

/**
 * While a modal overlay is open, everything outside it is `aria-hidden`, so a
 * screen reader's reading cursor cannot wander onto the page behind it.
 *
 * The lists, menus, popovers and dialogs opened from inside a modal render in
 * portals outside its element, and must stay readable. Each one registers its
 * root with the nearest modal through `useModalLayerRef`. `aria-modal` can't
 * do this: it hides everything outside the dialog element, those lists too.
 */
interface ModalContainment {
  /** Keeps `element` readable while the modal is open. Returns a release. */
  keep(element: Element): () => void;
}

interface OwnModalContainment extends ModalContainment {
  /** The modal's own element, from its ref. */
  setElement(element: Element | null): void;
  setActive(isActive: boolean): void;
}

interface OpenModal {
  modal: Element | null;
  /** Hides everything but the modal, its layers and the modals `above` it. */
  hide(above: OpenModal[]): void;
}

const ModalContainmentContext = createContext<ModalContainment | null>(null);

export const ModalContainmentProvider = ModalContainmentContext.Provider;

/**
 * The open modals, in the order they opened. A modal opened while another is
 * open, or in the same commit, need not be one of its layers — a dialog opened
 * through `useDialogContainer` or the alert dialog API is not — so each one
 * keeps the modals above it readable, and they hide it in turn.
 */
const openModals: OpenModal[] = [];

/**
 * Hides anew for every open modal, lowest first, so the top one hides the
 * others and its observer is the one left watching.
 */
function hideBehindOpenModals() {
  openModals.forEach((open, index) => open.hide(openModals.slice(index + 1)));
}

function createModalContainment(): OwnModalContainment {
  const layers = new Map<Element, number>();
  let isActive = false;
  let shown = new Set<Element>();
  let release: (() => void) | undefined;

  const open: OpenModal = {
    modal: null,
    hide(above) {
      // Hide anew before releasing the previous call, so nothing behind the
      // modal is shown in between. The new call also takes over the old one's
      // observer, dropping what it had not yet hidden, and the release reveals
      // any layer or modal the old call had already hidden.
      const modals = [open, ...above].flatMap(({ modal }) =>
        modal ? [modal] : [],
      );
      const next = open.modal
        ? ariaHideOutside([...modals, ...layers.keys()])
        : undefined;

      release?.();
      release = next;
      shown = new Set(next ? layers.keys() : []);
    },
  };

  return {
    keep(element) {
      layers.set(element, (layers.get(element) ?? 0) + 1);

      if (release && !shown.has(element)) hideBehindOpenModals();

      return () => {
        const count = (layers.get(element) ?? 1) - 1;

        // A released layer is leaving the page, or is being kept again at
        // once by a new ref; either way nothing needs hiding right now.
        if (count) layers.set(element, count);
        else layers.delete(element);
      };
    },
    setElement(element) {
      // The element moves when its portal does: a dialog open from the first
      // render is portaled before `<Root>` is ready, then again into it. A
      // detached element is replaced in the same commit, or the modal is
      // unmounting and `setActive(false)` lets go.
      if (!element || element === open.modal) return;

      open.modal = element;

      if (isActive) hideBehindOpenModals();
    },
    setActive(next) {
      if (next === isActive) return;

      isActive = next;

      if (next) {
        openModals.push(open);
      } else {
        openModals.splice(openModals.indexOf(open), 1);
        release?.();
        release = undefined;
        shown = new Set();
      }

      hideBehindOpenModals();
    },
  };
}

/**
 * For a modal overlay. While `isModal && isOpen`, hides the page outside the
 * element given `ref` and outside the layers opened from it. Returns that ref,
 * and the containment to provide to the overlay's content: its own, or the
 * enclosing one for an overlay that is not modal, so the layers opened from it
 * still register with a modal around it. The overlay itself is a layer of the
 * enclosing modal either way.
 */
export function useModalContainment(isModal: boolean, isOpen: boolean) {
  const parent = useContext(ModalContainmentContext);
  const [containment] = useState(createModalContainment);
  const layerRef = useModalLayerRef();
  const isActive = isModal && isOpen;

  // A layout effect, so the page is hidden in the commit that inserts the
  // overlay. A modal already open hides what is inserted after it once its
  // observer runs, and a passive effect here could come too late: a modal
  // hidden that way stays hidden.
  useLayoutEffect(() => {
    if (!isActive) return;

    containment.setActive(true);

    return () => containment.setActive(false);
  }, [containment, isActive]);

  const ref = (element: Element | null) => {
    layerRef(element);
    containment.setElement(element);
  };

  return { containment: isModal ? containment : parent, ref };
}

/**
 * A ref for the root of an overlay that renders in a portal: opened from inside
 * a modal, it stays readable while the modal hides the page.
 */
export function useModalLayerRef() {
  const containment = useContext(ModalContainmentContext);
  const release = useRef<(() => void) | undefined>(undefined);

  return (element: Element | null) => {
    release.current?.();
    release.current = element ? containment?.keep(element) : undefined;
  };
}
