import { useState, useRef, useMemo, useEffect } from 'react'
import { KEY_OPTIONS, generateGridData, type ScaleType, noteToMidi, getChordInversions } from '../utils/musicEngine'
import { PianoKeyboard } from './PianoKeyboard'
import { useClickOutside } from '../hooks/useClickOutside'
import { useAudioEngine } from '../hooks/useAudioEngine'
import { resolveMidi, extractChordNotes, getAverageMidi, shiftOctavesDown } from '../utils/chordHelpers'

interface GameStep {
  name: string;
  label: string;
  chordName: string;
  isCompleted: boolean;
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
        className="group flex items-center gap-2 md:gap-3 text-2xl md:text-3xl font-bold text-stone-800 hover:text-stone-600 transition-colors focus:outline-none"
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
        className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-1.5 md:py-2 bg-white border border-stone-200 rounded-full shadow-sm text-xs md:text-sm font-medium text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-stone-100 whitespace-nowrap"
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
      className={`flex-grow flex flex-col items-center justify-center px-4 md:px-6 w-full max-w-4xl mx-auto min-h-[150px] sm:min-h-[200px] ${
        isExiting 
          ? 'animate-slide-out-left' 
          : (isInitialLoad ? '' : 'animate-slide-in-right')
      }`}
    >
      {/* Passing Chords */}
      <div className="mb-[clamp(0.5rem,2vh,2rem)] text-center w-full mt-auto">
        <h2 className="text-[clamp(0.75rem,2vh,0.875rem)] font-bold uppercase tracking-widest text-stone-400 mb-[clamp(0.25rem,1vh,0.5rem)]">Passing Chords</h2>
        <div className="flex justify-center items-end gap-[clamp(1.5rem,6vw,4rem)]">
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
              <h3 className="text-[clamp(2rem,6vmin,4rem)] font-bold tracking-tighter leading-none">
                {step.label}
              </h3>
            </button>
          ))}
        </div>
      </div>

      {/* Tonic Chord (The 'I') */}
      {currentChord && (
        <div className="text-center flex flex-col items-center mb-auto pb-[clamp(0.5rem,2vh,1.5rem)]">
          <button 
            onClick={onPlayTonic}
            className="block mx-auto animate-in fade-in zoom-in duration-700 mb-[clamp(0.5rem,2vh,1.5rem)] focus:outline-none hover:scale-[1.02] transition-transform cursor-pointer"
          >
            <h1 className="text-[clamp(3.5rem,12vmin,8rem)] font-bold text-stone-800 tracking-tighter drop-shadow-sm leading-none">{currentChord.root}</h1>
            <p className="text-[clamp(1.25rem,4vmin,2.5rem)] font-serif italic text-stone-500 mt-[clamp(0.25rem,1vh,0.5rem)] leading-none">{currentChord.type}</p>
          </button>
          
          <button
            onClick={onNextRound}
            aria-label="Next Round"
            className={`shrink-0 flex items-center justify-center transition-all duration-300 ease-in-out outline-none focus:outline-none focus:ring-0 [-webkit-tap-highlight-color:transparent]
              ${isRoundComplete
                ? 'text-yellow-500 hover:text-yellow-400 animate-bounce-right drop-shadow-md cursor-pointer'
                : 'text-stone-300 hover:text-stone-400'
              }
            `}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-[clamp(2rem,5vmin,2.75rem)] h-[clamp(2rem,5vmin,2.75rem)]">
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
  
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 850 : false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 850);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const { playSound, instrument, setInstrument } = useAudioEngine();

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

    const newTargetNotes = extractChordNotes(gridData, degreeIndex);
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

  const handleReplayChord = (stepIndex: number) => {
    const notes = playedNotesHistory[stepIndex];
    if (notes && notes.length > 0) {
      playSound(notes, '2n');
      triggerPlaybackFlash(notes);
    }
  };

  const handlePlayTonic = () => {
    if (!chordState) return;
    
    const scaleType = chordState.type === 'Major' ? 'Major' : minorMode as ScaleType;
    const gridData = generateGridData(chordState.root, scaleType);
    
    const notes = extractChordNotes(gridData, 0);
    const inversions = shiftOctavesDown(getChordInversions(notes[0], notes));
    
    if (inversions.length > 0) {
      let inversionToPlay = inversions[0];

      // Try to voice lead smoothly from the final played chord
      if (isRoundComplete && gameSteps.length > 0) {
        const finalStepNotes = playedNotesHistory[gameSteps.length - 1];
        
        if (finalStepNotes && finalStepNotes.length > 0) {
          const targetCenter = getAverageMidi(finalStepNotes);
          
          inversionToPlay = inversions.reduce((closest, current) => Math.abs(getAverageMidi(current) - targetCenter) < Math.abs(getAverageMidi(closest) - targetCenter) ? current : closest);
        }
      }

      playSound(inversionToPlay, '2n');
      triggerPlaybackFlash(inversionToPlay);
    }
  };

  const handlePlayNote = (note: string) => {
    playSound(note); // Fire and forget so we don't block game logic

    if (activeStepIndex >= gameSteps.length || isExiting || isRoundComplete) return;

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
    <div className="flex flex-col h-screen supports-[height:100dvh]:h-[100dvh] bg-stone-50 overflow-hidden">
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
          @keyframes bounceRight {
            0%, 100% { transform: translateX(0); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
            50% { transform: translateX(25%); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
          }
          .animate-bounce-right { animation: bounceRight 1s infinite; }
      `}</style>
      {/* Top Controls */}
      <div className="w-full p-4 md:p-6 flex justify-between md:grid md:grid-cols-3 gap-2 md:gap-4 items-center relative z-20 shrink-0">
        <div className="hidden md:block"></div>
        <div className="flex justify-start md:justify-center">
          <ProgressionSelector value={progression} onChange={setProgression} />
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 md:gap-4">
          <MinorModeSelector value={minorMode} onChange={setMinorMode} />
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-widest text-stone-400 font-bold hidden sm:inline">Sound</span>
            <div className="flex bg-stone-200/60 p-0.5 rounded">
              <button 
                onClick={() => setInstrument('piano')}
                className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors ${instrument === 'piano' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Piano
              </button>
              <button 
                onClick={() => setInstrument('synth')}
                className={`text-[9px] uppercase tracking-wider font-bold px-2 py-1 rounded transition-colors ${instrument === 'synth' ? 'bg-white text-stone-800 shadow-sm' : 'text-stone-500 hover:text-stone-700'}`}
              >
                Synth
              </button>
            </div>
          </div>
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
      <div className="w-full mt-auto shrink-0">
        <PianoKeyboard 
          highlightedNotes={Array.from(new Set([...highlightedKeys, ...playbackKeys]))} 
          incorrectNotes={errorKeys}
          className="w-full max-h-[35vh] md:max-h-[40vh] lg:max-h-[40vh] block mx-auto"
          interactive={true}
          startMidi={48}
        endMidi={isMobile ? 60 : 72}
          onPlayNote={handlePlayNote}
        />
      </div>
    </div>
  )
}
