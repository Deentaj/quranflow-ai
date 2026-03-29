import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchAyah, getAyahByMood, getMoodAyahExplanation, type AyahData } from '@/lib/quran-api';
import { logActivity, getStreakStatus, type StreakResult } from '@/lib/streak-utils';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import MoodCheckin from '@/components/MoodCheckin';
import AyahDisplay from '@/components/AyahDisplay';
import StreakRecovery from '@/components/StreakRecovery';
import { PageSkeleton } from '@/components/UIStates';
import { Button } from '@/components/ui/button';
import { Flame, BookOpen, PenLine, Target, CheckCircle2, MessageCircle, Bookmark, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [ayah, setAyah] = useState<AyahData | null>(null);
  const [explanation, setExplanation] = useState<{ whyItMatters: string; applyToday: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ reflections: 0, goals: 0, todayCompleted: false });
  const [currentMood, setCurrentMood] = useState<string | null>(null);
  const [streakInfo, setStreakInfo] = useState<StreakResult | null>(null);
  const [showRecovery, setShowRecovery] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    if (!user) return;
    setLoading(true);
    
    const today = new Date().toISOString().split('T')[0];
    const [ayahData, reflectionsRes, goalsRes, todayActivityRes, moodRes, streakResult] = await Promise.all([
      fetchAyah(),
      supabase.from('reflections').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', user.id).eq('completed', false),
      supabase.from('activities').select('id').eq('user_id', user.id).eq('action_type', 'ayah_completed').eq('date', today),
      supabase.from('moods').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle(),
      getStreakStatus(user.id),
    ]);

    setStreakInfo(streakResult);
    setShowRecovery(streakResult.missedDays > 0);

    if (ayahData) {
      setAyah(ayahData);
      const mood = moodRes.data?.mood || 'calm';
      setCurrentMood(mood);
      setExplanation(getMoodAyahExplanation(mood));
    }

    setStats({
      reflections: reflectionsRes.count || 0,
      goals: goalsRes.count || 0,
      todayCompleted: (todayActivityRes.data?.length || 0) > 0,
    });
    setLoading(false);
  };

  const handleMarkComplete = async () => {
    if (!user || !ayah) return;
    await logActivity(user.id, 'ayah_completed', ayah.verseKey);
    await refreshProfile();
    setStats(prev => ({ ...prev, todayCompleted: true }));
    toast.success('Ayah completed! Consistency grows quietly.');
  };

  const handleBookmark = async () => {
    if (!user || !ayah) return;
    const { error } = await supabase.from('bookmarks').insert([{
      user_id: user.id,
      type: 'ayah',
      reference: ayah.verseKey,
      content: { arabicText: ayah.arabicText, translationText: ayah.translationText, surahName: ayah.surahName } as unknown as import('@/integrations/supabase/types').Json,
    }]);
    if (error?.code === '23505') { toast.info('Already bookmarked.'); return; }
    if (error) { toast.error('Failed to bookmark.'); return; }
    toast.success('Ayah bookmarked.');
  };

  const handleMoodChange = async (mood: string) => {
    setCurrentMood(mood);
    const verseKey = getAyahByMood(mood);
    const newAyah = await fetchAyah(verseKey);
    if (newAyah) {
      setAyah(newAyah);
      setExplanation(getMoodAyahExplanation(mood));
    }
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        {/* Greeting */}
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">
            {greeting()}, {profile?.full_name?.split(' ')[0] || 'friend'}
          </h1>
          <p className="text-muted-foreground mt-1">Your daily journey with the Qur'an</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Current Streak" value={`${profile?.current_streak || 0} days`} icon={<Flame className="h-4 w-4" />} />
          <StatCard label="Longest Streak" value={`${profile?.longest_streak || 0} days`} icon={<Flame className="h-4 w-4" />} />
          <StatCard label="Reflections" value={stats.reflections} icon={<PenLine className="h-4 w-4" />} />
          <StatCard label="Active Goals" value={stats.goals} icon={<Target className="h-4 w-4" />} />
        </div>

        {/* Streak Recovery Banner */}
        {streakInfo && streakInfo.missedDays > 0 && showRecovery && (
          <StreakRecovery
            missedDays={streakInfo.missedDays}
            previousStreak={streakInfo.previousStreak}
            onDismiss={() => setShowRecovery(false)}
          />
        )}

        {/* Quick actions */}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/reconnect')}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> 5-Min Reconnect
          </Button>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={() => navigate('/reflections')}>
            <PenLine className="h-4 w-4 mr-1.5" /> Write Reflection
          </Button>
        </div>

        {/* Mood check-in */}
        <MoodCheckin onMoodSelected={handleMoodChange} compact />

        {/* Main Ayah Card */}
        {ayah && (
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-3">The Verse That Found You Today</h2>
            <AyahDisplay ayah={ayah} whyItMatters={explanation?.whyItMatters} applyToday={explanation?.applyToday} />
            
            <div className="flex flex-wrap gap-2 mt-4">
              <Button
                onClick={handleMarkComplete}
                disabled={stats.todayCompleted}
                className="rounded-xl"
                variant={stats.todayCompleted ? 'outline' : 'default'}
              >
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                {stats.todayCompleted ? 'Completed' : 'Mark Complete'}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate('/reflections')}>
                <PenLine className="h-4 w-4 mr-1.5" /> Reflect
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate('/ai-assistant')}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> Ask AI
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleBookmark}>
                <Bookmark className="h-4 w-4 mr-1.5" /> Bookmark
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
