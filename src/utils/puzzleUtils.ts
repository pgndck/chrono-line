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
  
  // Improved Difficulty Algorithm
  // 1. Base score is total letter count.
  // 2. Add extra complexity based on Scrabble letter values (obscure letters = harder).
  // 3. Subtract complexity based on the number of short words (anchor points).
  
  const scrabbleScores: Record<string, number> = {
    A: 1, B: 3, C: 3, D: 2, E: 1, F: 4, G: 2, H: 4, I: 1, J: 8, K: 5, L: 1, M: 3,
    N: 1, O: 1, P: 3, Q: 10, R: 1, S: 1, T: 1, U: 1, V: 4, W: 4, X: 8, Y: 4, Z: 10
  };

  const words = cleaned.split(/\s+/).filter(w => w.length > 0);
  const shortWordCount = words.filter(w => w.length <= 3).length;
  
  let scrabbleScore = 0;
  for (let i = 0; i < cleaned.length; i++) {
    const char = cleaned[i];
    if (char !== ' ') {
      scrabbleScore += scrabbleScores[char] || 1;
    }
  }

  // Calculate final complexity core
  const complexityScore = letterCount + (scrabbleScore - letterCount) * 1.5 - (shortWordCount * 5);

  let difficulty = 1;
  if (complexityScore >= 90) difficulty = 5;
  else if (complexityScore >= 70) difficulty = 4;
  else if (complexityScore >= 50) difficulty = 3;
  else if (complexityScore >= 30) difficulty = 2;

  // Bound it strictly to 1-5
  difficulty = Math.max(1, Math.min(5, Math.round(difficulty)));

  return {
    grid,
    columns: shuffledColumns,
    headline: cleaned,
    sourceDate,
    url,
    difficulty
  };
}
