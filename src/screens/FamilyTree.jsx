import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Lightbulb, Volume2 } from 'lucide-react';
import Photo from '../components/Photo.jsx';
import { buildFamilyTree } from '../engine/session.js';
import { GAMES, applyBounds } from '../engine/ladder.js';
import { updateAbility, CALIBRATION_K, STEADY_K } from '../engine/elo.js';
import { observeState, decide, explainDecision, applyAction } from '../engine/policy.js';
import { abilityFor, bestRecentLevel, recentSessions, uid } from '../store/state.js';
import { play, synth, stopAudio } from '../audio/speak.js';
import { t } from '../content/strings.js';
import { relationGroup, relationLabel } from '../content/kinship.js';

/* DESIGN DEVIATION, deliberate and worth defending.
 *
 * The original spec for this game used drag-and-drop with a magnetic snap
 * radius. We implement TAP-TO-SELECT then TAP-TO-PLACE instead.
 *
 * Reason: the accessibility spec (docs/04 §5) is tap-only — no swipe, drag,
 * pinch or long-press — because our user has tremor and dry skin, and drag
 * gestures fail badly for both. The same spec's own Game 1 note says exactly
 * this: "tap interaction rather than drag-and-drop to minimize motor-control
 * friction." We just applied it consistently.
 *
 * We keep everything else the spec asked for: forgiving targets, the pulsing
 * dashed slot, the gold flash and click on a correct placement, the gentle
 * bounce-back on an incorrect one.
 */

const TIERS = ['elder', 'spouse', 'sibling', 'child', 'grandchild', 'other'];

