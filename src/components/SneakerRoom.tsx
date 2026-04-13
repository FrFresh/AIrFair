import { useState, useEffect } from 'react';
import { Silhouette, PE } from '../data/silhouettes';
import { ShowcaseMode } from '../types/showcase';

type Props = {
  current: Silhouette;
  onClose?: () => void;
};

const MODE_LABEL: Record<ShowcaseMode, string> = {
  [ShowcaseMode.Scrim]:    'Projection Scrim',
  [ShowcaseMode.Panels]:   'Reveal Panels',
  [ShowcaseMode.Lightbox]: 'Lightbox Edition',
};

export default function SneakerRoom({ current, onClose }: Props) {
  const [activePE, setActivePE] = useState<PE>(current.pes[0]);

  // Reset to first PE when shoe changes
  useEffect(() => {
    setActivePE(current.pes[0]);
  }, [current.id]);

  return (
    <div className="museum-panel">
      <div className="panel-header">
        <div>
          {/* Eyebrow: showcase mode label */}
          <div className="panel-eyebrow" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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

        {onClose && (
          <button className="panel-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        )}
      </div>

      <p className="panel-description">{current.description}</p>

      <div className="panel-divider" />

      <div className="panel-section-label">Player Exclusives</div>

      {/* PE athlete tabs */}
      <div className="pe-tabs">
        {current.pes.map((pe) => (
          <button
            key={pe.athlete}
            className={`pe-tab ${activePE.athlete === pe.athlete ? 'active' : ''}`}
            onClick={() => setActivePE(pe)}
            style={{ '--accent': current.accentColor } as React.CSSProperties}
          >
            {pe.athlete.split(' ').pop()}
          </button>
        ))}
      </div>

      {/* Active PE card */}
      <div className="pe-card">
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
  );
}
