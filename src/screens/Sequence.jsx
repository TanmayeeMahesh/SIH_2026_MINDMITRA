import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ImagePlus, Lightbulb, Volume2 } from 'lucide-react';
import Photo from '../components/Photo.jsx';
import { buildSequence } from '../engine/session.js';
import { GAMES, applyBounds } from '../engine/ladder.js';
import { updateAbility, CALIBRATION_K, STEADY_K } from '../engine/elo.js';
import { observeState, decide, explainDecision, applyAction } from '../engine/policy.js';
import { abilityFor, bestRecentLevel, recentSessions, uid } from '../store/state.js';
import { play, stopAudio } from '../audio/speak.js';
import { t } from '../content/strings.js';
import { hasStepImage } from '../content/stepIcons.js';

const COUNT = 2; // how many different routines to sequence in one session

/* E1 — Sequence ("In Order"). Interaction: tap steps from the scrambled tray
 * IN THE ORDER you think they happen; each correct tap appends to the
 * assembled row. There is no separate "choose a slot" action — order is
 * inherently linear, so which slot a step goes in is never ambiguous, and one
 * tap per decision is gentler than two (accessibility spec, docs/04 §5). */
export default function Sequence({ state, update, onExit, source = 'personal' }) {
  const lang = state.profile.language;
  const dims = GAMES.sequence.dims;
  const dimKey = 'length';

  const [ability, setAbility] = useState(() => abilityFor(state, 'sequence', dims));
  const startAbility = useRef(abilityFor(state, 'sequence', dims));
  const [built, setBuilt] = useState(() => buildSequence({ state, ability, count: COUNT, source }));
  const [idx, setIdx] = useState(0);
  const [assembled, setAssembled] = useState([]);
  const [tray, setTray] = useState([]);
  const [wrongId, setWrongId] = useState(null);
  const [cueLevel, setCueLevel] = useState(0);
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
    setAssembled([]);
    setTray(item.scrambled);
    setCueLevel(0);
    shownAt.current = Date.now();
    play('seq.prompt', item.prompt);
    return stopAudio;
  }, [idx, done]);

  if (!item && !done) {
    return (
      <Shell onExit={onExit} idx={0} total={1}>
        <div className="panel">
          <h2>Add a daily routine first</h2>
          <p className="sub">
            This activity is built from the steps of something she does every day — making tea, getting
            ready for the market. A caregiver can add one in Caregiver mode, under Things &amp; Places.
          </p>
          <button className="btn primary" onClick={onExit}>Go back</button>
        </div>
      </Shell>
    );
  }

  const nextCorrect = item.steps[assembled.length];
  const twoChoiceIds = cueLevel === 3
    ? new Set([nextCorrect?.id, ...tray.filter((s) => s.id !== nextCorrect?.id).slice(0, 1).map((s) => s.id)])
    : null;

  /* ---------- one Elo + L0/L3/fuzzy step, shared by a correct tap, a scored
   * miss, and the level-4 auto-resolve. Returns the finalAbility so the caller
   * can use it immediately (no cross-closure globals). ---------- */
  function adapt(result, nextResults) {
    misses.current = result.correct ? 0 : misses.current + 1;
    const calibrating = recentSessions(state, 'sequence', 3).length < 2;
    const nextAbility = updateAbility(ability, settings, result, calibrating ? CALIBRATION_K : STEADY_K);

    const obs = observeState(
      { items: nextResults, index: nextResults.length, total: item.steps.length, baselineLatency: 8000, level: settings[dimKey].level },
      recentSessions(state, 'sequence', 3),
    );
    const decision = decide(obs);
    const proposed = applyAction(nextAbility[dimKey], decision.action);
    const bounded = applyBounds(nextAbility[dimKey], proposed, {
      consecutiveMisses: misses.current,
      bestRecentLevel: bestRecentLevel(state, 'sequence', dimKey),
      sessionStartTheta: startAbility.current[dimKey],
    });

    const finalAbility = { ...nextAbility, [dimKey]: bounded.theta };
    setAbility(finalAbility);
    setActions((a) => [...a, {
      at: nextResults.length,
      action: bounded.reason ? 'bounded' : decision.action,
      source: bounded.reason ? 'L0 safety rail' : decision.arbiter,
      stateKey: decision.qtable?.key, q: decision.qtable?.q, fuzzy: decision.fuzzy,
      reason: bounded.reason || explainDecision(obs, decision, dims[dimKey].label),
    }]);
    if (bounded.floor) setFloor(true);
    return { finalAbility, floor: bounded.floor };
  }

  function tapTray(step) {
    if (done) return;
    const latencyMs = Date.now() - shownAt.current;
    const correct = step.id === nextCorrect.id;
    shownAt.current = Date.now();

    if (correct) {
      const result = { correct: true, cueLevel, latencyMs };
      const nextResults = [...results, result];
      setResults(nextResults);
      const { finalAbility, floor: isFloor } = adapt(result, nextResults);
      setCueLevel(0);
      play('fb.good', t(lang, 'fb.good'));
      placeStep(step, nextResults, finalAbility, isFloor);
      return;
    }

    setWrongId(step.id);
    setTimeout(() => setWrongId(null), 500);
    const next = Math.min(4, cueLevel + 1);
    setCueLevel(next);
    play('fb.soft', t(lang, 'fb.soft'));

    const result = { correct: false, cueLevel: next, latencyMs };
    const nextResults = [...results, result];
    setResults(nextResults);
    const { finalAbility, floor: isFloor } = adapt(result, nextResults);

    if (next >= 4) {
      // Level 4 always resolves. There is no losing.
      setTimeout(() => { play('fb.shown', t(lang, 'fb.shown')); placeStep(nextCorrect, nextResults, finalAbility, isFloor); }, 700);
    }
  }

  function placeStep(step, resultsSoFar, finalAbility, isFloor) {
    const nextAssembled = [...assembled, step];
    setAssembled(nextAssembled);
    setTray((tr) => tr.filter((s) => s.id !== step.id));
    if (isFloor || nextAssembled.length >= item.steps.length) {
      setTimeout(() => advanceItem(resultsSoFar, finalAbility, isFloor), 900);
    }
  }

  function advanceItem(resultsSoFar, finalAbility, wasFloor) {
    if (wasFloor || idx + 1 >= total) { finish(resultsSoFar, finalAbility, wasFloor); return; }
    const rebuilt = buildSequence({ state, ability: finalAbility, count: total, source });
    setBuilt({ ...rebuilt, items: [...built.items.slice(0, idx + 1), ...rebuilt.items.slice(idx + 1)] });
    setIdx(idx + 1);
  }

  function finish(rs, finalAbility, wasFloor) {
    const accuracy = rs.length ? rs.filter((r) => r.correct).length / rs.length : 1;
    setDone(true);
    update((s) => ({
      ...s,
      ability: { ...s.ability, sequence: finalAbility },
      sessions: [...s.sessions, {
        id: uid(), ts: Date.now(), game: 'sequence', accuracy,
        durationMs: Date.now() - startedAt.current, items: rs, settings, actions, floor: wasFloor,
      }],
    }));
    play(wasFloor ? 'session.floor' : 'session.done', t(lang, wasFloor ? 'session.floor' : 'session.done'));
  }

  function showHint() {
    const next = Math.min(4, cueLevel + 1);
    setCueLevel(next);
    if (next >= 4) tapTray(nextCorrect);
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
        <p>{item.prompt}</p>
        <button className="speaker" aria-label={t(lang, 'game.listen')}
          onClick={() => play('seq.prompt', item.prompt)}><Volume2 size={30} /></button>
      </div>

      {item.showReference && (
        <div className="seqref" aria-label="Finished result, for reference">
          {item.steps.map((s) => (
            <div key={s.id} className="stepicon" aria-hidden="true">
              <StepPicture step={s} />
            </div>
          ))}
        </div>
      )}

      <div className="seqrow" role="list" aria-label="Steps in order so far">
        {item.steps.map((s, i) => {
          const filled = assembled[i];
          return (
            <div key={s.id} className={`seqslot${filled ? ' filled' : ''}`}>
              <span className="num" aria-hidden="true">{i + 1}</span>
              {filled
                ? <StepPicture step={filled} />
                : <span style={{ color: 'var(--text-3)', fontSize: 28 }} aria-hidden="true">?</span>}
              {filled && <span>{filled.label}</span>}
              {filled && <Check size={16} aria-hidden="true" />}
            </div>
          );
        })}
      </div>

      <p className="small" style={{ textAlign: 'center', marginBottom: 10 }}>
        Tap what happens next.
      </p>
      <div className="shelf" role="group" aria-label="Steps to place">
        {tray.map((s) => {
          const dim = twoChoiceIds && !twoChoiceIds.has(s.id);
          return (
            <button key={s.id} className={`pcard${wrongId === s.id ? ' wobble' : ''}${dim ? ' dim' : ''}`}
              onClick={() => tapTray(s)} aria-label={s.label}>
              <StepPicture step={s} />
              <span>{s.label}</span>
            </button>
          );
        })}
      </div>

      {cueLevel > 0 && (
        <div className="cue">
          <Lightbulb size={22} aria-hidden="true" />
          <span>
            {cueLevel === 1 && 'Think about what happens first.'}
            {cueLevel === 2 && 'Look closely — one of these comes next.'}
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

/** A step's picture: her caregiver's own photo if there is one, otherwise the
 *  default pack's photo of the action, otherwise a neutral "no picture yet"
 *  mark — deliberately not an emoji (see content/stepIcons.js). */
function StepPicture({ step }) {
  if (hasStepImage(step)) {
    return <Photo id={step.photoId} src={step.imageSrc} name={step.label} className="" />;
  }
  return (
    <div className="ph nopic" role="img" aria-label={step.label}>
      <ImagePlus size={26} aria-hidden="true" />
    </div>
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
