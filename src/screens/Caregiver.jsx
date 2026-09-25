import React, { useEffect, useState } from 'react';
import { BarChart3, Bell, Brain, Check, CloudUpload, FileText, ImagePlus, Plus, Trash2, Users, Wifi, WifiOff, X } from 'lucide-react';
import Photo from '../components/Photo.jsx';
import { savePhoto, deletePhoto } from '../store/db.js';
import {
  uid, abilityFor, totals, seedHistory, wipeEverything, recentSessions,
  minutesPlayedToday, medicineDoneToday,
} from '../store/state.js';
import { GAMES, levelFor } from '../engine/ladder.js';
import { qtableMeta, FLOW_BAND } from '../engine/policy.js';
import { KINSHIP, relationsFor } from '../content/kinship.js';
import { LANGUAGES } from '../content/strings.js';
import { hasStepImage } from '../content/stepIcons.js';
import { pushToCloud } from '../sync/mockCloud.js';
import SafeWalkAdmin from './SafeWalkAdmin.jsx';

export default function Caregiver({ state, update, onExit, online, activeWalk }) {
  const [tab, setTab] = useState(state.onboarded ? 'people' : 'setup');
  return (
    <>
      <div className="topbar">
        <div>
          <p className="eyebrow">CAREGIVER MODE</p>
          <b style={{ fontSize: 22 }}>{state.profile.preferredName || 'Setup'}</b>
        </div>
        <button className="iconbtn" onClick={onExit} aria-label="Close"><X size={26} /></button>
      </div>
      {/* Visible regardless of which tab is open — a walk in progress
          shouldn't require navigating to find out about. */}
      {activeWalk?.active && (
        <button className="walkBanner" onClick={() => setTab('safewalk')}>
          <span className="dot" aria-hidden="true" />
          Walking to {activeWalk.place?.name} — {activeWalk.status ? `${Math.round(activeWalk.status.distanceToDestM)} m to go` : 'starting…'}
        </button>
      )}
      <div className="tabs">
        {[['setup', 'Setup'], ['people', 'People'], ['things', 'Things & Places'], ['medicines', 'Medicines'],
          ['safewalk', 'Safe Walk'], ['ai', 'How it adapts'], ['report', 'Report'], ['sync', 'Sync']].map(([k, l]) => (
          <button key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      <div className="scroll">
        {tab === 'setup' && <Setup state={state} update={update} />}
        {tab === 'people' && <People state={state} update={update} />}
        {tab === 'things' && <Things state={state} update={update} />}
        {tab === 'medicines' && <Medicines state={state} update={update} />}
        {tab === 'safewalk' && <SafeWalkAdmin state={state} update={update} activeWalk={activeWalk} online={online} />}
        {tab === 'ai' && <HowItAdapts state={state} />}
        {tab === 'report' && <Report state={state} update={update} />}
        {tab === 'sync' && <Sync state={state} update={update} online={online} />}
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ setup */

function Setup({ state, update }) {
  const p = state.profile;
  const set = (k, v) => update((s) => ({ ...s, profile: { ...s.profile, [k]: v } }));
  return (
    <>
      <div className="panel">
        <h2>About her</h2>
        <p className="small">These details personalise the activities. They stay on this phone.</p>
        <label htmlFor="pn">What does she like to be called?</label>
        <input id="pn" value={p.preferredName} onChange={(e) => set('preferredName', e.target.value)} placeholder="e.g. Aita" />
        <label htmlFor="lg">Language</label>
        <select id="lg" value={p.language} onChange={(e) => set('language', e.target.value)}>
          {LANGUAGES.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
        </select>
        <label htmlFor="cm">Community / kinship</label>
        <select id="cm" value={p.community} onChange={(e) => set('community', e.target.value)}>
          {Object.values(KINSHIP).map((k) => <option key={k.id} value={k.id}>{k.label}</option>)}
        </select>
        <p className="note">
          Kinship is not universal. Khasi, Jaintia and Garo families are matrilineal — the youngest
          daughter (Ka Khadduh) inherits and carries the duty of caring for her parents, and the maternal
          uncle has formal standing. So the relationship terms come from the community pack, not from our code.
        </p>
      </div>

      <div className="panel">
        <h2>Starting point</h2>
        <p className="small">Three quick questions so the first session starts easy rather than guessing.</p>
        <label htmlFor="ed">Schooling</label>
        <select id="ed" value={p.education} onChange={(e) => set('education', e.target.value)}>
          <option value="none">No formal schooling</option>
          <option value="primary">Primary</option>
          <option value="secondary_plus">Secondary or above</option>
        </select>
        <label htmlFor="in">Daily tasks</label>
        <select id="in" value={p.independence} onChange={(e) => set('independence', e.target.value)}>
          <option value="low">Needs help with most</option>
          <option value="partial">Needs some prompting</option>
          <option value="high">Mostly independent</option>
        </select>
        <label htmlFor="ts">Has she used a touchscreen before?</label>
        <select id="ts" value={p.usedTouchscreen ? 'y' : 'n'} onChange={(e) => set('usedTouchscreen', e.target.value === 'y')}>
          <option value="n">No</option><option value="y">Yes</option>
        </select>
      </div>

      <div className="panel">
        <h2>Daily play time</h2>
        <p className="small">
          A soft daily budget. She never sees a clock or countdown — once today's total is used up, the
          activity in progress finishes normally and the app simply says "that's enough for today" and
          rests until tomorrow. Set to 0 for no limit.
        </p>
        <label htmlFor="dl">Minutes per day</label>
        <input id="dl" type="number" min={0} step={5} value={p.dailyMinutesLimit}
          onChange={(e) => set('dailyMinutesLimit', Math.max(0, Number(e.target.value) || 0))} />
        <p className="small" style={{ marginTop: 8 }}>Played today: {minutesPlayedToday(state)} minutes.</p>
      </div>

      <div className="panel">
        <h2>Consent</h2>
        <p className="small">
          A person with moderate dementia may not be able to consent for herself. Under India's DPDP Act 2023,
          consent is given by her lawful guardian or carer. Consent to use the app is not consent to share
          anything — every report is shared as a separate, deliberate act.
        </p>
        <label htmlFor="cg">Your name (the person responsible for her care)</label>
        <input id="cg" value={p.caregiverName} onChange={(e) => set('caregiverName', e.target.value)} />
        <button className={`btn ${p.consentAt ? 'ghost' : 'primary'}`} style={{ marginTop: 14 }}
          onClick={() => set('consentAt', p.consentAt ? null : Date.now())}>
          {p.consentAt ? <><Check size={22} /> Consent recorded</> : 'I consent on her behalf'}
        </button>
        <button className={`btn ${p.assentConfirmed ? 'ghost' : 'secondary'}`} style={{ marginTop: 10 }}
          onClick={() => set('assentConfirmed', !p.assentConfirmed)}>
          {p.assentConfirmed ? <><Check size={22} /> She is willing</> : 'I have explained it to her and she is willing'}
        </button>
        <p className="note">
          Guardian consent is the legal layer. Her ongoing willingness is the ethical one — if she does not
          want to play, the app stops. Every session is refusable in one tap, with no consequence.
        </p>
      </div>

      <div className="panel">
        <h2>Demo & data</h2>
        <button className="btn ghost" onClick={() => update((s) => seedHistory(s))}>
          Load two weeks of sample history
        </button>
        <p className="small" style={{ marginTop: 8 }}>Sample rows are tagged as demo data and never mixed into real reporting.</p>
        <button className="btn ghost" style={{ marginTop: 14, color: 'var(--negative)' }}
          onClick={async () => {
            if (!confirm('Delete everything on this device? This cannot be undone.')) return;
            await wipeEverything(state.people);
            location.reload();
          }}>
          <Trash2 size={22} /> Delete everything
        </button>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- people */

function People({ state, update }) {
  const rels = relationsFor(state.profile.community);
  const [name, setName] = useState('');
  const [rel, setRel] = useState(rels[0]?.key || '');
  const [living, setLiving] = useState(true);
  const [file, setFile] = useState(null);

  async function add() {
    if (!name.trim()) return;
    const id = uid();
    let photoId = null;
    if (file) { photoId = uid(); await savePhoto(photoId, file); }
    update((s) => ({
      ...s, onboarded: true,
      people: [...s.people, {
        id, name: name.trim(), relationKey: rel, photoId, living,
        group: rels.find((r) => r.key === rel)?.group || 'other',
        approvedAt: Date.now(),
      }],
    }));
    setName(''); setFile(null); setLiving(true);
  }

  async function remove(p) {
    if (p.photoId) await deletePhoto(p.photoId);
    update((s) => ({ ...s, people: s.people.filter((x) => x.id !== p.id) }));
  }

  return (
    <>
      <div className="panel">
        <h2><Users size={22} /> Add a person</h2>
        <p className="small">Only people she actually knows. Every photo is added and confirmed by you — the app never finds or invents a face.</p>
        <label htmlFor="nm">Name she uses for them</label>
        <input id="nm" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bhaskar" />
        <label htmlFor="rl">Relationship</label>
        <select id="rl" value={rel} onChange={(e) => setRel(e.target.value)}>
          {rels.map((r) => <option key={r.key} value={r.key}>{r.en}</option>)}
        </select>
        <label htmlFor="ph">Photo</label>
        <input id="ph" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <label htmlFor="lv">Is this person living?</label>
        <select id="lv" value={living ? 'y' : 'n'} onChange={(e) => setLiving(e.target.value === 'y')}>
          <option value="y">Yes</option><option value="n">No — they have passed away</option>
        </select>
        {!living && (
          <p className="note">
            They will only appear in gentle story moments, never in a question that asks her to identify them.
            Being asked to name someone who has died can bring the loss back, sometimes as if for the first time.
          </p>
        )}
        <button className="btn primary" style={{ marginTop: 14 }} onClick={add} disabled={!name.trim()}>
          <Plus size={22} /> Add person
        </button>
      </div>

      <div className="panel">
        <h2>{state.people.length} added</h2>
        <p className="small">Three or more unlocks the family tree. Five or more makes the matching game work well.</p>
        <div className="plist">
          {state.people.map((p) => (
            <div className="prow" key={p.id}>
              <Photo id={p.photoId} name={p.name} className="" />
              <div>
                <b>{p.name}</b>
                <div className="small">
                  {rels.find((r) => r.key === p.relationKey)?.en || p.relationKey}
                  {p.living === false && ' · story mode only'}
                </div>
              </div>
              <button className="iconbtn" onClick={() => remove(p)} aria-label={`Remove ${p.name}`}><Trash2 size={20} /></button>
            </div>
          ))}
          {!state.people.length && <p className="small">Nobody added yet.</p>}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------- things & places */

/** The SAME engines that run on people run on these. Adding an object here
 *  produces new questions in Who Is This? with no new game code. */
function Things({ state, update }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState('object');
  const [file, setFile] = useState(null);
  const things = state.things || [];
  const routines = state.routines || [];

  async function add() {
    if (!name.trim()) return;
    let photoId = null;
    if (file) { photoId = uid(); await savePhoto(photoId, file); }
    update((s) => ({
      ...s,
      things: [...(s.things || []), {
        id: uid(), name: name.trim(), kind, photoId, group: kind, approvedAt: Date.now(),
      }],
    }));
    setName(''); setFile(null);
  }

  async function remove(t) {
    if (t.photoId) await deletePhoto(t.photoId);
    update((s) => ({ ...s, things: (s.things || []).filter((x) => x.id !== t.id) }));
  }

  return (
    <>
      <div className="panel">
        <h2>Add a thing or a place</h2>
        <p className="small">
          Things she actually uses and places she actually goes. A photo of her own cup works
          far better than a picture of a cup.
        </p>
        <label htmlFor="tk">What is it?</label>
        <select id="tk" value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="object">An everyday thing — her cup, her shawl, the dao</option>
          <option value="place">A place — her kitchen, the market, the temple</option>
        </select>
        <label htmlFor="tn">What does she call it?</label>
        <input id="tn" value={name} onChange={(e) => setName(e.target.value)}
          placeholder={kind === 'place' ? 'e.g. the market' : 'e.g. her brass cup'} />
        <label htmlFor="tp">Photo</label>
        <input id="tp" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} />
        <button className="btn primary" style={{ marginTop: 14 }} onClick={add} disabled={!name.trim()}>
          <Plus size={22} /> Add
        </button>
      </div>

      <div className="panel">
        <h2>{things.length} added</h2>
        <p className="small">Two or more of a kind is enough for that kind to start appearing in games.</p>
        <div className="plist">
          {things.map((t) => (
            <div className="prow" key={t.id}>
              <Photo id={t.photoId} name={t.name} className="" />
              <div><b>{t.name}</b><div className="small">{t.kind === 'place' ? 'Place' : 'Everyday thing'}</div></div>
              <button className="iconbtn" onClick={() => remove(t)} aria-label={`Remove ${t.name}`}><Trash2 size={20} /></button>
            </div>
          ))}
          {!things.length && <p className="small">Nothing added yet.</p>}
        </div>
      </div>

      <div className="panel">
        <h2>Daily routines</h2>
        <p className="small">
          The steps of something she does every day — making tea, getting ready for the market.
          Used by the “In Order” activity. One step per line.
        </p>
        <RoutineAdder update={update} />
        <div className="plist" style={{ marginTop: 12 }}>
          {routines.map((r) => (
            <div key={r.id}>
              <div className="prow">
                <span className="ph" aria-hidden="true">📋</span>
                <div><b>{r.name}</b><div className="small">{r.steps.map((s) => s.label).join(' → ')}</div></div>
                <button className="iconbtn" aria-label={`Remove ${r.name}`}
                  onClick={() => update((s) => ({ ...s, routines: s.routines.filter((x) => x.id !== r.id) }))}>
                  <Trash2 size={20} />
                </button>
              </div>
              <RoutineSteps routine={r} update={update} />
            </div>
          ))}
          {!routines.length && <p className="small">No routines yet.</p>}
        </div>
      </div>
    </>
  );
}

/** Each step of "In Order" shows a photo if there is one, otherwise a generic
 *  icon (content/stepIcons.js) — this lets a caregiver enrich a step with her
 *  own photo later, without having to have one ready at creation time. */
function RoutineSteps({ routine, update }) {
  async function attach(stepId, file) {
    if (!file) return;
    const photoId = uid();
    await savePhoto(photoId, file);
    update((s) => ({
      ...s,
      routines: s.routines.map((r) => r.id !== routine.id ? r : {
        ...r, steps: r.steps.map((st) => (st.id === stepId ? { ...st, photoId } : st)),
      }),
    }));
  }
  return (
    <div className="plist" style={{ marginTop: 8, marginLeft: 12 }}>
      {routine.steps.map((s, i) => (
        <div className="prow" key={s.id} style={{ background: 'var(--surface)' }}>
          {hasStepImage(s)
            ? <Photo id={s.photoId} src={s.imageSrc} name={s.label} className="" />
            : <span className="ph nopic" aria-hidden="true"><ImagePlus size={22} /></span>}
          <div>
            <b>{i + 1}. {s.label}</b>
            <div className="small">{s.photoId ? 'Her own photo' : 'No picture yet — a photo of her actually doing this works best'}</div>
          </div>
          <label className="iconbtn" style={{ cursor: 'pointer' }} aria-label={`Add a photo for ${s.label}`}>
            <input type="file" accept="image/*" style={{ display: 'none' }}
              onChange={(e) => attach(s.id, e.target.files?.[0])} />
            <Plus size={18} />
          </label>
        </div>
      ))}
    </div>
  );
}

function RoutineAdder({ update }) {
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const steps = text.split('\n').map((l) => l.trim()).filter(Boolean);
  return (
    <>
      <label htmlFor="rn">Name of the task</label>
      <input id="rn" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Making tea" />
      <label htmlFor="rs">Steps, one per line</label>
      <textarea id="rs" rows={5} value={text} onChange={(e) => setText(e.target.value)}
        style={{ minHeight: 120 }} placeholder={'Boil the water\nAdd the tea leaves\nAdd milk\nPour into the cup'} />
      <button className="btn primary" style={{ marginTop: 12 }}
        disabled={!name.trim() || steps.length < 3}
        onClick={() => {
          update((s) => ({
            ...s,
            routines: [...(s.routines || []), {
              id: uid(), name: name.trim(),
              steps: steps.map((label) => ({ id: uid(), label })),
              approvedAt: Date.now(),
            }],
          }));
          setName(''); setText('');
        }}>
        <Plus size={22} /> Add routine{steps.length ? ` (${steps.length} steps)` : ''}
      </button>
      {!!name.trim() && steps.length < 3 && <p className="small">At least three steps.</p>}
    </>
  );
}

/* -------------------------------------------------------------- medicines */

function Medicines({ state, update }) {
  const [label, setLabel] = useState('');
  const [time, setTime] = useState('08:00');
  const meds = state.medicines || [];

  function add() {
    if (!label.trim()) return;
    update((s) => ({ ...s, medicines: [...(s.medicines || []), { id: uid(), label: label.trim(), time, log: {} }] }));
    setLabel(''); setTime('08:00');
  }
  function remove(id) {
    update((s) => ({ ...s, medicines: s.medicines.filter((m) => m.id !== id) }));
  }

  return (
    <>
      <div className="panel">
        <h2><Bell size={22} /> Add a reminder</h2>
        <p className="small">
          Only what you enter here is ever spoken to her or shown as a reminder. The on-device assistant
          can read this list but can never invent a name, dose or time.
        </p>
        <label htmlFor="ml">What is it called?</label>
        <input id="ml" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Morning tablet" />
        <label htmlFor="mt">Time</label>
        <input id="mt" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
        <button className="btn primary" style={{ marginTop: 14 }} onClick={add} disabled={!label.trim()}>
          <Plus size={22} /> Add reminder
        </button>
      </div>

      <div className="panel">
        <h2>{meds.length} reminder{meds.length === 1 ? '' : 's'}</h2>
        <div className="plist">
          {meds.map((m) => (
            <div className="prow" key={m.id}>
              <span className="ph" aria-hidden="true">{medicineDoneToday(m) ? '✅' : '⏰'}</span>
              <div><b>{m.label}</b><div className="small">{m.time}{medicineDoneToday(m) ? ' · taken today' : ''}</div></div>
              <button className="iconbtn" onClick={() => remove(m.id)} aria-label={`Remove ${m.label}`}><Trash2 size={20} /></button>
            </div>
          ))}
          {!meds.length && <p className="small">Nothing added yet.</p>}
        </div>
        <p className="note" style={{ marginTop: 12 }}>
          Reminders appear on the Home screen once their time has passed, and are marked done there. This
          build is a web app (PWA) — a reminder while the phone is locked or the app is closed needs the
          native Android packaging step (Capacitor, docs/06) and platform-level exact-alarm scheduling,
          which is not yet built. Say so rather than implying otherwise.
        </p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------- sync */

function Sync({ state, update, online: connected = navigator.onLine }) {
  const [busy, setBusy] = useState(false);
  const mode = state.profile.mode || 'online';
  const effectiveOnline = connected && mode !== 'offline';

  async function doSync() {
    setBusy(true);
    const ts = await pushToCloud(state);
    update((s) => ({ ...s, sync: { ...s.sync, lastSyncedAt: ts } }));
    setBusy(false);
  }

  const setMode = (m) => update((s) => ({ ...s, profile: { ...s.profile, mode: m } }));

  return (
    <>
      <div className="panel">
        <h2><CloudUpload size={22} /> Online or offline</h2>
        <p className="small">
          One app, one build. This switch decides whether the online-only extras are available at all —
          it cannot conjure a connection that isn't there, and it never changes anything the elder sees.
        </p>
        <div className="row" style={{ marginTop: 14 }}>
          <button className={`btn ${mode === 'offline' ? 'primary' : 'ghost'}`} style={{ width: 'auto', flex: 1 }}
            onClick={() => setMode('offline')}>
            <WifiOff size={20} /> Offline only
          </button>
          <button className={`btn ${mode === 'online' ? 'primary' : 'ghost'}`} style={{ width: 'auto', flex: 1 }}
            onClick={() => setMode('online')}>
            <Wifi size={20} /> Online allowed
          </button>
        </div>
        <p className="small" style={{ marginTop: 12 }}>
          Right now: <b>{effectiveOnline ? 'online' : 'offline'}</b>
          {mode === 'online' && !connected && ' — set to allow online, but this device has no connection.'}
        </p>

        <div className="note" style={{ marginTop: 12 }}>
          <b>What actually changes.</b> Identical in both modes: every game, content generation, the
          adaptive engine, reminders, the assistant, progress and the printable report. Online adds
          exactly one thing — the sync below. That is the whole difference, and it is deliberate: if
          anything in the daily loop needed a network, the app would be useless in the village it is for.
        </div>
      </div>

      <div className="panel">
        <h3>Sync</h3>
        <p className="note">
          A demonstration of the hybrid architecture, not a live cloud connection — "the cloud" in this
          build is simulated on this device, so nothing has actually left this phone. In a real deployment
          only de-identified engagement and report data would ever sync; photographs and personal facts
          would never leave the household's device.
        </p>
        <button className="btn primary" disabled={!effectiveOnline || busy} onClick={doSync}>
          {busy ? 'Syncing…' : 'Sync now'}
        </button>
        {!effectiveOnline && (
          <p className="small" style={{ marginTop: 8 }}>
            {connected ? 'Switched to offline only, so sync is off.' : 'No connection, so there is nothing to sync to.'}
          </p>
        )}
        <p className="small" style={{ marginTop: 10 }}>
          {state.sync?.lastSyncedAt ? `Last synced ${new Date(state.sync.lastSyncedAt).toLocaleString()}` : 'Never synced.'}
        </p>
      </div>
    </>
  );
}

/* ------------------------------------------------- how it adapts (judge view) */

function HowItAdapts({ state }) {
  const last = [...(state.sessions || [])].reverse().find((s) => s.actions?.length);
  return (
    <>
      <div className="panel">
        <h2><Brain size={22} /> How MindMitra is adapting</h2>
        <p className="small">
          Difficulty is not one level. It is several independent settings, each learned separately —
          she may be fine with six choices but struggle when the faces look alike. Those are different things,
          and one number would hide it.
        </p>
      </div>

      {Object.values(GAMES).map((g) => {
        const ability = abilityFor(state, g.id, g.dims);
        return (
          <div className="panel" key={g.id}>
            <h3>{g.title}</h3>
            {Object.entries(g.dims).map(([key, dim]) => {
              const lvl = levelFor(ability[key], dim);
              return (
                <div className="dim" key={key}>
                  <div className="hd">
                    <b>{dim.label}</b>
                    <span className="pill">{dim.describe(dim.levels[lvl])}</span>
                  </div>
                  <div className="steps" role="img" aria-label={`Level ${lvl + 1} of ${dim.levels.length}`}>
                    {dim.levels.map((_, i) => <i key={i} className={i < lvl ? 'on' : i === lvl ? 'cur' : ''} />)}
                  </div>
                  <div className="small mono" style={{ marginTop: 6 }}>ability θ = {ability[key].toFixed(2)} → level {lvl}</div>
                </div>
              );
            })}
          </div>
        );
      })}

      <div className="panel">
        <h3>What it decided last session</h3>
        {!last && <p className="small">Play an activity and the decisions will appear here.</p>}
        {last?.actions?.map((a, i) => (
          <div className="dim" key={i}>
            <div className="hd">
              <b>After item {a.at}</b>
              <span className="pill">{a.action}</span>
            </div>
            <p style={{ margin: '4px 0', fontSize: 17 }}>{a.reason}</p>
            <div className="small mono">
              decided by: {a.source} · state: {a.stateKey}
              {a.q && ` · Q[down,hold,up] = [${a.q.map((x) => x.toFixed(2)).join(', ')}]`}
            </div>
            {a.fuzzy && (
              <div className="small mono" style={{ marginTop: 4 }}>
                fuzzy: {a.fuzzy.action} (score {a.fuzzy.value >= 0 ? '+' : ''}{a.fuzzy.value}, confidence {a.fuzzy.confidence})
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="panel">
        <h3>The layers</h3>
        <ol style={{ paddingLeft: 20, fontSize: 17, lineHeight: 1.6 }}>
          <li><b>L0 Bounded ladder</b> — deterministic safety rails. At most two steps up or one step down within a session, never above recent best + 1; hard step-down after two misses in a row; stop gently after three. Nothing above can override this.</li>
          <li><b>L1 Elo ability estimate</b> — the workhorse. Converges in tens of items, not thousands. No training data, no model file.</li>
          <li><b>L2 Contextual bandit</b> — which activity, how long. <i>Roadmap.</i></li>
          <li><b>L3 Q-learning policy</b> — {qtableMeta.trained
            ? `trained on ${qtableMeta.episodes?.toLocaleString?.() || 'simulated'} simulated episodes, running greedy on this device.`
            : 'table not generated yet — the transparent rule below is running instead, and the app is fully adaptive either way.'}</li>
          <li><b>Fuzzy logic (runs alongside L3)</b> — a small rule set that reaches the same up/hold/down decision from soft, overlapping boundaries instead of hard cutoffs, so a noisy day (61% today, 59% tomorrow) doesn't get treated as a real change.</li>
        </ol>
        <p className="small" style={{ marginTop: 10 }}>
          <b>How the three are combined.</b> The clear-cut ends are decided by rule, not by the learned
          policy: comfortably above the target band with no cues means step up, below the band or leaning
          on cues means step down. The Q-table and the fuzzy advisor govern the ambiguous middle, and
          where the two disagree the difficulty is held steady rather than moved on a split vote.
          Everything they decide is still subject to the L0 rails above.
        </p>
        <p className="note">
          Target success band: {Math.round(FLOW_BAND[0] * 100)}–{Math.round(FLOW_BAND[1] * 100)}%.
          Set higher than the usual 70–85% because for this user the cost of failing is emotional, not just motivational.
          Exploration happens against simulated learners only — a real person never meets an untested policy.
        </p>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- report */

function Report({ state, update }) {
  const tt = totals(state);
  const real = (state.sessions || []).filter((s) => !s.demo);
  const mm = recentSessions(state, 'memorymatch', 6);
  const cueTrend = mm.length >= 2
    ? avgCue(mm.slice(-3)) - avgCue(mm.slice(0, 3))
    : 0;

  return (
    <>
      <div className="panel noprint">
        <h2><FileText size={22} /> Fortnightly summary</h2>
        <p className="small">One page. No data entry for the health worker. Print it or show it on the phone.</p>
        <button className="btn primary" onClick={() => window.print()}>Print / save as PDF</button>
      </div>

      <div className="panel">
        <p className="eyebrow">MINDMITRA ACTIVITY SUMMARY</p>
        <h2>{state.profile.preferredName || 'Not named'}</h2>
        <p className="small">Prepared {new Date().toLocaleDateString()} · carer: {state.profile.caregiverName || '—'}</p>

        <h3 style={{ marginTop: 18 }}>Engagement</h3>
        <div className="stats">
          <div className="stat"><span className="small">Sessions</span><b>{tt.sessions}</b></div>
          <div className="stat"><span className="small">Active minutes</span><b>{tt.mins}</b></div>
          <div className="stat"><span className="small">Activities done</span><b>{tt.items}</b></div>
          <div className="stat"><span className="small">Reminders kept</span><b>{state.medicines.filter((m) => m.done).length}/{state.medicines.length || 0}</b></div>
        </div>

        <h3 style={{ marginTop: 18 }}>Function, in plain words</h3>
        <ul style={{ fontSize: 17, lineHeight: 1.6, paddingLeft: 20 }}>
          <li>Completed {tt.sessions} sessions{real.length !== tt.sessions ? ` (${tt.sessions - real.length} sample rows included for demonstration)` : ''}.</li>
          <li>{cueTrend > 0.25
            ? 'Needed more cueing in recognition activities this fortnight than the previous one.'
            : cueTrend < -0.25
              ? 'Needed less cueing in recognition activities than the previous fortnight.'
              : 'Cueing needs were broadly steady across the fortnight.'}</li>
          <li>Working comfortably at {describeLevel(state)}.</li>
        </ul>

        <h3 style={{ marginTop: 18 }}>For the health worker</h3>
        <p style={{ fontSize: 17 }}>
          {cueTrend > 0.25
            ? 'Increased cueing dependence is worth mentioning at the next review.'
            : 'Nothing flagged this fortnight.'}
        </p>

        <div className="note" style={{ marginTop: 18, borderLeftColor: 'var(--accent)' }}>
          <b>This summarises app activity. It is not a medical or diagnostic assessment.</b> Game performance
          reflects engagement with the app and is not a clinical measure of cognition. MindMitra is not a
          diagnostic test, screening tool or medical device.
        </div>
      </div>
    </>
  );
}

const avgCue = (rows) => rows.length
  ? rows.reduce((a, s) => a + (s.items || []).reduce((b, i) => b + (i.cueLevel || 0), 0) / ((s.items || []).length || 1), 0) / rows.length
  : 0;

function describeLevel(state) {
  const g = GAMES.memorymatch;
  const a = abilityFor(state, 'memorymatch', g.dims);
  const lvl = levelFor(a.options, g.dims.options);
  return `${g.dims.options.levels[lvl]} choices per question`;
}
