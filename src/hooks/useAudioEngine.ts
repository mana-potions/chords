import { useRef, useEffect, useCallback } from 'react';
import * as Tone from 'tone';

export const useAudioEngine = () => {
  const synthRef = useRef<Tone.PolySynth | null>(null);

  useEffect(() => {
    // Initialize synth only on the client side to prevent SSR issues
    if (typeof window !== 'undefined' && !synthRef.current) {
      synthRef.current = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'amtriangle' },
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 1.5 },
      }).toDestination();
      synthRef.current.volume.value = -12; // Lower volume for a more pleasant sound
    }

    return () => {
      if (synthRef.current) {
        synthRef.current.dispose();
        synthRef.current = null;
      }
    };
  }, []);

  const playSound = useCallback(async (notes: string | string[], duration: string = '8n') => {
    if (typeof window === 'undefined' || !synthRef.current) return;
    
    // Resume the AudioContext upon user interaction directly in the click handler 
    if (Tone.context.state !== 'running') {
      await Tone.start();
    }

    const formatNote = (n: string) => /[0-9]/.test(n) ? n : `${n}4`;
    
    if (Array.isArray(notes)) {
      const formattedNotes = notes.map(formatNote);
      synthRef.current.triggerAttackRelease(formattedNotes, duration);
    } else {
      synthRef.current.triggerAttackRelease(formatNote(notes), duration);
    }
  }, []);

  return { playSound };
};