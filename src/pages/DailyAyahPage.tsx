import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchAyah, getAyahByMood, getMoodAyahExplanation, type AyahData } from '@/lib/quran-api';
import { logActivity } from '@/lib/streak-utils';
import AppLayout from '@/components/AppLayout';
import AyahDisplay from '@/components/AyahDisplay';
import TafsirViewer from '@/components/TafsirViewer';
import { PageSkeleton } from '@/components/UIStates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, PenLine, MessageCircle, Bookmark, Search } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function DailyAyahPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [ayah, setAyah] = useState<AyahData | null>(null);
  const [explanation, setExplanation] = useState<{ whyItMatters: string; applyToday: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [searchRef, setSearchRef] = useState('');

  useEffect(() => { loadAyah(); }, [user]);

  const loadAyah = async () => {
    if (!user) return;
    setLoading(true);
    
    const today = new Date().toISOString().split('T')[0];
    const [ayahData, moodRes, actRes] = await Promise.all([
      fetchAyah(),
      supabase.from('moods').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('activities').select('id').eq('user_id', user.id).eq('action_type', 'ayah_completed').eq('date', today),
    ]);

    const mood = moodRes.data?.mood || 'calm';
    
    if (moodRes.data?.mood) {
      const moodAyah = await fetchAyah(getAyahByMood(moodRes.data.mood));
      if (moodAyah) { setAyah(moodAyah); setExplanation(getMoodAyahExplanation(mood)); }
      else if (ayahData) { setAyah(ayahData); setExplanation(getMoodAyahExplanation(mood)); }
    } else if (ayahData) {
      setAyah(ayahData);
      setExplanation(getMoodAyahExplanation(mood));
    }

    setCompleted((actRes.data?.length || 0) > 0);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!user || !ayah) return;
    await logActivity(user.id, 'ayah_completed', ayah.verseKey);
    await refreshProfile();
    setCompleted(true);
    toast.success('Ayah completed. You showed up today — that matters.');
  };

  const handleBookmark = async () => {
    if (!user || !ayah) return;
    const { error } = await supabase.from('bookmarks').insert([{
      user_id: user.id, type: 'ayah', reference: ayah.verseKey,
      content: { arabicText: ayah.arabicText, translationText: ayah.translationText, surahName: ayah.surahName } as unknown as import('@/integrations/supabase/types').Json,
    }]);
    if (error?.code === '23505') { toast.info('Already bookmarked.'); return; }
    toast.success('Bookmarked.');
  };

  const handleSearch = async () => {
    if (!searchRef.match(/^\d+:\d+$/)) { toast.error('Use format: surah:verse (e.g. 2:255)'); return; }
    setLoading(true);
    const data = await fetchAyah(searchRef);
    if (data) { setAyah(data); setExplanation(getMoodAyahExplanation('calm')); }
    else toast.error('Verse not found.');
    setLoading(false);
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Daily Ayah Journey</h1>
          <p className="text-muted-foreground mt-1">Your guided spiritual experience for today</p>
        </div>

        {/* Search by reference */}
        <div className="flex gap-2">
          <Input placeholder="Search verse (e.g. 2:255)" value={searchRef} onChange={e => setSearchRef(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} className="rounded-xl max-w-xs" />
          <Button variant="outline" className="rounded-xl" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
        </div>

        {ayah && (
          <>
            <AyahDisplay ayah={ayah} whyItMatters={explanation?.whyItMatters} applyToday={explanation?.applyToday} />

            {/* Reflection prompt */}
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-heading text-lg font-semibold mb-2">Reflection Prompt</h3>
              <p className="text-sm text-muted-foreground italic">
                "How does this verse connect to something happening in your life right now?"
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleComplete} disabled={completed} className="rounded-xl" variant={completed ? 'outline' : 'default'}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> {completed ? 'Completed' : 'Mark Complete'}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/reflections?ayah=${ayah.verseKey}`)}>
                <PenLine className="h-4 w-4 mr-1.5" /> Save Reflection
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate('/ai-assistant')}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> Ask Companion
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleBookmark}>
                <Bookmark className="h-4 w-4 mr-1.5" /> Bookmark
              </Button>
            </div>
          </>
        )}
      </motion.div>
    </AppLayout>
  );
}
