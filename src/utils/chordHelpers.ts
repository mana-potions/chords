import { noteToMidi } from './musicEngine';

export const resolveMidi = (note: string): number | undefined => {
  const cleanNote = note.replace(/[0-9-]/g, '');
  if (noteToMidi[cleanNote] !== undefined) return noteToMidi[cleanNote];
  
  const doubleSharps: Record<string, number> = {
    'F##': 7, 'Fx': 7,
    'C##': 2, 'Cx': 2,
    'G##': 9, 'Gx': 9,
    'D##': 4, 'Dx': 4,
    'A##': 11, 'Ax': 11
  };
  return doubleSharps[cleanNote];
};

export const extractChordNotes = (gridData: { rows: string[][] }, colIndex: number): string[] => {
  const root = gridData.rows[6][colIndex];
  const third = gridData.rows[4][colIndex];
  const fifth = gridData.rows[2][colIndex];
  const seventh = gridData.rows[0][colIndex];
  return [root, third, fifth, seventh].filter(Boolean);
};

export const shiftOctavesDown = (inversions: string[][]): string[][] => {
  return inversions.map(inv => inv.map(n => n.replace(/\d+/, d => String(Number(d) - 1))));
};

export const getAverageMidi = (notesArr: string[]): number => {
  if (notesArr.length === 0) return 0;
  const sum = notesArr.reduce((acc, noteStr) => {
    const octaveMatch = noteStr.match(/-?\d+/);
    const octave = octaveMatch ? parseInt(octaveMatch[0], 10) : 4;
    const midiBase = resolveMidi(noteStr) ?? 0;
    return acc + (midiBase + (octave + 1) * 12);
  }, 0);
  return sum / notesArr.length;
};