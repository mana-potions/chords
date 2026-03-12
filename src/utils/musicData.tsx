export const MAJOR_KEYS = {
  "C":  ["C", "D", "E", "F", "G", "A", "B"],
  "Db": ["Db", "Eb", "F", "Gb", "Ab", "Bb", "C"],
  "D":  ["D", "E", "F#", "G", "A", "B", "C#"],
  "Eb": ["Eb", "F", "G", "Ab", "Bb", "C", "D"],
  "E":  ["E", "F#", "G#", "A", "B", "C#", "D#"],
  "F":  ["F", "G", "A", "Bb", "C", "D", "E"],
  "Gb": ["Gb", "Ab", "Bb", "Cb", "Db", "Eb", "F"],
  "G":  ["G", "A", "B", "C", "D", "E", "F#"],
  "Ab": ["Ab", "Bb", "C", "Db", "Eb", "F", "G"],
  "A":  ["A", "B", "C#", "D", "E", "F#", "G#"],
  "Bb": ["Bb", "C", "D", "Eb", "F", "G", "A"],
  "B":  ["B", "C#", "D#", "E", "F#", "G#", "A#"]
};

export const NATURAL_MINOR_KEYS = {
  "C":  ["C", "D", "Eb", "F", "G", "Ab", "Bb"],
  "C#": ["C#", "D#", "E", "F#", "G#", "A", "B"],
  "D":  ["D", "E", "F", "G", "A", "Bb", "C"],
  "Eb": ["Eb", "F", "Gb", "Ab", "Bb", "Cb", "Db"],
  "E":  ["E", "F#", "G", "A", "B", "C", "D"],
  "F":  ["F", "G", "Ab", "Bb", "C", "Db", "Eb"],
  "F#": ["F#", "G#", "A", "B", "C#", "D", "E"],
  "G":  ["G", "A", "Bb", "C", "D", "Eb", "F"],
  "G#": ["G#", "A#", "B", "C#", "D#", "E", "F#"],
  "A":  ["A", "B", "C", "D", "E", "F", "G"],
  "Bb": ["Bb", "C", "Db", "Eb", "F", "Gb", "Ab"],
  "B":  ["B", "C#", "D", "E", "F#", "G", "A"]
};

export const HARMONIC_MINOR_KEYS = {
  "C":  ["C", "D", "Eb", "F", "G", "Ab", "B"],
  "C#": ["C#", "D#", "E", "F#", "G#", "A", "B#"],
  "D":  ["D", "E", "F", "G", "A", "Bb", "C#"],
  "Eb": ["Eb", "F", "Gb", "Ab", "Bb", "Cb", "D"],
  "E":  ["E", "F#", "G", "A", "B", "C", "D#"],
  "F":  ["F", "G", "Ab", "Bb", "C", "Db", "E"],
  "F#": ["F#", "G#", "A", "B", "C#", "D", "E#"],
  "G":  ["G", "A", "Bb", "C", "D", "Eb", "F#"],
  "G#": ["G#", "A#", "B", "C#", "D#", "E", "Fx"], // Fx is F double sharp
  "A":  ["A", "B", "C", "D", "E", "F", "G#"],
  "Bb": ["Bb", "C", "Db", "Eb", "F", "Gb", "A"],
  "B":  ["B", "C#", "D", "E", "F#", "G", "A#"]
};

export const MELODIC_MINOR_KEYS = {
  "C":  ["C", "D", "Eb", "F", "G", "A", "B"],
  "C#": ["C#", "D#", "E", "F#", "G#", "A#", "B#"],
  "D":  ["D", "E", "F", "G", "A", "B", "C#"],
  "Eb": ["Eb", "F", "Gb", "Ab", "Bb", "C", "D"],
  "E":  ["E", "F#", "G", "A", "B", "C#", "D#"],
  "F":  ["F", "G", "Ab", "Bb", "C", "D", "E"],
  "F#": ["F#", "G#", "A", "B", "C#", "D#", "E#"],
  "G":  ["G", "A", "Bb", "C", "D", "E", "F#"],
  "G#": ["G#", "A#", "B", "C#", "D#", "E#", "Fx"],
  "A":  ["A", "B", "C", "D", "E", "F#", "G#"],
  "Bb": ["Bb", "C", "Db", "Eb", "F", "G", "A"],
  "B":  ["B", "C#", "D", "E", "F#", "G#", "A#"]
};

export const SCALE_DATA = {
  "Major": {
    suffixes: ["Maj7", "m7", "m7", "Maj7", "7", "m7", "m7b5"],
    numerals: ["IMaj7", "iim7", "iiim7", "IVMaj7", "V7", "vim7", "viim7b5"],
    modes: ["Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian", "Aeolian", "Locrian"]
  },
  "Natural Minor": {
    suffixes: ["m7", "m7b5", "Maj7", "m7", "m7", "Maj7", "7"],
    numerals: ["im7", "iiø7", "IIImaj7", "ivm7", "vm7", "VImaj7", "VII7"],
    modes: ["Aeolian", "Locrian", "Ionian", "Dorian", "Phrygian", "Lydian", "Mixolydian"]
  },
  "Harmonic Minor": {
    suffixes: ["mMaj7", "m7b5", "Maj7#5", "m7", "7", "Maj7", "dim7"],
    numerals: ["imMaj7", "iiø7", "III+Maj7", "ivm7", "V7", "VIMaj7", "vii°7"],
    modes: ["Harmonic Minor", "Locrian #6", "Ionian #5", "Dorian #4", "Phrygian Dominant", "Lydian #2", "Ultralocrian"]
  },
  "Melodic Minor": {
    suffixes: ["mMaj7", "m7", "Maj7#5", "7", "7", "m7b5", "m7b5"],
    numerals: ["imMaj7", "iim7", "III+Maj7", "IV7", "V7", "viø7", "viiø7"],
    modes: ["Melodic Minor", "Dorian b2", "Lydian Augmented", "Lydian Dominant", "Mixolydian b6", "Locrian #2", "Super Locrian"]
  }
} as const;

// Backwards compatibility for existing imports if any
export const CHORD_SUFFIXES = SCALE_DATA["Major"].suffixes;
export const ROMAN_NUMERALS = SCALE_DATA["Major"].numerals;
export const MODES = SCALE_DATA["Major"].modes;