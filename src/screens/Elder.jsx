import React, { useState } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, Bot, Brain, CalendarDays, Check, ChevronRight, Clock, Heart,
  Home as HomeIcon, Images, IndianRupee, Leaf, ListOrdered, MapPin, Pill, Search, Send, Sparkles,
  Sprout, User, Users, Volume2,
} from 'lucide-react';
import Photo from '../components/Photo.jsx';
import { GAMES } from '../engine/ladder.js';
import { canPlay, needsHint } from '../engine/session.js';
import { totals, uid, dueMedicines, medicineDoneToday, markMedicineDone, screenTimeReached } from '../store/state.js';
import { play, synth } from '../audio/speak.js';
import { t } from '../content/strings.js';
import { relationLabel } from '../content/kinship.js';

/* ---------------------------------------------------------------- home */

export function Home({ state, go, update }) {
  const lang = state.profile.language;
  const name = state.profile.preferredName;
  const greet = `${t(lang, 'home.greeting')}${name ? ', ' + name : ''}`;
  const due = dueMedicines(state);
  const paused = screenTimeReached(state);
  return (
    <div className="scroll">
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 8 }}>
        <div style={{ flex: 1 }}>
          <h1>{greet}</h1>
          <p className="sub">{t(lang, 'home.question')}</p>
        </div>
        <button className="speaker" aria-label="Read aloud"
          onClick={() => play('home.question', `${greet}. ${t(lang, 'home.question')}`)}>
          <Volume2 size={30} />
        </button>
      </div>

      {due.map((m) => (
        <div className="reminder" key={m.id}>
          <Bell size={26} aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <b>{m.label}</b>
            <div className="small">Time for this, at {m.time}</div>
          </div>
          <button className="btn primary" style={{ width: 'auto', padding: '10px 18px' }}
            onClick={() => { markMedicineDone(update, m.id); play('fb.good', 'Taken. Well done.'); }}>
            <Check size={20} /> Done
          </button>
        </div>
      ))}

      <div className="hero">
        <button className="a" onClick={() => go('general')} disabled={paused} style={paused ? { opacity: 0.6 } : undefined}>
          <Brain size={44} aria-hidden="true" />
          <h3>{t(lang, 'home.general')}</h3>
          <p>{t(lang, 'home.generalSub')}</p>
          <span className="circle" aria-hidden="true"><ArrowRight size={22} /></span>
        </button>
        <button className="b" onClick={() => go('games')} disabled={paused} style={paused ? { opacity: 0.6 } : undefined}>
          <Heart size={44} aria-hidden="true" />
          <h3>{t(lang, 'home.personal')}</h3>
          <p>{t(lang, 'home.personalSub')}</p>
          <span className="circle" aria-hidden="true"><ArrowRight size={22} /></span>
        </button>
      </div>

      {paused && (
        <div className="quote" style={{ marginBottom: 16 }}>
          <Leaf size={26} aria-hidden="true" />
          <div><b>That's enough playing for today.</b><span className="small"> See you tomorrow.</span></div>
        </div>
      )}

      <button className="banner" onClick={() => go('chat')} style={{ marginBottom: 16 }}>
        <span className="avatar" aria-hidden="true"><Bot size={28} /></span>
        <span style={{ flex: 1 }}>
          <b style={{ display: 'block', fontSize: 20 }}>{t(lang, 'home.chat')}</b>
          <span className="small">{t(lang, 'home.chatSub')}</span>
        </span>
        <ChevronRight aria-hidden="true" />
      </button>

      {!!state.medicines.length && (
        <>
          <h2 style={{ marginTop: 20 }}>Today</h2>
          <div className="plist">
            {state.medicines.map((m) => (
              <div className="prow" key={m.id}>
                <span className="ph" aria-hidden="true">{medicineDoneToday(m) ? '✅' : '⏰'}</span>
                <div><b>{m.label}</b><div className="small">{m.time}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="quote">
        <Sprout size={28} aria-hidden="true" />
        <div><b>{t(lang, 'home.quote')}</b></div>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- games list */

const ICONS = { memorymatch: Users, familytree: Heart, findit: Search, marketmoney: IndianRupee, sequence: ListOrdered };

// The two lists are deliberately NOT the same set.
//   Family Tree has no generic version — there is no such thing as a stock "family".
//   Market Day has no personal version — currency is currency; nothing about it
//   comes from her corpus, so listing it under "Personal Games" made the personal
//   games look broken ("only Market Day works") when really it just didn't belong.
const PERSONAL_GAME_IDS = ['memorymatch', 'familytree', 'findit', 'sequence'];
const GENERAL_GAME_IDS = ['memorymatch', 'findit', 'marketmoney', 'sequence'];

/** Personal Games — always built from the caregiver's own corpus (T1). This
 *  is deliberately never padded with regional-default content; if there
 *  isn't enough of her own material yet, the card stays disabled with a
 *  nudge rather than quietly showing someone else's photos in its place. */
export function Games({ state, go, onBack }) {
  const lang = state.profile.language;
  return (
    <div className="scroll">
      <Title onBack={onBack} title={t(lang, 'games.title')} sub={t(lang, 'games.sub')} />
      <div className="glist">
        {PERSONAL_GAME_IDS.map((id) => {
          const g = GAMES[id];
          const Icon = ICONS[id] || Brain;
          const playable = canPlay(state, id, 'personal');
          return (
            <button key={id} className="gcard" onClick={() => playable && go(id, 'personal')}
              disabled={!playable} aria-disabled={!playable}
              style={playable ? undefined : { opacity: 0.55 }}>
              <span className="ico" aria-hidden="true"><Icon size={30} /></span>
              <b>{g.title}</b>
              <span className="small">
                {playable ? g.subtitle : needsHint(state, id)}
              </span>
            </button>
          );
        })}
      </div>
      <div className="quote" style={{ marginTop: 18 }}>
        <Leaf size={26} aria-hidden="true" />
        <div><b>Take your time.</b><span className="small"> There is no timer and mistakes are fine.</span></div>
      </div>
    </div>
  );
}

/** General Games — always built from the regional-default pack (T3). Always
 *  playable, from the very first launch, with zero onboarding — this is what
 *  makes the app demoable (and genuinely useful for a cold start) before a
 *  caregiver has added anything of her own. */
export function General({ state, go, onBack }) {
  const lang = state.profile.language;
  return (
    <div className="scroll">
      <Title onBack={onBack} title={t(lang, 'home.general')} sub="The same engines, with everyday pictures — no setup needed" />
      <div className="glist">
        {GENERAL_GAME_IDS.map((id) => {
          const g = GAMES[id];
          const Icon = ICONS[id] || Brain;
          const playable = canPlay(state, id, 'general');
          return (
            <button key={id} className="gcard" onClick={() => playable && go(id, 'general')}
              disabled={!playable} aria-disabled={!playable}
              style={playable ? undefined : { opacity: 0.55 }}>
              <span className="ico" aria-hidden="true"><Icon size={30} /></span>
              <b>{g.title}</b>
              <span className="small">{g.subtitle}</span>
            </button>
          );
        })}
      </div>
      <p className="small" style={{ marginTop: 14 }}>
        These use common, everyday pictures rather than her own photographs. Personal Games, once set up, use hers.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------ progress */

export function Progress({ state, onBack }) {
  const lang = state.profile.language;
  const tt = totals(state);
  const recent = [...(state.sessions || [])].slice(-7);
  return (
    <div className="scroll">
      <Title onBack={onBack} title={t(lang, 'progress.title')} sub="Small steps count" />
      <div className="stats">
        <div className="stat"><span className="small">Activities</span><b>{tt.sessions}</b></div>
        <div className="stat"><span className="small">Minutes</span><b>{tt.mins}</b></div>
        <div className="stat"><span className="small">People known</span><b>{state.people.length}</b></div>
        <div className="stat"><span className="small">This week</span><b>{recent.length}</b></div>
      </div>
      <div className="panel" style={{ marginTop: 16 }}>
        <h3>Recent</h3>
        {!recent.length && <p className="small">Nothing yet — play an activity to begin.</p>}
        <div className="plist">
          {recent.reverse().map((s) => (
            <div className="prow" key={s.id}>
              <span className="ph" aria-hidden="true">🌿</span>
              <div>
                <b>{GAMES[s.game]?.title || s.game}</b>
                <div className="small">{new Date(s.ts).toLocaleDateString()}{s.demo ? ' · sample' : ''}</div>
              </div>
              <Check size={20} aria-hidden="true" />
            </div>
          ))}
        </div>
      </div>
      <p className="small" style={{ marginTop: 14 }}>
        This shows how much she has been doing, not how well. It is not a score.
      </p>
    </div>
  );
}

/* ------------------------------------------------------------- profile */

/** Profile used to render the Progress screen verbatim — two nav tabs, one
 *  screen. This is her own page: who she is, who her people are, and the one
 *  setting she might actually want to change herself (text size). Everything
 *  is picture-first and speaks when tapped. */
export function Profile({ state, update, onBack }) {
  const lang = state.profile.language;
  const p = state.profile;
  const community = p.community;
  const living = (state.people || []).filter((x) => x.living !== false);
  const things = state.things || [];
  const scale = p.textScale || 1;

  const setScale = (v) => update((s) => ({ ...s, profile: { ...s.profile, textScale: v } }));

  return (
    <div className="scroll">
      <Title onBack={onBack} title={t(lang, 'nav.profile')} sub="About you" />

      <div className="panel" style={{ textAlign: 'center' }}>
        <div className="avatar" style={{ width: 88, height: 88, margin: '0 auto 12px' }} aria-hidden="true">
          <User size={44} />
        </div>
        <h2 style={{ marginBottom: 4 }}>{p.preferredName || 'Your name is not set yet'}</h2>
        <p className="small">{LANG_LABEL[lang] || lang}</p>
        <button className="btn ghost" style={{ marginTop: 12 }}
          onClick={() => synth(p.preferredName ? `You are ${p.preferredName}.` : 'Your name is not set yet.')}>
          <Volume2 size={22} /> Say my name
        </button>
      </div>

      {!!living.length && (
        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Your people</h3>
          <p className="small">Tap anyone to hear who they are.</p>
          <div className="shelf" style={{ marginTop: 12 }}>
            {living.map((x) => (
              <button key={x.id} className="pcard" aria-label={x.name}
                onClick={() => synth(`${x.name}, your ${relationLabel(community, x.relationKey).toLowerCase()}.`)}>
                <Photo id={x.photoId} src={x.imageSrc} name={x.name} className="" />
                <span>{x.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {!!things.length && (
        <div className="panel">
          <h3 style={{ marginBottom: 10 }}>Your things and places</h3>
          <div className="shelf" style={{ marginTop: 12 }}>
            {things.map((x) => (
              <button key={x.id} className="pcard" aria-label={x.name} onClick={() => synth(x.name)}>
                <Photo id={x.photoId} src={x.imageSrc} name={x.name} className="" />
                <span>{x.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="panel">
        <h3 style={{ marginBottom: 10 }}>Text size</h3>
        <div className="row" style={{ flexWrap: 'wrap' }}>
          {[['Normal', 1], ['Big', 1.15], ['Biggest', 1.3]].map(([label, v]) => (
            <button key={label} className={`btn ${scale === v ? 'primary' : 'ghost'}`}
              style={{ width: 'auto', flex: 1 }} onClick={() => setScale(v)}>{label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

const LANG_LABEL = { en: 'English', as: 'অসমীয়া (Assamese)' };

/* ---------------------------------------------------------------- chat */

export function Chat({ state, update, onBack, go }) {
  const [text, setText] = useState('');
  const lang = state.profile.language;
  const msgs = state.chat.length ? state.chat : [{ role: 'a', text: `Hello${state.profile.preferredName ? ', ' + state.profile.preferredName : ''}. How are you feeling today?` }];

  function send(input) {
    const q = (input ?? text).trim();
    if (!q) return;
    const reply = answer(q, state);
    update((s) => ({
      ...s,
      chat: [...(s.chat.length ? s.chat : msgs),
        { role: 'u', text: q },
        { role: 'a', text: reply.text, action: reply.action || null }],
    }));
    setText('');
    synth(reply.text);
  }

  // Quick replies are the main way in for someone who does not type — and each
  // one is spoken back, because tapping a written chip still assumes reading.
  // Only offer the ones that can actually be answered from local data.
  const chips = [
    { icon: Pill, label: 'Did I take my medicine?', when: true },
    { icon: Images, label: 'Show me photographs', when: true },
    { icon: Users, label: 'Who is in my family?', when: (state.people || []).length > 0 },
    { icon: CalendarDays, label: 'What day is it today?', when: true },
    { icon: Clock, label: 'What is next today?', when: (state.medicines || []).length > 0 },
    { icon: ListOrdered, label: 'How do I make tea?', when: (state.routines || []).length > 0 },
    { icon: MapPin, label: 'Where do I go?', when: (state.things || []).some((x) => x.kind === 'place') },
    { icon: Sparkles, label: 'What have I done today?', when: true },
    { icon: Heart, label: 'I am feeling low', when: true },
  ].filter((c) => c.when);

  return (
    <div className="scroll">
      <Title onBack={onBack} title="MindMitra" sub="I am here to help" />
      <div className="chat">
        {msgs.map((m, i) => (
          <React.Fragment key={i}>
            <div className={`bub${m.role === 'u' ? ' me' : ''}`}>
              {m.text}
              {m.role === 'a' && (
                <button className="bubspeak" aria-label="Read this again" onClick={() => synth(m.text)}>
                  <Volume2 size={18} />
                </button>
              )}
            </div>
            {/* An answer that offers to DO something offers the button to do it.
                Telling her "shall we look at a photograph?" and then leaving her
                to find the photographs herself is not an answer. */}
            {m.action && go && (
              <button className="btn secondary" style={{ width: 'auto', alignSelf: 'flex-start' }}
                onClick={() => go(m.action.screen)}>
                <Images size={22} /> {m.action.label}
              </button>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="chips">
        {chips.map((c) => (
          <button key={c.label} className="chip" onClick={() => send(c.label)}>
            <c.icon size={20} aria-hidden="true" />
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      <div className="row" style={{ marginTop: 12 }}>
        <input value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()} placeholder="Type a message" aria-label="Message" />
        <button className="btn primary" style={{ width: 'auto', padding: '0 22px' }} onClick={() => send()} aria-label="Send"><Send size={24} /></button>
      </div>
      <p className="note">
        This assistant reads only what a caregiver entered on this phone. It works with no internet
        connection and it never invents medication times, doses or facts about your family.
      </p>
    </div>
  );
}

/** Rule-based, on-device, reads structured local data only.
 *
 *  GUARDRAIL 2 (docs/07): it can READ medication records; it can never COMPOSE
 *  them. Every branch below either reports a stored fact verbatim or says
 *  plainly that it does not know — there is no path here that invents
 *  anything about her life, which is exactly why this stays a rule engine
 *  rather than becoming a language model with her health data in the prompt. */
function answer(q, state) {
  const s = q.toLowerCase().trim();
  const name = state.profile.preferredName;
  const people = state.people || [];
  const meds = state.medicines || [];
  const routines = state.routines || [];
  const things = state.things || [];
  const places = things.filter((x) => x.kind === 'place');
  const community = state.profile.community;
  const call = name ? `, ${name}` : '';

  const say = (text, action = null) => ({ text, action });
  // Only real, caregiver-added photographs count. The regional-default pack is
  // stock imagery — offering it as "your photographs" would be a small lie.
  const photoCount = people.filter((p) => p.photoId).length + things.filter((x) => x.photoId).length;
  const photoAction = photoCount
    ? { label: 'Show me the photographs', screen: 'profile' }
    : null;
  const noPhotosYet = 'There are no photographs on this phone yet. Whoever looks after you can add them in the carer settings, and then we can look at them together.';

  // --- photographs: take her there, or say plainly that there are none
  if (/photo|photograph|picture|image|album|look at (them|some)|see (them|her|him)/.test(s)) {
    if (!photoCount) return say(noPhotosYet);
    return say(photoCount === 1
      ? 'Yes, let us look at it together. There is one photograph here.'
      : `Yes, let us look at them together. There are ${photoCount} photographs here.`, photoAction);
  }

  // --- a person she named: "who is Bhaskar", "tell me about Rina"
  const person = people.find((p) => p.name && s.includes(p.name.toLowerCase()));
  if (person) {
    const rel = relationLabel(community, person.relationKey).toLowerCase();
    return say(person.living === false
      ? `${person.name} was your ${rel}. They are remembered with love.`
      : `${person.name} is your ${rel}.`, photoAction);
  }

  // --- medicines and reminders
  if (/medicine|tablet|pill|dose|medication|injection/.test(s)) {
    if (!meds.length) return say('Your carer has not added any medicines yet, so I do not have anything to tell you. I will never guess about medicine.');
    const done = meds.filter(medicineDoneToday);
    const pending = meds.filter((m) => !medicineDoneToday(m));
    const a = done.length ? `You have taken ${done.map((m) => m.label).join(' and ')}. ` : '';
    return say(a + (pending.length
      ? `Still to come: ${pending.map((m) => `${m.label} at ${m.time}`).join(', ')}.`
      : 'That is all of them for today. Well done.'));
  }
  if (/what.*(next|now)|schedule|later today/.test(s)) {
    const pending = meds.filter((m) => !medicineDoneToday(m));
    if (pending.length) return say(`Next is ${pending[0].label} at ${pending[0].time}.`);
    return say('Nothing else is set for today. You could rest, or we could do a small activity together.');
  }

  // --- orientation: day, date, time
  if (/what day|which day|what.*date|today.*date/.test(s)) {
    return say(`Today is ${new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' })}.`);
  }
  if (/what time|time is it|clock/.test(s)) {
    return say(`It is ${new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}.`);
  }

  // --- family
  if (/family|children|son|daughter|grandchild|husband|wife|relative|who are/.test(s)) {
    if (!people.length) return say('Your carer has not added anyone yet.');
    const living = people.filter((p) => p.living !== false);
    const list = living.map((p) => `${p.name}, your ${relationLabel(community, p.relationKey).toLowerCase()}`).join('; ');
    return say(photoCount ? `${list}. Would you like to see their photographs?` : `${list}.`, photoAction);
  }

  // --- routines: "how do I make tea"
  if (/how do i|how to|steps|make tea|cook|prepare|get ready/.test(s)) {
    const r = routines.find((x) => x.name && s.includes(x.name.toLowerCase().split(' ')[0]))
      || routines.find((x) => /tea/.test(s) && /tea/i.test(x.name))
      || routines[0];
    if (!r) return say('Your carer has not written down any daily steps yet.');
    return say(`${r.name}: ${r.steps.map((st, i) => `${i + 1}, ${st.label}`).join('. ')}.`);
  }

  // --- places
  if (/where|place|market|temple|outside|go out/.test(s)) {
    if (!places.length) return say('Your carer has not added any places yet.');
    return say(`The places you know: ${places.map((p) => p.name).join(', ')}. Please do not go out alone — ask someone at home to go with you.`);
  }

  // --- today's activity
  if (/what have i done|today.*do|my day|activity|progress/.test(s)) {
    const today = (state.sessions || []).filter((x) => !x.demo && new Date(x.ts).toDateString() === new Date().toDateString());
    if (!today.length) return say(`Nothing yet today${call}. Would you like to do one small activity?`);
    return say(`You have done ${today.length} ${today.length === 1 ? 'activity' : 'activities'} today. That is good going.`);
  }

  // --- feelings. Offering to look at a photograph and then not taking her
  // there is the kind of small letdown this app cannot afford, so the offer
  // is only made when there is actually something to show.
  if (/sad|lonely|low|not well|tired|scared|afraid|worried|upset|angry/.test(s)) {
    return photoCount
      ? say(`I am sorry today feels hard${call}. Would you like to sit with someone, or shall we look at a photograph together?`, photoAction)
      : say(`I am sorry today feels hard${call}. Would you like to sit with someone? I am here with you.`);
  }
  if (/happy|good|fine|well|nice/.test(s)) {
    return say(`That is lovely to hear${call}. Would you like to do a small activity?`);
  }

  // --- who am I / where am I
  if (/who am i|my name|what.*call me/.test(s)) {
    return say(name ? `You are ${name}.` : 'Your carer has not told me your name yet.');
  }

  // --- games
  if (/game|play|activity|something to do|bored/.test(s)) {
    return say('We could put the steps of a task in order, or find things together. Tap General Games when you are ready.');
  }

  // --- conversational glue
  if (/^(hello|hi|hey|good morning|good evening|namaskar|namaste)/.test(s)) {
    return say(`Hello${call}. How are you feeling today?`);
  }
  if (/thank|thanks/.test(s)) return say('You are very welcome.');
  if (/bye|goodbye|good night/.test(s)) return say(`Goodbye${call}. I am here whenever you need me.`);
  if (/again|repeat|what did you say|did not hear|pardon/.test(s)) {
    return say('Of course. Tap the speaker beside any of my answers and I will say it again.');
  }
  if (/yes|yeah|ok|okay|sure|please/.test(s) && photoCount) {
    return say('Here they are.', photoAction);
  }

  return say(`I am here with you${call}. You can ask me about your medicines, your family, what day it is, or what happens next today.`);
}

/* --------------------------------------------------------------- bits */

function Title({ title, sub, onBack }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
      {onBack && <button className="iconbtn" onClick={onBack} aria-label="Back"><ArrowLeft size={26} /></button>}
      <div><h1>{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
    </div>
  );
}

export function Nav({ screen, go, lang }) {
  const items = [
    ['home', HomeIcon, t(lang, 'nav.home')],
    ['progress', Leaf, t(lang, 'nav.progress')],
    ['safewalk', MapPin, 'Safe Walk'],
    ['profile', User, t(lang, 'nav.profile')],
  ];
  return (
    <nav className="nav">
      {items.map(([k, Icon, label]) => (
        <button key={k} className={screen === k ? 'on' : ''} onClick={() => go(k)} aria-current={screen === k}>
          <Icon size={26} aria-hidden="true" /><span>{label}</span>
        </button>
      ))}
    </nav>
  );
}
