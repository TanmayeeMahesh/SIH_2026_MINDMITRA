/**
 * Proof that the games are generated, not written.
 *
 *   node scripts/demo-generation.mjs
 *
 * Same code, same corpus, five different sessions — and the subject rotates
 * between people, everyday things and places on its own. Nothing below is a
 * hardcoded question. Useful to run in front of a jury after the live demo:
 * it shows the engine is a function of the caregiver's data, not a script.
 */

import { buildSession, canPlay } from '../src/engine/session.js';

// A small pretend household. In the real app this comes from Caregiver mode.
const state = {
  people: [
    { id: 'p1', name: 'Bhaskar', relationKey: 'son', group: 'child', living: true },
    { id: 'p2', name: 'Rima', relationKey: 'daughter_in_law', group: 'child', living: true },
    { id: 'p3', name: 'Nabin', relationKey: 'grandson', group: 'grandchild', living: true },
    { id: 'p4', name: 'Naren', relationKey: 'husband', group: 'spouse', living: false }, // deceased
  ],
  things: [
    { id: 't1', name: 'her brass cup', kind: 'object' },
    { id: 't2', name: 'the dao', kind: 'object' },
    { id: 't3', name: 'her shawl', kind: 'object' },
    { id: 't4', name: 'the kitchen', kind: 'place' },
    { id: 't5', name: 'the market', kind: 'place' },
    { id: 't6', name: 'the temple', kind: 'place' },
  ],
  routines: [{
    id: 'r1', name: 'making tea', steps: [
      { id: 's1', label: 'Boil the water' }, { id: 's2', label: 'Add tea leaves' },
      { id: 's3', label: 'Add milk' }, { id: 's4', label: 'Pour into the cup' },
    ],
  }],
  sessions: [],
};

const ability = { options: 1.4, direction: 0.5, distractor: 1.0 };

console.log('Playable from this corpus:');
for (const g of ['memorymatch', 'familytree', 'sequence']) {
  console.log(`  ${g.padEnd(13)} ${canPlay(state, g) ? 'yes' : 'no'}`);
}

console.log('\nFive sessions, same code, same data — nothing hardcoded:\n');
for (let i = 0; i < 5; i++) {
  const b = buildSession('memorymatch', { state, ability, count: 3 });
  console.log(`  [${(b.kind?.label || '—').padEnd(16)}] ` +
    b.items.map((it) => `"${it.prompt}"`).join('   '));
}

// Safety check, asserted rather than assumed (docs/07).
const leaked = Array.from({ length: 200 }, () => buildSession('memorymatch', { state, ability, count: 6 }))
  .some((b) => b.items.some((it) => it.target.id === 'p4' || it.options.some((o) => o.id === 'p4')));
console.log(`\nGuardrail — deceased person appeared in a quiz over 200 sessions: ${leaked ? 'YES (BUG)' : 'no'}`);

const sq = buildSession('sequence', { state, ability: { length: 2, reference: 0 } });
console.log(`\nSequence engine, from her own routine: ${sq.items[0]?.steps.map((s) => s.label).join(' -> ')}`);

console.log('\nAdd one more photo in Caregiver mode and every line above changes.');
