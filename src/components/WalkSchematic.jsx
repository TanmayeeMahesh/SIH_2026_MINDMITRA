import React from 'react';

/** The caregiver-facing "map" — North-up, no tiles, no streets, nothing that
 *  needs a network or a signup. A dot for her, a line toward the
 *  destination, a ring for how wide the safe corridor is right now. This is
 *  what's used offline everywhere, and stays available even online as the
 *  fallback if the live-tile view (Leaflet, online-only) can't load. */
export default function WalkSchematic({ headingDeg = 0, targetBearing = 0, distanceM = 0, corridorM = 30, status = 'NAVIGATING_NORMAL' }) {
  const tone = status === 'CRITICAL_DEVIATION' ? 'crit' : status === 'GENTLE_REORIENT' ? 'warn' : 'ok';
  return (
    <div className={`schematic ${tone}`}>
      <svg viewBox="0 0 220 220" aria-hidden="true">
        <circle cx="110" cy="110" r="90" className="ring outer" />
        <circle cx="110" cy="110" r="46" className="ring corridor" />
        {/* Destination line, North-up */}
        <line x1="110" y1="110" x2={110 + 85 * Math.sin((targetBearing * Math.PI) / 180)} y2={110 - 85 * Math.cos((targetBearing * Math.PI) / 180)} className="line dest" />
        {/* Her heading wedge */}
        <g transform={`translate(110,110) rotate(${headingDeg})`}>
          <path d="M0 -14 L8 8 L0 3 L-8 8 Z" className="heading" />
        </g>
        <circle cx="110" cy="110" r="7" className="me" />
        <text x="110" y="18" textAnchor="middle" className="label">N</text>
      </svg>
      <div className="schematicMeta">
        <b>{Math.round(distanceM)} m</b>
        <span className="small">to go · safe path ±{Math.round(corridorM)} m</span>
      </div>
    </div>
  );
}
