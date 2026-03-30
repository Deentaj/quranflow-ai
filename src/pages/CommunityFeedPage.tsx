import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { EmptyState, PageSkeleton } from '@/components/UIStates';
import { Heart, Users } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type MoodType = Database['public']['Enums']['mood_type'];

const MOOD_EMOJI: Record<string, string> = {
  stressed: '😰', calm: '😌', tired: '😴',
  hopeful: '🌟', grateful: '🤲', unmotivated: '😔',
};

interface PublicReflection {
  id: string;
  ayah_reference: string | null;
  reflection_text: string;
  mood: MoodType | null;
  created_at: string;
  user_id: string;
  profiles: { full_name: string } | null;
}

interface Reaction {
  reflection_id: string;
  count: number;
  user_reacted: boolean;
}

export default function CommunityFeedPage() {
  const { user } = useAuth();
  const [reflections, setReflections] = useState<PublicReflection[]>([]);
  const [reactions, setReactions] = useState<Record<string, Reaction>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeed();
  }, [user]);

  const loadFeed = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('reflections')
      .select('id, ayah_reference, reflection_text, mood, created_at, user_id, profiles!reflections_user_id_fkey(full_name)')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .limit(50);

    // If the join doesn't work, fetch without it
    if (!data) {
      const { data: plainData } = await supabase
        .from('reflections')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (plainData) {
        setReflections(plainData.map(r => ({ ...r, profiles: null })) as PublicReflection[]);
        await loadReactions(plainData.map(r => r.id));
      }
    } else {
      setReflections(data as unknown as PublicReflection[]);
      await loadReactions(data.map((r: any) => r.id));
    }
    setLoading(false);
  };

  const loadReactions = async (reflectionIds: string[]) => {
    if (!user || reflectionIds.length === 0) return;

    const { data: allReactions } = await supabase
      .from('reflection_reactions')
      .select('*')
      .in('reflection_id', reflectionIds);

    if (allReactions) {
      const map: Record<string, Reaction> = {};
      for (const id of reflectionIds) {
        const forThis = allReactions.filter((r: any) => r.reflection_id === id);
        map[id] = {
          reflection_id: id,
          count: forThis.length,
          user_reacted: forThis.some((r: any) => r.user_id === user.id),
        };
      }
      setReactions(map);
    }
  };

  const toggleReaction = async (reflectionId: string) => {
    if (!user) return;
    const current = reactions[reflectionId];

    if (current?.user_reacted) {
      await supabase
        .from('reflection_reactions')
        .delete()
        .eq('reflection_id', reflectionId)
        .eq('user_id', user.id)
        .eq('reaction_type', 'heart');

      setReactions(prev => ({
        ...prev,
        [reflectionId]: { ...prev[reflectionId], count: prev[reflectionId].count - 1, user_reacted: false },
      }));
    } else {
      const { error } = await supabase
        .from('reflection_reactions')
        .insert({ reflection_id: reflectionId, user_id: user.id, reaction_type: 'heart' });

      if (error) {
        toast.error('Could not react');
        return;
      }
      setReactions(prev => ({
        ...prev,
        [reflectionId]: {
          reflection_id: reflectionId,
          count: (prev[reflectionId]?.count || 0) + 1,
          user_reacted: true,
        },
      }));
    }
  };

  const getDisplayName = (r: PublicReflection) => {
    if (r.user_id === user?.id) return 'You';
    const name = (r.profiles as any)?.full_name;
    if (name) return name;
    return 'A fellow traveler';
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Community Feed</h1>
          <p className="text-muted-foreground mt-1">Reflections shared by the community</p>
        </div>

        {reflections.length === 0 ? (
          <EmptyState
            icon={<Users className="h-12 w-12" />}
            title="No shared reflections yet"
            description="Be the first to share a reflection with the community. Toggle 'Share publicly' when writing a reflection."
          />
        ) : (
          <div className="space-y-4">
            {reflections.map(r => {
              const reaction = reactions[r.id];
              return (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-2xl p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium text-primary">
                      {getDisplayName(r).charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-foreground">{getDisplayName(r)}</span>
                      <span className="text-xs text-muted-foreground ml-2">{timeAgo(r.created_at)}</span>
                    </div>
                    {r.mood && <span className="text-lg">{MOOD_EMOJI[r.mood]}</span>}
                  </div>

                  {r.ayah_reference && (
                    <span className="inline-block text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5 mb-2">
                      {r.ayah_reference}
                    </span>
                  )}

                  <p className="text-sm text-foreground leading-relaxed mb-3">{r.reflection_text}</p>

                  <button
                    onClick={() => toggleReaction(r.id)}
                    className={cn(
                      'flex items-center gap-1.5 text-sm transition-colors rounded-lg px-2 py-1',
                      reaction?.user_reacted
                        ? 'text-destructive'
                        : 'text-muted-foreground hover:text-destructive'
                    )}
                  >
                    <Heart className={cn('h-4 w-4', reaction?.user_reacted && 'fill-current')} />
                    <span>{reaction?.count || 0}</span>
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
