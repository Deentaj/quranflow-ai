import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Flame, Trophy, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

interface Challenge {
  id: string;
  challenge_type: string;
  title: string;
  description: string;
  target_value: number;
  current_value: number;
  completed: boolean;
  xp_reward: number;
}

const FALLBACK_TEMPLATES = [
  { challenge_type: 'read_ayah', title: 'Read 3 Ayahs', description: 'Read and reflect on 3 different ayahs today', target_value: 3, xp_reward: 15 },
  { challenge_type: 'reflect', title: 'Write a Reflection', description: 'Write a heartfelt reflection on an ayah', target_value: 1, xp_reward: 20 },
  { challenge_type: 'bookmark', title: 'Bookmark 2 Verses', description: 'Save 2 verses that speak to you', target_value: 2, xp_reward: 10 },
];

export default function ChallengesPage() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalXp, setTotalXp] = useState(0);

  useEffect(() => { if (user) loadChallenges(); }, [user]);

  const loadChallenges = async () => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];

    // 1. Get today's already-assigned challenges for this user
    const { data: existing } = await supabase
      .from('daily_challenges')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today);

    // 2. Pull active global challenges curated by admins
    const { data: globals } = await supabase
      .from('global_challenges')
      .select('challenge_type, title, description, target_value, xp_reward')
      .eq('active', true);

    const sourceList = (globals && globals.length > 0) ? globals : FALLBACK_TEMPLATES;

    // 3. Determine which global challenges aren't yet assigned today (dedupe by title)
    const existingTitles = new Set((existing ?? []).map(c => c.title));
    const toInsert = sourceList
      .filter(g => !existingTitles.has(g.title))
      .map(g => ({
        user_id: user.id,
        date: today,
        challenge_type: g.challenge_type,
        title: g.title,
        description: g.description,
        target_value: g.target_value,
        xp_reward: g.xp_reward,
        current_value: 0,
        completed: false,
      }));

    let allToday = (existing as Challenge[]) ?? [];
    if (toInsert.length > 0) {
      const { data: inserted } = await supabase
        .from('daily_challenges')
        .insert(toInsert)
        .select();
      if (inserted) allToday = [...allToday, ...(inserted as Challenge[])];
    }

    setChallenges(allToday);

    // Total XP from all completed challenges
    const { data: allCompleted } = await supabase
      .from('daily_challenges')
      .select('xp_reward')
      .eq('user_id', user.id)
      .eq('completed', true);

    setTotalXp(allCompleted?.reduce((sum, c) => sum + c.xp_reward, 0) || 0);
    setLoading(false);
  };

  const incrementChallenge = async (challenge: Challenge) => {
    if (challenge.completed) return;
    const newValue = Math.min(challenge.current_value + 1, challenge.target_value);
    const completed = newValue >= challenge.target_value;

    await supabase.from('daily_challenges').update({
      current_value: newValue,
      completed,
    }).eq('id', challenge.id);

    setChallenges(prev => prev.map(c =>
      c.id === challenge.id ? { ...c, current_value: newValue, completed } : c
    ));

    if (completed) {
      setTotalXp(prev => prev + challenge.xp_reward);
      toast.success(`🎉 Challenge complete! +${challenge.xp_reward} XP`);
    }
  };

  const completedCount = challenges.filter(c => c.completed).length;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-2xl">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Daily Challenges</h1>
          <p className="text-muted-foreground mt-1">Complete spiritual challenges to earn XP</p>
        </div>

        {/* XP Banner */}
        <div className="glass-card rounded-3xl p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-accent" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{totalXp} XP</p>
              <p className="text-xs text-muted-foreground">Total earned</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-foreground">{completedCount}/{challenges.length}</p>
            <p className="text-xs text-muted-foreground">Today's progress</p>
          </div>
        </div>

        {/* Challenges */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass-card rounded-2xl p-5 animate-pulse h-28" />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {challenges.map((challenge, i) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`glass-card rounded-2xl p-5 transition-all ${challenge.completed ? 'border-primary/30 bg-primary/5' : ''}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {challenge.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      ) : (
                        <Zap className="h-5 w-5 text-accent" />
                      )}
                      <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                      <span className="text-xs bg-accent/20 text-accent px-2 py-0.5 rounded-full">
                        +{challenge.xp_reward} XP
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{challenge.description}</p>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={(challenge.current_value / challenge.target_value) * 100}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {challenge.current_value}/{challenge.target_value}
                      </span>
                    </div>
                  </div>
                  {!challenge.completed && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-xl shrink-0"
                      onClick={() => incrementChallenge(challenge)}
                    >
                      +1
                    </Button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {completedCount === challenges.length && challenges.length > 0 && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card rounded-3xl p-6 text-center border-primary/30"
          >
            <Flame className="h-10 w-10 text-accent mx-auto mb-2" />
            <h3 className="font-heading text-xl font-bold text-foreground">All Challenges Complete!</h3>
            <p className="text-sm text-muted-foreground mt-1">MashaAllah! You've completed all of today's challenges.</p>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
