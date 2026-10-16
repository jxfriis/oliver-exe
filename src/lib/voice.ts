// Voice via Puter.js v2 (js.puter.com/v2), loaded lazily on first SPEAK press,
// with speechSynthesis fallback. Only ever called from a user gesture.
declare global {
  interface Window { puter?: any }
}

let puterLoading: Promise<boolean> | null = null;

function loadPuter(): Promise<boolean> {
  if (window.puter?.ai?.txt2speech) return Promise.resolve(true);
  if (puterLoading) return puterLoading;
  puterLoading = new Promise((resolve) => {
    try {
      const s = document.createElement('script');
      s.src = 'https://js.puter.com/v2/';
      s.onload = () => resolve(!!window.puter?.ai?.txt2speech);
      s.onerror = () => resolve(false);
      document.head.appendChild(s);
      setTimeout(() => resolve(!!window.puter?.ai?.txt2speech), 8000);
    } catch {
      resolve(false);
    }
  });
  return puterLoading;
}

export async function speak(text: string): Promise<boolean> {
  const short = text.slice(0, 220);
  // 1) Puter cloud TTS (many voices, no key needed)
  try {
    if (await loadPuter()) {
      const audio = await window.puter.ai.txt2speech(short, { voice: 'Joanna' });
      if (audio && typeof audio.play === 'function') {
        await audio.play();
        return true;
      }
    }
  } catch {
    /* fall through to system voice */
  }
  // 2) standard system voices only — never clone Oliver's actual voice
  try {
    window.speechSynthesis?.cancel();
    const u = new SpeechSynthesisUtterance(short);
    u.rate = 1.02; u.pitch = 1.1;
    window.speechSynthesis?.speak(u);
    return true;
  } catch {
    return false;
  }
}
