// Step imagery for the Sequence (E1) engine.
//
// This used to return an emoji per step label. Emoji are the wrong answer here
// for two reasons: they are a typeface, so they render differently (or not at
// all) across devices, and a cartoon teacup is not what "pour the tea" looks
// like in her kitchen. A step should show a photograph of the action.
//
// Resolution order for a step's picture:
//   1. step.photoId   — the caregiver's own photo of her doing it (best; T1)
//   2. step.imageSrc  — a photo shipped with the default routine pack (T3)
//   3. nothing        — the screen renders a neutral "add a photo" icon, never
//                       an emoji, and the caregiver console nudges her to add one.

export function stepImage(step = {}) {
  return { photoId: step.photoId || null, imageSrc: step.imageSrc || null };
}

export function hasStepImage(step = {}) {
  return !!(step.photoId || step.imageSrc);
}
