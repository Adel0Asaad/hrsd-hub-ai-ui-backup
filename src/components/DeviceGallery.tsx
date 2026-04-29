// components/DeviceGallery.tsx
//
// Horizontal image strip rendered inside an assistant chat bubble
// whenever the LLM reply includes a ```cards fenced block with
// kind === "gallery" (see lib/parseCardsBlock.ts).
//
// Design notes:
//   * LTR direction is forced on the strip itself — we want the
//     "scroll right for more" affordance to be consistent regardless
//     of the active UI language. The item *name* inside each card
//     still honours `dir="auto"` so Arabic renders right-aligned.
//   * Cards are `shrink-0` so they never squish to fit; the strip
//     scrolls horizontally when the total width exceeds the bubble.
//   * CSS scroll-snap keeps manual swipes landing on card boundaries
//     rather than mid-image, which feels markedly more polished on
//     touch devices.
//   * `loading="lazy"` keeps the gallery cheap even if a reply lists
//     many items — images only fetch when scrolled into view.
//
// Interaction notes:
//   * Clicking the image opens an ImageLightbox with zoom + pan.
//   * A small "Select" button under each card calls onSelect(item)
//     so the parent (ChatMessage → Chat) can prefill the input.
//   * The Select button is a real <button> (not a wrapping <a>) so
//     screen readers announce it with the correct role and it
//     doesn't nest inside the image's click target.

import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { CheckCircle2 } from "lucide-react";
import type { CardItem } from "@/lib/parseCardsBlock";
import { resolveDeviceImage } from "@/lib/deviceImages";
import ImageLightbox from "./ImageLightbox";

interface DeviceGalleryProps {
  items: CardItem[];
  /**
   * Called when the user clicks the "Select" button on a card.
   * The parent typically prefills the chat input with item.name.
   */
  onSelect?: (item: CardItem) => void;
}

const DeviceGallery = ({ items, onSelect }: DeviceGalleryProps) => {
  const { lang } = useLanguage();
  const [lightbox, setLightbox] = useState<CardItem | null>(null);

  if (!items || items.length === 0) return null;

  const selectLabel = lang === "ar" ? "اختيار" : "Select";
  const expandLabel = lang === "ar" ? "تكبير الصورة" : "Open image";
  const listLabel = lang === "ar" ? "الأجهزة المساعدة" : "Assistive devices";

  return (
    <>
      <div
        className="mt-2 flex gap-3 overflow-x-auto overflow-y-hidden pb-2 snap-x snap-mandatory scroll-smooth"
        style={{ direction: "ltr" }}
        role="list"
        aria-label={listLabel}
      >
        {items.map((item) => {
          const src = resolveDeviceImage(item.code);
          return (
            <div
              key={item.code}
              role="listitem"
              className="shrink-0 w-40 snap-start rounded-xl border border-border bg-background shadow-sm overflow-hidden flex flex-col"
            >
              {/*
                The image area is a <button> so keyboard users can open
                the lightbox via Enter/Space and screen readers announce
                it as an actionable control.
              */}
              <button
                type="button"
                onClick={() => setLightbox(item)}
                className="aspect-square bg-accent/40 flex items-center justify-center hover:bg-accent/60 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label={`${expandLabel}: ${item.name}`}
                title={expandLabel}
              >
                <img
                  src={src}
                  alt={item.name}
                  loading="lazy"
                  draggable={false}
                  className="w-full h-full object-contain p-2 select-none pointer-events-none"
                  onError={(e) => {
                    // Fall back to the placeholder if the asset 404s —
                    // e.g. an unknown code slipped past the map.
                    const target = e.currentTarget;
                    if (target.dataset.fallbackApplied) return;
                    target.dataset.fallbackApplied = "1";
                    target.src = "/placeholder.svg";
                  }}
                />
              </button>

              <div
                className="px-3 pt-2 text-xs font-medium text-foreground truncate"
                dir="auto"
                title={item.name}
              >
                {item.name}
              </div>

              {onSelect && (
                <div className="px-2 py-2">
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="w-full flex items-center justify-center gap-1.5 text-xs font-medium rounded-lg border border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground active:scale-[0.98] transition-all py-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`${selectLabel}: ${item.name}`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{selectLabel}</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightbox && (
        <ImageLightbox
          src={resolveDeviceImage(lightbox.code)}
          alt={lightbox.name}
          caption={lightbox.name}
          onClose={() => setLightbox(null)}
        />
      )}
    </>
  );
};

export default DeviceGallery;
