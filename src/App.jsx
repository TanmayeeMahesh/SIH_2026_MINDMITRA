import React, { useEffect, useState } from 'react';
import { LockKeyhole, Sprout, Wifi, WifiOff } from 'lucide-react';
import { useStore, screenTimeReached } from './store/state.js';
import { configureAudio } from './audio/speak.js';
import { AUDIO } from './content/strings.js';
import { Chat, Games, General, Home, Nav, Profile, Progress } from './screens/Elder.jsx';
import MemoryMatch from './screens/MemoryMatch.jsx';
import FamilyTree from './screens/FamilyTree.jsx';
import Sequence from './screens/Sequence.jsx';
import FindSelect from './screens/FindSelect.jsx';
import MarketMoney from './screens/MarketMoney.jsx';
import SafeWalk from './screens/SafeWalk.jsx';
import Caregiver from './screens/Caregiver.jsx';
import { useSafeWalk } from './hooks/useSafeWalk.js';

export default function App() {
  const { state, update, ready } = useStore();
  const [screen, setScreen] = useState('home');
  const [gameSource, setGameSource] = useState('personal');
  const [care, setCare] = useState(false);
  const [pin, setPin] = useState(false);
  const [online, setOnline] = useState(navigator.onLine);

  const lang = state.profile.language;
  useEffect(() => { configureAudio(AUDIO[lang], lang); }, [lang]);
  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // The switch can only turn the online extras off; it can never claim a
  // connection that isn't there.
  const effectiveOnline = online && state.profile.mode !== 'offline';

  // Lives here, not inside the Safe Walk screen, so switching to Caregiver
  // mode mid-walk doesn't unmount the GPS watch — see hooks/useSafeWalk.js.
  // Called unconditionally, before the `ready` check below, because hooks
  // can never be called conditionally — `state` is always a valid object
  // (EMPTY until loaded), so this is safe even pre-load.
  const safeWalk = useSafeWalk(update, effectiveOnline);

  if (!ready) return <div className="shell"><div className="frame" /></div>;

  const GAME_SCREENS = ['memorymatch', 'familytree', 'sequence', 'findit', 'marketmoney'];
  const go = (s, source = 'personal') => {
    // Defensive re-check — the list screens already disable the card, this
    // just makes sure a stale reference can't slip past it (docs/04 §5: the
    // cap is a soft, invisible one, never a lock screen).
    if (GAME_SCREENS.includes(s) && screenTimeReached(state)) return;
    setGameSource(source);
    setScreen(s);
  };
  const back = () => setScreen('home');
  const exitGame = () => setScreen(gameSource === 'general' ? 'general' : 'games');

  const scale = state.profile.textScale || 1;
  const scaleClass = scale >= 1.3 ? ' bigger' : scale > 1 ? ' big' : '';

  return (
    <div className="shell">
      <div className={`frame${scaleClass}`}>
        {care ? (
          <Caregiver state={state} update={update} online={online} activeWalk={safeWalk}
            onExit={() => { setCare(false); setScreen('home'); }} />
        ) : (
          <>
            <header className="topbar">
              <div className="brand"><Sprout size={30} aria-hidden="true" />Mind<em>Mitra</em></div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                {/* Always shown, not just when offline — during a demo the
                    current mode should never be something you have to guess. */}
                <span className="pill" title={effectiveOnline
                  ? 'Online extras available. Everything still works without internet.'
                  : 'Offline. Every game, the adaptive engine, reminders and reports work exactly the same.'}>
                  {effectiveOnline
                    ? <><Wifi size={16} aria-hidden="true" /> Online</>
                    : <><WifiOff size={16} aria-hidden="true" /> Offline</>}
                </span>
                <button className="iconbtn" onClick={() => setPin(true)} aria-label="Caregiver mode">
                  <LockKeyhole size={24} />
                </button>
              </div>
            </header>

            {screen === 'home' && <Home state={state} go={go} update={update} />}
            {screen === 'games' && <Games state={state} go={go} onBack={back} />}
            {screen === 'general' && <General state={state} go={go} onBack={back} />}
            {screen === 'progress' && <Progress state={state} onBack={back} />}
            {screen === 'profile' && <Profile state={state} update={update} onBack={back} />}
            {screen === 'chat' && <Chat state={state} update={update} onBack={back} go={go} />}
            {screen === 'memorymatch' && <MemoryMatch state={state} update={update} source={gameSource} onExit={exitGame} />}
            {screen === 'familytree' && <FamilyTree state={state} update={update} onExit={exitGame} />}
            {screen === 'sequence' && <Sequence state={state} update={update} source={gameSource} onExit={exitGame} />}
            {screen === 'findit' && <FindSelect state={state} update={update} source={gameSource} onExit={exitGame} />}
            {screen === 'marketmoney' && <MarketMoney state={state} update={update} onExit={exitGame} />}
            {screen === 'safewalk' && <SafeWalk state={state} walk={safeWalk} online={effectiveOnline} onExit={back} />}

            {['home', 'progress', 'profile', 'safewalk'].includes(screen) && <Nav screen={screen} go={go} lang={lang} />}
          </>
        )}

        {pin && <Pin onClose={() => setPin(false)} onOk={() => { setPin(false); setCare(true); }} />}
      </div>
    </div>
  );
}

function Pin({ onClose, onOk }) {
  const [v, setV] = useState('');
  return (
    <div style={{ position: 'absolute', inset: 0, background: '#332F29cc', display: 'grid', placeItems: 'center', padding: 20, zIndex: 20 }}>
      <div className="panel" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
        <LockKeyhole size={36} aria-hidden="true" />
        <h2 style={{ marginTop: 10 }}>Caregiver mode</h2>
        <p className="small">Prototype PIN is 1234.</p>
        <input value={v} onChange={(e) => setV(e.target.value)} inputMode="numeric"
          style={{ textAlign: 'center', fontSize: 28, letterSpacing: 8, marginTop: 12 }} aria-label="PIN" />
        <button className="btn primary" style={{ marginTop: 14 }} onClick={() => v === '1234' && onOk()}>Open</button>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onClose}>Back</button>
      </div>
    </div>
  );
}
