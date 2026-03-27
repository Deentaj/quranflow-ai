import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchAyah, getAyahByMood, getMoodAyahExplanation, type AyahData } from '@/lib/quran-api';
import { logActivity } from '@/lib/streak-utils';
import AppLayout from '@/components/AppLayout';
import AyahDisplay from '@/components/AyahDisplay';
import { PageSkeleton, EmptyState } from '@/components/UIStates';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RefreshCw, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

export default function ReconnectPage() {
  const { user, refreshProfile } = useAuth();
  const [step, setStep] = useState(0);
  const [ayah, setAyah] = useState<AyahData | null>(null);
  const [explanation, setExplanation] = useState<{ whyItMatters: string; applyToday: string } | null>(null);
  const [reflection, setReflection] = useState('');
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [history, setHistory] = useState<{ id: string; date: string; completed: boolean }[]>([]);

  useEffect(() => { loadReconnect(); }, [user]);

  const loadReconnect = async () => {
    if (!user) return;
    
    const [moodRes, histRes] = await Promise.all([
      supabase.from('moods').select('mood').eq('user_id', user.id).order('created_at', { ascending: false }).limit(1).maybeSingle(),
      supabase.from('reconnect_sessions').select('id, date, completed').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
    ]);

    const mood = moodRes.data?.mood || 'calm';
    const verseKey = getAyahByMood(mood);
    const ayahData = await fetchAyah(verseKey);
    if (ayahData) {
      setAyah(ayahData);
      setExplanation(getMoodAyahExplanation(mood));
    }
    setHistory((histRes.data || []) as { id: string; date: string; completed: boolean }[]);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!user || !ayah) return;
    
    await supabase.from('reconnect_sessions').insert([{
      user_id: user.id,
      ayah_reference: ayah.verseKey,
      content: { reflection, ayahText: ayah.translationText } as unknown as import('@/integrations/supabase/types').Json,
      completed: true,
    }]);

    if (reflection.trim()) {
      await supabase.from('reflections').insert([{
        user_id: user.id,
        ayah_reference: ayah.verseKey,
        reflection_text: reflection,
      }]);
    }

    await logActivity(user.id, 'reconnect_completed', ayah.verseKey);
    await refreshProfile();
    setCompleted(true);
    toast.success('Beautiful. You reconnected today.');
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const steps = [
    {
      title: 'Read this verse',
      content: ayah && <AyahDisplay ayah={ayah} />,
    },
    {
      title: 'Understand the meaning',
      content: ayah && explanation && (
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Simple meaning</h4>
            <p className="text-sm text-muted-foreground">{ayah.translationText}</p>
          </div>
          <div>
            <h4 className="text-sm font-semibold text-primary mb-1">Why this matters</h4>
            <p className="text-sm text-muted-foreground">{explanation.whyItMatters}</p>
          </div>
        </div>
      ),
    },
    {
      title: 'A reminder for you',
      content: explanation && (
        <div className="glass-card rounded-3xl p-6">
          <h4 className="text-sm font-semibold text-accent-foreground mb-1">✨ Apply this today</h4>
          <p className="text-sm text-muted-foreground">{explanation.applyToday}</p>
        </div>
      ),
    },
    {
      title: 'Reflect briefly',
      content: (
        <div className="glass-card rounded-3xl p-6">
          <p className="text-sm text-muted-foreground mb-3">What's one thought this verse brings to mind?</p>
          <Textarea value={reflection} onChange={e => setReflection(e.target.value)} placeholder="Even a single sentence counts..." className="rounded-xl min-h-[100px]" />
        </div>
      ),
    },
  ];

  if (completed) {
    return (
      <AppLayout>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
          <CheckCircle2 className="h-16 w-16 text-primary mb-4" />
          <h1 className="font-heading text-3xl font-bold text-foreground mb-2">You reconnected.</h1>
          <p className="text-muted-foreground max-w-sm">A small return today can become a lasting habit. Consistency grows quietly.</p>
        </motion.div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 text-primary mx-auto mb-3" />
          <h1 className="font-heading text-3xl font-bold text-foreground">Reconnect in 5 Minutes</h1>
          <p className="text-muted-foreground mt-1">A gentle return to the Qur'an</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 justify-center">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i <= step ? 'w-8 bg-primary' : 'w-4 bg-muted'}`} />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <h2 className="font-heading text-xl font-semibold text-foreground mb-4">Step {step + 1}: {steps[step].title}</h2>
            {steps[step].content}
          </motion.div>
        </AnimatePresence>

        <div className="flex justify-between">
          {step > 0 && <Button variant="outline" className="rounded-xl" onClick={() => setStep(s => s - 1)}>Back</Button>}
          <div className="ml-auto">
            {step < steps.length - 1 ? (
              <Button className="rounded-xl" onClick={() => setStep(s => s + 1)}>
                Next <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            ) : (
              <Button className="rounded-xl" onClick={handleComplete}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> Complete Reconnect
              </Button>
            )}
          </div>
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <h3 className="font-heading text-lg font-semibold mb-3">Recent Sessions</h3>
            <div className="space-y-2">
              {history.map(h => (
                <div key={h.id} className="glass-card rounded-xl px-4 py-3 flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">{new Date(h.date).toLocaleDateString()}</span>
                  <span className={h.completed ? 'text-primary' : 'text-muted-foreground'}>
                    {h.completed ? '✓ Completed' : 'In progress'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
