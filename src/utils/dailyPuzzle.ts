import { format, subYears, addDays } from 'date-fns';
import puzzlesData from '../data/puzzles.json';

const CORS_PROXY = 'https://api.codetabs.com/v1/proxy?quest=';
const NYT_SITEMAP_BASE = 'https://www.nytimes.com/sitemap';

export interface DailyPuzzleDef {
  date: string;
  headline: string;
  url: string;
  sourceDate: string;
}

// Seeded random number generator for deterministic daily puzzles
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

function getLocalPuzzles(): Record<string, DailyPuzzleDef> {
  try {
    const raw = localStorage.getItem('chrono_future_puzzles');
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to parse cached puzzles", e);
  }
  return {};
}

function saveLocalPuzzles(puzzles: Record<string, DailyPuzzleDef>) {
  localStorage.setItem('chrono_future_puzzles', JSON.stringify(puzzles));
}

async function fetchArchiveForDate(date: Date): Promise<DailyPuzzleDef | null> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const seed = parseInt(format(date, 'yyyyMMdd'), 10);
  const rng = mulberry32(seed);

  const yearsAgoOptions = [5, 10, 15, 20, 25];
  const yearsAgo = yearsAgoOptions[Math.floor(rng() * yearsAgoOptions.length)];
  const targetDate = subYears(date, yearsAgo);
  
  const year = targetDate.getFullYear();
  const month = format(targetDate, 'MM');
  const day = format(targetDate, 'dd');

  const targetUrl = `${NYT_SITEMAP_BASE}/${year}/${month}/${day}/`;
  const proxiedUrl = `${CORS_PROXY}${encodeURIComponent(targetUrl)}`;

  try {
    const response = await fetch(proxiedUrl);
    if (!response.ok) throw new Error('Network response was not ok');
    const html = await response.text();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const links = Array.from(doc.querySelectorAll('a'));
    
    let headlines = links
      .map(link => ({
        url: link.getAttribute('href') || '',
        headline: (link.textContent || '').trim()
      }))
      .filter(item => {
        const h = item.headline.toLowerCase();
        return item.url.includes(`/${year}/${month}/${day}/`) && 
               item.headline.length > 25 && 
               item.headline.length < 90 &&
               !h.includes('no title') &&
               !h.includes('untitled') &&
               !h.startsWith('article ') &&
               /^[a-zA-Z0-9\s.,!?'"-]+$/.test(item.headline); // Basic clean text filter
      });

    headlines.sort((a, b) => a.headline.localeCompare(b.headline));

    if (headlines.length > 0) {
      const selected = headlines[Math.floor(rng() * headlines.length)];
      return {
        date: dateStr,
        headline: selected.headline.toUpperCase(),
        url: selected.url.startsWith('http') ? selected.url : `https://www.nytimes.com${selected.url}`,
        sourceDate: format(targetDate, 'yyyy-MM-dd')
      };
    }
  } catch (error) {
    console.error('Failed to fetch from NYT:', error);
  }
  return null;
}

export async function getDailyPuzzleDef(): Promise<DailyPuzzleDef> {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // FAST LOAD 1: Check pre-generated json
  const preGenerated = (puzzlesData as Record<string, DailyPuzzleDef>)[todayStr];
  if (preGenerated) {
    return preGenerated;
  }

  // FAST LOAD 2: Check local storage (background fetched)
  const localPuzzles = getLocalPuzzles();
  if (localPuzzles[todayStr]) {
    return localPuzzles[todayStr];
  }

  // FALLBACK: Dynamic generation right away
  const fetched = await fetchArchiveForDate(today);
  if (fetched) return fetched;

  // Final fallback if offline
  return {
    date: todayStr,
    headline: "ARCHIVE CONNECTION FAILED BUT YOU CAN STILL PLAY THIS BACKUP PUZZLE",
    url: "https://www.nytimes.com",
    sourceDate: "2000-01-01"
  };
}

// Background loading: called quietly after the game loads
export async function prefetchNextPuzzle() {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  // We only fetch one puzzle per day in the background to avoid spamming the proxy.
  const lastFetch = localStorage.getItem('chrono_last_bg_fetch');
  if (lastFetch === todayStr) {
    return; // Already did our background job today
  }

  const localPuzzles = getLocalPuzzles();
  let checkDate = addDays(today, 1);
  let missingDate: Date | null = null;
  let missingDateStr = '';

  // Scan future dates to find the first one that is missing from both files and localStorage
  // Limit to searching 1000 days forward to avoid infinite loops
  for (let i = 0; i < 1000; i++) {
    const ds = format(checkDate, 'yyyy-MM-dd');
    const inJson = !!(puzzlesData as Record<string, DailyPuzzleDef>)[ds];
    const inLocal = !!localPuzzles[ds];
    
    if (!inJson && !inLocal) {
      missingDate = checkDate;
      missingDateStr = ds;
      break;
    }
    checkDate = addDays(checkDate, 1);
  }

  if (missingDate) {
    console.log("Background fetching future puzzle for:", missingDateStr);
    const fetched = await fetchArchiveForDate(missingDate);
    if (fetched) {
      localPuzzles[missingDateStr] = fetched;
      saveLocalPuzzles(localPuzzles);
      // Mark background fetch as done for today only if successful
      localStorage.setItem('chrono_last_bg_fetch', todayStr);
      console.log("Background fetch saved successfully!");
    }
  }
}
