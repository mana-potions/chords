import { useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';

export type InstrumentType = 'piano' | 'synth';

export const useAudioEngine = () => {
  const sampler = useRef<Tone.Sampler | null>(null);
  const synth = useRef<Tone.PolySynth | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [instrument, setInstrument] = useState<InstrumentType>('piano');

  useEffect(() => {
    // Setup effects for a more realistic and controlled sound
    const reverb = new Tone.Reverb({
      decay: 2.5,
      wet: 0.2, // Blend 20% of the reverb with the dry signal
    });
    const limiter = new Tone.Limiter(-2); // Prevent clipping when playing full chords

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
      onload: () => {
        setIsLoaded(true);
      }
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
    // iOS requires AudioContext to be resumed synchronously during a user gesture.
    const unlockAudio = async () => {
      try {
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }
        
        // Only remove listeners if audio successfully unlocked
        if (Tone.getContext().state === 'running') {
          window.removeEventListener('touchstart', unlockAudio, true);
          window.removeEventListener('touchend', unlockAudio, true);
          window.removeEventListener('click', unlockAudio, true);
          window.removeEventListener('keydown', unlockAudio, true);
        }
      } catch (e) {
        console.error("Failed to unlock audio context:", e);
      }
    };

    // Intentionally omit 'pointerdown' as it's often untrusted for audio in Safari
    // Use capture phase (`true`) to intercept the event before React's synthetic 
    // event delegation or any async propagation drops the gesture token!
    window.addEventListener('touchstart', unlockAudio, true);
    window.addEventListener('touchend', unlockAudio, true);
    window.addEventListener('click', unlockAudio, true);
    window.addEventListener('keydown', unlockAudio, true);

    return () => {
      sampler.current?.dispose();
      synth.current?.dispose();
      reverb.dispose();
      limiter.dispose();
      window.removeEventListener('touchstart', unlockAudio, true);
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
        await Tone.start();
      } catch (e) {
        console.error("Failed to start Tone context during play:", e);
      }
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
      if (!isLoaded || !sampler.current) return;
      sampler.current.triggerAttackRelease(formattedNotes, duration);
    } else if (instrument === 'synth') {
      if (!synth.current) return;
      synth.current.triggerAttackRelease(formattedNotes, duration);
    }
  };

  return { playSound, isLoaded, instrument, setInstrument };
};
