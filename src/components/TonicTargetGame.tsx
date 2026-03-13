import { useState, useRef, useMemo, useEffect } from 'react'
import { KEY_OPTIONS, generateGridData, type ScaleType, noteToMidi, getChordInversions } from '../utils/musicEngine'
import { PianoKeyboard } from './PianoKeyboard'
import { useClickOutside } from '../hooks/useClickOutside'
import { useAudioEngine } from '../hooks/useAudioEngine'

interface GameStep {
  name: string;
  label: string;
  chordName: string;
  isCompleted: boolean;
}

const resolveMidi = (note: string): number | undefined => {
  if (noteToMidi[note] !== undefined) return noteToMidi[note]
  // Handle double sharps commonly found in Harmonic Minor keys (e.g. G# minor -> F##)
  const doubleSharps: Record<string, number> = {
    'F##': 7, 'Fx': 7,
    'C##': 2, 'Cx': 2,
    'G##': 9, 'Gx': 9,
    'D##': 4, 'Dx': 4,
    'A##': 11, 'Ax': 11
  }
  return doubleSharps[note]
}

const ProgressionSelector = ({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false), isOpen)

  const options = ['ii-V-I']

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center gap-3 text-3xl font-bold text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
      >
        <span>{value}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"
          className={`w-5 h-5 text-stone-300 group-hover:text-stone-400 transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50 transition-all duration-200 ease-out origin-top ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden w-[200px] flex flex-col p-1">
          {options.map(opt => (
            <button key={opt} onClick={() => { onChange(opt); setIsOpen(false) }} className="text-center px-3 py-3 rounded-lg text-lg font-medium text-stone-600 hover:bg-stone-50 hover:text-stone-900 transition-colors">
              {opt}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const MinorModeSelector = ({
  value,
  onChange
}: {
  value: string
  onChange: (val: string) => void
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  useClickOutside(ref, () => setIsOpen(false), isOpen)

  const options = ['Harmonic Minor', 'Natural Minor', 'Melodic Minor']

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm text-sm font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-100 whitespace-nowrap"
      >
        <span>{value}</span>
        <svg className={`w-4 h-4 text-stone-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className={`absolute top-full right-0 mt-2 w-48 z-50 transition-all duration-200 ease-out origin-top-right ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 -translate-y-2 scale-95 pointer-events-none'}`}>
        <div className="bg-white rounded-xl shadow-xl border border-stone-100 overflow-hidden p-1">
          {options.map((mode) => (
            <button key={mode} onClick={() => { onChange(mode); setIsOpen(false) }} className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors duration-150 ${value === mode ? 'bg-stone-100 text-stone-900 font-semibold' : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900'}`}>
              {mode}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const GameArea = ({ gameSteps, bouncingStep, currentChord, isExiting, isInitialLoad, isRoundComplete, onNextRound, onReplayChord, onPlayTonic }: {
  gameSteps: GameStep[];
  bouncingStep: number | null;
  currentChord: { root: string, type: string } | null;
  isExiting: boolean;
  isInitialLoad: boolean;
  isRoundComplete: boolean;
  onNextRound: () => void;
  onReplayChord: (index: number) => void;
  onPlayTonic: () => void;
}) => {
  return (
    <div 
      className={`flex-grow flex flex-col items-center justify-center p-6 w-full max-w-4xl mx-auto ${
        isExiting 
          ? 'animate-slide-out-left' 
          : (isInitialLoad ? '' : 'animate-slide-in-right')
      }`}
    >
      {/* Passing Chords */}
      <div className="mb-16 text-center w-full">
        <h2 className="text-sm font-bold uppercase tracking-widest text-stone-400 mb-6">Passing Chords</h2>
        <div className="flex justify-center items-end gap-24">
          {gameSteps.map((step, index) => (
            <button
              key={index}
              disabled={!step.isCompleted}
              onClick={() => step.isCompleted ? onReplayChord(index) : undefined}
              className={`transition-all duration-300 focus:outline-none ${
                step.isCompleted 
                  ? 'opacity-100 text-yellow-500 scale-110 hover:scale-[1.15] cursor-pointer' 
                  : 'opacity-30 text-stone-600 cursor-default'
              } ${bouncingStep === index ? 'animate-pop' : ''}`}
            >
              <h3 className="text-7xl font-bold tracking-tighter">
                {step.label}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* Tonic Chord (The 'I') */}
      {currentChord && (
        <div className="text-center">
          <button 
            onClick={onPlayTonic}
            className="block mx-auto animate-in fade-in zoom-in duration-700 mb-8 focus:outline-none hover:scale-105 transition-transform cursor-pointer"
          >
            <h1 className="text-9xl font-bold text-stone-800 tracking-tighter drop-shadow-sm">{currentChord.root}</h1>
            <p className="text-5xl font-serif italic text-stone-500 mt-4">{currentChord.type}</p>
          </button>
          
          <button
            onClick={onNextRound}
            aria-label="Next Round"
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto transition-all duration-300 ease-in-out
              ${isRoundComplete
                ? 'bg-yellow-400 text-white animate-pop shadow-lg'
                : 'bg-stone-200 text-stone-400 hover:bg-stone-300 hover:text-stone-500'
              }
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
              <path fillRule="evenodd" d="M12.97 3.97a.75.75 0 011.06 0l7.5 7.5a.75.75 0 010 1.06l-7.5 7.5a.75.75 0 11-1.06-1.06l6.22-6.22H3a.75.75 0 010-1.5h14.69l-6.22-6.22a.75.75 0 010-1.06z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

export const TonicTargetGame = () => {
  const [progression, setProgression] = useState('ii-V-I')
  const [minorMode, setMinorMode] = useState('Harmonic Minor')

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [completedStepIndex, setCompletedStepIndex] = useState<number | null>(null);
  const [foundNotes, setFoundNotes] = useState<string[]>([]);
  
  const [highlightedKeys, setHighlightedKeys] = useState<string[]>([]);
  const [errorKeys, setErrorKeys] = useState<string[]>([]);
  const [bouncingStep, setBouncingStep] = useState<number | null>(null);
  const [isRoundComplete, setIsRoundComplete] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isExiting, setIsExiting] = useState(false);
  const [roundKey, setRoundKey] = useState(0); // Used to force re-mount/animation of GameArea

  const [playedNotesHistory, setPlayedNotesHistory] = useState<Record<number, string[]>>({});
  const [playbackKeys, setPlaybackKeys] = useState<string[]>([]);
  
  const playbackTimersRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(playbackTimersRef.current).forEach(clearTimeout);
    };
  }, []);

  const triggerPlaybackFlash = (notes: string[]) => {
    setPlaybackKeys(prev => Array.from(new Set([...prev, ...notes])));
    
    notes.forEach(note => {
      if (playbackTimersRef.current[note]) {
        clearTimeout(playbackTimersRef.current[note]);
      }
      playbackTimersRef.current[note] = setTimeout(() => {
        setPlaybackKeys(prev => prev.filter(k => k !== note));
        delete playbackTimersRef.current[note];
      }, 500);
    });
  };

  const { playSound } = useAudioEngine();

  const [currentChord] = useState<{ root: string, type: string } | null>(() => {
    // Generate a random chord on mount
    const randomKey = KEY_OPTIONS[Math.floor(Math.random() * KEY_OPTIONS.length)]
    const isMinor = Math.random() > 0.5
    return {
      root: isMinor ? randomKey.minor : randomKey.major,
      type: isMinor ? 'Minor' : 'Major'
    }
  })
  const [chordState, setChordState] = useState(currentChord);

  // Derive game steps from current settings and progress
  // This replaces the 'gameSteps' state and the useEffect that caused cascading renders
  const gameSteps = useMemo<GameStep[]>(() => {
    if (!chordState) return [];

    if (progression === 'ii-V-I') {
      const isMajor = chordState.type === 'Major';
      const scaleType = isMajor ? 'Major' : minorMode as ScaleType;
      const gridData = generateGridData(chordState.root, scaleType);
      
      const iiName = gridData.chordNames[1];
      const vName = gridData.chordNames[4];

      // Generate steps with derived completion status and label
      return [
        { 
          name: 'ii', 
          chordName: iiName, 
          isCompleted: activeStepIndex > 0 || completedStepIndex === 0,
          label: (activeStepIndex > 0 || completedStepIndex === 0) ? iiName : 'ii'
        },
        { 
          name: 'V', 
          chordName: vName, 
          isCompleted: activeStepIndex > 1 || completedStepIndex === 1,
          label: (activeStepIndex > 1 || completedStepIndex === 1) ? vName : 'V'
        },
      ];
    }
    return [];
  }, [progression, chordState, minorMode, activeStepIndex, completedStepIndex]);

  // Memoize target notes calculation to avoid re-running on every render
  const targetNotes = useMemo(() => {
    if (!chordState || activeStepIndex >= gameSteps.length) return [];

    const stepName = gameSteps[activeStepIndex].name;
    const scaleType = chordState.type === 'Major' ? 'Major' : minorMode as ScaleType;
    const gridData = generateGridData(chordState.root, scaleType);

    let degreeIndex = 0;
    if (stepName === 'ii') degreeIndex = 1;
    else if (stepName === 'V') degreeIndex = 4;

    const root = gridData.rows[6][degreeIndex];
    const third = gridData.rows[4][degreeIndex];
    const fifth = gridData.rows[2][degreeIndex];
    const seventh = gridData.rows[0][degreeIndex];

    const newTargetNotes = [root, third, fifth, seventh].filter(Boolean);
    console.log(`Target for ${stepName} in ${chordState.root} ${scaleType}:`, newTargetNotes);
    return newTargetNotes;
  }, [activeStepIndex, chordState, gameSteps, minorMode]);

  const completeStep = (index: number, finalKeys: string[]) => {
    setCompletedStepIndex(index);
    setBouncingStep(index);
    setPlayedNotesHistory(prev => ({ ...prev, [index]: finalKeys }));
    setTimeout(() => setBouncingStep(null), 1000);

    if (index < gameSteps.length - 1) {
      setTimeout(() => {
        // Advance to next step and reset note tracking
        setCompletedStepIndex(null);
        setActiveStepIndex(index + 1);
        setFoundNotes([]);
        setHighlightedKeys([]);
        setErrorKeys([]);
      }, 800);
    } else {
      // Round Complete!
      setIsRoundComplete(true);
      setTimeout(() => {
        setFoundNotes([]);
        setHighlightedKeys([]);
        setErrorKeys([]);
      }, 800);
    }
  };

  const handleNextRound = () => {
    if (isInitialLoad) {
      setIsInitialLoad(false);
    }

    setIsExiting(true);
    setTimeout(() => {
      // Generate new random chord
      const randomKey = KEY_OPTIONS[Math.floor(Math.random() * KEY_OPTIONS.length)];
      const isMinor = Math.random() > 0.5;
      setChordState({
        root: isMinor ? randomKey.minor : randomKey.major,
        type: isMinor ? 'Minor' : 'Major'
      });
      setRoundKey(prev => prev + 1); // Force re-init of steps
      setActiveStepIndex(0);
      setFoundNotes([]);
      setHighlightedKeys([]);
      setErrorKeys([]);
      setPlayedNotesHistory({});
      setPlaybackKeys([]);
      Object.values(playbackTimersRef.current).forEach(clearTimeout);
      playbackTimersRef.current = {};
      setCompletedStepIndex(null);
      setIsRoundComplete(false);
      setIsExiting(false);
    }, 300); // Animation duration
  };

  const handleReplayChord = async (stepIndex: number) => {
    const notes = playedNotesHistory[stepIndex];
    if (notes && notes.length > 0) {
      await playSound(notes, '2n');
      triggerPlaybackFlash(notes);
    }
  };

  const handlePlayTonic = async () => {
    if (!chordState) return;
    
    const scaleType = chordState.type === 'Major' ? 'Major' : minorMode as ScaleType;
    const gridData = generateGridData(chordState.root, scaleType);
    
    const root = gridData.rows[6][0];
    const third = gridData.rows[4][0];
    const fifth = gridData.rows[2][0];
    const seventh = gridData.rows[0][0];

    const notes = [root, third, fifth, seventh].filter(Boolean);
    const inversions = getChordInversions(root, notes);
    
    if (inversions.length > 0) {
      let inversionToPlay = inversions[0];

      // Try to voice lead smoothly from the final played chord
      if (isRoundComplete && gameSteps.length > 0) {
        const finalStepNotes = playedNotesHistory[gameSteps.length - 1];
        
        if (finalStepNotes && finalStepNotes.length > 0) {
          const getAverageMidi = (notesArr: string[]) => {
            const sum = notesArr.reduce((acc, noteStr) => {
              const pitchClass = noteStr.replace(/[0-9-]/g, '');
              const octaveMatch = noteStr.match(/-?\d+/);
              const octave = octaveMatch ? parseInt(octaveMatch[0], 10) : 4;
              const midiBase = resolveMidi(pitchClass) ?? 0;
              return acc + (midiBase + (octave + 1) * 12);
            }, 0);
            return sum / notesArr.length;
          };

          const targetCenter = getAverageMidi(finalStepNotes);
          
          inversionToPlay = inversions.reduce((closest, current) => Math.abs(getAverageMidi(current) - targetCenter) < Math.abs(getAverageMidi(closest) - targetCenter) ? current : closest);
        }
      }

      await playSound(inversionToPlay, '2n');
      triggerPlaybackFlash(inversionToPlay);
    }
  };

  const handlePlayNote = async (note: string) => {
    if (activeStepIndex >= gameSteps.length || isExiting || isRoundComplete) return;

    await playSound(note);

    const pitchClass = note.replace(/[0-9-]/g, '');
    const playedMidi = noteToMidi[pitchClass];

    // Find if the played note matches any target note (checking via MIDI to handle enharmonics like F# vs Gb)
    const matchedTargetNote = targetNotes.find(target => resolveMidi(target) === playedMidi);

    if (matchedTargetNote) {
      // Correct Note logic
      if (!foundNotes.includes(matchedTargetNote)) {
          const newFound = [...foundNotes, matchedTargetNote];
          setFoundNotes(newFound);
          const newHighlighted = [...highlightedKeys, note];
          setHighlightedKeys(newHighlighted);

          if (newFound.length >= targetNotes.length) {
              completeStep(activeStepIndex, newHighlighted);
          }
      } else {
          // Already found, just highlight this specific key instance too if not already
          if (!highlightedKeys.includes(note)) {
          setHighlightedKeys(prev => [...prev, note]);
        }
      }
    } else {
      setErrorKeys(prev => [...prev, note]);
      setTimeout(() => {
        setErrorKeys(prev => prev.filter(k => k !== note));
      }, 500);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 overflow-hidden">
      <style>{`
        @keyframes pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1.1); }
        }
        .animate-pop { animation: pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
        @keyframes slideInRight {
          0% { transform: translateX(100%); opacity: 0; }
          100% { transform: translateX(0); opacity: 1; }
        }
        .animate-slide-in-right { animation: slideInRight 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes slideOutLeft {
          0% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(-100%); opacity: 0; }
        }
        .animate-slide-out-left { animation: slideOutLeft 0.4s ease-in forwards; }
      `}</style>
      {/* Top Controls */}
      <div className="w-full p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative z-20">
        <div className="hidden md:block"></div>
        <div className="flex-1 flex justify-center">
          <ProgressionSelector value={progression} onChange={setProgression} />
        </div>
        <div className="flex justify-center md:justify-end">
          <MinorModeSelector value={minorMode} onChange={setMinorMode} />
        </div>
      </div>

      {/* Center Content */}
      <GameArea
        key={roundKey}
        gameSteps={gameSteps}
        bouncingStep={bouncingStep}
        currentChord={chordState}
        isExiting={isExiting}
        isInitialLoad={isInitialLoad}
        isRoundComplete={isRoundComplete}
        onNextRound={handleNextRound}
        onReplayChord={handleReplayChord}
        onPlayTonic={handlePlayTonic}
      />

      {/* Bottom: Piano Keyboard */}
      <div className="w-full mt-auto">
        <PianoKeyboard 
          highlightedNotes={Array.from(new Set([...highlightedKeys, ...playbackKeys]))} 
          incorrectNotes={errorKeys}
          className="w-full h-auto block"
          interactive={true}
          startMidi={48}
          endMidi={72}
          onPlayNote={handlePlayNote}
        />
      </div>
    </div>
  )
}
