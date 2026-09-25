/**
 * MindMitra: Voice-First Interaction Engine
 * Features Multilingual Text-to-Speech (TTS) + Continuous Hands-Free Speech Recognition (STT)
 * Zero Voice Toggles: Operates naturally and automatically in the background.
 */

class VoiceEngine {
  constructor() {
    this.currentLanguage = 'en'; // 'en', 'hi', 'mr', 'as', 'bn'
    this.currentPersona = 'gentle_caregiver';
    this.synth = window.speechSynthesis;
    this.isMuted = false;
    this.lastPrompt = "";
    this.availableVoices = [];

    // Continuous Speech Recognition (Hands-Free STT)
    this.recognition = null;
    this.isListening = false;
    this.shouldListen = true;
    this.onVoiceCommand = null;

    // English Personas
    this.personas = {
      gentle_caregiver: {
        name: "Gentle Maya",
        rate: 0.85,
        pitch: 1.15,
        genderPreference: 'female'
      },
      calm_guide: {
        name: "Calm Rohan",
        rate: 0.88,
        pitch: 0.95,
        genderPreference: 'male'
      },
      elder_friend: {
        name: "Warm Elder",
        rate: 0.78,
        pitch: 1.0,
        genderPreference: 'neutral'
      },
      cheerful_companion: {
        name: "Cheerful",
        rate: 0.95,
        pitch: 1.25,
        genderPreference: 'female'
      }
    };

    // Built-in Regional Translations Dictionary for core dementia safety cues
    this.translations = {
      "START": {
        en: "Please walk forward along the road. Follow the blue arrows.",
        hi: "कृपया सड़क पर आगे बढ़ें। नीले तीरों का पालन करें।",
        mr: "कृपया रस्त्याने पुढे चला. निळ्या बाणांचे अनुसरण करा.",
        as: "অনুগ্ৰহ কৰি পথটোৰে আগবাঢ়ক। নীলা কাঁড়বোৰ অনুসৰণ কৰক।",
        bn: "দয়া করে রাস্তা ধরে এগিয়ে চলুন। নীল তীর অনুসরণ করুন।"
      },
      "WAYPOINT_REACHED": {
        en: "Good job! You reached the landmark. Follow the next direction.",
        hi: "बहुत बढ़िया! आप सही मोड़ पर पहुँच गए हैं। आगे बढ़ें।",
        mr: "खूप छान! तुम्ही योग्य ठिकाणी आला आहात. पुढे वळा.",
        as: "বৰ ভাল কথা! আপুনি চিনাক্ত স্থানত উপস্থিত হ'লহি।",
        bn: "খুব ভালো! আপনি ল্যান্ডমার্কে পৌঁছে গেছেন। পরবর্তী পথ অনুসরণ করুন।"
      },
      "GENTLE_REORIENT": {
        en: "Let's turn around slowly and walk back along the safe road.",
        hi: "धीरे से मुड़ें और सुरक्षित सड़क पर वापस चलें।",
        mr: "हळूच मागे वळा आणि सुरक्षित रस्त्यावरून चालत रहा.",
        as: "লাহেকৈ ঘূৰি আকৌ চিনাকি পোন পথটোৰে আগবাঢ়ক।",
        bn: "আস্তে আস্তে ঘুরে আবার পরিচিত নিরাপদ পথ ধরে হাঁটুন।"
      },
      "CRITICAL_DEVIATION": {
        en: "Updating your route to lead you safely. Please follow the blue arrows.",
        hi: "आपका सुरक्षित रास्ता अपडेट किया जा रहा है।",
        mr: "तुमचा सुरक्षित मार्ग अपडेट केला जात आहे.",
        as: "আপোনাৰ পথ সলনি কৰা হৈছে।",
        bn: "আপনার রুট আপডেট করা হচ্ছে।"
      },
      "DESTINATION_ARRIVED": {
        en: "You have reached your destination. Wonderful stroll today!",
        hi: "आप सुरक्षित रूप से अपने गंतव्य पर पहुँच गए हैं।",
        mr: "तुम्ही सुरक्षितपणे आपल्या गंतव्यस्थानी पोहोचला आहात.",
        as: "আপুনি কুশলে গন্তব্যস্থানত উপস্থিত হ'লহি।",
        bn: "আপনি নিরাপদে আপনার গন্তব্যে পৌঁছে গেছেন।"
      }
    };

    if (this.synth) {
      this.loadVoices();
      if (speechSynthesis.onvoiceschanged !== undefined) {
        speechSynthesis.onvoiceschanged = () => this.loadVoices();
      }
    }

    // Automatically initialize Hands-Free Speech Recognition
    this.initSpeechRecognition();
  }

