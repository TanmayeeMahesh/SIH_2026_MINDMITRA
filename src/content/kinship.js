// THE KINSHIP MODEL LIVES IN THE CONTENT PACK, NOT IN CODE. (docs/15)
//
// Our first draft hardcoded "daughter-in-law" as the caregiver. That encodes a
// patrilineal, virilocal joint family and is structurally WRONG for Khasi,
// Jaintia and Garo households in Meghalaya, where lineage runs through the
// mother, the husband moves into his mother-in-law's home, the youngest
// daughter (Ka Khadduh) inherits along with the customary duty of caring for
// her parents, and the maternal uncle (U Kni) has formal standing.
//
// So a community defines its own relationship vocabulary and its own default
// caregiver role. The engine never assumes one.

export const KINSHIP = {
  assamese: {
    id: 'assamese',
    label: 'Assamese (patrilineal)',
    descent: 'patrilineal',
    defaultCaregiverRole: 'daughter_in_law',
    // group is used for distractor similarity — same group == harder to tell apart
    relations: [
      { key: 'son', en: 'Son', as: 'পুত্ৰ', group: 'child' },
      { key: 'daughter', en: 'Daughter', as: 'জীয়ৰী', group: 'child' },
      { key: 'daughter_in_law', en: 'Daughter-in-law', as: 'বোৱাৰী', group: 'child' },
      { key: 'son_in_law', en: 'Son-in-law', as: 'জোঁৱাই', group: 'child' },
      { key: 'grandson', en: 'Grandson', as: 'নাতি', group: 'grandchild' },
      { key: 'granddaughter', en: 'Granddaughter', as: 'নাতিনী', group: 'grandchild' },
      { key: 'brother', en: 'Brother', as: 'ভাই', group: 'sibling' },
      { key: 'sister', en: 'Sister', as: 'ভনী', group: 'sibling' },
      { key: 'husband', en: 'Husband', as: 'স্বামী', group: 'spouse' },
      { key: 'neighbour', en: 'Neighbour', as: 'ওচৰ-চুবুৰীয়া', group: 'other' },
    ],
  },

  khasi: {
    id: 'khasi',
    label: 'Khasi (matrilineal)',
    descent: 'matrilineal',
    // Ka Khadduh, the youngest daughter, inherits AND carries the customary
    // duty of caring for elderly parents. She is the default caregiver here.
    defaultCaregiverRole: 'youngest_daughter',
    relations: [
      { key: 'youngest_daughter', en: 'Youngest daughter (Ka Khadduh)', kha: 'Ka Khadduh', group: 'child' },
      { key: 'daughter', en: 'Daughter', kha: 'Ka khun kynthei', group: 'child' },
      { key: 'son', en: 'Son', kha: 'U khun shynrang', group: 'child' },
      { key: 'maternal_uncle', en: 'Maternal uncle (U Kni)', kha: 'U Kni', group: 'elder' },
      { key: 'mother', en: 'Mother', kha: 'Ka Mei', group: 'elder' },
      { key: 'grandchild', en: 'Grandchild', kha: 'U/Ka su', group: 'grandchild' },
      { key: 'sister', en: 'Sister', kha: 'Ka para kynthei', group: 'sibling' },
      { key: 'brother', en: 'Brother', kha: 'U para shynrang', group: 'sibling' },
      { key: 'neighbour', en: 'Neighbour', kha: 'Ki para shnong', group: 'other' },
    ],
  },

  generic: {
    id: 'generic',
    label: 'Not specified',
    descent: 'unspecified',
    defaultCaregiverRole: null,
    relations: [
      { key: 'child', en: 'Son or daughter', group: 'child' },
      { key: 'grandchild', en: 'Grandchild', group: 'grandchild' },
      { key: 'sibling', en: 'Brother or sister', group: 'sibling' },
      { key: 'spouse', en: 'Husband or wife', group: 'spouse' },
      { key: 'relative', en: 'Other relative', group: 'other' },
      { key: 'friend', en: 'Friend or neighbour', group: 'other' },
    ],
  },
};

export function relationsFor(communityId) {
  return (KINSHIP[communityId] || KINSHIP.generic).relations;
}

export function relationLabel(communityId, key, lang = 'en') {
  const r = relationsFor(communityId).find((x) => x.key === key);
  if (!r) return key;
  return r[lang] || r.en;
}

export function relationGroup(communityId, key) {
  return relationsFor(communityId).find((x) => x.key === key)?.group || 'other';
}
