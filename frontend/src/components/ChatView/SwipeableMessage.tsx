import { useRef, useState, type ReactNode } from 'react';

const SWIPE_THRESHOLD = 56;
const MAX_DRAG = 80;

interface SwipeableMessageProps {
  sent: boolean;
  onReply: () => void;
  children: ReactNode;
}

export function SwipeableMessage({ sent, onReply, children }: SwipeableMessageProps) {
  const startX = useRef(0);
  const dragging = useRef(false);
  const [offset, setOffset] = useState(0);
  const [animating, setAnimating] = useState(false);

  const clampDrag = (dx: number) => {
    // WhatsApp-style: swipe right to reply (both sent and received)
    const drag = Math.max(0, Math.min(dx, MAX_DRAG));
    return drag;
  };

  const reset = () => {
    setAnimating(true);
    setOffset(0);
    window.setTimeout(() => setAnimating(false), 200);
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    dragging.current = true;
    startX.current = e.clientX;
    setAnimating(false);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    const dx = e.clientX - startX.current;
    setOffset(clampDrag(dx));
  };

  const onPointerUp = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* already released */
    }
    if (offset >= SWIPE_THRESHOLD) {
      onReply();
    }
    reset();
  };

  const onPointerCancel = () => {
    dragging.current = false;
    reset();
  };

  const showReplyHint = offset > 12;

  return (
    <div className={`message-swipe-row${sent ? ' message-swipe-row--sent' : ''}`}>
      <div
        className={`message-swipe-hint${showReplyHint ? ' message-swipe-hint--visible' : ''}`}
        aria-hidden
      >
        ↩
      </div>
      <div
        className={`message-swipe-track${animating ? ' message-swipe-track--snap' : ''}`}
        style={{ transform: `translateX(${offset}px)` }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {children}
      </div>
    </div>
  );
}