  loadVoices() {
    if (!this.synth) return;
    this.availableVoices = this.synth.getVoices();
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode;
    console.log(`Voice language set to: ${langCode}`);
  }

  getMatchedVoice(langCode) {
    if (!this.availableVoices || this.availableVoices.length === 0) {
      this.loadVoices();
    }

    const langPrefixMap = {
      'en': 'en',
      'hi': 'hi',
      'mr': 'mr',
      'as': 'as',
      'bn': 'bn'
    };

    const targetPrefix = langPrefixMap[langCode] || 'en';
    let matched = this.availableVoices.find(v => v.lang.toLowerCase().startsWith(targetPrefix));
    
    if (!matched && (targetPrefix === 'mr' || targetPrefix === 'as')) {
      matched = this.availableVoices.find(v => v.lang.toLowerCase().startsWith('hi') || v.lang.toLowerCase().startsWith('bn'));
    }

    if (!matched) {
      matched = this.availableVoices.find(v => v.lang.toLowerCase().startsWith('en'));
    }

    return matched || (this.availableVoices.length > 0 ? this.availableVoices[0] : null);
  }

  /**
   * Speaks navigation prompt with pleasant cadence
   */
  speak(prompt, forceText = null) {
    if (this.isMuted || !this.synth) return;

    let textToSpeak = "";
    if (forceText) {
      textToSpeak = forceText;
    } else if (typeof prompt === 'object' && prompt !== null) {
      textToSpeak = prompt[this.currentLanguage] || prompt['en'] || Object.values(prompt)[0] || "";
    } else if (typeof prompt === 'string') {
      textToSpeak = prompt;
    }

    if (!textToSpeak) return;
    this.lastPrompt = textToSpeak;

    this.synth.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const localeMap = {
      'en': 'en-IN',
      'hi': 'hi-IN',
      'mr': 'mr-IN',
      'as': 'as-IN',
      'bn': 'bn-IN'
    };
    utterance.lang = localeMap[this.currentLanguage] || 'en-IN';

    const persona = this.personas[this.currentPersona] || this.personas['gentle_caregiver'];
    utterance.rate = (this.currentLanguage === 'en') ? persona.rate : 0.85;
    utterance.pitch = (this.currentLanguage === 'en') ? persona.pitch : 1.05;

    const voice = this.getMatchedVoice(this.currentLanguage);
    if (voice) {
      utterance.voice = voice;
    }

    // Temporarily pause recognition while speaking to prevent self-triggering
    if (this.recognition && this.isListening) {
      try { this.recognition.stop(); } catch (e) {}
    }

    utterance.onend = () => {
      if (this.shouldListen) {
        setTimeout(() => this.startListening(), 400);
      }
    };

    this.synth.speak(utterance);
  }

  repeatLast() {
    if (this.lastPrompt) {
      this.speak(this.lastPrompt);
    }
  }

  playChime(type = 'success') {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'success') {
        osc.frequency.setValueAtTime(523.25, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15);
        osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      } else if (type === 'alert') {
        osc.frequency.setValueAtTime(392.00, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(329.63, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
      }
    } catch (e) {
      console.warn('Audio Context chime note:', e);
    }
  }

