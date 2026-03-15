import { useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'piano' | 'synth';

export const useAudioEngine = () => {
  const sampler = useRef<Tone.Sampler | null>(null);
  const synth = useRef<Tone.PolySynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');

  // Keep references to effects so we can chain the sampler to them later
  const effects = useRef<{ reverb: Tone.Reverb, limiter: Tone.Limiter } | null>(null);
  
  // Store initialization logic to safely call it after audio context unlocks
  const initSamplerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // Pre-fetch the piano samples into the browser's HTTP cache immediately on mount.
    // We don't decode them yet (which would fail on iOS while the context is suspended),
    // but this network-level preload eliminates the download latency on the first tap.
    const baseUrl = "https://tonejs.github.io/audio/salamander/";
    const sampleFiles = ["A1.mp3", "A2.mp3", "C4.mp3", "Ds4.mp3"];
    sampleFiles.forEach(file => {
      fetch(baseUrl + file, { mode: 'cors' }).catch(() => {}); // Fire and forget
    });

    // Setup effects for a more realistic and controlled sound
    effects.current = {
      reverb: new Tone.Reverb({
        decay: 2.5,
        wet: 0.2, // Blend 20% of the reverb with the dry signal
      }),
      limiter: new Tone.Limiter(-2) // Prevent clipping when playing full chords
    };

    initSamplerRef.current = () => {
      if (!sampler.current && effects.current) {
        sampler.current = new Tone.Sampler({
          urls: {
            A1: "A1.mp3",
            A2: "A2.mp3",
            C4: "C4.mp3",
            "D#4": "Ds4.mp3",
          },
          // Add a longer release tail to prevent abrupt cutoffs
          release: 1,
          // Using a high-quality free CDN for Salamander Piano samples
          baseUrl: "https://tonejs.github.io/audio/salamander/",
        }).chain(effects.current.reverb, effects.current.limiter, Tone.Destination);

        // Use Tone.loaded() instead of onload config for better iOS reliability
        Tone.loaded().then(() => setIsLoaded(true));
      }
    };

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
    }).set({ volume: -4 }).chain(effects.current.reverb, effects.current.limiter, Tone.Destination);

    // Crucial for iOS: Unlock the Web Audio context on the first user interaction.
    // iOS requires AudioContext to be resumed synchronously during a user gesture.
    const unlockAudio = async () => {
      try {
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }
        
        // Only remove listeners if audio successfully unlocked
        if (Tone.getContext().state === 'running') {
          // iOS Safari bug fix: Only instantiate Sampler and decode audio AFTER context is running
          initSamplerRef.current?.();

          window.removeEventListener('touchend', unlockAudio, true);
          window.removeEventListener('click', unlockAudio, true);
          window.removeEventListener('keydown', unlockAudio, true);
        }
      } catch (e) {
        console.error("Failed to unlock audio context:", e);
      }
    };

    // Omit 'pointerdown' and 'touchstart' as they are often untrusted for audio in Safari (seen as scrolls)
    // Use capture phase (`true`) to intercept the event before React's synthetic 
    // event delegation or any async propagation drops the gesture token!
    window.addEventListener('touchend', unlockAudio, true);
    window.addEventListener('click', unlockAudio, true);
    window.addEventListener('keydown', unlockAudio, true);

    return () => {
      sampler.current?.dispose();
      sampler.current = null;
      synth.current?.dispose();
      synth.current = null;
      effects.current?.reverb.dispose();
      effects.current?.limiter.dispose();
      window.removeEventListener('touchend', unlockAudio, true);
      window.removeEventListener('click', unlockAudio, true);
      window.removeEventListener('keydown', unlockAudio, true);
    };
  }, []);

  const playSound = async (notes: string | string[], duration: string = '2n') => {
    // Must be triggered from a user action to start the audio context
    // Run this BEFORE the early return to ensure early taps still unlock audio
    if (Tone.getContext().state !== 'running') {
      try {
        // Race the start against a 100ms timeout because on iOS physical devices,
        // React's synthetic events are often considered "untrusted" and Safari 
        // will silently drop the AudioContext resumption, hanging the Promise forever!
        await Promise.race([
          Tone.start(),
          new Promise(resolve => setTimeout(resolve, 100))
        ]);
      } catch (e) {
        console.error("Failed to start Tone context during play:", e);
      }
    }
    
    if (Tone.getContext().state === 'running') {
      initSamplerRef.current?.();
    }

    // Helper to ensure notes have an octave if they don't already
    const formatNote = (note: string) => {
      // If note ends with a number (e.g. C4, Bb3), it has an octave
      if (/\d$/.test(note)) return note;
      // Otherwise default to octave 4
      return `${note}4`;
    };

    // Format single notes or arrays to ensure they are valid for the Sampler
    const formattedNotes = Array.isArray(notes) 
      ? notes.map(formatNote) 
      : formatNote(notes);

    if (instrument === 'piano') {
      // Wait for the sampler to download instead of dropping the note on the first tap
      if (sampler.current && !isLoaded) {
        try {
          // Add a timeout so it doesn't hang forever if iOS blocks the decode promise
          await Promise.race([
            Tone.loaded(),
            new Promise(resolve => setTimeout(resolve, 2000))
          ]);
        } catch (e) {
          console.error("Sampler failed to load", e);
          return;
        }
      }
      if (!sampler.current) return;
      
      const time = Tone.now();
      sampler.current.triggerAttackRelease(formattedNotes, duration, time);
    } else if (instrument === 'synth') {
      if (!synth.current) return;
      const time = Tone.now();
      // iOS Bug Fix: Hardware touch-bounces can trigger duplicate rapid attacks, 
      // causing voice allocation to leak and oscillators to drone forever.
      // Releasing the specific notes milliseconds before re-striking prevents zombie voices.
      synth.current.triggerRelease(formattedNotes, time);
      synth.current.triggerAttackRelease(formattedNotes, duration, time + 0.005);
    }
  };

  return { playSound, isLoaded, instrument, setInstrument };
};
