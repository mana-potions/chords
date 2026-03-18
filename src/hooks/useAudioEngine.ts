import { useState, useEffect, useRef, useCallback } from 'react'
import * as Tone from 'tone'

export type InstrumentType = 'piano' | 'synth'

export const useAudioEngine = () => {
  const [instrument, setInstrument] = useState<InstrumentType>('piano')
  const [isLoaded, setIsLoaded] = useState(false)

  // Use refs to keep track of the Tone instances across renders
  const sampler = useRef<Tone.Sampler | null>(null)
  const synth = useRef<Tone.PolySynth | null>(null)
  const reverb = useRef<Tone.Freeverb | null>(null)
  const limiter = useRef<Tone.Limiter | null>(null)

  useEffect(() => {
    // Initialize Audio Chain
    // 1. Create Effects
    const lim = new Tone.Limiter(-2)
    const rev = new Tone.Freeverb({
      roomSize: 0.7,
      dampening: 4000,
    }).set({ wet: 0.2 })

    // 2. Connect Effect Chain
    rev.connect(lim)
    lim.toDestination()

    // 3. Create Synth
    const poly = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 1,
      },
    })
    
    // Set PolySynth attributes directly to avoid type issues with .set()
    poly.volume.value = -4
    poly.maxPolyphony = 6
    poly.connect(rev)

    // 4. Create Sampler
    const sam = new Tone.Sampler({
      urls: {
        A1: 'A1.mp3',
        A2: 'A2.mp3',
        C4: 'C4.mp3',
        'D#4': 'Ds4.mp3',
      },
      baseUrl: 'https://tonejs.github.io/audio/salamander/',
      release: 1,
      onload: () => {
        setIsLoaded(true)
      },
      // Safely handle loading errors
      onerror: (e) => {
        console.warn("Sampler failed to load", e)
      }
    })
    // Sampler connection
    sam.connect(rev)

    // Store in refs
    limiter.current = lim
    reverb.current = rev
    synth.current = poly
    sampler.current = sam

    // 5. Setup Audio Context Unlock for Mobile
    const unlockAudio = async () => {
      if (Tone.getContext().state !== 'running') {
        try {
          await Tone.start()
          console.log("Audio Context Started")
        } catch (e) {
          console.error("Failed to start Audio Context", e)
        }
      }
    }

    // Attach unlock listener to widespread events
    const events = ['touchstart', 'touchend', 'mousedown', 'keydown', 'click']
    const handleInteraction = () => {
      unlockAudio()
      events.forEach((e) => window.removeEventListener(e, handleInteraction, true))
    }
    events.forEach((e) => window.addEventListener(e, handleInteraction, true))

    // Cleanup function
    return () => {
      sam.dispose()
      poly.dispose()
      rev.dispose()
      lim.dispose()
      
      // Clear refs
      sampler.current = null
      synth.current = null
      reverb.current = null
      limiter.current = null
      
      events.forEach((e) => window.removeEventListener(e, handleInteraction, true))
    }
  }, [])

  const playSound = useCallback(
    async (notes: string | string[], duration: string = '2n') => {
      try {
        // iOS Safety: Ensure context is running on user action (play)
        if (Tone.getContext().state !== 'running') {
          await Tone.start()
        }

        const notesArray = Array.isArray(notes) ? notes : [notes]
        // Ensure octave
        const formattedNotes = notesArray.map((n) => (/\d/.test(n) ? n : `${n}4`))
        const time = Tone.now() + 0.05

        if (instrument === 'piano') {
          // Check if sampler exists before triggering
          if (sampler.current) {
             sampler.current.triggerAttackRelease(formattedNotes, duration, time)
          }
        } else {
          // Check if synth exists
          if (synth.current) {
             synth.current.triggerAttackRelease(formattedNotes, duration, time)
          }
        }
      } catch (e) {
        // Prevent UI crash if audio fails
        console.error("Error playing sound:", e)
      }
    },
    [instrument]
  )

  return { playSound, isLoaded, instrument, setInstrument }
}
