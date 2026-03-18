import { useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'piano' | 'synth';

export const useAudioEngine = () => {
  const sampler = useRef<Tone.Sampler | null>(null);
  const synth = useRef<Tone.PolySynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');

  // Track the last time a specific note was played to prevent touch-bounce double triggers
  const lastNotePlaysRef = useRef<Record<string, number>>({});

  useEffect(() => {
    // Setup effects for a more realistic and controlled sound.
    // We use Tone.Freeverb instead of Tone.Reverb. Tone.Reverb uses an 
    // OfflineAudioContext to render its impulse response, which often hangs
    // or fails silently on iOS Safari when the main context is suspended.
    const reverb = new Tone.Freeverb({
      roomSize: 0.7,
      dampening: 4000
    }).set({ wet: 0.2 });
    
    const limiter = new Tone.Limiter(-2); // Prevent clipping

    // Instantiate Sampler immediately. Tone.js will handle fetching 
    // the audio buffers and decoding them.
    sampler.current = new Tone.Sampler({
      urls: {
        A1: "A1.mp3",
        A2: "A2.mp3",
        C4: "C4.mp3",
        "D#4": "Ds4.mp3",
      },
      release: 1, // Longer release tail
      baseUrl: "https://tonejs.github.io/audio/salamander/",
      onload: () => setIsLoaded(true)
    }).chain(reverb, limiter, Tone.Destination);

    synth.current = new Tone.PolySynth(Tone.Synth, {
      oscillator: {
        type: "triangle" // Gentle sound that doesn't pierce
      },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1
      }
    }).set({ volume: -4 }).chain(reverb, limiter, Tone.Destination);

    // Crucial for iOS: Unlock the Web Audio context on the first user interaction.
    const unlockAudio = async () => {
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start();
        } catch (e) {
          console.error("Failed to unlock audio context:", e);
        }
      }
    };

    // Use capture phase (`true`) to intercept the event before React's synthetic
    // event delegation drops the gesture token!
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'pointerdown'];
    const handleUnlock = () => {
      unlockAudio();
      // Remove listeners once triggered
      events.forEach(e => window.removeEventListener(e, handleUnlock, true));
    };

    events.forEach(e => window.addEventListener(e, handleUnlock, true));

    return () => {
      sampler.current?.dispose();
      synth.current?.dispose();
      reverb.dispose();
      limiter.dispose();
      events.forEach(e => window.removeEventListener(e, handleUnlock, true));
    };
  }, []);

  const playSound = async (notes: string | string[], duration: string = '2n') => {
    // Fallback to start context if it missed the initial interaction
    if (Tone.getContext().state !== 'running') {
      try {
        await Tone.start();
      } catch (e) {
        console.error("Failed to start Tone context during play:", e);
      }
    }

    const formatNote = (note: string) => {
      if (/\d$/.test(note)) return note;
      return `${note}4`;
    };

    const formattedNotes = Array.isArray(notes) 
      ? notes.map(formatNote) 
      : formatNote(notes);

    const time = Tone.now();

    // Prevent hardware touch-bounces from triggering rapid duplicate attacks on the same note,
    // which causes Tone.js PolySynth to leak voices and infinitely sustain.
    const notesArray = Array.isArray(formattedNotes) ? formattedNotes : [formattedNotes];
    const nowMs = Date.now();
    const isBounce = notesArray.every(n => nowMs - (lastNotePlaysRef.current[n] || 0) < 50);
    
    if (isBounce) return;
    notesArray.forEach(n => { lastNotePlaysRef.current[n] = nowMs; });

    if (instrument === 'piano') {
      if (!sampler.current || !isLoaded) return;
      sampler.current.triggerAttackRelease(formattedNotes, duration, time);
    } else if (instrument === 'synth') {
      if (!synth.current) return;
      // Explicitly release the note right before striking to prevent zombie voices,
      // using a 10ms offset on the attack so the Tone.js allocator doesn't choke.
      synth.current.triggerRelease(formattedNotes, time);
      synth.current.triggerAttackRelease(formattedNotes, duration, time + 0.01);
    }
  };

  return { playSound, isLoaded, instrument, setInstrument };
};
