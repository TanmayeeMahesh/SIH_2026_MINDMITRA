// T3 — regional-default routines for the Sequence (E1) engine, so "In Order"
// is playable from first launch, before any caregiver has entered a real
// routine of her own. Two generic, widely-recognisable everyday tasks.
//
// Each step carries a photograph of the ACTION (not an emoji, not a cartoon) —
// sourced openly-licensed, see public/content/t3/ATTRIBUTION.md. A caregiver's
// own photo of her doing the step still wins over these: attaching one sets
// `photoId` on the step, which takes precedence (content/stepIcons.js).

import t3manifest from './t3-manifest.json';

/** Look a step photo up by its manifest id, so a missing file degrades to the
 *  neutral "no picture yet" mark rather than a broken image. */
const stepSrc = (id) => {
  const hit = (t3manifest.steps || []).find((s) => s.id === id);
  return hit ? `/content/t3/${hit.file}` : null;
};

export const T3_ROUTINES = [
  {
    id: 't3-r-tea', name: 'Making tea', tier: 't3',
    steps: [
      { id: 't3-tea-1', label: 'Boil the water', imageSrc: stepSrc('t3-step-tea-boil') },
      { id: 't3-tea-2', label: 'Add the tea leaves', imageSrc: stepSrc('t3-step-tea-leaves') },
      { id: 't3-tea-3', label: 'Add milk', imageSrc: stepSrc('t3-step-tea-milk') },
      { id: 't3-tea-4', label: 'Pour into the cup', imageSrc: stepSrc('t3-step-tea-pour') },
    ],
  },
  {
    id: 't3-r-ready', name: 'Getting ready to go out', tier: 't3',
    steps: [
      { id: 't3-ready-1', label: 'Comb the hair', imageSrc: stepSrc('t3-step-ready-comb') },
      { id: 't3-ready-2', label: 'Wear the shawl', imageSrc: stepSrc('t3-step-ready-shawl') },
      { id: 't3-ready-3', label: 'Wear the sandals', imageSrc: stepSrc('t3-step-ready-sandals') },
      { id: 't3-ready-4', label: 'Take the umbrella', imageSrc: stepSrc('t3-step-ready-umbrella') },
    ],
  },
];
