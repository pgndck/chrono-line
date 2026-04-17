import React, { useState, useEffect } from 'react';
import { Share2, ExternalLink, X, Check } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import clsx from 'clsx';
import { PuzzleData } from '../utils/puzzleUtils';

interface VictoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  puzzleData: PuzzleData;
  elapsedTime: number;
  hintsUsed: number;
}

export function VictoryModal({ isOpen, onClose, puzzleData, elapsedTime, hintsUsed }: VictoryModalProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (copied) {
      const t = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(t);
    }
  }, [copied]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleShare = () => {
    const diff = puzzleData.difficulty || 3;
    const diffStr = Array(diff).fill('★').join('') + Array(5 - diff).fill('☆').join('');
    const timeStr = formatTime(elapsedTime);
    
    const text = `Chrono-Line 📰\n${format(parseISO(puzzleData.sourceDate), 'MMM d, yyyy')}\nDifficulty: ${diffStr}\nTime: ${timeStr}\nHints: ${hintsUsed}\n\n${window.location.origin}`;
    
    if (navigator.share) {
      navigator.share({ text }).catch(console.error);
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[var(--color-paper)] text-[var(--color-ink)] border-4 sm:border-8 border-[var(--color-ink)] w-full max-w-md shadow-2xl relative flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <header className="border-b-2 sm:border-b-4 border-[var(--color-ink)] p-4 sm:p-6 flex justify-between items-start">
          <div>
            <h2 className="font-sans font-black text-2xl sm:text-3xl uppercase tracking-[1px] leading-none mb-2">
              Decoded!
            </h2>
            <p className="font-serif italic text-lg sm:text-xl">
              {format(parseISO(puzzleData.sourceDate), 'MMMM d, yyyy')}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors rounded-full"
            title="Close"
          >
            <X className="w-6 h-6" strokeWidth={2.5} />
          </button>
        </header>

        {/* Stats */}
        <main className="p-6 sm:p-8 flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] uppercase font-bold tracking-[1px]">Time</span>
              <span className="font-serif text-2xl font-bold">{formatTime(elapsedTime)}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] uppercase font-bold tracking-[1px]">Hints</span>
              <span className="font-serif text-2xl font-bold">{hintsUsed}</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="font-sans text-[10px] uppercase font-bold tracking-[1px]">Difficulty</span>
              <div className="flex gap-[2px] justify-center h-full items-center">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={clsx("h-[6px] w-[6px] sm:w-[8px]", i < (puzzleData.difficulty || 3) ? "bg-[var(--color-accent)]" : "bg-[var(--color-grid-line)]")} />
                ))}
              </div>
            </div>
          </div>

          <hr className="border-[var(--color-ink)] opacity-20" />

          <div className="flex flex-col gap-3">
            <button
              onClick={handleShare}
              className="w-full flex items-center justify-center gap-2 bg-[var(--color-ink)] text-[var(--color-paper)] p-4 font-sans font-bold uppercase tracking-[1.5px] hover:opacity-90 transition-opacity"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" /> Copied to clipboard!
                </>
              ) : (
                <>
                  <Share2 className="w-5 h-5" /> Share Results
                </>
              )}
            </button>
            <a
              href={puzzleData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border-2 border-[var(--color-ink)] bg-transparent text-[var(--color-ink)] p-4 font-sans font-bold uppercase tracking-[1.5px] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors"
            >
              Read Full Story <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>
        </main>
      </div>
    </div>
  );
}
