import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import StatCard from '@/components/StatCard';
import { PageSkeleton } from '@/components/UIStates';
import { Flame, BookOpen, PenLine, Target, Calendar, BarChart3 } from 'lucide-react';
import { motion } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface WeekData { day: string; activities: number; }

export default function ProgressPage() {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalDays: 0, reflections: 0, ayahsCompleted: 0, goalsCompleted: 0 });
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [moodTrend, setMoodTrend] = useState<{ mood: string; count: number }[]>([]);

  useEffect(() => { loadProgress(); }, [user]);

  const loadProgress = async () => {
    if (!user) return;
    
    const [activitiesRes, reflectionsRes, goalsRes, moodsRes] = await Promise.all([
      supabase.from('activities').select('date, action_type').eq('user_id', user.id),
      supabase.from('reflections').select('id', { count: 'exact' }).eq('user_id', user.id),
      supabase.from('goals').select('id', { count: 'exact' }).eq('user_id', user.id).eq('completed', true),
      supabase.from('moods').select('mood').eq('user_id', user.id).order('created_at', { ascending: false }).limit(30),
    ]);

    const activities = activitiesRes.data || [];
    const uniqueDays = new Set(activities.map(a => a.date));
    const ayahsCompleted = activities.filter(a => a.action_type === 'ayah_completed').length;

    // Weekly chart
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const weekChart: WeekData[] = days.map(day => ({ day, activities: 0 }));
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    
    activities.forEach(a => {
      const d = new Date(a.date);
      if (d >= weekStart) weekChart[d.getDay()].activities++;
    });

    // Mood trend
    const moodCounts: Record<string, number> = {};
    (moodsRes.data || []).forEach(m => { moodCounts[m.mood] = (moodCounts[m.mood] || 0) + 1; });
    const trend = Object.entries(moodCounts).map(([mood, count]) => ({ mood, count })).sort((a, b) => b.count - a.count);

    setStats({ totalDays: uniqueDays.size, reflections: reflectionsRes.count || 0, ayahsCompleted, goalsCompleted: goalsRes.count || 0 });
    setWeekData(weekChart);
    setMoodTrend(trend);
    setLoading(false);
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const weeklyActive = weekData.filter(d => d.activities > 0).length;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Your Journey</h1>
          <p className="text-muted-foreground mt-1">Track your spiritual growth over time</p>
        </div>

        {/* Summary card */}
        <div className="glass-card rounded-3xl p-6 bg-primary/5">
          <h2 className="font-heading text-xl font-semibold text-foreground mb-2">Your Journey This Week</h2>
          <p className="text-muted-foreground">
            You showed up {weeklyActive} day{weeklyActive !== 1 ? 's' : ''} this week
            {stats.reflections > 0 ? ` and reflected on ${stats.reflections} ayah${stats.reflections !== 1 ? 's' : ''}` : ''}.
            {weeklyActive >= 5 ? ' Incredible consistency!' : weeklyActive >= 3 ? ' Keep going — you\'re building a beautiful habit.' : ' Every step counts. You\'re still on the journey.'}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard label="Total Active Days" value={stats.totalDays} icon={<Calendar className="h-4 w-4" />} />
          <StatCard label="Current Streak" value={`${profile?.current_streak || 0} days`} icon={<Flame className="h-4 w-4" />} />
          <StatCard label="Ayahs Completed" value={stats.ayahsCompleted} icon={<BookOpen className="h-4 w-4" />} />
          <StatCard label="Goals Completed" value={stats.goalsCompleted} icon={<Target className="h-4 w-4" />} />
        </div>

        {/* Weekly chart */}
        <div className="glass-card rounded-3xl p-6">
          <h3 className="font-heading text-lg font-semibold mb-4">Weekly Activity</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weekData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="activities" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Mood trend */}
        {moodTrend.length > 0 && (
          <div className="glass-card rounded-3xl p-6">
            <h3 className="font-heading text-lg font-semibold mb-4">Mood Trends (Last 30 days)</h3>
            <div className="flex flex-wrap gap-3">
              {moodTrend.map(({ mood, count }) => (
                <div key={mood} className="bg-muted rounded-xl px-4 py-2 text-sm">
                  <span className="capitalize font-medium text-foreground">{mood}</span>
                  <span className="text-muted-foreground ml-2">×{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
