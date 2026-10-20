import React, { useEffect, useRef, useState } from 'react';

// Full-screen portal into the standalone Three.js island.
// Kept inside an iframe so the original React playground keeps running untouched.
function ThreeWorld({ onClose }: { onClose: () => void }) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const [progress, setProgress] = useState(8);
  const [ready, setReady] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const close = () => {
    if (leaving) return;
    setLeaving(true);
    window.setTimeout(onClose, 360);
  };

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((p) => (p >= 90 ? 90 : p + Math.max(1, (90 - p) * 0.09)));
    }, 130);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <div className={`threePortal ${leaving ? 'threePortalOut' : ''}`} role="dialog" aria-label="OLIVER.EXE 3D world">
      <div className="threeBar">
        <div className="threeBarBrand">
          <span className="threeDot" />
          OLIVER.EXE <b>3D DIMENSION</b>
        </div>
        <div className="threeBarHint">WASD move &middot; SPACE jump &middot; DRAG look &middot; E interact &middot; F dance</div>
        <button className="threeBack" onClick={close}>&larr; BACK TO THE LAB</button>
      </div>
      <div className="threeFrameWrap">
        <iframe
          ref={frameRef}
          className="threeFrame"
          src="./3d/index.html"
          title="OLIVER.EXE 3D world"
          allow="autoplay; fullscreen; gamepad"
          onLoad={() => {
            setProgress(100);
            window.setTimeout(() => setReady(true), 420);
            frameRef.current?.focus();
          }}
        />
        {!ready && (
          <div className="threeLoader">
            <div className="threePortalRing"><i /><i /><i /></div>
            <div className="threeLoaderTitle">OPENING THE 3D DIMENSION</div>
            <div className="threeLoaderTrack"><i style={{ width: `${progress}%` }} /></div>
            <div className="threeLoaderPct">{Math.round(progress)}%</div>
          </div>
        )}
      </div>
    </div>
  );
}

export default React.memo(ThreeWorld);
