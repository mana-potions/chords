import { 
  MAJOR_KEYS, 
  NATURAL_MINOR_KEYS, 
  HARMONIC_MINOR_KEYS, 
  MELODIC_MINOR_KEYS, 
  SCALE_DATA 
} from './musicData';

export type ScaleType = keyof typeof SCALE_DATA;

// Lookup table for enharmonic equivalents to handle missing keys in specific modes
const ENHARMONIC_EQUIVALENTS: Record<string, string> = {
  'A#': 'Bb', 'Bb': 'A#',
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'E#': 'F',  'F': 'E#',
  'B#': 'C',  'C': 'B#',
  'Cb': 'B',  'B': 'Cb',
  'Fx': 'G',  'G': 'Fx', // Fx is F double sharp
};

export const generateGridData = (root: string, scaleType: ScaleType = 'Major') => {
  let scaleMap: Record<string, string[]>;
  
  switch (scaleType) {
    case 'Natural Minor': scaleMap = NATURAL_MINOR_KEYS; break;
    case 'Harmonic Minor': scaleMap = HARMONIC_MINOR_KEYS; break;
    case 'Melodic Minor': scaleMap = MELODIC_MINOR_KEYS; break;
    case 'Major': default: scaleMap = MAJOR_KEYS; break;
  }

  let scale = scaleMap[root];

  // Guard: If direct lookup fails, try enharmonic equivalent (e.g., A# -> Bb)
  if (!scale) {
    const alternateRoot = ENHARMONIC_EQUIVALENTS[root];
    if (alternateRoot && scaleMap[alternateRoot]) scale = scaleMap[alternateRoot];
  }

  if (!scale) {
    throw new Error(`Key ${root} not found for scale type ${scaleType}`);
  }
  
  // Rows 1-7: Stacking Thirds
  // Based on your PDF: Row 1 is the scale itself, Row 2 starts on the 2nd degree, etc.
  // To get the "vertical" stack seen in the PDFs, we calculate the offsets.
  const rows = [7, 6, 5, 4, 3, 2, 1].map((rowNum) => {
    return scale.map((_, colIndex) => {
      // Logic: (Column Index + Row Offset) % 7
      return scale[(colIndex + rowNum - 1) % 7];
    });
  });

  const { suffixes, numerals, modes } = SCALE_DATA[scaleType];
  const chordNames = scale.map((note, index) => `${note}${suffixes[index]}`);

  return { 
    rows, 
    romanNumerals: numerals,
    chordNames,
    modes: modes
  };
};

export const noteToMidi: { [key: string]: number } = {
    'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8, 'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11,
    'Cb': 11, 'B#': 0, 'Fb': 4, 'E#': 5
};

export function midiToNoteName(midi: number): string {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octave = Math.floor(midi / 12) - 1;
    const note = notes[midi % 12];
    return `${note}${octave}`;
}

export function getChordInversions(rootNote: string, chordNotes: string[]): string[][] {
    const rootMidiBase = noteToMidi[rootNote]; 
    if (rootMidiBase === undefined) return [];
    
    const rootPositionMidi: number[] = [];

    chordNotes.forEach((noteName, i) => {
        const m = noteToMidi[noteName];
        if (m === undefined) return; 

        if (i === 0) {
            rootPositionMidi.push(60 + m); 
        } else {
            const rootOctaveBase = Math.floor(rootPositionMidi[0] / 12) * 12;
            let current = rootOctaveBase + m;
            while (current <= rootPositionMidi[i-1]) {
                current += 12;
            }
            rootPositionMidi.push(current);
        }
    });

    const inversions: string[][] = [];
    
    for (let inv = 0; inv < 4; inv++) {
        let currentMidi = [...rootPositionMidi];
        
        for (let j = 0; j < inv; j++) {
            currentMidi[j] += 12;
        }
        
        currentMidi.sort((a, b) => a - b);

        const maxNote = currentMidi[currentMidi.length - 1];
        if (maxNote > 84) {
            currentMidi = currentMidi.map(n => n - 12);
        }

        inversions.push(currentMidi.map(m => midiToNoteName(m)));
    }

    return inversions;
}

export const MINOR_MODES: ScaleType[] = ['Harmonic Minor', 'Melodic Minor', 'Natural Minor'];

export const KEY_OPTIONS = [
  { major: 'C', minor: 'C' },
  { major: 'Db', minor: 'C#' },
  { major: 'D', minor: 'D' },
  { major: 'Eb', minor: 'Eb' },
  { major: 'E', minor: 'E' },
  { major: 'F', minor: 'F' },
  { major: 'Gb', minor: 'F#' },
  { major: 'G', minor: 'G' },
  { major: 'Ab', minor: 'G#' },
  { major: 'A', minor: 'A' },
  { major: 'Bb', minor: 'Bb' },
  { major: 'B', minor: 'B' },
];

export const ALL_PICKER_ITEMS = KEY_OPTIONS.flatMap(k => [
  `${k.major} Major`,
  `${k.minor} Minor`
]);

export const ENHARMONICS: Record<string, string> = {
  'C#': 'Db', 'Db': 'C#',
  'D#': 'Eb', 'Eb': 'D#',
  'F#': 'Gb', 'Gb': 'F#',
  'G#': 'Ab', 'Ab': 'G#',
  'A#': 'Bb', 'Bb': 'A#'
};
