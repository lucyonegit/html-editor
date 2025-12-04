import { useLayoutEffect, useState } from 'react';
import type { Position } from '../../../lib';

type Placement = 'top' | 'bottom';

interface Options {
  offset?: number;
  placement?: Placement;
}

export const useToolbarPosition = (
  anchor: Position | null,
  ref: React.RefObject<HTMLElement>,
  options?: Options
) => {
  const [coords, setCoords] = useState<{ top: number; left: number; placement: Placement } | null>(null);

  useLayoutEffect(() => {
    if (!anchor) {
      setCoords(null);
      return;
    }

    const el = ref.current;
    const rect = el ? el.getBoundingClientRect() : ({ width: 240, height: 40 } as DOMRect);

    const viewportTop = window.scrollY;
    const viewportLeft = window.scrollX;
    const viewportRight = viewportLeft + window.innerWidth;
    const viewportBottom = viewportTop + window.innerHeight;

    const offset = options?.offset ?? 10;
    let placement: Placement = options?.placement ?? 'bottom';

    let left = anchor.left + (anchor.width - rect.width) / 2;
    left = Math.max(viewportLeft + 8, Math.min(left, viewportRight - rect.width - 8));

    const fitsBottom = anchor.bottom + offset + rect.height <= viewportBottom - 8;
    const fitsTop = anchor.top - offset - rect.height >= viewportTop + 8;

    let top = placement === 'bottom' ? anchor.bottom + offset : anchor.top - offset - rect.height;

    if (placement === 'bottom' && !fitsBottom && fitsTop) {
      placement = 'top';
      top = anchor.top - offset - rect.height;
    } else if (placement === 'top' && !fitsTop && fitsBottom) {
      placement = 'bottom';
      top = anchor.bottom + offset;
    } else {
      top = Math.max(viewportTop + 8, Math.min(top, viewportBottom - rect.height - 8));
    }

    setCoords({ top, left, placement });
  }, [anchor?.top, anchor?.left, anchor?.bottom, anchor?.right, anchor?.width, anchor?.height, options?.offset, options?.placement]);

  return coords;
};

