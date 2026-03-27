import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const moods = [
  { value: 'stressed', label: 'Stressed', emoji: '😰' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'hopeful', label: 'Hopeful', emoji: '🌟' },
  { value: 'grateful', label: 'Grateful', emoji: '🤲' },
  { value: 'unmotivated', label: 'Unmotivated', emoji: '😔' },
] as const;

type MoodValue = typeof moods[number]['value'];

interface MoodCheckinProps {
  onMoodSelected?: (mood: string) => void;
  compact?: boolean;
}

export default function MoodCheckin({ onMoodSelected, compact }: MoodCheckinProps) {
  const { user } = useAuth();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().split('T')[0];
    supabase
      .from('moods')
      .select('mood')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setSelectedMood(data.mood);
      });
  }, [user]);

  const handleMoodSelect = async (mood: MoodValue) => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    
    const { data: existing } = await supabase
      .from('moods')
      .select('id')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (existing) {
      await supabase.from('moods').update({ mood }).eq('id', existing.id);
    } else {
      await supabase.from('moods').insert([{ user_id: user.id, mood, date: today }]);
    }
    
    setSelectedMood(mood);
    setLoading(false);
    onMoodSelected?.(mood);
    toast.success('Mood saved. May your day be blessed.');
  };

  return (
    <div className={cn('glass-card rounded-2xl', compact ? 'p-4' : 'p-6')}>
      <h3 className={cn('font-heading font-semibold text-foreground', compact ? 'text-base mb-3' : 'text-lg mb-4')}>
        How are you feeling today?
      </h3>
      <div className={cn('grid gap-2', compact ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3')}>
        {moods.map(({ value, label, emoji }) => (
          <button
            key={value}
            onClick={() => handleMoodSelect(value)}
            disabled={loading}
            className={cn(
              'flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium transition-all border',
              selectedMood === value
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-card border-border text-muted-foreground hover:border-primary/30 hover:bg-primary/5'
            )}
          >
            <span>{emoji}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
