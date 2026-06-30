import { supabase } from '@/integrations/supabase/client';

async function qfFetch(path: string, query?: Record<string, string>): Promise<any> {
  const { data, error } = await supabase.functions.invoke('quran-api', {
    body: { path, query },
  });
  if (error) throw error;
  return data;
}

export interface AyahData {
  verseKey: string;
  surahName: string;
  surahNameArabic: string;
  verseNumber: number;
  surahNumber: number;
  arabicText: string;
  translationText: string;
  audioUrl: string | null;
}

const MOOD_AYAHS: Record<string, string[]> = {
  stressed: ['94:5', '2:286', '65:2', '39:53', '3:139'],
  calm: ['13:28', '89:27', '2:152', '16:97', '10:62'],
  tired: ['94:6', '2:45', '73:20', '3:200', '52:48'],
  hopeful: ['12:87', '39:53', '93:5', '15:56', '2:216'],
  grateful: ['14:7', '16:18', '31:12', '55:13', '27:40'],
  unmotivated: ['94:5', '3:139', '12:87', '29:69', '2:153'],
};

function getDailyVerseKey(): string {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000
  );
  const totalVerses = 6236;
  const verseIndex = (dayOfYear % totalVerses) + 1;
  
  const surahVerses = [7,286,200,176,120,165,206,75,129,109,123,111,43,52,99,128,111,110,98,135,112,78,118,64,77,227,93,88,69,60,34,30,73,54,45,83,182,88,75,85,54,53,89,59,37,35,38,29,18,45,60,49,62,55,78,96,29,22,24,13,14,11,11,18,12,12,30,52,52,44,28,28,20,56,40,31,50,40,46,42,29,19,36,25,22,17,19,26,30,20,15,21,11,8,8,19,5,8,8,11,11,8,3,9,5,4,7,3,6,3,5,4,5,6];
  
  let remaining = verseIndex;
  let surah = 1;
  for (let i = 0; i < surahVerses.length; i++) {
    if (remaining <= surahVerses[i]) {
      surah = i + 1;
      break;
    }
    remaining -= surahVerses[i];
  }
  
  return `${surah}:${remaining}`;
}

export async function fetchAyah(verseKey?: string): Promise<AyahData | null> {
  try {
    const key = verseKey || getDailyVerseKey();
    const [surah, verse] = key.split(':').map(Number);

    const [arabicData, translationData, surahData] = await Promise.all([
      qfFetch('/quran/verses/uthmani', { verse_key: key }),
      qfFetch('/quran/translations/20', { verse_key: key }),
      qfFetch(`/chapters/${surah}`, { language: 'en' }),
    ]);

    const arabicText = arabicData.verses?.[0]?.text_uthmani || '';
    const translationText = translationData.translations?.[0]?.text?.replace(/<[^>]*>/g, '') || '';

    let audioUrl: string | null = null;
    try {
      const recitationData = await qfFetch(`/recitations/7/by_ayah/${key}`);
      if (recitationData.audio_files?.[0]?.url) {
        audioUrl = `https://verses.quran.com/${recitationData.audio_files[0].url}`;
      }
    } catch {}

    return {
      verseKey: key,
      surahName: surahData.chapter?.name_simple || `Surah ${surah}`,
      surahNameArabic: surahData.chapter?.name_arabic || '',
      verseNumber: verse,
      surahNumber: surah,
      arabicText,
      translationText,
      audioUrl,
    };
  } catch (error) {
    console.error('Error fetching ayah:', error);
    return null;
  }
}

export async function fetchTafsir(verseKey: string): Promise<string | null> {
  try {
    const data = await qfFetch('/quran/tafsirs/169', { verse_key: verseKey });
    const text = data.tafsirs?.[0]?.text || '';
    return text.replace(/<[^>]*>/g, '') || null;
  } catch (error) {
    console.error('Error fetching tafsir:', error);
    return null;
  }
}

export function getAyahByMood(mood: string): string {
  const ayahs = MOOD_AYAHS[mood] || MOOD_AYAHS.calm;
  return ayahs[Math.floor(Math.random() * ayahs.length)];
}

export function getMoodAyahExplanation(mood: string): { whyItMatters: string; applyToday: string } {
  const explanations: Record<string, { whyItMatters: string; applyToday: string }> = {
    stressed: {
      whyItMatters: 'Allah reminds us that with every hardship comes ease. Your struggle is temporary, and relief is closer than you think.',
      applyToday: 'Take three deep breaths and remind yourself: this difficulty will pass. Trust in Allah\'s plan for you.',
    },
    calm: {
      whyItMatters: 'Inner peace comes from remembering Allah. This state of calm is a blessing — nurture it through gratitude.',
      applyToday: 'Use this peaceful moment to make a quiet du\'a and express thanks for the serenity you feel.',
    },
    tired: {
      whyItMatters: 'Rest is part of worship. Even in your tiredness, showing up is an act of devotion.',
      applyToday: 'Be gentle with yourself today. Even reading one ayah counts as a meaningful step.',
    },
    hopeful: {
      whyItMatters: 'Hope is a sign of strong faith. Allah loves those who maintain hope in His mercy.',
      applyToday: 'Channel your hope into a small act of kindness today — it multiplies your blessings.',
    },
    grateful: {
      whyItMatters: 'Gratitude multiplies blessings. When you thank Allah, He promises to give you more.',
      applyToday: 'Write down three things you\'re grateful for and share your gratitude with someone you love.',
    },
    unmotivated: {
      whyItMatters: 'Feeling low doesn\'t mean you\'ve failed. Even the prophets had moments of difficulty. Your presence here is already a victory.',
      applyToday: 'Start with just one verse today. Small steps build lasting habits. You don\'t need to be perfect — just present.',
    },
  };
  return explanations[mood] || explanations.calm;
}
