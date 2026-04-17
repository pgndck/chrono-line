import React from 'react';
import { format, subDays, isSameDay } from 'date-fns';
import { CalendarDays, Play, CheckSquare } from 'lucide-react';
import clsx from 'clsx';

interface HomeViewProps {
  stats: Record<string, any>;
  onPlayDate: (date: Date) => void;
  onOpenArchive: () => void;
}

export function HomeView({ stats, onPlayDate, onOpenArchive }: HomeViewProps) {
  const today = new Date();
  // Generate the last 5 days including today
  const recentDays = Array.from({ length: 5 }).map((_, i) => subDays(today, i)).reverse();
  
  const totalSolved = Object.values(stats).filter(s => s?.isComplete).length;

  return (
    <div className="min-h-screen bg-[#e8e4d9] text-[var(--color-ink)] font-serif flex flex-col border-[8px] sm:border-[12px] border-[var(--color-ink)] box-border selection:bg-[var(--color-accent)] selection:text-[var(--color-paper)]">
      
      {/* Header */}
      <header className="h-[80px] border-b-2 border-[var(--color-ink)] px-4 sm:px-10 flex items-center justify-center sticky top-0 z-10 bg-[#e8e4d9]">
        <div className="flex items-center select-none cursor-default">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--color-ink)] text-[var(--color-paper)] flex items-center justify-center font-serif text-2xl sm:text-3xl font-black">
            <span className="mt-[2px] sm:mt-[4px]">C</span>
          </div>
          <h1 className="font-serif font-bold text-lg sm:text-xl uppercase tracking-[0.08em] sm:tracking-[0.12em] ml-1 sm:ml-1.5 mt-1 sm:mt-1.5 flex items-center">
            HRONO<span className="tracking-tight mx-[2px] opacity-80">-</span>LINE
          </h1>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center p-4 sm:p-10 max-w-3xl mx-auto w-full gap-8">
        
        {/* Today's Clue Card */}
        <div className="w-full bg-[var(--color-paper)] border-[4px] border-[var(--color-ink)] p-8 sm:p-12 flex flex-col items-center text-center relative shadow-[8px_8px_0_0_var(--color-ink)] mt-4 sm:mt-8">
          <h2 className="font-sans font-black text-2xl sm:text-3xl uppercase tracking-[2px] mb-4">
            Today's Edition
          </h2>
          
          <p className="font-serif italic text-lg sm:text-xl mb-12 max-w-sm text-gray-700">
            Decode the front page headline from this day in history.
          </p>
          
          <button 
            onClick={() => onPlayDate(today)}
            className="bg-[var(--color-accent)] text-[var(--color-paper)] border-2 border-[var(--color-ink)] text-xl font-sans font-black uppercase tracking-[3px] px-16 py-4 shadow-[4px_4px_0_0_var(--color-ink)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0_0_var(--color-ink)] active:translate-x-[4px] active:translate-y-[4px] active:shadow-none transition-all flex items-center gap-3"
          >
            <Play fill="currentColor" className="w-5 h-5 -ml-2" /> Play
          </button>
          
          <div className="mt-10 font-sans text-xs font-bold uppercase tracking-[1px] opacity-60">
            {format(today, 'MMMM d, yyyy')}
          </div>
        </div>

        {/* Total Solved Badge */}
        {totalSolved > 0 && (
          <div className="bg-[#f2eecb] border-2 border-[var(--color-ink)] px-6 py-2 font-sans font-bold uppercase tracking-[1px] text-sm shadow-[2px_2px_0_0_var(--color-ink)] transform rotate-1 my-2">
            You have decoded {totalSolved} headline{totalSolved !== 1 ? 's' : ''}!
          </div>
        )}

        {/* Recent Puzzles Sub-section */}
        <div className="w-full mt-4 bg-[var(--color-paper)] border-2 border-[var(--color-ink)] p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-sans font-black text-lg uppercase tracking-[1px] flex items-center gap-2">
              Recent Editions <span className="text-xl font-serif font-normal">›</span>
            </h3>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 sm:gap-4">
            {recentDays.map((dayDate, idx) => {
              const dayStr = format(dayDate, 'yyyy-MM-dd');
              let stateStr = localStorage.getItem('chrono_states');
              let allStates = stateStr ? JSON.parse(stateStr) : {};
              let state = allStates[dayStr];
              let isDone = stats[dayStr]?.isComplete || (state && state.isSolved);
              const isToday = isSameDay(dayDate, today);

              return (
                <button
                  key={idx}
                  onClick={() => onPlayDate(dayDate)}
                  className={clsx(
                    "aspect-[3/4] border-2 border-[var(--color-ink)] flex flex-col justify-between items-center p-2 hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors group relative bg-[var(--color-paper)]",
                    isToday && "ring-2 ring-[var(--color-accent)] ring-offset-2 ring-offset-[var(--color-paper)]"
                  )}
                >
                  <div className="font-serif italic font-bold">
                    {format(dayDate, 'EE')}
                  </div>
                  
                  <div className="w-8 h-8 flex items-center justify-center">
                    {isDone ? (
                      <CheckSquare className="w-6 h-6" strokeWidth={3} />
                    ) : (
                      <div className="w-6 h-6 border-2 border-current group-hover:bg-[var(--color-paper)]/10" />
                    )}
                  </div>
                  
                  <div className="font-sans text-[10px] uppercase font-bold tracking-[1px] text-center w-full truncate">
                    {isToday ? 'Today' : format(dayDate, 'd')}
                  </div>
                </button>
              );
            })}
            
            {/* Archive Button */}
            <button
              onClick={onOpenArchive}
              className="aspect-[3/4] border-2 border-[var(--color-ink)] flex flex-col justify-center items-center p-2 hover:bg-gray-100 transition-colors bg-[#f5f5f5]"
            >
              <CalendarDays className="w-6 h-6 mb-2" strokeWidth={2.5} />
              <div className="font-sans text-[10px] uppercase font-bold tracking-[1px] text-center">
                See All
              </div>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}
