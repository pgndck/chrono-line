import { format, subYears } from 'date-fns';

const CORS_PROXY = 'https://api.allorigins.win/raw?url=';
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

export async function getDailyPuzzleDef(): Promise<DailyPuzzleDef> {
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  const seed = parseInt(format(today, 'yyyyMMdd'), 10);
  const rng = mulberry32(seed);

  // We use 5 to 25 years ago. This ensures we hit the 2000s+ where OCR is highly accurate,
  // avoiding the "JUCLGE" typos from the 1970s.
  const yearsAgoOptions = [5, 10, 15, 20, 25];
  
  // Pick a deterministic year for today
  const yearsAgo = yearsAgoOptions[Math.floor(rng() * yearsAgoOptions.length)];
  const targetDate = subYears(today, yearsAgo);
  
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
      .filter(item => 
        item.url.includes(`/${year}/${month}/${day}/`) && 
        item.headline.length > 30 && 
        item.headline.length < 90 &&
        /^[a-zA-Z0-9\s.,!?'"-]+$/.test(item.headline) // Basic clean text filter
      );

    // Sort alphabetically to ensure deterministic order regardless of HTML structure changes
    headlines.sort((a, b) => a.headline.localeCompare(b.headline));

    if (headlines.length > 0) {
      // Pick deterministic headline
      const selected = headlines[Math.floor(rng() * headlines.length)];
      return {
        date: todayStr,
        headline: selected.headline.toUpperCase(),
        url: selected.url.startsWith('http') ? selected.url : `https://www.nytimes.com${selected.url}`,
        sourceDate: format(targetDate, 'yyyy-MM-dd')
      };
    }
  } catch (error) {
    console.error('Failed to fetch from NYT:', error);
  }

  // Fallback if offline or proxy fails
  return {
    date: todayStr,
    headline: "ARCHIVE CONNECTION FAILED BUT YOU CAN STILL PLAY THIS BACKUP PUZZLE",
    url: "https://www.nytimes.com",
    sourceDate: "2000-01-01"
  };
}
