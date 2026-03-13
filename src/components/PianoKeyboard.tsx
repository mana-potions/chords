import React from 'react'
import { midiToNoteName } from '../utils/musicEngine'

export const PianoKeyboard = ({ 
  highlightedNotes, 
  className = "" 
}: { 
  highlightedNotes: string[]
  className?: string 
}) => {
  // Fixed range C4 to C6 (2 octaves + 1 note) to accommodate most close voicings
  // MIDI 60 (C4) to 84 (C6)
  const startMidi = 60; 
  const endMidi = 84; 
  
  const isHighlighted = (midi: number) => {
    const noteName = midiToNoteName(midi);
    return highlightedNotes.includes(noteName);
  };

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

  return (
    <svg viewBox={`0 0 ${totalWidth} ${height}`} className={`w-full h-auto ${className}`}>
      {whiteKeys.map(k => (
        <rect key={k.midi} x={k.x} y={0} width={whiteKeyWidth} height={height} stroke="#e5e7eb" strokeWidth="1" fill={isHighlighted(k.midi) ? '#facc15' : 'white'} className="transition-colors duration-300" rx={3} ry={3} />
      ))}
      {blackKeys.map(k => (
        <rect key={k.midi} x={k.x} y={0} width={blackKeyWidth} height={height * 0.6} stroke="#e5e7eb" strokeWidth="1" fill={isHighlighted(k.midi) ? '#facc15' : '#374151'} className="transition-colors duration-300" rx={2} ry={2} />
      ))}
    </svg>
  )
}