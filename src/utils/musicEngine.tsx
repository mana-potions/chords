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