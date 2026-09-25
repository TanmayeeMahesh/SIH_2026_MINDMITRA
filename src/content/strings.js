// UI strings + the audio manifest.
//
// Every key here that the elder hears should have a corresponding mp3 generated
// by scripts/generate-audio.mjs and listed in AUDIO. Until then speak.js falls
// back to Web Speech, so the app is fully usable during development.
//
// Text is present mainly for the CAREGIVER. The elder's channel is picture +
// spoken audio — reading ability cannot be assumed (docs/01 §3).

export const STRINGS = {
  en: {
    'app.tagline': 'Play · Remember · Stay connected',
    'home.greeting': 'Good morning',
    'home.question': 'What would you like to do today?',
    'home.general': 'General Games',
    'home.generalSub': 'Fun activities to keep your mind active',
    'home.personal': 'Personal Games',
    'home.personalSub': 'Your memories, family and life stories',
    'home.chat': 'Talk with MindMitra',
    'home.chatSub': 'Ask anything, any time',
    'home.quote': 'Small steps towards a brighter you',
    'games.title': 'Personal Games',
    'games.sub': 'Choose one gentle activity',
    'game.listen': 'Listen again',
    'game.hint': 'Show me a hint',
    'game.next': 'Next',
    'game.finish': 'Finish',
    'mm.whoIs': 'Which one is',
    'mm.whatName': 'What is this person called?',
    'ft.title': 'Put each person in their place',
    'fb.good': 'Lovely.',
    'fb.great': 'Wonderful.',
    'fb.soft': 'Let us look again together.',
    'fb.shown': 'Here they are, together.',
    'session.done': 'That was lovely. Shall we do this again tomorrow?',
    'session.floor': 'Let us rest here for today. You did well to try.',
    'progress.title': 'My Progress',
    'nav.home': 'Home', 'nav.progress': 'Progress', 'nav.profile': 'Profile',
  },
  as: {
    'app.tagline': 'খেলক · মনত পেলাওক · সংযুক্ত থাকক',
    'home.greeting': 'শুভ ৰাতিপুৱা',
    'home.question': 'আজি আপুনি কি কৰিব বিচাৰে?',
    'home.general': 'সাধাৰণ খেল',
    'home.generalSub': 'মন সজীৱ ৰাখিবলৈ ৰাসায়নিক কাম',
    'home.personal': 'ব্যক্তিগত খেল',
    'home.personalSub': 'আপোনাৰ স্মৃতি, পৰিয়াল আৰু জীৱনৰ কাহিনী',
    'home.chat': 'মাইণ্ডমিত্ৰাৰ সৈতে কথা পাতক',
    'home.chatSub': 'যিকোনো সময়ত সোধক',
    'home.quote': 'উজ্জ্বল কাইলৈৰ বাবে সৰু সৰু খোজ',
    'games.title': 'ব্যক্তিগত খেল',
    'games.sub': 'এটা কোমল কাম বাছি লওক',
    'game.listen': 'পুনৰ শুনক',
    'game.hint': 'মোক এটা ইংগিত দিয়ক',
    'game.next': 'পৰৱৰ্তী',
    'game.finish': 'শেষ কৰক',
    'mm.whoIs': 'কোনজন হ’ল',
    'mm.whatName': 'এওঁৰ নাম কি?',
    'ft.title': 'প্ৰতিজনক নিজৰ ঠাইত ৰাখক',
    'fb.good': 'বৰ ভাল।',
    'fb.great': 'অতি সুন্দৰ।',
    'fb.soft': 'আহক, আকৌ এবাৰ চাওঁ।',
    'fb.shown': 'এইয়া, একেলগে।',
    'session.done': 'বৰ ভাল লাগিল। কাইলৈ আকৌ কৰিম নেকি?',
    'session.floor': 'আজিলৈ ইয়াতে জিৰাওঁ। আপুনি চেষ্টা কৰি ভাল কৰিলে।',
    'progress.title': 'মোৰ অগ্ৰগতি',
    'nav.home': 'ঘৰ', 'nav.progress': 'অগ্ৰগতি', 'nav.profile': 'প্ৰফাইল',
  },
};

// Written by scripts/generate-audio.mjs — no copy-paste step.
// Key -> /audio/<lang>/<key>.mp3. A language with an empty map falls back to
// Web Speech, so the app always works.
import manifest from './audio-manifest.js';

export const AUDIO = { as: {}, en: {}, ...manifest };

export function t(lang, key, fallback) {
  return STRINGS[lang]?.[key] ?? STRINGS.en[key] ?? fallback ?? key;
}

export const LANGUAGES = [
  { id: 'as', label: 'অসমীয়া (Assamese)', tts: 'Sarvam / AI4Bharat / Bhashini' },
  { id: 'en', label: 'English', tts: 'Web Speech' },
];
