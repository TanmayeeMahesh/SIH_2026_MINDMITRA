import React from 'react';
import { DENOMINATIONS } from '../content/currency.js';

/** A photograph of the real note or coin — see the licensing note in
 *  content/currency.js. The tinted background shows while the image loads and
 *  stands in if a file is ever missing, so a card is never blank. */
export default function Currency({ value, kind, count = 0, className = '' }) {
  const d = DENOMINATIONS.find((x) => x.value === value && (!kind || x.kind === kind))
    || DENOMINATIONS.find((x) => x.value === value);
  const isCoin = (d?.kind || kind) === 'coin';
  return (
    <div className={`money ${isCoin ? 'coin' : 'note'} ${className}`} style={{ background: d?.bg || '#6F3D35' }}>
      {d?.src && <img src={d.src} alt="" aria-hidden="true" />}
      <span className="rs">₹{value}</span>
      {count > 0 && <span className="badge">×{count}</span>}
    </div>
  );
}
