import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Search } from 'lucide-react';

const SURAH_DATA: { name: string; verses: number }[] = [
  { name: "Al-Fatihah", verses: 7 }, { name: "Al-Baqarah", verses: 286 }, { name: "Ali 'Imran", verses: 200 },
  { name: "An-Nisa", verses: 176 }, { name: "Al-Ma'idah", verses: 120 }, { name: "Al-An'am", verses: 165 },
  { name: "Al-A'raf", verses: 206 }, { name: "Al-Anfal", verses: 75 }, { name: "At-Tawbah", verses: 129 },
  { name: "Yunus", verses: 109 }, { name: "Hud", verses: 123 }, { name: "Yusuf", verses: 111 },
  { name: "Ar-Ra'd", verses: 43 }, { name: "Ibrahim", verses: 52 }, { name: "Al-Hijr", verses: 99 },
  { name: "An-Nahl", verses: 128 }, { name: "Al-Isra", verses: 111 }, { name: "Al-Kahf", verses: 110 },
  { name: "Maryam", verses: 98 }, { name: "Ta-Ha", verses: 135 }, { name: "Al-Anbiya", verses: 112 },
  { name: "Al-Hajj", verses: 78 }, { name: "Al-Mu'minun", verses: 118 }, { name: "An-Nur", verses: 64 },
  { name: "Al-Furqan", verses: 77 }, { name: "Ash-Shu'ara", verses: 227 }, { name: "An-Naml", verses: 93 },
  { name: "Al-Qasas", verses: 88 }, { name: "Al-Ankabut", verses: 69 }, { name: "Ar-Rum", verses: 60 },
  { name: "Luqman", verses: 34 }, { name: "As-Sajdah", verses: 30 }, { name: "Al-Ahzab", verses: 73 },
  { name: "Saba", verses: 54 }, { name: "Fatir", verses: 45 }, { name: "Ya-Sin", verses: 83 },
  { name: "As-Saffat", verses: 182 }, { name: "Sad", verses: 88 }, { name: "Az-Zumar", verses: 75 },
  { name: "Ghafir", verses: 85 }, { name: "Fussilat", verses: 54 }, { name: "Ash-Shura", verses: 53 },
  { name: "Az-Zukhruf", verses: 89 }, { name: "Ad-Dukhan", verses: 59 }, { name: "Al-Jathiyah", verses: 37 },
  { name: "Al-Ahqaf", verses: 35 }, { name: "Muhammad", verses: 38 }, { name: "Al-Fath", verses: 29 },
  { name: "Al-Hujurat", verses: 18 }, { name: "Qaf", verses: 45 }, { name: "Adh-Dhariyat", verses: 60 },
  { name: "At-Tur", verses: 49 }, { name: "An-Najm", verses: 62 }, { name: "Al-Qamar", verses: 55 },
  { name: "Ar-Rahman", verses: 78 }, { name: "Al-Waqi'ah", verses: 96 }, { name: "Al-Hadid", verses: 29 },
  { name: "Al-Mujadila", verses: 22 }, { name: "Al-Hashr", verses: 24 }, { name: "Al-Mumtahanah", verses: 13 },
  { name: "As-Saf", verses: 14 }, { name: "Al-Jumu'ah", verses: 11 }, { name: "Al-Munafiqun", verses: 11 },
  { name: "At-Taghabun", verses: 18 }, { name: "At-Talaq", verses: 12 }, { name: "At-Tahrim", verses: 12 },
  { name: "Al-Mulk", verses: 30 }, { name: "Al-Qalam", verses: 52 }, { name: "Al-Haqqah", verses: 52 },
  { name: "Al-Ma'arij", verses: 44 }, { name: "Nuh", verses: 28 }, { name: "Al-Jinn", verses: 28 },
  { name: "Al-Muzzammil", verses: 20 }, { name: "Al-Muddaththir", verses: 56 }, { name: "Al-Qiyamah", verses: 40 },
  { name: "Al-Insan", verses: 31 }, { name: "Al-Mursalat", verses: 50 }, { name: "An-Naba", verses: 40 },
  { name: "An-Nazi'at", verses: 46 }, { name: "Abasa", verses: 42 }, { name: "At-Takwir", verses: 29 },
  { name: "Al-Infitar", verses: 19 }, { name: "Al-Mutaffifin", verses: 36 }, { name: "Al-Inshiqaq", verses: 25 },
  { name: "Al-Buruj", verses: 22 }, { name: "At-Tariq", verses: 17 }, { name: "Al-A'la", verses: 19 },
  { name: "Al-Ghashiyah", verses: 26 }, { name: "Al-Fajr", verses: 30 }, { name: "Al-Balad", verses: 20 },
  { name: "Ash-Shams", verses: 15 }, { name: "Al-Layl", verses: 21 }, { name: "Ad-Duha", verses: 11 },
  { name: "Ash-Sharh", verses: 8 }, { name: "At-Tin", verses: 8 }, { name: "Al-Alaq", verses: 19 },
  { name: "Al-Qadr", verses: 5 }, { name: "Al-Bayyinah", verses: 8 }, { name: "Az-Zalzalah", verses: 8 },
  { name: "Al-Adiyat", verses: 11 }, { name: "Al-Qari'ah", verses: 11 }, { name: "At-Takathur", verses: 8 },
  { name: "Al-Asr", verses: 3 }, { name: "Al-Humazah", verses: 9 }, { name: "Al-Fil", verses: 5 },
  { name: "Quraysh", verses: 4 }, { name: "Al-Ma'un", verses: 7 }, { name: "Al-Kawthar", verses: 3 },
  { name: "Al-Kafirun", verses: 6 }, { name: "An-Nasr", verses: 3 }, { name: "Al-Masad", verses: 5 },
  { name: "Al-Ikhlas", verses: 4 }, { name: "Al-Falaq", verses: 5 }, { name: "An-Nas", verses: 6 },
];

