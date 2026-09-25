import React, { lazy, Suspense, useState } from 'react';
import { ArrowLeft, Camera, Compass, Map as MapIcon, TriangleAlert, Volume2 } from 'lucide-react';
import BigArrow from '../components/BigArrow.jsx';
import ArrowCameraView from '../components/ArrowCameraView.jsx';
import { gardenState } from '../engine/garden.js';
import { play } from '../audio/speak.js';

// Leaflet (~40KB + CSS) only ever loads when someone actually taps Map view —
// never for the default Arrow view, and never at all in offline mode.
const LiveMap = lazy(() => import('../components/LiveMap.jsx'));

/**
 * Safe Walk — the elder-facing screen. Deliberately NOT a map app: pick a
 * place, get one big arrow and a distance, walk. All the state and the live
 * GPS watch live in useSafeWalk() at the App root (see docs there for why) —
 * this component only ever renders whatever that hook currently says.
 */
export default function SafeWalk({ state, walk, online, onExit }) {
  const { phase, place, route, status, error, choose, cancel, sos, reset, canWalkTo } = walk;
  const places = state.safePlaces || [];
  const garden = gardenState(state.garden?.points ?? 40);
  const [view, setView] = useState('arrow'); // arrow | map | camera — arrow is always the default

  /* ---------------------------------------------------------- pick screen */
  if (phase === 'pick') {
    return (
      <Shell onExit={onExit} title="Safe Walk">
        {!places.length
          ? (
            <div className="panel">
              <h2>No safe places yet</h2>
              <p className="sub">A caregiver can add home, the market, or the temple in Caregiver mode.</p>
              <button className="btn primary" onClick={onExit}>Go back</button>
            </div>
          )
          : (
            <div className="glist">
              {places.map((p) => {
                const ok = canWalkTo(p);
                return (
                  <button key={p.id} className="gcard" disabled={!ok} style={ok ? undefined : { opacity: 0.5 }}
                    onClick={() => ok && choose(p)}>
                    <span className="ico" aria-hidden="true" style={{ fontSize: 30 }}>{p.icon}</span>
                    <b>{p.name}</b>
                    <span className="small">{ok ? 'Tap to walk there' : 'Needs a saved path or a connection'}</span>
                  </button>
                );
              })}
            </div>
          )}
        <div className="quote" style={{ marginTop: 18 }}>
          <span>🌱 {garden.points} pts</span>
          <div><b>{garden.name}</b></div>
        </div>
      </Shell>
    );
  }

  if (phase === 'locating') {
    return (
      <Shell onExit={cancel} title={place?.name}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <h2>Finding you…</h2>
          <p className="sub">One moment.</p>
        </div>
      </Shell>
    );
  }

  if (phase === 'blocked') {
    return (
      <Shell onExit={onExit} title={place?.name}>
        <div className="panel">
          <h2>Can't start this walk yet</h2>
          <p className="sub">{error}</p>
          <button className="btn primary" onClick={reset}>Go back</button>
        </div>
      </Shell>
    );
  }

  if (phase === 'arrived') {
    return (
      <Shell onExit={onExit} title={place?.name}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }} aria-hidden="true">🌼</div>
          <h2>Safely at {place?.name}</h2>
          <button className="btn primary" onClick={() => { reset(); onExit(); }}>Finish</button>
        </div>
      </Shell>
    );
  }

  /* ------------------------------------------------------------- walking */
  const rotate = status?.arrowDiff ?? 0;
  const crit = status?.status === 'CRITICAL_DEVIATION';
  const warn = status?.status === 'GENTLE_REORIENT';
  const distLabel = status ? `${Math.round(status.distanceToDestM)} m` : '…';

  return (
    <Shell onExit={cancel} title={place?.name}>
      {/* Arrow is always available (offline-safe, zero dependency). Map only
          makes sense online (needs live tiles). Camera needs no connection
          but does need a permission grant — see ArrowCameraView.jsx for the
          honest take on what this view actually is. */}
      <div className="viewSwitch" role="group" aria-label="How to show the way">
        <button className={view === 'arrow' ? 'on' : ''} onClick={() => setView('arrow')}><Compass size={18} /> Arrow</button>
        <button className={view === 'map' ? 'on' : ''} onClick={() => online && setView('map')} disabled={!online}>
          <MapIcon size={18} /> Map
        </button>
        <button className={view === 'camera' ? 'on' : ''} onClick={() => setView('camera')}><Camera size={18} /> Camera</button>
      </div>

      {view === 'arrow' && (
        <div className={`walkStage${crit ? ' crit' : warn ? ' warn' : ''}`}>
          <BigArrow rotateDeg={rotate} calm={warn || crit} />
          <b className="walkDist">{distLabel}</b>
          <span className="small">to {place?.name}</span>
        </div>
      )}

      {view === 'map' && online && (
        <Suspense fallback={<p className="small" style={{ textAlign: 'center' }}>Loading the map…</p>}>
          <LiveMap route={route} here={status?.here} place={place} />
          <b className="walkDist" style={{ display: 'block', textAlign: 'center', marginTop: 10 }}>{distLabel}</b>
        </Suspense>
      )}

      {view === 'camera' && (
        <ArrowCameraView rotateDeg={rotate} distanceLabel={distLabel} />
      )}

      {(warn || crit) && (
        <div className="cue">
          <TriangleAlert size={22} aria-hidden="true" />
          <span>{crit ? "Let's stop here and rest. Help is on the way." : "Let's turn and find the path again."}</span>
        </div>
      )}

      <button className="speaker" style={{ margin: '14px auto' }} onClick={() => play('walk.repeat', 'Follow the arrow.')}>
        <Volume2 size={26} />
      </button>

      <button className="btn primary sos" onClick={sos}>I need help</button>
      <button className="btn ghost" style={{ marginTop: 10 }} onClick={cancel}>I'm done for today</button>
    </Shell>
  );
}

function Shell({ children, onExit, title }) {
  return (
    <>
      <div className="gtop">
        <button className="iconbtn" onClick={onExit} aria-label="Back"><ArrowLeft size={26} /></button>
        <b style={{ flex: 1, textAlign: 'center' }}>{title || 'Safe Walk'}</b>
        <span style={{ width: 56 }} />
      </div>
      <div className="scroll">{children}</div>
    </>
  );
}
