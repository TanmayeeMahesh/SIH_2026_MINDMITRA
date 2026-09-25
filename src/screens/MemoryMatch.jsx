import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, Lightbulb, Volume2 } from 'lucide-react';
import Photo from '../components/Photo.jsx';
import { buildMemoryMatch } from '../engine/session.js';
import { GAMES, applyBounds, CUES } from '../engine/ladder.js';
import { updateAbility, CALIBRATION_K, STEADY_K } from '../engine/elo.js';
import { observeState, decide, explainDecision, applyAction } from '../engine/policy.js';
import { abilityFor, bestRecentLevel, recentSessions, uid } from '../store/state.js';
import { play, synth, stopAudio } from '../audio/speak.js';
import { t } from '../content/strings.js';
import { relationLabel } from '../content/kinship.js';

const COUNT = 6;

export default function MemoryMatch({ state, update, onExit, source = 'personal' }) {
  const lang = state.profile.language;
  const community = state.profile.community;
  const dims = GAMES.memorymatch.dims;

  const [ability, setAbility] = useState(() => abilityFor(state, 'memorymatch', dims));
  const startAbility = useRef(abilityFor(state, 'memorymatch', dims));
  const [built, setBuilt] = useState(() => buildMemoryMatch({ state, ability, count: COUNT, source }));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState(null);
  const [wrong, setWrong] = useState(null);
  const [speakingId, setSpeakingId] = useState(null);
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
  // Sessions can be SHORTER than COUNT when the corpus is small — the builder
  // caps length to the pool rather than padding with repeats. (docs/17)
  const total = built.items.length || 1;
  const askName = item?.direction === 'photo2name';

  // The prompt is built by the corpus KIND, so the same engine says
  // "Which one is Bhaskar?" for people and "Which one is the dao?" for objects.
  const promptText = item?.prompt || '';

  // Speak the prompt whenever a new item appears. The app initiates; it never
  // waits silently for her to work out what to do.
  /* The pre-rendered clips were recorded when this engine only ran on PEOPLE
   * ("What is this person called?"). It now also runs on objects and places,
   * where that wording is simply wrong — the screen said "What is this place
   * called?" while the audio said "person". So the clip is only used when it
   * actually matches the kind; otherwise we speak the kind's own prompt text.
   *
   * And in the name-recall direction the options are TEXT, which assumes
   * reading. Our user cannot be assumed to read anything (docs/01 §3), so the
   * choices are read aloud too — otherwise that direction is unusable for her. */
  async function speakPrompt({ signal } = {}) {
    const isPerson = built.kind?.id === 'person';
    const key = askName ? (isPerson ? 'mm.whatName' : null) : 'mm.whoIs';
    await play(key, promptText);
    if (signal?.cancelled) return;
    if (!askName) { await synth(item.target.name); return; }
    // Read the choices out, and LIFT each card as its name is spoken. Hearing
    // a list of names is not much use if you cannot tell which box on the
    // screen each one belongs to — the number is said aloud with the name and
    // printed on the card, so the two channels point at the same thing.
    for (let i = 0; i < item.options.length; i++) {
      if (signal?.cancelled) return;
      const o = item.options[i];
      setSpeakingId(o.id);
      await synth(`${i + 1}. ${o.name}`);
    }
    if (!signal?.cancelled) setSpeakingId(null);
  }

  useEffect(() => {
    if (!item || done) return;
    shownAt.current = Date.now();
    setCueLevel(0); setPicked(null); setWrong(null); setSpeakingId(null);
    const signal = { cancelled: false };
    speakPrompt({ signal });
    return () => { signal.cancelled = true; setSpeakingId(null); stopAudio(); };
  }, [idx, done]);

  if (!item && !done) {
    return (
      <Shell onExit={onExit} idx={0} total={1}>
        <div className="panel">
          <h2>{source === 'general' ? 'Nothing to load yet' : 'Add a few things first'}</h2>
          <p className="sub">
            {source === 'general'
              ? 'The everyday picture pack has not loaded. Try again once the app has been online at least once.'
              : 'This activity is built from what a caregiver has added — people, everyday things or places. Two of any one kind is enough to start. Open Caregiver mode to add some.'}
          </p>
          <button className="btn primary" onClick={onExit}>Go back</button>
        </div>
      </Shell>
    );
  }

  /* ---------- the adaptive step, run after every item ---------- */
  function advance(correct) {
    const latencyMs = Date.now() - shownAt.current;
    const result = { correct, cueLevel, latencyMs };
    const nextResults = [...results, result];
    setResults(nextResults);

    misses.current = correct ? 0 : misses.current + 1;

    // L1 — Elo update per dimension
    const calibrating = recentSessions(state, 'memorymatch', 3).length < 2;
    const nextAbility = updateAbility(ability, settings, result, calibrating ? CALIBRATION_K : STEADY_K);

    // L3 — policy proposes a move on the dominant dimension
    const obs = observeState(
      { items: nextResults, index: idx + 1, total, baselineLatency: 6000, level: settings.options.level },
      recentSessions(state, 'memorymatch', 3),
    );
    const decision = decide(obs);
    const dimKey = 'options'; // dominant dimension for this engine
    const proposed = applyAction(nextAbility[dimKey], decision.action);

    // L0 — bounds. Nothing above may override these.
    const bounded = applyBounds(nextAbility[dimKey], proposed, {
      consecutiveMisses: misses.current,
      bestRecentLevel: bestRecentLevel(state, 'memorymatch', dimKey),
      sessionStartTheta: startAbility.current[dimKey],
    });

    const finalAbility = { ...nextAbility, [dimKey]: bounded.theta };
    setAbility(finalAbility);
    setActions((a) => [...a, {
      at: idx + 1,
      action: bounded.reason ? 'bounded' : decision.action,
      source: bounded.reason ? 'L0 safety rail' : decision.arbiter,
      stateKey: decision.qtable?.key,
      q: decision.qtable?.q,
      fuzzy: decision.fuzzy,
      reason: bounded.reason || explainDecision(obs, decision, dims[dimKey].label),
    }]);

    if (bounded.floor) { setFloor(true); finish(nextResults, finalAbility, true); return; }
    if (idx + 1 >= total) { finish(nextResults, finalAbility, false); return; }

    // Rebuild the remaining items at the new difficulty — adaptation is live,
    // not deferred to the next session.
    const rebuilt = buildMemoryMatch({
      state, ability: finalAbility, count: total, kindId: built.kind?.id, source,
      exclude: built.items.slice(0, idx + 1).map((x) => x.target.id),
    });
    const merged = [...built.items.slice(0, idx + 1), ...rebuilt.items.slice(idx + 1)];
    setBuilt({ ...rebuilt, items: merged.length ? merged : built.items });
    setIdx(idx + 1);
  }

  function finish(rs, finalAbility, wasFloor) {
    const accuracy = rs.filter((r) => r.correct).length / (rs.length || 1);
    setDone(true);
    update((s) => ({
      ...s,
      ability: { ...s.ability, memorymatch: finalAbility },
      sessions: [...s.sessions, {
        id: uid(), ts: Date.now(), game: 'memorymatch', accuracy,
        durationMs: Date.now() - startedAt.current,
        items: rs, settings, actions, floor: wasFloor,
        kind: built.kind?.id || null,
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
      // Never "wrong". Wobble, soft sound, raise the scaffold, stay on the item.
      setWrong(opt.id);
      setTimeout(() => setWrong(null), 500);
      const next = Math.min(4, cueLevel + 1);
      setCueLevel(next);
      play('fb.soft', t(lang, 'fb.soft'));
      if (next >= 4) { // level 4 always resolves — there is no losing
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
          <p className="sub">
            {results.filter((r) => r.correct).length} of {results.length} on your own.
          </p>
          <button className="btn primary" onClick={onExit}>{t(lang, 'game.finish')}</button>
        </div>
      </Shell>
    );
  }

  const cue = CUES[cueLevel];
  const gridClass = settings.options.value >= 9 ? 'g9' : settings.options.value >= 6 ? 'g6' : 'g4';
  // The one distractor kept visible at cue level 3 (two-alternative forced choice).
  const keepId = item.options.find((x) => x.id !== item.target.id)?.id;

  return (
    <Shell onExit={onExit} idx={idx} total={total}>
      <div className="prompt">
        <p>{promptText}</p>
        <button
          className="speaker"
          aria-label={t(lang, 'game.listen')}
          onClick={() => speakPrompt()}
        ><Volume2 size={30} /></button>
      </div>

      {askName && (
        <div className="pcard" style={{ maxWidth: 260, margin: '0 auto 18px' }}>
          <Photo id={item.target.photoId} src={item.target.imageSrc} name={item.target.name} className="" alt="what to name" />
        </div>
      )}

      <div className={`grid ${gridClass}`}>
        {item.options.map((o, i) => {
          const isTarget = o.id === item.target.id;
          const cls = ['pcard'];
          if (picked === o.id) cls.push('right');
          if (wrong === o.id) cls.push('wobble');
          if (speakingId === o.id) cls.push('speaking');
          if (picked && !isTarget) cls.push('dim');
          // Cue level 3 = two-alternative forced choice: keep the target plus one.
          if (cueLevel === 3 && !isTarget && o.id !== keepId) cls.push('dim');
          return (
            <div className="wrap" key={o.id}>
              <button className={cls.join(' ')} onClick={() => pick(o)} aria-label={`${i + 1}. ${o.name}`}>
                {askName
                  ? <span style={{ fontSize: 22, padding: '22px 6px' }}>{o.name}</span>
                  : <><Photo id={o.photoId} src={o.imageSrc} name={o.name} className="" /><span>{o.name}</span></>}
              </button>
              <span className="idx" aria-hidden="true">{i + 1}</span>
              {picked === o.id && <span className="mark" aria-hidden="true"><Check size={20} /></span>}
            </div>
          );
        })}
      </div>

      {cueLevel > 0 && (
        <div className="cue">
          <Lightbulb size={22} aria-hidden="true" />
          <span>
            {cueLevel === 1 && (item.target.kind === 'person'
              ? `A ${relationLabel(community, item.target.relationKey, 'en').toLowerCase()}.`
              : `It is ${built.kind?.id === 'place' ? 'a place' : 'something she uses'}.`)}
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
        <div className="bar"><i style={{ width: `${Math.round(((idx) / total) * 100)}%` }} /></div>
        <b style={{ minWidth: 48, textAlign: 'right' }}>{Math.min(idx + 1, total)}/{total}</b>
      </div>
      <div className="scroll">{children}</div>
    </>
  );
}