interface ReadingEntry {
  id: string;
  surah_number: number;
  last_verse_read: number;
  total_verses: number;
  completed: boolean;
}

export default function ReadingTrackerPage() {
  const { user } = useAuth();
  const [progress, setProgress] = useState<ReadingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'in-progress' | 'completed' | 'not-started'>('all');

  useEffect(() => { if (user) loadProgress(); }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reading_progress')
      .select('*')
      .eq('user_id', user.id);
    setProgress((data || []) as ReadingEntry[]);
    setLoading(false);
  };

  const updateProgress = async (surahNum: number, versesRead: number) => {
    if (!user) return;
    const surah = SURAH_DATA[surahNum - 1];
    const clamped = Math.min(versesRead, surah.verses);
    const completed = clamped >= surah.verses;
    const existing = progress.find(p => p.surah_number === surahNum);

    if (existing) {
      await supabase.from('reading_progress').update({
        last_verse_read: clamped, completed, updated_at: new Date().toISOString(),
      }).eq('id', existing.id);
    } else {
      await supabase.from('reading_progress').insert({
        user_id: user.id, surah_number: surahNum,
        last_verse_read: clamped, total_verses: surah.verses, completed,
      });
    }
    await loadProgress();
    if (completed) toast.success(`Completed Surah ${surah.name}! 🎉`);
  };

  const getEntry = (surahNum: number) => progress.find(p => p.surah_number === surahNum);

  const totalVersesRead = progress.reduce((s, p) => s + p.last_verse_read, 0);
  const totalVerses = 6236;
  const completedSurahs = progress.filter(p => p.completed).length;

  const filtered = SURAH_DATA.map((s, i) => ({ ...s, num: i + 1 })).filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || String(s.num).includes(search);
    const entry = getEntry(s.num);
    if (filter === 'completed') return matchSearch && entry?.completed;
    if (filter === 'in-progress') return matchSearch && entry && !entry.completed && entry.last_verse_read > 0;
    if (filter === 'not-started') return matchSearch && (!entry || entry.last_verse_read === 0);
    return matchSearch;
  });

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Quran Reading Tracker</h1>
          <p className="text-muted-foreground mt-1">Track your journey through the Holy Quran</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-primary">{completedSurahs}</p>
            <p className="text-xs text-muted-foreground">Surahs Done</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-accent">{totalVersesRead}</p>
            <p className="text-xs text-muted-foreground">Verses Read</p>
          </div>
          <div className="glass-card rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{Math.round((totalVersesRead / totalVerses) * 100)}%</p>
            <p className="text-xs text-muted-foreground">Overall</p>
          </div>
        </div>

        {/* Overall progress */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Overall Quran Progress</span>
            <span className="font-medium text-foreground">{totalVersesRead}/{totalVerses}</span>
          </div>
          <Progress value={(totalVersesRead / totalVerses) * 100} className="h-3" />
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search surah..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-xl"
            />
          </div>
          {(['all', 'in-progress', 'completed', 'not-started'] as const).map(f => (
            <Button
              key={f}
              variant={filter === f ? 'default' : 'outline'}
              size="sm"
              className="rounded-xl capitalize"
              onClick={() => setFilter(f)}
            >
              {f.replace('-', ' ')}
            </Button>
          ))}
        </div>

        {/* Surah Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map(i => <div key={i} className="glass-card rounded-2xl p-4 h-20 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(surah => {
              const entry = getEntry(surah.num);
              const pct = entry ? (entry.last_verse_read / surah.verses) * 100 : 0;

              return (
                <div
                  key={surah.num}
                  className={`glass-card rounded-2xl p-4 transition-all ${entry?.completed ? 'border-primary/30 bg-primary/5' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-muted-foreground w-7">{surah.num}</span>
                      <span className="font-medium text-foreground text-sm">{surah.name}</span>
                      {entry?.completed && <CheckCircle2 className="h-4 w-4 text-primary" />}
                    </div>
                    <span className="text-xs text-muted-foreground">{surah.verses} verses</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={pct} className="flex-1 h-1.5" />
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        min={0}
                        max={surah.verses}
                        value={entry?.last_verse_read || 0}
                        onChange={e => updateProgress(surah.num, parseInt(e.target.value) || 0)}
                        className="w-16 h-7 text-xs rounded-lg text-center"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
