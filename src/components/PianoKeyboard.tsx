import { useState } from 'react'
import { midiToNoteName } from '../utils/musicEngine'

const pcMidiMap: Record<string, number> = {
  'C': 0, 'B#': 0,
  'C#': 1, 'Db': 1,
  'D': 2,
  'D#': 3, 'Eb': 3,
  'E': 4, 'Fb': 4,
  'F': 5, 'E#': 5,
  'F#': 6, 'Gb': 6,
  'G': 7,
  'G#': 8, 'Ab': 8,
  'A': 9,
  'A#': 10, 'Bb': 10,
  'B': 11, 'Cb': 11
};

const getAbsoluteMidi = (noteStr: string) => {
  if (!noteStr) return -1;
  const pitchClass = noteStr.replace(/[0-9-]/g, '');
  const octaveStr = noteStr.replace(/[^0-9-]/g, '');
  if (!octaveStr) return -1;
  const octave = parseInt(octaveStr, 10);
  const pcMidi = pcMidiMap[pitchClass];
  if (pcMidi === undefined) return -1;
  return (octave + 1) * 12 + pcMidi;
};

export const PianoKeyboard = ({ 
  highlightedNotes, 
  incorrectNotes = [],
  className = "",
  interactive = false,
  startMidi = 60,
  endMidi = 84,
  onPlayNote
}: { 
  highlightedNotes: string[]
  incorrectNotes?: string[]
  className?: string 
  interactive?: boolean
  startMidi?: number
  endMidi?: number
  onPlayNote?: (note: string) => void
}) => {
  const [activeKeys, setActiveKeys] = useState<number[]>([])
  
  const checkNoteMatch = (midi: number, notesList: string[]) => {
    const noteName = midiToNoteName(midi);
    if (notesList.includes(noteName)) return true;

    const currentPc = midi % 12;

    // Pitch class fallback for out-of-bounds notes OR flat/sharp enharmonics
    return notesList.some(hn => {
      const hnAbsoluteMidi = getAbsoluteMidi(hn);
      if (hnAbsoluteMidi === -1) return false;
      
      if (hnAbsoluteMidi === midi) return true; // Exact match (handles enharmonics on the board)

      const hnPc = hnAbsoluteMidi % 12;
      if (hnPc === currentPc) {
        // Highlight if the actual target note is outside the board's currently rendered range
        if (hnAbsoluteMidi < startMidi || hnAbsoluteMidi > endMidi) {
            return true;
        }
      }
      return false;
    });
  };

  const isHighlighted = (midi: number) => {
    return checkNoteMatch(midi, highlightedNotes) || activeKeys.includes(midi);
  };

  const isIncorrect = (midi: number) => {
    return checkNoteMatch(midi, incorrectNotes);
  }

  const handleKeyClick = (midi: number) => {
    if (!interactive) return
    
    const noteName = midiToNoteName(midi)
    if (onPlayNote) onPlayNote(noteName)

    setActiveKeys(prev => [...prev, midi])
    setTimeout(() => {
      setActiveKeys(prev => prev.filter(k => k !== midi))
    }, 300)
  }

  const whiteKeys = [];
  const blackKeys = [];

  let xPos = 0;
  const whiteKeyWidth = 24;
  const blackKeyWidth = 14;

  for (let m = startMidi; m <= endMidi; m++) {
    const isBlack = [1, 3, 6, 8, 10].includes(m % 12);
    if (!isBlack) {
      whiteKeys.push({ midi: m, x: xPos });
      xPos += whiteKeyWidth;
    }
  }

  // Second pass for black keys to overlay them correctly
  for (let m = startMidi; m <= endMidi; m++) {
    const isBlack = [1, 3, 6, 8, 10].includes(m % 12);
    if (isBlack) {
        // Find the white key before it
        const prevWhite = whiteKeys.find(wk => wk.midi === m - 1);
        if (prevWhite) {
            blackKeys.push({ midi: m, x: prevWhite.x + (whiteKeyWidth - blackKeyWidth / 2) });
        }
    }
  }

  const totalWidth = xPos;
  const height = 80;

  const getKeyFill = (midi: number, isBlack: boolean) => {
    if (isIncorrect(midi)) return '#ef4444'; // Red-500
    if (isHighlighted(midi)) return '#facc15'; // Yellow-400
    return isBlack ? '#374151' : 'white';
  }

  const getAnimationClass = (midi: number) => {
    const baseClass = 'transition-colors duration-300';
    return `${baseClass} ${isIncorrect(midi) ? 'animate-pulse-red' : ''}`;
  }

  return (
    <>
      <style>{`
        @keyframes pulse-red {
          0%, 100% { fill: #ef4444; } /* Red-500 */
          50% { fill: #991b1b; }      /* Red-800 - darker pulse instead of transparency */
        }
        .animate-pulse-red {
          animation: pulse-red 0.5s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
      <svg viewBox={`0 0 ${totalWidth} ${height}`} className={`w-full h-auto ${className}`}>
        {whiteKeys.map(k => (
          <rect 
            key={k.midi} 
            x={k.x} 
            y={0} 
            width={whiteKeyWidth} 
            height={height} 
            stroke="#e5e7eb" 
            strokeWidth="1" 
            fill={getKeyFill(k.midi, false)}
            className={`${getAnimationClass(k.midi)} ${interactive ? 'cursor-pointer' : ''}`} 
            rx={3} ry={3} 
            onClick={() => handleKeyClick(k.midi)}
          />
        ))}
        {blackKeys.map(k => (
          <rect 
            key={k.midi} 
            x={k.x} y={0} 
            width={blackKeyWidth} height={height * 0.6} 
            stroke="#e5e7eb" strokeWidth="1" 
            fill={getKeyFill(k.midi, true)}
            className={`${getAnimationClass(k.midi)} ${interactive ? 'cursor-pointer' : ''}`} 
            rx={2} ry={2} 
            onClick={() => handleKeyClick(k.midi)}
          />
        ))}
      </svg>
    </>
  )
}
