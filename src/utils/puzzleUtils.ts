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
  difficulty: number;
}

export function generatePuzzleData(headline: string, sourceDate: string, url: string, cols: number = 15): PuzzleData {
  // Clean headline: keep only letters and spaces, convert to uppercase
  const cleaned = headline.toUpperCase().replace(/[^A-Z\s]/g, '').replace(/\s+/g, ' ').trim();
  
  const grid: PuzzleGridCell[][] = [];
  const columns: string[][] = Array.from({ length: cols }, () => []);
  
  let currentRow: PuzzleGridCell[] = [];
  let letterCount = 0;
  
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
      letterCount++;
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
  
  // Calculate difficulty out of 5 based on letter count
  // < 35 letters = 1
  // 35-44 letters = 2
  // 45-54 letters = 3
  // 55-64 letters = 4
  // 65+ letters = 5
  let difficulty = 1;
  if (letterCount >= 65) difficulty = 5;
  else if (letterCount >= 55) difficulty = 4;
  else if (letterCount >= 45) difficulty = 3;
  else if (letterCount >= 35) difficulty = 2;

  return {
    grid,
    columns: shuffledColumns,
    headline: cleaned,
    sourceDate,
    url,
    difficulty
  };
}
