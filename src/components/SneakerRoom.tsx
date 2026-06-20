import { useState, useEffect } from 'react';
import { Silhouette, PE, SILHOUETTES } from '../data/silhouettes';

type Props = {
  current: Silhouette;
  onClose?: () => void;
  onPEChange?: (pe: PE) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

/** Model number from id: 'aj12' → 12. Drives the corner numeral. */
const modelNo = (id: string) => Number(id.replace('aj', ''));

/** Jumpman mark — official silhouette, painted via CSS mask (see .jumpman-mark). */
function Jumpman() {
  return <span className="jumpman-mark card-jump" aria-hidden="true" />;
}

// On mobile the card opens as a compact peek so the shoe stays visible;
// desktop opens expanded. User taps the grabber / ↓ control to toggle.
const isMobile = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches;

export default function SneakerRoom({ current, onClose, onPEChange, onPrev, onNext }: Props) {
  const [activePE, setActivePE] = useState<PE>(current.pes[0]);
  const [minimized, setMinimized] = useState(isMobile);

  // When shoe changes: reset to the featured PE; collapse on mobile, expand on desktop
  useEffect(() => {
    const first = current.pes[0];
    setActivePE(first);
    setMinimized(isMobile());
    onPEChange?.(first);
  }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const idx = SILHOUETTES.findIndex((s) => s.id === current.id);
  const total = SILHOUETTES.length;
  const prevModel = SILHOUETTES[(idx - 1 + total) % total];
  const nextModel = SILHOUETTES[(idx + 1) % total];

  return (
    <article
      className={`info-card${minimized ? ' minimized' : ''}`}
      style={{ '--accent': current.accentColor } as React.CSSProperties}
      aria-live="polite"
    >
      {/* ── Grabber handle — tap to expand/collapse (prominent on mobile) ── */}
      <button
        className="card-grabber"
        onClick={() => setMinimized((m) => !m)}
        aria-label={minimized ? 'Expand card' : 'Minimize card'}
      />

      {/* ── Top-right controls ─────────────────────────────────────── */}
      <div className="card-controls">
        <button
          className="card-ctrl"
          onClick={() => setMinimized((m) => !m)}
          aria-label={minimized ? 'Expand card' : 'Minimize card'}
        >
          {minimized ? '↑' : '↓'}
        </button>
        {onClose && (
          <button className="card-ctrl" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      {/* ── Top zone: eyebrow / status / headline + corner numeral ──── */}
      <div className="card-top">
        <div className="card-top-left">
          <div className="card-eyebrow">Jordan Brand Museum</div>
          <div className="card-status">
            <span className="card-dot" />
            On display
          </div>
          <div className="card-headline">{activePE.moment}</div>
        </div>
        <div className="card-numeral-wrap">
          <Jumpman />
          <div className="card-numeral">{modelNo(current.id)}</div>
        </div>
      </div>

      {/* ── Title ──────────────────────────────────────────────────── */}
      <h1 className="card-title">{current.title}</h1>

      {/* ── Featured player row ────────────────────────────────────── */}
      <div className="card-feat">
        <span className="card-who">{activePE.athlete}</span>
        <span className="card-team">— {activePE.team}</span>
        {activePE.designer && <span className="card-tag">Designer Edition</span>}
      </div>
      <div className="card-chip">
        <span className="card-sw" />
        {activePE.colorway}
      </div>

      {/* ── Collapsible body ───────────────────────────────────────── */}
      <div className="card-content">
        <div className="card-rule" />
        <p className="card-desc">{activePE.summary}</p>
      </div>

      {/* ── Prev / next model nav ──────────────────────────────────── */}
      <div className="card-nav">
        <button className="card-nav-btn" onClick={onPrev} aria-label="Previous shoe">
          <span className="card-nav-arrow">‹</span>
          <span>AJ {modelNo(prevModel.id)}</span>
        </button>
        <span className="card-ix">
          {idx + 1} / {total}
        </span>
        <button className="card-nav-btn" onClick={onNext} aria-label="Next shoe">
          <span>AJ {modelNo(nextModel.id)}</span>
          <span className="card-nav-arrow">›</span>
        </button>
      </div>
    </article>
  );
}
