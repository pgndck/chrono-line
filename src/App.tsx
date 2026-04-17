import React, { useEffect, useState, useCallback, useRef } from 'react';
import { generatePuzzleData, PuzzleData, PuzzleGridCell } from './utils/puzzleUtils';
import { getDailyPuzzleDef, DailyPuzzleDef, prefetchNextPuzzle } from './utils/dailyPuzzle';
import { Loader2, Share2, HelpCircle, Trophy, Wand2, Shuffle } from 'lucide-react';
import { format } from 'date-fns';
import clsx from 'clsx';

interface DailyStat {
  isComplete: boolean;
  endTime: number;
  completeTime: number;
}
type StatsDB = Record<string, DailyStat>;

export default function App() {
  const [puzzleData, setPuzzleData] = useState<PuzzleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [gridState, setGridState] = useState<PuzzleGridCell[][]>([]);
  const [selectedCell, setSelectedCell] = useState<{r: number, c: number} | null>(null);
  const [columnSorts, setColumnSorts] = useState<number[][]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  
  const [startTime, setStartTime] = useState<number>(0);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [hintsUsed, setHintsUsed] = useState(0);
  const [isSolved, setIsSolved] = useState(false);

  const [stats, setStats] = useState<StatsDB>(() => {
    const saved = localStorage.getItem('chrono_stats');
    return saved ? JSON.parse(saved) : {};
  });

  useEffect(() => {
    const loadPuzzle = async () => {
      try {
        const def = await getDailyPuzzleDef();
        const pData = generatePuzzleData(def.headline, def.sourceDate, def.url, 12);
        setPuzzleData(pData);
        
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        const savedStateStr = localStorage.getItem('chrono_state');
        let loadedFromSave = false;

        if (savedStateStr) {
          try {
            const savedState = JSON.parse(savedStateStr);
            const isSameHeadline = savedState.headline === pData.headline;
            const isSameGrid = savedState.gridState?.length === pData.grid.length && 
                               savedState.gridState?.[0]?.length === pData.grid[0]?.length;
                               
            if (savedState.date === todayStr && isSameHeadline && isSameGrid) {
              setGridState(savedState.gridState);
              setElapsedTime(savedState.elapsedTime);
              setHintsUsed(savedState.hintsUsed);
              setIsSolved(savedState.isSolved);
              setColumnSorts(savedState.columnSorts || pData.columns.map(col => col.map(() => Math.random())));
              setStartTime(Date.now() - savedState.elapsedTime);
              loadedFromSave = true;
            }
          } catch (e) {
            console.error("Failed to parse saved state", e);
          }
        }

        if (!loadedFromSave) {
          setGridState(pData.grid);
          setColumnSorts(pData.columns.map(col => col.map(() => Math.random())));
          setStartTime(Date.now());
          setElapsedTime(0);
          setHintsUsed(0);
          setIsSolved(false);
        }
        
        setLoading(false);
        
        // Quietly fetch a future puzzle in the background
        setTimeout(() => {
          prefetchNextPuzzle().catch(console.error);
        }, 1000);

      } catch (err) {
        console.error(err);
        setError('Failed to load puzzle. Please try again later.');
        setLoading(false);
      }
    };

    loadPuzzle();
  }, []);

  // Save game state
  useEffect(() => {
    if (puzzleData && gridState.length > 0) {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      localStorage.setItem('chrono_state', JSON.stringify({
        date: todayStr,
        headline: puzzleData.headline,
        gridState,
        elapsedTime,
        hintsUsed,
        isSolved,
        columnSorts
      }));
    }
  }, [gridState, elapsedTime, hintsUsed, isSolved, puzzleData, columnSorts]);

  useEffect(() => {
    if (!isSolved && startTime > 0) {
      const interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isSolved, startTime]);

  const checkWinCondition = useCallback((currentGrid: PuzzleGridCell[][]) => {
    let solved = true;
    for (let r = 0; r < currentGrid.length; r++) {
      for (let c = 0; c < currentGrid[r].length; c++) {
        const cell = currentGrid[r][c];
        if (!cell.isSpace && cell.userInput !== cell.char) {
          solved = false;
          break;
        }
      }
    }
    if (solved && !isSolved) {
      setIsSolved(true);
      
      // Save stats
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const newStats = {
        ...stats,
        [todayStr]: {
          isComplete: true,
          endTime: Date.now(),
          completeTime: elapsedTime
        }
      };
      setStats(newStats);
      localStorage.setItem('chrono_stats', JSON.stringify(newStats));
    }
  }, [isSolved, elapsedTime, stats]);

  useEffect(() => {
    if (selectedCell && !isSolved) {
      inputRef.current?.focus();
    }
  }, [selectedCell, isSolved]);

  const getAvailableLettersForColState = (c: number, ignoreRow: number, currentGrid: PuzzleGridCell[][], pData: PuzzleData) => {
    const allLetters = [...pData.columns[c]];
    for (let row = 0; row < currentGrid.length; row++) {
      if (row !== ignoreRow) {
        const cell = currentGrid[row][c];
        if (!cell.isSpace && cell.userInput) {
          const idx = allLetters.indexOf(cell.userInput);
          if (idx !== -1) {
            allLetters.splice(idx, 1);
          }
        }
      }
    }
    return allLetters;
  };

  const moveToNextEmptyCell = useCallback((startR: number, startC: number, currentGrid: PuzzleGridCell[][]) => {
    let nextC = startC + 1;
    let nextR = startR;
    while (nextR < currentGrid.length) {
      while (nextC < currentGrid[nextR].length) {
        if (!currentGrid[nextR][nextC].isSpace && !currentGrid[nextR][nextC].userInput) {
          setSelectedCell({ r: nextR, c: nextC });
          return;
        }
        nextC++;
      }
      nextR++;
      nextC = 0;
    }
    nextR = 0;
    nextC = 0;
    while (nextR <= startR) {
      while (nextC < currentGrid[nextR].length) {
        if (nextR === startR && nextC >= startC) return;
        if (!currentGrid[nextR][nextC].isSpace && !currentGrid[nextR][nextC].userInput) {
          setSelectedCell({ r: nextR, c: nextC });
          return;
        }
        nextC++;
      }
      nextR++;
      nextC = 0;
    }
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent | React.KeyboardEvent) => {
    if (isSolved || !selectedCell || !puzzleData) return;

    const { r, c } = selectedCell;

    if (e.key === 'ArrowRight') {
      let nextC = c + 1;
      let nextR = r;
      while (nextR < gridState.length) {
        while (nextC < gridState[nextR].length) {
          if (!gridState[nextR][nextC].isSpace) {
            setSelectedCell({ r: nextR, c: nextC });
            return;
          }
          nextC++;
        }
        nextR++;
        nextC = 0;
      }
    } else if (e.key === 'ArrowLeft') {
      let prevC = c - 1;
      let prevR = r;
      while (prevR >= 0) {
        while (prevC >= 0) {
          if (!gridState[prevR][prevC].isSpace) {
            setSelectedCell({ r: prevR, c: prevC });
            return;
          }
          prevC--;
        }
        prevR--;
        prevC = gridState[0].length - 1;
      }
    } else if (e.key === 'ArrowDown') {
      let nextR = r + 1;
      while (nextR < gridState.length) {
        if (!gridState[nextR][c].isSpace) {
          setSelectedCell({ r: nextR, c });
          return;
        }
        nextR++;
      }
    } else if (e.key === 'ArrowUp') {
      let prevR = r - 1;
      while (prevR >= 0) {
        if (!gridState[prevR][c].isSpace) {
          setSelectedCell({ r: prevR, c });
          return;
        }
        prevR--;
      }
    } else if (e.key === 'Backspace') {
      const newGrid = [...gridState];
      newGrid[r][c] = { ...newGrid[r][c], userInput: '' };
      setGridState(newGrid);
      
      // Move left
      let prevC = c - 1;
      let prevR = r;
      while (prevR >= 0) {
        while (prevC >= 0) {
          if (!gridState[prevR][prevC].isSpace) {
            setSelectedCell({ r: prevR, c: prevC });
            return;
          }
          prevC--;
        }
        prevR--;
        prevC = gridState[0].length - 1;
      }
    } else if (/^[a-zA-Z]$/.test(e.key)) {
      e.preventDefault();
      const char = e.key.toUpperCase();
      
      const available = getAvailableLettersForColState(c, r, gridState, puzzleData);
      if (!available.includes(char)) return;

      const newGrid = [...gridState];
      newGrid[r][c] = { ...newGrid[r][c], userInput: char };
      setGridState(newGrid);
      checkWinCondition(newGrid);

      moveToNextEmptyCell(r, c, newGrid);
    }
  }, [selectedCell, gridState, isSolved, puzzleData, checkWinCondition, moveToNextEmptyCell]);

  const handleHint = () => {
    if (!selectedCell || isSolved || !puzzleData) return;
    const { r, c } = selectedCell;
    const correctChar = gridState[r][c].char;
    
    const newGrid = [...gridState];
    newGrid[r][c] = { ...newGrid[r][c], userInput: correctChar };
    setGridState(newGrid);
    setHintsUsed(h => h + 1);
    checkWinCondition(newGrid);
    moveToNextEmptyCell(r, c, newGrid);
  };

  const handleSolveSingles = () => {
    if (isSolved || !puzzleData) return;
    
    let changed = false;
    const newGrid = [...gridState];
    
    for (let c = 0; c < puzzleData.columns.length; c++) {
      const emptyRows: number[] = [];
      for (let r = 0; r < newGrid.length; r++) {
        if (!newGrid[r][c].isSpace && !newGrid[r][c].userInput) {
          emptyRows.push(r);
        }
      }
      
      if (emptyRows.length === 1) {
        const available = getAvailableLettersForColState(c, -1, newGrid, puzzleData);
        if (available.length === 1) {
          newGrid[emptyRows[0]][c] = { ...newGrid[emptyRows[0]][c], userInput: available[0] };
          changed = true;
        }
      }
    }
    
    if (changed) {
      setGridState(newGrid);
      checkWinCondition(newGrid);
    }
  };

  const handleScramble = () => {
    if (!puzzleData) return;
    setColumnSorts(puzzleData.columns.map(col => col.map(() => Math.random())));
  };

  const handleColumnLetterClick = (c: number, letter: string | null) => {
    if (!letter || isSolved || !puzzleData) return;
    
    let targetRow = -1;
    
    // If the currently selected cell is in this column and is empty, use it
    if (selectedCell && selectedCell.c === c && !gridState[selectedCell.r][c].isSpace && !gridState[selectedCell.r][c].userInput) {
      targetRow = selectedCell.r;
    } else {
      // Otherwise, find the first empty cell in this column
      for (let r = 0; r < gridState.length; r++) {
        if (!gridState[r][c].isSpace && !gridState[r][c].userInput) {
          targetRow = r;
          break;
        }
      }
    }
    
    if (targetRow !== -1) {
      const newGrid = [...gridState];
      newGrid[targetRow][c] = { ...newGrid[targetRow][c], userInput: letter };
      setGridState(newGrid);
      checkWinCondition(newGrid);
      moveToNextEmptyCell(targetRow, c, newGrid);
    }
  };

  const handleShare = () => {
    const mins = Math.floor(elapsedTime / 60);
    const secs = elapsedTime % 60;
    const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
    const text = `NYT Drop Quote\nTime: ${timeStr}\nHints: ${hintsUsed}\nPlay at: ${window.location.href}`;
    
    if (navigator.share) {
      navigator.share({ text });
    } else {
      navigator.clipboard.writeText(text);
      alert('Copied to clipboard!');
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-serif flex items-center justify-center border-[8px] sm:border-[12px] border-[var(--color-ink)] box-border">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-accent)]" />
          <p className="text-lg font-bold italic">Accessing Archives...</p>
        </div>
      </div>
    );
  }

  if (error || !puzzleData) {
    return (
      <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-serif flex items-center justify-center border-[8px] sm:border-[12px] border-[var(--color-ink)] box-border p-4">
        <div className="bg-white p-8 border-2 border-[var(--color-ink)] text-center max-w-md">
          <p className="text-[var(--color-accent)] font-bold uppercase tracking-[2px] mb-2 font-sans text-sm">Error</p>
          <p className="text-lg italic">{error}</p>
        </div>
      </div>
    );
  }

  // Calculate remaining letters for the top columns
  const remainingColumns = puzzleData.columns.map((col, cIndex) => {
    const usedLetters: string[] = [];
    for (let r = 0; r < gridState.length; r++) {
      const cell = gridState[r][cIndex];
      if (!cell.isSpace && cell.userInput) {
        usedLetters.push(cell.userInput);
      }
    }
    
    const remaining = col.map((letter, idx) => ({ letter, idx, used: false }));
    
    for (const used of usedLetters) {
      const found = remaining.find(r => !r.used && r.letter === used);
      if (found) found.used = true;
    }
    
    const filtered = remaining.filter(r => !r.used);
    
    filtered.sort((a, b) => {
      const sortA = columnSorts[cIndex]?.[a.idx] || 0;
      const sortB = columnSorts[cIndex]?.[b.idx] || 0;
      return sortA - sortB;
    });
    
    return filtered.map(r => r.letter);
  });

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-serif flex flex-col border-[8px] sm:border-[12px] border-[var(--color-ink)] box-border selection:bg-[var(--color-accent)] selection:text-[var(--color-paper)]">
      <header className="h-[80px] border-b-2 border-[var(--color-ink)] px-4 sm:px-10 flex items-center justify-between sticky top-0 z-10 bg-[var(--color-paper)]">
        <div className="flex items-center select-none group cursor-default" title="Chrono-Line">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--color-ink)] text-[var(--color-paper)] flex items-center justify-center font-serif text-2xl sm:text-3xl font-black transition-transform group-hover:-rotate-6">
            <span className="mt-[2px] sm:mt-[4px]">C</span>
          </div>
          <h1 className="font-serif font-bold text-lg sm:text-xl uppercase tracking-[0.08em] sm:tracking-[0.12em] ml-1 sm:ml-1.5 mt-1 sm:mt-1.5 flex items-center">
            HRONO<span className="tracking-tight mx-[2px] opacity-80">-</span>LINE
          </h1>
        </div>
        <div className="hidden sm:block text-center absolute left-1/2 -translate-x-1/2">
          <h2 className="font-sans text-[14px] uppercase tracking-[2px] font-bold">Archive Edition</h2>
          <p className="italic text-[18px] font-serif">
            {new Date(puzzleData.sourceDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex gap-4 sm:gap-6 font-sans text-[10px] sm:text-xs font-bold uppercase">
          <div>Time: {formatTime(elapsedTime)}</div>
          <div>Hints: {hintsUsed}</div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-10">
        
        <div className="opacity-50 text-sm sm:text-base mb-8 text-center max-w-2xl leading-relaxed">
          From the New York Times Front Page: Decode the headline from {new Date(puzzleData.sourceDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}.
        </div>

        <div className="flex flex-col gap-1">
          {/* Top Columns (Available Letters) */}
          <div className="flex justify-center gap-1 mb-2">
            {remainingColumns.map((col, cIdx) => (
              <div key={cIdx} className="w-8 sm:w-10 flex flex-col items-center font-sans text-[11px] sm:text-xs text-[var(--color-accent)] font-bold min-h-[60px] justify-end leading-tight">
                {col.map((letter, rIdx) => (
                  <span 
                    key={rIdx} 
                    onClick={() => handleColumnLetterClick(cIdx, letter)}
                    className="cursor-pointer hover:bg-[var(--color-accent)] hover:text-[var(--color-paper)] px-1 rounded transition-colors"
                  >
                    {letter}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Puzzle Grid */}
          <div className="flex flex-col gap-1">
            {gridState.map((row, rIdx) => (
              <div key={rIdx} className="flex justify-center gap-1">
                {row.map((cell, cIdx) => {
                  const isSelected = selectedCell?.r === rIdx && selectedCell?.c === cIdx;
                  
                  if (cell.isSpace) {
                    return <div key={cIdx} className="w-8 h-[42px] sm:w-10 sm:h-[52px] bg-transparent" />;
                  }

                  const isWordBreak = cIdx === row.length - 1 && 
                                      rIdx < gridState.length - 1 && 
                                      !gridState[rIdx + 1][0].isSpace;

                  return (
                    <div
                      key={cIdx}
                      onClick={() => setSelectedCell({ r: rIdx, c: cIdx })}
                      className={clsx(
                        "relative w-8 h-[42px] sm:w-10 sm:h-[52px] flex items-center justify-center text-[20px] font-bold uppercase cursor-pointer transition-all",
                        isSelected ? "outline outline-2 outline-[var(--color-accent)] outline-offset-2 z-10" : "border border-[var(--color-grid-line)]",
                        (cell.userInput || isSolved) ? "bg-[var(--color-ink)] text-[var(--color-paper)] border-[var(--color-ink)]" : "bg-white text-[var(--color-ink)] hover:bg-gray-50"
                      )}
                    >
                      {cell.userInput}
                      {isWordBreak && (
                        <span className="absolute -right-[6px] sm:-right-[8px] top-1/2 -translate-y-1/2 text-[var(--color-ink)] font-bold text-sm z-20">
                          -
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Mobile Keyboard Hint */}
        <p className="mt-12 text-xs opacity-50 text-center max-w-sm font-sans">
          Use your physical keyboard to type. On mobile, tap a cell to open the keyboard.
        </p>

        {/* Hidden input for mobile keyboard */}
        <input
          ref={inputRef}
          type="text"
          className="opacity-0 absolute -z-10"
          onBlur={() => {
            // Intentionally not forcing focus back. 
            // This allows users to click and type in other text fields on the page.
          }}
          onChange={(e) => {
            const val = e.target.value;
            if (val.length > 0) {
              const char = val.charAt(val.length - 1).toUpperCase();
              if (/^[A-Z]$/.test(char)) {
                handleKeyDown(new KeyboardEvent('keydown', { key: char }));
              }
              e.target.value = '';
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Backspace') {
              handleKeyDown(new KeyboardEvent('keydown', { key: 'Backspace' }));
            } else if (e.key.startsWith('Arrow')) {
              handleKeyDown(new KeyboardEvent('keydown', { key: e.key }));
            } else if (/^[a-zA-Z]$/.test(e.key)) {
              e.preventDefault();
              handleKeyDown(new KeyboardEvent('keydown', { key: e.key }));
            }
          }}
        />
      </main>

      <footer className="h-auto sm:h-[120px] border-t border-[var(--color-ink)] grid grid-cols-1 sm:grid-cols-3 gap-6 items-center p-6 sm:px-10 bg-[var(--color-footer)] mt-auto">
        <div className="flex flex-col gap-1 items-center sm:items-start">
          <div className="font-sans text-[10px] uppercase tracking-[1px] font-bold text-[var(--color-ink)]">Difficulty</div>
          <div className="flex gap-[2px]">
            {[...Array(5)].map((_, i) => (
              <div key={i} className={clsx("h-[6px] w-[24px]", i < 3 ? "bg-[var(--color-accent)]" : "bg-[var(--color-grid-line)]")} />
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2">
          {!isSolved ? (
            <>
              <button
                onClick={handleHint}
                className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[1px] px-3 sm:px-4 py-2 border-2 border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors flex items-center gap-1"
                title="Reveal current letter"
              >
                <HelpCircle className="w-3 h-3 sm:w-4 sm:h-4" /> Hint ({hintsUsed})
              </button>
              <button
                onClick={handleSolveSingles}
                className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[1px] px-3 sm:px-4 py-2 border-2 border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors flex items-center gap-1"
                title="Fill columns with only 1 empty space"
              >
                <Wand2 className="w-3 h-3 sm:w-4 sm:h-4" /> Singles
              </button>
              <button
                onClick={handleScramble}
                className="font-sans text-[10px] sm:text-xs font-bold uppercase tracking-[1px] px-3 sm:px-4 py-2 border-2 border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors flex items-center gap-1"
                title="Shuffle available letters"
              >
                <Shuffle className="w-3 h-3 sm:w-4 sm:h-4" /> Mix
              </button>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-xl font-bold uppercase mb-1">Archive Decoded</h2>
              <a 
                href={puzzleData.url} 
                target="_blank" 
                rel="noreferrer"
                className="font-sans text-xs font-bold uppercase border-b-2 border-[var(--color-ink)] hover:text-[var(--color-accent)] hover:border-[var(--color-accent)] transition-colors"
              >
                Read Original Article
              </a>
            </div>
          )}
        </div>

        <div className="flex justify-center sm:justify-end">
          {isSolved && (
            <button
              onClick={handleShare}
              className="bg-[var(--color-ink)] text-[var(--color-paper)] px-6 py-3 font-sans uppercase text-xs font-bold tracking-[1px] flex items-center gap-2 hover:bg-gray-800 transition-colors"
            >
              <Share2 className="w-4 h-4" /> Copy Result
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

