import { useState, useEffect } from 'react';
import { Silhouette, PE } from '../data/silhouettes';
import { ShowcaseMode } from '../types/showcase';

type Props = {
  current: Silhouette;
  onClose?: () => void;
  onPEChange?: (pe: PE) => void;
  onPrev?: () => void;
  onNext?: () => void;
};

const MODE_LABEL: Record<ShowcaseMode, string> = {
  [ShowcaseMode.Scrim]:    'Projection Scrim',
  [ShowcaseMode.Panels]:   'Reveal Panels',
  [ShowcaseMode.Lightbox]: 'Lightbox Edition',
};

export default function SneakerRoom({ current, onClose, onPEChange, onPrev, onNext }: Props) {
  const [activePE, setActivePE] = useState<PE>(current.pes[0]);
  const [minimized, setMinimized] = useState(false);

  // When shoe changes: expand panel and reset to first PE
  useEffect(() => {
    const first = current.pes[0];
    setActivePE(first);
    setMinimized(false);
    onPEChange?.(first);
  }, [current.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectPE = (pe: PE) => {
    setActivePE(pe);
    onPEChange?.(pe);
  };

  return (
    <div className={`museum-panel${minimized ? ' minimized' : ''}`}>

      {/* ── Always-visible header bar ───────────────────────────── */}
      <div className="panel-header">

        {/* Prev shoe */}
        <button
          className="panel-nav-btn"
          onClick={onPrev}
          aria-label="Previous shoe"
        >
          ‹
        </button>

        {/* Title stack */}
        <div className="panel-title-stack">
          <div className="panel-eyebrow">
            <span>Jordan Brand Museum</span>
            <span
              className="mode-badge"
              style={{ background: current.accentColor }}
            >
              {MODE_LABEL[current.showcaseMode]}
            </span>
          </div>
          <h2 className="panel-title">{current.title}</h2>
          <div className="panel-subtitle">
            {current.subtitle}&nbsp;&middot;&nbsp;{current.year}
          </div>
        </div>

        {/* Actions: next, minimize, close */}
        <div className="panel-actions">
          <button
            className="panel-nav-btn"
            onClick={onNext}
            aria-label="Next shoe"
          >
            ›
          </button>
          <button
            className="panel-minimize-btn"
            onClick={() => setMinimized(m => !m)}
            aria-label={minimized ? 'Expand panel' : 'Minimize panel'}
          >
            {minimized ? '↑' : '↓'}
          </button>
          {onClose && (
            <button className="panel-close" onClick={onClose} aria-label="Close">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Collapsible content ─────────────────────────────────── */}
      <div className="panel-content">
        <p className="panel-description">{current.description}</p>

        <div className="panel-divider" />

        <div className="panel-section-label">Player Exclusives</div>

        {/* PE athlete tabs */}
        <div className="pe-tabs">
          {current.pes.map((pe) => (
            <button
              key={pe.athlete}
              className={`pe-tab ${activePE.athlete === pe.athlete ? 'active' : ''}`}
              onClick={() => selectPE(pe)}
              style={{ '--accent': current.accentColor } as React.CSSProperties}
            >
              {pe.athlete.split(' ').pop()}
            </button>
          ))}
        </div>

        {/* Active PE card */}
        <div className="pe-card">
          <div
            className="pe-player-photo"
            style={{ '--accent': current.accentColor } as React.CSSProperties}
          >
            {activePE.playerImage ? (
              <img
                src={activePE.playerImage}
                alt={`${activePE.athlete} wearing ${activePE.peName}`}
              />
            ) : (
              <div className="pe-player-photo-placeholder">
                <span>{activePE.athlete}</span>
              </div>
            )}
          </div>

          <div className="pe-card-header">
            <div>
              <div className="pe-name">{activePE.peName}</div>
              <div className="pe-athlete">{activePE.athlete}</div>
            </div>
            <div
              className="pe-year-badge"
              style={{ background: current.accentColor }}
            >
              {activePE.year}
            </div>
          </div>

          <div className="pe-colorway">
            <span className="colorway-label">Colorway</span>
            <span className="colorway-value">{activePE.colorway}</span>
          </div>

          <p className="pe-summary">{activePE.summary}</p>
        </div>
      </div>
    </div>
  );
}
