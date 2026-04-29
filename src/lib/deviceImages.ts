// lib/deviceImages.ts
//
// Client-side mapping from assistive-device code → local image asset.
// The gateway deliberately leaves image URLs OUT of the ```cards
// fenced block it appends to assistant messages. The backend knows
// about device codes and names (from sdp-service), but not about the
// asset bundle the frontend ships — that's purely a UI concern and
// keeping it here means designers can rename/re-shoot images without
// touching any backend service.
//
// If a device code arrives that we don't have art for, the gallery
// falls back to `/placeholder.svg`, so new device types degrade
// gracefully instead of showing a broken-image icon.

/** Single-source-of-truth for device artwork paths served by Vite. */
export const DEVICE_IMAGES: Record<string, string> = {
  WHEELCHAIR: "/devices/wheelchair.webp",
  WALKER: "/devices/walker.webp",
  CRUTCHES: "/devices/crutches.jpeg",
  HEARING_AID: "/devices/hearing-aid.webp",
};

/** Asset returned when the device code isn't in the map above. */
export const DEVICE_IMAGE_FALLBACK = "/placeholder.svg";

export function resolveDeviceImage(code: string): string {
  return DEVICE_IMAGES[code] ?? DEVICE_IMAGE_FALLBACK;
}
