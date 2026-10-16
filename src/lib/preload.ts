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
      // intro cinematic frames — preloaded so the spotlight beats never pop in late
      './sprites/oliver-intro-sit.png',
      './sprites/oliver-intro-tears.png',
      './sprites/oliver-intro-hearts.png',
      './sprites/oliver-intro-smooch.png',
    ];
    // staggered so the landing paints first; batch into two waves to avoid
    // flooding the connection / main thread on low-end machines
    const waves = [urls.slice(0, Math.ceil(urls.length / 2)), urls.slice(Math.ceil(urls.length / 2))];
    waves.forEach((wave, wi) => {
      setTimeout(() => {
        wave.forEach((src, i) => {
          setTimeout(() => {
            try {
              const img = new Image();
              (img as any).decoding = 'async';
              (img as any).fetchPriority = 'low';
              img.src = src;
              if ((img as any).decode) (img as any).decode().catch(() => {});
            } catch { /* noop */ }
          }, 40 * i);
        });
      }, 800 * wi);
    });
  } catch { /* noop */ }
}
