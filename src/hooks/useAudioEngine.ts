import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'

export type InstrumentType = 'piano' | 'synth'

export const useAudioEngine = () => {
  // Start with 'synth' to ensure immediate playability
  const [instrument, setInstrumentState] = useState<InstrumentType>('synth')
  const [isLoaded, setIsLoaded] = useState(false)

  // Use refs to keep track of the Tone instances across renders
  const sampler = useRef<Tone.Sampler | null>(null);
  const synth = useRef<Tone.PolySynth | null>(null);

  // 1. Initialize Default Synth (Always available)
  useEffect(() => {
    const poly = new Tone.PolySynth(Tone.Synth).set({
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.4,    // Smoother decay
        sustain: 0.2,  // Less ducking
        release: 0.3,
      },
    })
    
    poly.volume.value = -6; // Adjusted volume for new envelope
    poly.maxPolyphony = 8; // Increased polyphony slightly
    poly.toDestination();

    synth.current = poly;

    // Cleanup function
    return () => {
      synth.current?.dispose();
      sampler.current?.dispose();
      sampler.current = null;
      synth.current = null;
    }
  }, [])

  // 2. Helper to load the piano samples
  const initializeSampler = useCallback(async () => {
    if (sampler.current) return; // Already initialized

    console.log("[AudioEngine] Initializing Sampler...");
    console.log("[AudioEngine] AudioContext state:", Tone.getContext().state);

    // URL Options
    const PRIMARY_URL = 'https://tonejs.github.io/audio/salamander/';
    // Backup: Raw GitHub content often has more permissive CORS headers or different routing
    const BACKUP_URL = 'https://raw.githubusercontent.com/Tonejs/audio/master/salamander/';
    
    let validBaseUrl = PRIMARY_URL;

    // 1. Diagnostic / Connectivity Check with Fallback
    try {
        const testFile = 'C4.mp3';
        console.log(`[AudioEngine] Testing connection to primary: ${PRIMARY_URL}${testFile}`);
        const response = await fetch(PRIMARY_URL + testFile, { method: 'HEAD', mode: 'cors' });
        
        if (!response.ok) {
            throw new Error(`Primary CDN failed: ${response.status}`);
        }
    } catch (e) {
        console.warn("[AudioEngine] Primary CDN failed. Switching to backup URL...", e);
        validBaseUrl = BACKUP_URL;
    }

    try {
        const sam = new Tone.Sampler({
            urls: {
                A1: 'A1.mp3',
                A2: 'A2.mp3',
                C4: 'C4.mp3',
                'D#4': 'Ds4.mp3',
            },
            baseUrl: validBaseUrl,
            release: 0.4, // Significantly shortened release
            onload: () => {
                console.log("[AudioEngine] Sampler loaded successfully.");
                setIsLoaded(true);
            },
            onerror: (e) => {
                console.error("[AudioEngine] Sampler failed to load:", e);
                // Revert UI to synth if real loading fails
                setInstrumentState('synth'); 
            }
        }).toDestination();
        
        sampler.current = sam;
    } catch (e) {
        console.error("[AudioEngine] Sampler constructor error:", e);
    }
  }, []);

  // 3. Custom Instrument Switcher
  const setInstrument = useCallback(async (inst: InstrumentType) => {
      // Update state immediately for UI
      setInstrumentState(inst);
      
      if (inst === 'piano') {
          console.log("[AudioEngine] Switching to Piano. Checking Context...");
          
          // Use this user interaction to ensure AudioContext is running
          if (Tone.getContext().state !== 'running') {
              try {
                  await Tone.start();
                  console.log("[AudioEngine] AudioContext started via switch.");
              } catch (e) {
                  console.error("[AudioEngine] Could not start context:", e);
              }
          }
          
          // Trigger loading if not already done
          if (!sampler.current) {
              initializeSampler();
          }
      }
  }, [initializeSampler]);

  // 4. Play Sound Logic
  const playSound = useCallback(
    async (notes: string | string[], duration: string = '2n') => {
      try {
        // Ensure context is running (redundant safety check)
        if (Tone.getContext().state !== 'running') {
          await Tone.start();
        }

        const notesArray = Array.isArray(notes) ? notes : [notes];
        // Ensure octave
        const formattedNotes = notesArray.map((n) => (/\d/.test(n) ? n : `${n}4`));
        
        // THE FIX: Manually convert the duration notation (e.g., '2n') to seconds.
        // This avoids a bug in Tone.js where tempo-relative time can be calculated as 0 if the Transport is not running.
        const durationInSeconds = Tone.Time(duration).toSeconds();

        if (instrument === 'piano') {
          // Check if sampler exists and is loaded
          if (sampler.current && sampler.current.loaded) {
             sampler.current.triggerAttackRelease(formattedNotes, durationInSeconds);
          } else {
             // FALLBACK: Play synth if piano is loading or failed
             console.warn("[AudioEngine] Piano not ready. Using synth fallback.");
             synth.current?.triggerAttackRelease(formattedNotes, durationInSeconds);
          }
        } else {
          // Play Synth
          synth.current?.triggerAttackRelease(formattedNotes, durationInSeconds);
        }
      } catch (e) {
        console.error("[AudioEngine] Error playing sound:", e);
      }
    },
    [instrument, isLoaded]
  );

  return { playSound, isLoaded, instrument, setInstrument };
};
