import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, Volume2 } from 'lucide-react';
import Currency from '../components/Currency.jsx';
import { buildMarketMoney } from '../engine/session.js';
import { GAMES, applyBounds } from '../engine/ladder.js';
import { updateAbility, CALIBRATION_K, STEADY_K } from '../engine/elo.js';
import { observeState, decide, explainDecision, applyAction } from '../engine/policy.js';
import { greedyBreakdown } from '../content/currency.js';
import { abilityFor, bestRecentLevel, recentSessions, uid } from '../store/state.js';
import { play, stopAudio } from '../audio/speak.js';
import { t } from '../content/strings.js';

const COUNT = 3;
const DIM_KEY = 'amount';

/* E2 — Find & Select, numeracy variant ("Market Day"). Same "pick from a
 * field to reach a target" shape as Find It, but the target is an amount
 * instead of a name. Tap notes/coins to build up a running total; there is no
 * "submit" step — the moment the total matches, it resolves on its own. */
export default function MarketMoney({ state, update, onExit }) {
  const lang = state.profile.language;
  const dims = GAMES.marketmoney.dims;

  const [ability, setAbility] = useState(() => abilityFor(state, 'marketmoney', dims));
  const startAbility = useRef(abilityFor(state, 'marketmoney', dims));
  const [built, setBuilt] = useState(() => buildMarketMoney({ state, ability, count: COUNT }));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState({}); // { value: count }
  const [overshoot, setOvershoot] = useState(null);
  const [cueLevel, setCueLevel] = useState(0);
  const [resolved, setResolved] = useState(false);
  const [results, setResults] = useState([]);
  const [actions, setActions] = useState([]);
  const [floor, setFloor] = useState(false);
  const [done, setDone] = useState(false);
  const misses = useRef(0);
  const shownAt = useRef(Date.now());
  const startedAt = useRef(Date.now());

  const item = built.items[idx];
  const settings = built.settings;
  const total = built.items.length || 1;

  useEffect(() => {
    if (!item || done) return;
    setPicked({}); setCueLevel(0); setResolved(false);
    shownAt.current = Date.now();
    play('money.prompt', `Choose notes and coins to make ${item.amount} rupees.`);
    return stopAudio;
  }, [idx, done]);

  if (!item && !done) {
    return (
      <Shell onExit={onExit} idx={0} total={1}>
        <div className="panel"><h2>Nothing to load</h2><button className="btn primary" onClick={onExit}>Go back</button></div>
      </Shell>
    );
  }

  const total$ = Object.entries(picked).reduce((sum, [v, c]) => sum + Number(v) * c, 0);
  const remaining = item.amount - total$;
  const nextBest = [...item.tray].filter((d) => d.value <= remaining).sort((a, b) => b.value - a.value)[0];
  const twoChoice = cueLevel === 3 && nextBest
    ? new Set([nextBest.value, item.tray.find((d) => d.value !== nextBest.value)?.value])
    : null;

  function adapt(result, nextResults) {
    misses.current = result.correct ? 0 : misses.current + 1;
    const calibrating = recentSessions(state, 'marketmoney', 3).length < 2;
    const nextAbility = updateAbility(ability, settings, result, calibrating ? CALIBRATION_K : STEADY_K);

    const obs = observeState(
      { items: nextResults, index: idx + 1, total, baselineLatency: 9000, level: settings[DIM_KEY].level },
      recentSessions(state, 'marketmoney', 3),
    );
    const decision = decide(obs);
    const proposed = applyAction(nextAbility[DIM_KEY], decision.action);
    const bounded = applyBounds(nextAbility[DIM_KEY], proposed, {
      consecutiveMisses: misses.current,
      bestRecentLevel: bestRecentLevel(state, 'marketmoney', DIM_KEY),
      sessionStartTheta: startAbility.current[DIM_KEY],
    });

    const finalAbility = { ...nextAbility, [DIM_KEY]: bounded.theta };
    setAbility(finalAbility);
    setActions((a) => [...a, {
      at: idx + 1,
      action: bounded.reason ? 'bounded' : decision.action,
      source: bounded.reason ? 'L0 safety rail' : decision.arbiter,
      stateKey: decision.qtable?.key, q: decision.qtable?.q, fuzzy: decision.fuzzy,
      reason: bounded.reason || explainDecision(obs, decision, dims[DIM_KEY].label),
    }]);
    return { finalAbility, isFloor: bounded.floor };
  }

  function advance(correct) {
    const latencyMs = Date.now() - shownAt.current;
    const result = { correct, cueLevel, latencyMs };
    const nextResults = [...results, result];
    setResults(nextResults);

    const { finalAbility, isFloor } = adapt(result, nextResults);
    if (isFloor) { setFloor(true); finish(nextResults, finalAbility, true); return; }
    if (idx + 1 >= total) { finish(nextResults, finalAbility, false); return; }

    const rebuilt = buildMarketMoney({ state, ability: finalAbility, count: total });
    setBuilt({ ...rebuilt, items: [...built.items.slice(0, idx + 1), ...rebuilt.items.slice(idx + 1)] });
    setIdx(idx + 1);
  }

  function finish(rs, finalAbility, wasFloor) {
    const accuracy = rs.filter((r) => r.correct).length / (rs.length || 1);
    setDone(true);
    update((s) => ({
      ...s,
      ability: { ...s.ability, marketmoney: finalAbility },
      sessions: [...s.sessions, {
        id: uid(), ts: Date.now(), game: 'marketmoney', accuracy,
        durationMs: Date.now() - startedAt.current, items: rs, settings, actions, floor: wasFloor,
      }],
    }));
    play(wasFloor ? 'session.floor' : 'session.done', t(lang, wasFloor ? 'session.floor' : 'session.done'));
  }

  function tapTray(d) {
    if (resolved) return;
    const would = total$ + d.value;
    if (would > item.amount) {
      // Never "wrong" — just doesn't fit. Gentle nudge, no state change kept.
      setOvershoot(d.value);
      setTimeout(() => setOvershoot(null), 500);
      const next = Math.min(4, cueLevel + 1);
      setCueLevel(next);
      play('fb.soft', t(lang, 'fb.soft'));
      if (next >= 4) resolveWithHelp();
      return;
    }
    setPicked((p) => ({ ...p, [d.value]: (p[d.value] || 0) + 1 }));
    if (would === item.amount) {
      setResolved(true);
      play('fb.great', t(lang, 'fb.great'));
      setTimeout(() => advance(true), 1200);
    } else {
      setCueLevel(0);
    }
  }

  function removeOne(value) {
    if (resolved) return;
    setPicked((p) => {
      const c = (p[value] || 0) - 1;
      const next = { ...p };
      if (c <= 0) delete next[value]; else next[value] = c;
      return next;
    });
  }

  function resolveWithHelp() {
    // Level 4 always resolves. Show the remaining amount made up warmly.
    const need = greedyBreakdown(item.amount - total$);
    setPicked((p) => {
      const next = { ...p };
      for (const [v, c] of Object.entries(need)) next[v] = (next[v] || 0) + c;
      return next;
    });
    setResolved(true);
    setTimeout(() => { play('fb.shown', t(lang, 'fb.shown')); }, 200);
    setTimeout(() => advance(false), 1900);
  }

  function showHint() {
    const next = Math.min(4, cueLevel + 1);
    setCueLevel(next);
    if (next >= 4) resolveWithHelp();
  }

  if (done) {
    return (
      <Shell onExit={onExit} idx={total} total={total}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }} aria-hidden="true">{floor ? '🌿' : '🌼'}</div>
          <h2>{t(lang, floor ? 'session.floor' : 'session.done')}</h2>
          <button className="btn primary" onClick={onExit}>{t(lang, 'game.finish')}</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onExit={onExit} idx={idx} total={total}>
      <div className="prompt">
        <p>Choose notes and coins to make this much money</p>
        <button className="speaker" aria-label={t(lang, 'game.listen')}
          onClick={() => play('money.prompt', `Choose notes and coins to make ${item.amount} rupees.`)}>
          <Volume2 size={30} />
        </button>
      </div>

      <div className="moneyTarget">
        <span className="small">Make this much</span>
        <b>₹{item.amount}</b>
        <div className="moneyBar" aria-hidden="true"><i style={{ width: `${Math.min(100, Math.round((total$ / item.amount) * 100))}%` }} /></div>
      </div>

      <div className="moneyPicked" aria-label="What you have chosen so far">
        {Object.keys(picked).length === 0 && <span className="empty">Nothing chosen yet</span>}
        {Object.entries(picked).map(([v, c]) => (
          <button key={v} onClick={() => removeOne(Number(v))} aria-label={`Remove one ₹${v}, tap to take one back`}>
            <Currency value={Number(v)} kind={item.tray.find((d) => d.value === Number(v))?.kind || 'note'} count={c} />
          </button>
        ))}
      </div>

      <p className="small" style={{ textAlign: 'center', marginBottom: 8 }}>Tap the notes and coins below.</p>
      <div className="moneyTray" role="group" aria-label="Notes and coins">
        {item.tray.map((d) => {
          const glow = cueLevel === 2 && nextBest?.value === d.value;
          const dim = twoChoice && !twoChoice.has(d.value);
          return (
            <button key={d.value} onClick={() => tapTray(d)} aria-label={`₹${d.value} ${d.kind}`}
              className={`${overshoot === d.value ? 'wobble' : ''} ${glow ? 'hintglow' : ''} ${dim ? 'dim' : ''}`}
              style={dim ? { opacity: 0.35 } : undefined}>
              <Currency value={d.value} kind={d.kind} />
            </button>
          );
        })}
      </div>

      {cueLevel > 0 && (
        <div className="cue">
          <Lightbulb size={22} aria-hidden="true" />
          <span>
            {cueLevel === 1 && `You need ₹${remaining} more.`}
            {cueLevel === 2 && `Try the one that is glowing.`}
            {cueLevel === 3 && 'It is one of these two.'}
            {cueLevel >= 4 && t(lang, 'fb.shown')}
          </span>
        </div>
      )}

      <div className="actions">
        <button className="hint" onClick={showHint} aria-label={t(lang, 'game.hint')}>
          <Lightbulb size={28} />
        </button>
        <span className="small" style={{ flex: 1 }}>No timer. Take your time.</span>
      </div>
    </Shell>
  );
}

function Shell({ children, onExit, idx, total }) {
  return (
    <>
      <div className="gtop">
        <button className="iconbtn" onClick={onExit} aria-label="Back"><ArrowLeft size={26} /></button>
        <div className="bar"><i style={{ width: `${Math.round((idx / total) * 100)}%` }} /></div>
        <b style={{ minWidth: 48, textAlign: 'right' }}>{Math.min(idx + 1, total)}/{total}</b>
      </div>
      <div className="scroll">{children}</div>
    </>
  );
}
