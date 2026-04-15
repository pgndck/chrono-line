export interface PuzzleGridCell {
  char: string;
  isSpace: boolean;
  userInput: string;
  isCorrect: boolean;
}

export interface PuzzleData {
  grid: PuzzleGridCell[][];
  columns: string[][]; // Available letters for each column
  headline: string;
  sourceDate: string;
  url: string;
}

export function generatePuzzleData(headline: string, sourceDate: string, url: string, cols: number = 15): PuzzleData {
  // Clean headline: keep only letters and spaces, convert to uppercase
  const cleaned = headline.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
  
  const grid: PuzzleGridCell[][] = [];
  const columns: string[][] = Array.from({ length: cols }, () => []);
  
  let currentRow: PuzzleGridCell[] = [];
  
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    const isSpace = char === ' ';
    
    currentRow.push({
      char: isSpace ? '' : char,
      isSpace,
      userInput: '',
      isCorrect: false
    });
    
    if (!isSpace) {
      columns[currentRow.length - 1].push(char);
    }
    
    if (currentRow.length === cols) {
      grid.push(currentRow);
      currentRow = [];
    }
  }
  
  // Pad the last row with spaces if needed
  if (currentRow.length > 0) {
    while (currentRow.length < cols) {
      currentRow.push({
        char: '',
        isSpace: true,
        userInput: '',
        isCorrect: false
      });
    }
    grid.push(currentRow);
  }
  
  // Shuffle letters in each column
  const shuffledColumns = columns.map(col => {
    const shuffled = [...col];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  });
  
  return {
    grid,
    columns: shuffledColumns,
    headline: cleaned,
    sourceDate,
    url
  };
}
