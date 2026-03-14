import { useRef, useState, useEffect } from 'react';
import * as Tone from 'tone';

export const useAudioEngine = () => {
  const sampler = useRef<Tone.Sampler | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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

    // Crucial for iOS: Unlock the Web Audio context on the first user interaction.
    // iOS requires AudioContext to be resumed synchronously during a user gesture.
    const unlockAudio = async () => {
      if (Tone.getContext().state !== 'running') {
        await Tone.start();
      }
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };

    window.addEventListener('pointerdown', unlockAudio);
    window.addEventListener('touchstart', unlockAudio);
    window.addEventListener('click', unlockAudio);
    window.addEventListener('keydown', unlockAudio);

    return () => {
      sampler.current?.dispose();
      reverb.dispose();
      limiter.dispose();
      window.removeEventListener('pointerdown', unlockAudio);
      window.removeEventListener('touchstart', unlockAudio);
      window.removeEventListener('click', unlockAudio);
      window.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  const playSound = async (notes: string | string[], duration: string = '2n') => {
    // Drop the playback command if the piano samples are still loading
    if (!isLoaded || !sampler.current) return;
    
    // Must be triggered from a user action to start the audio context
    if (Tone.getContext().state !== 'running') {
      await Tone.start();
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

    // Play the note(s) with the specified duration and natural velocity
    sampler.current.triggerAttackRelease(formattedNotes, duration);
  };

  return { playSound, isLoaded };
};
