import { MAJOR_KEYS } from './musicData';

export const generateGridData = (root: keyof typeof MAJOR_KEYS) => {
  const scale = MAJOR_KEYS[root];
  
  // Rows 1-7: Stacking Thirds
  // Based on your PDF: Row 1 is the scale itself, Row 2 starts on the 2nd degree, etc.
  // To get the "vertical" stack seen in the PDFs, we calculate the offsets.
  const rows = [7, 6, 5, 4, 3, 2, 1].map((rowNum) => {
    return scale.map((_, colIndex) => {
      // Logic: (Column Index + Row Offset) % 7
      return scale[(colIndex + rowNum - 1) % 7];
    });
  });

  return { scale, rows };
};