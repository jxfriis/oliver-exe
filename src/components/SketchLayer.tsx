import { useRef, useEffect, useState, useImperativeHandle, forwardRef } from 'react';

export interface Stroke { pts: { x: number; y: number }[]; color: string; width: number; tool: string; alpha: number }
export interface StampMark { x: number; y: number; emoji: string; size: number }

interface Props {
  active: boolean;
  tool: string;
  color: string;
  width: number;
  stamp: string | null;
  strokes: Stroke[];
  stamps: StampMark[];
  onStrokes: (s: Stroke[]) => void;
  onStamps: (s: StampMark[]) => void;
  onDrawn: () => void;
}

export interface SketchHandle {
  undo: () => void; redo: () => void; clear: () => void;
  canUndo: boolean; canRedo: boolean;
}

// Canvas fills the Oliver box (fractions 0..1), so drawings stay glued to Oliver.
const SketchLayer = forwardRef<SketchHandle, Props>(function SketchLayer(props, ref) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<Stroke | null>(null);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);

  useImperativeHandle(ref, () => ({
    undo() {
      if (props.strokes.length === 0) return;
      const s = [...props.strokes]; const last = s.pop()!;
      props.onStrokes(s); setRedoStack((r) => [...r, last]);
    },
    redo() {
      if (redoStack.length === 0) return;
      const r = [...redoStack]; const s = r.pop()!;
      setRedoStack(r); props.onStrokes([...props.strokes, s]);
    },
    clear() { props.onStrokes([]); props.onStamps([]); setRedoStack([]); },
    canUndo: props.strokes.length > 0,
    canRedo: redoStack.length > 0,
  }));

  const render = () => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    const drawOne = (st: Stroke) => {
      ctx.save();
      ctx.globalAlpha = st.alpha;
      ctx.strokeStyle = st.tool === 'eraser' ? 'rgba(0,0,0,1)' : st.color;
      ctx.lineWidth = Math.max(1, (st.width / 300) * W);
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (st.tool === 'eraser') ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      st.pts.forEach((p, i) => {
        const X = p.x * W, Y = p.y * H;
        if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
      });
      // single dot tap still leaves a mark
      if (st.pts.length === 1) {
        const X = st.pts[0].x * W, Y = st.pts[0].y * H;
        ctx.moveTo(X, Y); ctx.lineTo(X + 0.5, Y + 0.5);
      }
      ctx.stroke();
      ctx.restore();
    };
    for (const st of props.strokes) drawOne(st);
    // live in-progress stroke — so you see it WHILE drawing
    if (drawing.current && drawing.current.pts.length > 0) drawOne(drawing.current);
    ctx.save();
    for (const m of props.stamps) {
      ctx.font = `${(m.size / 300) * W}px serif`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(m.emoji, m.x * W, m.y * H);
    }
    ctx.restore();
  };

  useEffect(() => { render(); });
  useEffect(() => {
    const fit = () => {
      const cv = canvasRef.current; if (!cv) return;
      const parent = cv.parentElement!; const r = parent.getBoundingClientRect();
      cv.width = Math.max(50, Math.round(r.width * 2));
      cv.height = Math.max(50, Math.round(r.height * 2));
      render();
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pos = (e: React.PointerEvent) => {
    const r = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    return { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height };
  };

  if (!props.active) {
    // still render non-interactive overlay so art stays visible
    return (
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20 }}>
        <canvas ref={canvasRef} className="w-full h-full" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0" style={{ zIndex: 20 }}>
      <canvas
        ref={canvasRef}
        className="w-full h-full sketch-canvas cursor-crosshair"
        style={{ borderRadius: 24 }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
          const p = pos(e);
          if (props.stamp) {
            props.onStamps([...props.stamps, { x: p.x, y: p.y, emoji: props.stamp, size: 34 }]);
            props.onDrawn();
            return;
          }
          drawing.current = {
            pts: [p], color: props.color, width: props.width,
            tool: props.tool, alpha: props.tool === 'highlighter' ? 0.45 : 1,
          };
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          drawing.current.pts.push(pos(e));
          render();
        }}
        onPointerUp={() => {
          if (drawing.current) {
            props.onStrokes([...props.strokes, drawing.current]);
            setRedoStack([]);
            drawing.current = null;
            props.onDrawn();
          }
        }}
      />
    </div>
  );
});

export default SketchLayer;
