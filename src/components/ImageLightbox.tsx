// components/ImageLightbox.tsx
//
// Modal image viewer with zoom in/out, drag-to-pan, and keyboard
// controls. Rendered in a portal so it escapes the chat bubble's
// overflow/z-index constraints.
//
// Why roll our own instead of pulling in a lightbox library?
//   * No dependency surface — this project already ships a fairly
//     lean bundle and a full-fat lightbox lib adds ~20–40 kB gzipped.
//   * Our needs are narrow (one image at a time, zoom + pan + close)
//     and the component is <200 lines including accessibility.
//
// Accessibility notes:
//   * role="dialog", aria-modal="true", aria-label from the caption.
//   * ESC closes; focus is moved to the close button on open and
//     returned to the previously-focused element on close.
//   * The backdrop is click-to-close but the image + controls are not
//     (pointerdown propagation is stopped on those).
//   * We avoid trapping wheel events globally — wheel-to-zoom is only
//     armed while the pointer is over the image container, so the
//     underlying page still scrolls normally when it gains focus
//     after the modal is closed.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

interface ImageLightboxProps {
  src: string;
  alt: string;
  /** Optional caption rendered under the image. Also used as aria-label. */
  caption?: string;
  /** Fallback src used if `src` 404s. */
  fallbackSrc?: string;
  onClose: () => void;
}

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;
const WHEEL_ZOOM_SENSITIVITY = 0.0015;

const ImageLightbox = ({
  src,
  alt,
  caption,
  fallbackSrc = "/placeholder.svg",
  onClose,
}: ImageLightboxProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [currentSrc, setCurrentSrc] = useState(src);

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus management — move focus into the dialog on mount and
  // restore it on close. This also anchors keyboard handling so ESC
  // triggers even before the user clicks anything.
  useEffect(() => {
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus();
    return () => {
      previouslyFocusedRef.current?.focus?.();
    };
  }, []);

  // Reset view when a new image is shown.
  useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setCurrentSrc(src);
  }, [src]);

  // Body scroll lock while open — scrolling the page underneath the
  // modal is disorienting, especially on touch where a swipe might
  // drift past the backdrop.
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const handleClose = useCallback(() => onClose(), [onClose]);

  const resetView = useCallback(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, []);

  const zoomIn = useCallback(() => {
    setZoom((z) => clamp(z + ZOOM_STEP, MIN_ZOOM, MAX_ZOOM));
  }, []);

  const zoomOut = useCallback(() => {
    setZoom((z) => {
      const next = clamp(z - ZOOM_STEP, MIN_ZOOM, MAX_ZOOM);
      // When we're fully zoomed out, reset pan too so the image
      // re-centers — otherwise repeated zoom-out leaves it offset.
      if (next <= MIN_ZOOM) setPan({ x: 0, y: 0 });
      return next;
    });
  }, []);

  // Keyboard shortcuts. Bound to the document rather than the root
  // element so they work regardless of which inner control has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleClose();
      } else if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        zoomIn();
      } else if (e.key === "-" || e.key === "_") {
        e.preventDefault();
        zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        resetView();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [handleClose, zoomIn, zoomOut, resetView]);

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // Negative deltaY = wheel up = zoom in (standard convention on
    // desktop image viewers).
    e.preventDefault();
    setZoom((z) => clamp(z - e.deltaY * WHEEL_ZOOM_SENSITIVITY, MIN_ZOOM, MAX_ZOOM));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (zoom <= MIN_ZOOM) return; // No pan at base zoom.
    (e.target as Element).setPointerCapture?.(e.pointerId);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const start = dragStartRef.current;
    if (!start) return;
    setPan({
      x: start.panX + (e.clientX - start.x),
      y: start.panY + (e.clientY - start.y),
    });
  };

  const endDrag = () => {
    dragStartRef.current = null;
    setIsDragging(false);
  };

  const onBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only close when the backdrop itself is the direct target —
    // clicks that bubbled up from a nested control (button, image)
    // should not dismiss.
    if (e.target === e.currentTarget) handleClose();
  };

  const overlay = (
    <div
      className="fixed inset-0 z-[100] bg-black/85 backdrop-blur-sm flex items-center justify-center animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label={caption || alt || "Image viewer"}
      onClick={onBackdropClick}
      style={{ direction: "ltr" }}
    >
      {/* Top-right controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= MIN_ZOOM}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Zoom out"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= MAX_ZOOM}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Zoom in"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          type="button"
          onClick={resetView}
          disabled={zoom === MIN_ZOOM && pan.x === 0 && pan.y === 0}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Reset zoom"
          title="Reset (0)"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          ref={closeBtnRef}
          type="button"
          onClick={handleClose}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
          aria-label="Close"
          title="Close (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Zoom level readout */}
      <div className="absolute top-4 left-4 text-xs text-white/70 font-mono bg-white/10 rounded-full px-3 py-1 pointer-events-none">
        {Math.round(zoom * 100)}%
      </div>

      {/* Image stage */}
      <div
        className="max-w-[92vw] max-h-[85vh] overflow-hidden flex items-center justify-center"
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={(e) => e.stopPropagation()}
        style={{
          cursor: zoom > MIN_ZOOM ? (isDragging ? "grabbing" : "grab") : "default",
          touchAction: "none",
        }}
      >
        <img
          src={currentSrc}
          alt={alt}
          draggable={false}
          className="max-w-full max-h-[85vh] object-contain select-none"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transition: isDragging ? "none" : "transform 0.12s ease-out",
          }}
          onError={(e) => {
            const target = e.currentTarget;
            if (target.dataset.fallbackApplied) return;
            target.dataset.fallbackApplied = "1";
            setCurrentSrc(fallbackSrc);
          }}
        />
      </div>

      {/* Caption */}
      {caption && (
        <div
          className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/40 rounded-full px-4 py-1.5 max-w-[80vw] truncate"
          dir="auto"
          onClick={(e) => e.stopPropagation()}
        >
          {caption}
        </div>
      )}
    </div>
  );

  return createPortal(overlay, document.body);
};

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export default ImageLightbox;
