import React, { useState } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, subMonths, addMonths, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight, CheckSquare, X } from 'lucide-react';
import clsx from 'clsx';

interface ArchiveViewProps {
  stats: Record<string, any>;
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

export function ArchiveView({ stats, onSelectDate, onClose }: ArchiveViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const today = new Date();
  
  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => {
    const next = addMonths(currentMonth, 1);
    if (next <= today) {
      setCurrentMonth(next);
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const dateFormat = "d";
  const rows: Date[][] = [];
  
  let days: Date[] = [];
  let day = startDate;
  let formattedDate = "";

  while (day <= endDate) {
    for (let i = 0; i < 7; i++) {
      days.push(day);
      day = addDays(day, 1);
    }
    rows.push(days);
    days = [];
  }

  const isNextDisabled = addMonths(currentMonth, 1) > today;

  return (
    <div className="min-h-screen bg-[var(--color-paper)] text-[var(--color-ink)] font-serif flex flex-col border-[8px] sm:border-[12px] border-[var(--color-ink)] box-border">
      
      {/* Header */}
      <header className="h-[80px] border-b-2 border-[var(--color-ink)] px-4 sm:px-10 flex items-center justify-between sticky top-0 z-10 bg-[var(--color-paper)]">
        <div className="flex items-center select-none cursor-default" title="Chrono-Line">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--color-ink)] text-[var(--color-paper)] flex items-center justify-center font-serif text-2xl sm:text-3xl font-black">
            <span className="mt-[2px] sm:mt-[4px]">C</span>
          </div>
          <h1 className="font-serif font-bold text-lg sm:text-xl uppercase tracking-[0.08em] sm:tracking-[0.12em] ml-1 sm:ml-1.5 mt-1 sm:mt-1.5 flex items-center hidden sm:flex">
            HRONO<span className="tracking-tight mx-[2px] opacity-80">-</span>LINE
          </h1>
        </div>
        
        <div className="text-center absolute left-1/2 -translate-x-1/2">
          <h2 className="font-sans text-[16px] sm:text-[18px] uppercase tracking-[2px] font-bold">Archive</h2>
        </div>

        <div className="flex items-center justify-end">
          <button 
            onClick={onClose}
            className="flex items-center justify-center w-10 h-10 border-2 border-[var(--color-ink)] bg-[var(--color-ink)] text-[var(--color-paper)] hover:bg-transparent hover:text-[var(--color-ink)] transition-colors rounded-full group"
            title="Back to Game"
          >
            <X className="w-5 h-5 transition-transform group-hover:rotate-90 group-hover:scale-110" strokeWidth={2.5} />
          </button>
        </div>
      </header>

      {/* Calendar content */}
      <main className="flex-1 flex flex-col items-center p-4 sm:p-10 max-w-4xl mx-auto w-full">
        
        <div className="w-full max-w-[500px] mb-8">
          <div className="flex items-center justify-between border-b-2 border-[var(--color-ink)] pb-2 mb-6">
            <h3 className="font-sans text-xl sm:text-2xl font-bold uppercase tracking-[1px] pl-2">
              {format(currentMonth, "MMMM yyyy")}
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={handlePrevMonth}
                className="w-10 h-10 border-2 border-[var(--color-ink)] flex items-center justify-center hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)] transition-colors rounded-full"
              >
                <ChevronLeft className="w-6 h-6" strokeWidth={3} />
              </button>
              <button 
                onClick={handleNextMonth}
                disabled={isNextDisabled}
                className={clsx(
                  "w-10 h-10 border-2 flex items-center justify-center transition-colors rounded-full",
                  isNextDisabled 
                    ? "border-gray-300 text-gray-300" 
                    : "border-[var(--color-ink)] hover:bg-[var(--color-ink)] hover:text-[var(--color-paper)]"
                )}
              >
                <ChevronRight className="w-6 h-6" strokeWidth={3} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 mb-4 border-b border-[var(--color-ink)] pb-2">
            {['su', 'm', 'tu', 'w', 'th', 'f', 'sa'].map((dayName, i) => (
              <div key={i} className="text-center font-serif text-lg font-bold italic lowercase">
                {dayName}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex flex-col gap-2 sm:gap-4">
            {rows.map((row, i) => (
              <div key={i} className="grid grid-cols-7 gap-2 sm:gap-4">
                {row.map((dayDate, idx) => {
                  const isCurrentMonth = isSameMonth(dayDate, monthStart);
                  const isFuture = dayDate > today && !isSameDay(dayDate, today);
                  let stateStr = localStorage.getItem('chrono_states');
                  let allStates = stateStr ? JSON.parse(stateStr) : {};
                  let state = allStates[format(dayDate, 'yyyy-MM-dd')];
                  let isDone = stats[format(dayDate, 'yyyy-MM-dd')]?.isComplete || (state && state.isSolved);

                  if (!isCurrentMonth) {
                    return <div key={idx} className="aspect-square" />;
                  }

                  if (isFuture) {
                    return (
                      <div key={idx} className="aspect-square flex items-center justify-center opacity-30">
                        <div className="w-2 h-2 rounded-full bg-[var(--color-ink)]" />
                      </div>
                    );
                  }

                  return (
                    <div key={idx} className="flex flex-col items-center gap-1 group">
                      <button
                        onClick={() => onSelectDate(dayDate)}
                        className={clsx(
                          "w-full aspect-[3/4] border-[3px] border-[var(--color-ink)] flex flex-col justify-between p-1 hover:bg-[#e4e1d7] transition-all relative overflow-hidden",
                          isSameDay(dayDate, today) && "bg-[var(--color-accent)]/10 border-[var(--color-accent)]"
                        )}
                      >
                        {/* Puzzle visual representation */}
                        <div className="grid grid-cols-[1fr_8fr_1fr] gap-[1px] w-full h-3 border-[1.5px] border-[var(--color-ink)]">
                          <div className="bg-[var(--color-ink)] h-[1px] self-center" />
                          <div className="grid grid-cols-4 gap-[1px] px-[2px]">
                            <div className="h-2 w-full bg-[var(--color-ink)]/20" />
                            <div className="h-2 w-full bg-[var(--color-ink)]/20" />
                            <div className="h-2 w-full bg-[var(--color-ink)]/20" />
                            <div className="h-2 w-full bg-[var(--color-ink)]/20" />
                          </div>
                          <div className="bg-[var(--color-ink)] h-[1px] self-center" />
                        </div>
                        
                        {/* Checkmark overlay */}
                        {isDone && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <CheckSquare className="w-8 h-8 text-[var(--color-ink)]" strokeWidth={3} />
                          </div>
                        )}
                      </button>
                      <span className="font-sans text-xs font-bold text-gray-500">
                        {format(dayDate, 'd')}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

        </div>

      </main>
    </div>
  );
}