export default function FamilyTree({ state, update, onExit }) {
  const lang = state.profile.language;
  const community = state.profile.community;
  const dims = GAMES.familytree.dims;

  const [ability, setAbility] = useState(() => abilityFor(state, 'familytree', dims));
  const startAbility = useRef(abilityFor(state, 'familytree', dims));
  const [built, setBuilt] = useState(() => buildFamilyTree({ state, ability }));
  const [selected, setSelected] = useState(null);
  const [placed, setPlaced] = useState({});     // nodeId -> personId
  const [bounce, setBounce] = useState(null);
  const [cueLevel, setCueLevel] = useState(0);
  const [results, setResults] = useState([]);
  const [actions, setActions] = useState([]);
  const [done, setDone] = useState(false);
  const misses = useRef(0);
  const shownAt = useRef(Date.now());
  const startedAt = useRef(Date.now());

  const puzzle = built.items[0];
  const settings = built.settings;

  useEffect(() => {
    if (!puzzle || done) return;
    shownAt.current = Date.now();
    play('ft.title', t(lang, 'ft.title'));
    return stopAudio;
  }, [done]);

  if (!puzzle) {
    return (
      <Shell onExit={onExit} filled={0} total={1}>
        <div className="panel">
          <h2>Add at least three people</h2>
          <p className="sub">The family tree needs a few people before it can be built. A caregiver can add them in Caregiver mode.</p>
          <button className="btn primary" onClick={onExit}>Go back</button>
        </div>
      </Shell>
    );
  }

  const blanks = puzzle.blanks.filter((id) => !placed[id]);
  const total = puzzle.blanks.length;
  const filled = total - blanks.length;

  /* group people into tiers so the tree reads as a hierarchy */
  const tiers = TIERS
    .map((g) => puzzle.nodes.filter((p) => relationGroup(community, p.relationKey) === g))
    .filter((row) => row.length);

  function tapPiece(person) {
    if (done) return;
    setSelected(selected?.id === person.id ? null : person);
    synth(person.name);
  }

  function tapSlot(nodeId) {
    if (!selected || placed[nodeId]) return;
    const correct = selected.id === nodeId;
    const latencyMs = Date.now() - shownAt.current;

    if (correct) {
      const nextPlaced = { ...placed, [nodeId]: selected.id };
      setPlaced(nextPlaced);
      setSelected(null);
      setCueLevel(0);
      play('fb.great', t(lang, 'fb.great'));
      record({ correct: true, cueLevel, latencyMs }, Object.keys(nextPlaced).length);
    } else {
      setBounce(selected.id);
      setTimeout(() => setBounce(null), 450);
      setSelected(null);
      const next = Math.min(4, cueLevel + 1);
      setCueLevel(next);
      play('fb.soft', t(lang, 'fb.soft'));
      if (next >= 4) {
        // Level 4 always resolves. There is no losing.
        const target = blanks[0];
        const nextPlaced = { ...placed, [target]: target };
        setTimeout(() => {
          setPlaced(nextPlaced);
          setCueLevel(0);
          play('fb.shown', t(lang, 'fb.shown'));
          record({ correct: false, cueLevel: 4, latencyMs }, Object.keys(nextPlaced).length);
        }, 700);
      } else {
        // A miss that did not resolve the slot: score it, but the item continues.
        record({ correct: false, cueLevel: next, latencyMs }, null);
      }
    }
    shownAt.current = Date.now();
  }

  /** placedCount === null means the item is still open (a miss mid-scaffold). */
  function record(result, placedCount) {
    const nextResults = [...results, result];
    setResults(nextResults);
    misses.current = result.correct ? 0 : misses.current + 1;

    const calibrating = recentSessions(state, 'familytree', 3).length < 2;
    const nextAbility = updateAbility(ability, settings, result, calibrating ? CALIBRATION_K : STEADY_K);

    const obs = observeState(
      { items: nextResults, index: nextResults.length, total, baselineLatency: 9000, level: settings.trayOptions.level },
      recentSessions(state, 'familytree', 3),
    );
    const decision = decide(obs);
    const dimKey = 'trayOptions';
    const proposed = applyAction(nextAbility[dimKey], decision.action);
    const bounded = applyBounds(nextAbility[dimKey], proposed, {
      consecutiveMisses: misses.current,
      bestRecentLevel: bestRecentLevel(state, 'familytree', dimKey),
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

    if (bounded.floor) { setTimeout(() => finish(nextResults, finalAbility, true), 900); return; }
    if (placedCount !== null && placedCount >= total) {
      setTimeout(() => finish(nextResults, finalAbility, false), 900);
    }
  }

  function finish(rs, finalAbility, wasFloor) {
    const accuracy = rs.filter((r) => r.correct).length / (rs.length || 1);
    setDone(true);
    update((s) => ({
      ...s,
      ability: { ...s.ability, familytree: finalAbility },
      sessions: [...s.sessions, {
        id: uid(), ts: Date.now(), game: 'familytree', accuracy,
        durationMs: Date.now() - startedAt.current, items: rs, settings, actions, floor: wasFloor,
      }],
    }));
    play('session.done', t(lang, 'session.done'));
  }

  if (done) {
    return (
      <Shell onExit={onExit} filled={total} total={total}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }} aria-hidden="true">🌼</div>
          <h2>{t(lang, 'session.done')}</h2>
          <button className="btn primary" onClick={onExit}>{t(lang, 'game.finish')}</button>
        </div>
      </Shell>
    );
  }

  return (
    <Shell onExit={onExit} filled={filled} total={total}>
      <div className="prompt">
        <p>{selected ? `Where does ${selected.name} belong?` : t(lang, 'ft.title')}</p>
        <button className="speaker" aria-label={t(lang, 'game.listen')}
          onClick={() => play('ft.title', t(lang, 'ft.title'))}><Volume2 size={30} /></button>
      </div>

      <div className="tree">
        {tiers.map((row, ri) => (
          <React.Fragment key={ri}>
            {ri > 0 && <span className="link" aria-hidden="true" />}
            <div className="tier">
              {row.map((p) => {
                const isBlank = puzzle.blanks.includes(p.id) && !placed[p.id];
                const isLocked = !!placed[p.id];
                const cls = ['node'];
                if (isBlank) cls.push('slot');
                if (isBlank && selected) cls.push('active');
                if (isLocked) cls.push('locked');
                const hideFace = isBlank && puzzle.piece === 'photo';
                const hideName = isBlank && puzzle.piece === 'name';
                return (
                  <button key={p.id} className={cls.join(' ')}
                    onClick={() => isBlank && tapSlot(p.id)}
                    aria-label={isBlank ? `Empty place for ${relationLabel(community, p.relationKey)}` : p.name}>
                    {hideFace
                      ? <div className="ph" aria-hidden="true">?</div>
                      : <Photo id={p.photoId} name={p.name} className="" />}
                    <span>{hideName ? '—' : p.name}</span>
                    <span className="small" style={{ fontSize: 13, minHeight: 0 }}>
                      {relationLabel(community, p.relationKey)}
                    </span>
                    {isLocked && <Check size={18} aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </React.Fragment>
        ))}
      </div>

      {cueLevel > 0 && (
        <div className="cue">
          <Lightbulb size={22} aria-hidden="true" />
          <span>
            {cueLevel === 1 && 'Look at where the empty place sits in the family.'}
            {cueLevel === 2 && blanks[0] && `Their name starts with “${puzzle.nodes.find((n) => n.id === blanks[0])?.name?.[0]}”.`}
            {cueLevel === 3 && 'It is one of the first two in the row below.'}
            {cueLevel >= 4 && t(lang, 'fb.shown')}
          </span>
        </div>
      )}

      <div className="tray" role="group" aria-label="People to place">
        {puzzle.tray.filter((p) => !placed[p.id]).map((p) => (
          <button key={p.id}
            className={`pcard${selected?.id === p.id ? ' sel' : ''}${bounce === p.id ? ' wobble' : ''}`}
            onClick={() => tapPiece(p)} aria-label={p.name}>
            {puzzle.piece === 'photo'
              ? <><Photo id={p.photoId} name={p.name} className="" /><span>{p.name}</span></>
              : <span style={{ fontSize: 20, padding: '20px 6px' }}>{p.name}</span>}
          </button>
        ))}
      </div>
      <p className="small" style={{ textAlign: 'center' }}>
        Tap a person, then tap their empty place. No timer.
      </p>
    </Shell>
  );
}

function Shell({ children, onExit, filled, total }) {
  return (
    <>
      <div className="gtop">
        <button className="iconbtn" onClick={onExit} aria-label="Back"><ArrowLeft size={26} /></button>
        <div className="bar"><i style={{ width: `${Math.round((filled / (total || 1)) * 100)}%` }} /></div>
        <b style={{ minWidth: 48, textAlign: 'right' }}>{filled}/{total}</b>
      </div>
      <div className="scroll">{children}</div>
    </>
  );
}
