// Preload every sprite/audio poster so skin switching is instant.
// Called once on app mount (while the landing is showing).
import { SPRITES, HD_SPRITES, HD_CUTOUT } from './sprites';

let done = false;
export function preloadAll() {
  if (done) return;
  done = true;
  try {
    const urls = [
      ...Object.values(SPRITES),
      ...Object.values(HD_SPRITES),
      HD_CUTOUT,
      './fx-anger.png',
      './castle-closed.jpg',
      './castle-open.jpg',
    ];
    // staggered so the landing paints first
    urls.forEach((src, i) => {
      setTimeout(() => {
        try {
          const img = new Image();
          (img as any).decoding = 'async';
          img.src = src;
          if ((img as any).decode) (img as any).decode().catch(() => {});
        } catch { /* noop */ }
      }, 60 * i);
    });
  } catch { /* noop */ }
}
