import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'

export type InstrumentType = 'piano' | 'synth'

export const useAudioEngine = () => {
  const [instrument, setInstrument] = useState<InstrumentType>('piano')
  const [isLoaded, setIsLoaded] = useState(false)

  // Use refs to hold Tone instances so they don't re-create on render
  const sampler = useRef<Tone.Sampler | null>(null)
  const synth = useRef<Tone.PolySynth | null>(null)

  useEffect(() => {
    // 1. Setup Shared Effects Chain
    // Using Freeverb for better iOS support (Tone.Reverb can hang on offline rendering)
    const reverb = new Tone.Freeverb({
      roomSize: 0.7,
      dampening: 4000,
    }).set({ wet: 0.2 })

    const limiter = new Tone.Limiter(-2)

    // Chain: Input -> Reverb -> Limiter -> Speakers
    reverb.connect(limiter)
    limiter.toDestination()

    // 2. Setup Sampler (Piano)
    sampler.current = new Tone.Sampler({
      urls: {
        A1: 'A1.mp3',
        A2: 'A2.mp3',
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      release: 1,
      onload: () => setIsLoaded(true),
    }).connect(reverb)

    // 3. Setup Synth (PolySynth)
    const polySynth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    })

    polySynth.volume.value = -4
    polySynth.maxPolyphony = 6
    polySynth.connect(reverb)
    synth.current = polySynth

    // 4. Mobile/iOS Audio Context Unlocking
    const unlockAudio = async () => {
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start()
        } catch (e) {
          console.error('Audio Context Unlock Failed:', e)
        }
      }
    }

    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'pointerdown']
    const handleInteraction = () => {
      unlockAudio()
      events.forEach((e) => window.removeEventListener(e, handleInteraction, true))
    }

    events.forEach((e) => window.addEventListener(e, handleInteraction, true))

    // Cleanup
    return () => {
      sampler.current?.dispose()
      synth.current?.dispose()
      reverb.dispose()
      limiter.dispose()
      events.forEach((e) => window.removeEventListener(e, handleInteraction, true))
    }
  }, [])

  const playSound = useCallback(
    (notes: string | string[], duration: string = '2n') => {
      // Emergency wake-up for AudioContext
      if (Tone.getContext().state !== 'running') {
        Tone.start().catch(() => {})
      }

      const notesArray = Array.isArray(notes) ? notes : [notes]

      // Format notes: Ensure octave is present (default to 4)
      // e.g., "C" -> "C4", "Db" -> "Db4", "C#5" -> "C#5"
      const formattedNotes = notesArray.map((n) => (/\d/.test(n) ? n : `${n}4`))

      // Small lookahead to prevent scheduling glitches
      const time = Tone.now() + 0.05

      if (instrument === 'piano') {
        // Sampler might not be loaded yet, but triggerAttackRelease handles it gracefully usually
        sampler.current?.triggerAttackRelease(formattedNotes, duration, time)
      } else {
        synth.current?.triggerAttackRelease(formattedNotes, duration, time)
      }
    },
    [instrument]
  )

  return { playSound, isLoaded, instrument, setInstrument }
}
