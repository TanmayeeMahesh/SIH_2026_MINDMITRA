import React from 'react';

/** The entire elder-facing navigation UI, structurally: one big arrow. No
 *  map, no streets, no north/south — just "turn until it points straight up,
 *  then walk." `rotateDeg` is signed (positive = turn right), matching
 *  engine/geodesic.js's signedBearingDiff / walkSession's `arrowDiff`. */
export default function BigArrow({ rotateDeg = 0, calm = false }) {
  return (
    <div className={`bigArrowWrap${calm ? ' calm' : ''}`}>
      <svg viewBox="0 0 200 200" className="bigArrow" style={{ transform: `rotate(${rotateDeg}deg)` }} aria-hidden="true">
        <path
          d="M100 18 L156 92 L124 92 L124 182 L76 182 L76 92 L44 92 Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
}
