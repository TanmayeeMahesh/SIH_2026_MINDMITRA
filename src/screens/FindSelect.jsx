import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Lightbulb, Volume2 } from 'lucide-react';
import Photo from '../components/Photo.jsx';
import { buildFindSelect } from '../engine/session.js';
import { GAMES, applyBounds, CUES } from '../engine/ladder.js';
import { updateAbility, CALIBRATION_K, STEADY_K } from '../engine/elo.js';
import { observeState, decide, explainDecision, applyAction } from '../engine/policy.js';
import { abilityFor, bestRecentLevel, recentSessions, uid } from '../store/state.js';
import { play, synth, stopAudio } from '../audio/speak.js';
import { t } from '../content/strings.js';

const COUNT = 3;
const DIM_KEY = 'field';

/* E2 — Find & Select ("Find It"). A bigger visual field than E3's card grid,
 * several different items to find per round rather than one — sustained
 * rather than single-shot attention. Same corpus-agnostic engine as E3: it
 * doesn't know what an "object" is, it just asks her to find one in a shelf. */
export default function FindSelect({ state, update, onExit, source = 'personal' }) {
  const lang = state.profile.language;
  const dims = GAMES.findit.dims;

  const [ability, setAbility] = useState(() => abilityFor(state, 'findit', dims));
  const startAbility = useRef(abilityFor(state, 'findit', dims));
  const [built, setBuilt] = useState(() => buildFindSelect({ state, ability, count: COUNT, source }));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState(null);
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
    shownAt.current = Date.now();
    setCueLevel(0); setPicked(null); setWrong(null);
    play('find.prompt', item.prompt);
    return stopAudio;
  }, [idx, done]);

  if (!item && !done) {
    return (
      <Shell onExit={onExit} idx={0} total={1}>
        <div className="panel">
          <h2>Add a few things first</h2>
          <p className="sub">
            This activity is built from things a caregiver has added. Two or more of a kind is enough
            to start. Open Caregiver mode to add some.
          </p>
          <button className="btn primary" onClick={onExit}>Go back</button>
        </div>
      </Shell>
    );
  }

  function adapt(result, nextResults) {
    misses.current = result.correct ? 0 : misses.current + 1;
    const calibrating = recentSessions(state, 'findit', 3).length < 2;
    const nextAbility = updateAbility(ability, settings, result, calibrating ? CALIBRATION_K : STEADY_K);

    const obs = observeState(
      { items: nextResults, index: idx + 1, total, baselineLatency: 7000, level: settings[DIM_KEY].level },
      recentSessions(state, 'findit', 3),
    );
    const decision = decide(obs);
    const proposed = applyAction(nextAbility[DIM_KEY], decision.action);
    const bounded = applyBounds(nextAbility[DIM_KEY], proposed, {
      consecutiveMisses: misses.current,
      bestRecentLevel: bestRecentLevel(state, 'findit', DIM_KEY),
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

    const rebuilt = buildFindSelect({
      state, ability: finalAbility, count: total, source,
      exclude: built.items.slice(0, idx + 1).map((x) => x.target.id),
    });
    setBuilt({ ...rebuilt, items: [...built.items.slice(0, idx + 1), ...rebuilt.items.slice(idx + 1)] });
    setIdx(idx + 1);
  }

  function finish(rs, finalAbility, wasFloor) {
    const accuracy = rs.filter((r) => r.correct).length / (rs.length || 1);
    setDone(true);
    update((s) => ({
      ...s,
      ability: { ...s.ability, findit: finalAbility },
      sessions: [...s.sessions, {
        id: uid(), ts: Date.now(), game: 'findit', accuracy,
        durationMs: Date.now() - startedAt.current, items: rs, settings, actions, floor: wasFloor,
        targetIds: built.items.slice(0, rs.length).map((i) => i.target.id),
      }],
    }));
    play(wasFloor ? 'session.floor' : 'session.done', t(lang, wasFloor ? 'session.floor' : 'session.done'));
  }

  function pick(opt) {
    if (picked) return;
    const correct = opt.id === item.target.id;
    if (correct) {
      setPicked(opt.id);
      play('fb.great', t(lang, 'fb.great'));
      setTimeout(() => advance(true), 1100);
    } else {
      setWrong(opt.id);
      setTimeout(() => setWrong(null), 500);
      const next = Math.min(4, cueLevel + 1);
      setCueLevel(next);
      play('fb.soft', t(lang, 'fb.soft'));
      if (next >= 4) {
        setTimeout(() => { setPicked(item.target.id); play('fb.shown', t(lang, 'fb.shown')); }, 600);
        setTimeout(() => advance(false), 2200);
      }
    }
  }

  function showHint() {
    const next = Math.min(4, cueLevel + 1);
    setCueLevel(next);
    if (next >= 4) { setPicked(item.target.id); setTimeout(() => advance(false), 1800); }
  }

  if (done) {
    return (
      <Shell onExit={onExit} idx={total} total={total}>
        <div className="panel" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 64 }} aria-hidden="true">{floor ? '🌿' : '🌼'}</div>
          <h2>{t(lang, floor ? 'session.floor' : 'session.done')}</h2>
          <p className="sub">{results.filter((r) => r.correct).length} of {results.length} on your own.</p>
          <button className="btn primary" onClick={onExit}>{t(lang, 'game.finish')}</button>
        </div>
      </Shell>
    );
  }

  const cue = CUES[cueLevel];
  const keepId = item.options.find((x) => x.id !== item.target.id)?.id;

  return (
    <Shell onExit={onExit} idx={idx} total={total}>
      <div className="prompt">
        <p>{item.prompt}</p>
        <button className="speaker" aria-label={t(lang, 'game.listen')}
          onClick={() => play('find.prompt', item.prompt).then(() => synth(item.target.name))}>
          <Volume2 size={30} />
        </button>
      </div>

      <div className="shelf">
        {item.options.map((o) => {
          const isTarget = o.id === item.target.id;
          const cls = ['pcard'];
          if (picked === o.id) cls.push('right');
          if (wrong === o.id) cls.push('wobble');
          if (picked && !isTarget) cls.push('dim');
          if (cueLevel === 3 && !isTarget && o.id !== keepId) cls.push('dim');
          return (
            <button key={o.id} className={cls.join(' ')} onClick={() => pick(o)} aria-label={o.name}>
              <Photo id={o.photoId} src={o.imageSrc} name={o.name} className="" />
              <span>{o.name}</span>
            </button>
          );
        })}
      </div>

      {cueLevel > 0 && (
        <div className="cue">
          <Lightbulb size={22} aria-hidden="true" />
          <span>
            {cueLevel === 1 && `It is something she uses often.`}
            {cueLevel === 2 && `The name starts with “${item.target.name?.[0]}”.`}
            {cueLevel === 3 && 'It is one of these two.'}
            {cueLevel >= 4 && t(lang, 'fb.shown')}
          </span>
        </div>
      )}

      <div className="actions">
        <button className="hint" onClick={showHint} aria-label={t(lang, 'game.hint')} disabled={!!picked}>
          <Lightbulb size={28} />
        </button>
        <span className="small" style={{ flex: 1 }}>{cue.name === 'None' ? 'No timer. Take your time.' : `Hint: ${cue.name}`}</span>
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