  // =========================================================================
  // CONTINUOUS HANDS-FREE SPEECH RECOGNITION (ZERO TOGGLES)
  // =========================================================================

  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser. Tap controls active.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = false;
      this.recognition.lang = 'en-IN';

      this.recognition.onstart = () => {
        this.isListening = true;
        console.log("🎙️ Hands-free voice recognition active & listening.");
      };

      this.recognition.onresult = (event) => {
        const lastIdx = event.results.length - 1;
        const transcript = event.results[lastIdx][0].transcript.trim().toLowerCase();
        console.log(`🗣️ Spoken: "${transcript}"`);
        this.processVoiceCommand(transcript);
      };

      this.recognition.onerror = (event) => {
        // Quietly ignore network/no-speech errors and auto-recover
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.log("Speech recognition notice:", event.error);
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        // Continuous loop: immediately resume listening unless explicitly instructed to stop
        if (this.shouldListen) {
          setTimeout(() => this.startListening(), 400);
        }
      };

      // Auto-start listening
      this.startListening();

      // On mobile browsers, microphones often require an initial user gesture
      const unlockVoice = () => {
        this.startListening();
        window.removeEventListener('click', unlockVoice);
        window.removeEventListener('touchstart', unlockVoice);
      };
      window.addEventListener('click', unlockVoice, { once: true });
      window.addEventListener('touchstart', unlockVoice, { once: true });

    } catch (e) {
      console.warn("Failed to initialize speech recognition:", e);
    }
  }

  startListening() {
    if (!this.recognition || this.isListening) return;
    try {
      this.recognition.start();
    } catch (e) {
      // Already running or starting
    }
  }

  stopListening() {
    this.shouldListen = false;
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  /**
   * Natural Language Voice Command Parser
   */
  processVoiceCommand(text) {
    if (!text) return;

    let command = null;

    // 1. Destination Commands
    if (text.includes("home") || text.includes("ghar") || text.includes("pg") || text.includes("laila")) {
      command = { action: "NAVIGATE_DESTINATION", targetName: "home" };
    } else if (text.includes("hospital") || text.includes("clinic") || text.includes("doctor")) {
      command = { action: "NAVIGATE_DESTINATION", targetName: "hospital" };
    } else if (text.includes("dmart") || text.includes("d mart") || text.includes("d-mart") || text.includes("market") || text.includes("grocery")) {
      command = { action: "NAVIGATE_DESTINATION", targetName: "dmart" };
    } else if (text.includes("lake") || text.includes("pond") || text.includes("water")) {
      command = { action: "NAVIGATE_DESTINATION", targetName: "lake" };
    } else if (text.includes("university") || text.includes("vidyashilp") || text.includes("vu") || text.includes("college")) {
      command = { action: "NAVIGATE_DESTINATION", targetName: "vu" };
    } else if (text.includes("temple") || text.includes("mandir") || text.includes("church") || text.includes("mosque")) {
      command = { action: "NAVIGATE_DESTINATION", targetName: "temple" };
    }

    // 2. Query / Information Commands
    else if (text.includes("where am i") || text.includes("where are we") || text.includes("kaha hu")) {
      command = { action: "QUERY_LOCATION" };
    } else if (text.includes("how far") || text.includes("distance") || text.includes("kitna baki")) {
      command = { action: "QUERY_DISTANCE" };
    } else if (text.includes("what's next") || text.includes("next turn") || text.includes("which way") || text.includes("direction")) {
      command = { action: "QUERY_NEXT_TURN" };
    } else if (text.includes("repeat") || text.includes("again") || text.includes("say again") || text.includes("phir se")) {
      command = { action: "REPEAT" };
    }

    // 3. Navigation Control Commands
    else if (text.includes("stop") || text.includes("cancel") || text.includes("take me back") || text.includes("exit") || text.includes("rok do")) {
      command = { action: "CANCEL_NAVIGATION" };
    }

    if (command && this.onVoiceCommand) {
      this.playChime('success');
      this.onVoiceCommand(command);
    }
  }
}

window.voiceEngine = new VoiceEngine();
