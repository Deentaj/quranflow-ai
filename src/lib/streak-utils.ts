import { supabase } from '@/integrations/supabase/client';

export async function updateStreak(userId: string): Promise<{ currentStreak: number; longestStreak: number }> {
  const { data: activities } = await supabase
    .from('activities')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (!activities || activities.length === 0) return { currentStreak: 0, longestStreak: 0 };

  const uniqueDates = [...new Set(activities.map(a => a.date))].sort().reverse();
  
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  let currentStreak = 0;
  if (uniqueDates[0] === today || uniqueDates[0] === yesterday) {
    currentStreak = 1;
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
      if (diffDays === 1) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let tempStreak = 1;
  const sortedAsc = [...uniqueDates].reverse();
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1]);
    const curr = new Date(sortedAsc[i]);
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) {
      tempStreak++;
    } else {
      longestStreak = Math.max(longestStreak, tempStreak);
      tempStreak = 1;
    }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  await supabase
    .from('profiles')
    .update({
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_active_date: today,
    })
    .eq('user_id', userId);

  return { currentStreak, longestStreak };
}

export async function logActivity(
  userId: string,
  actionType: string,
  ayahReference?: string,
  metadata?: Record<string, unknown>
) {
  const today = new Date().toISOString().split('T')[0];
  
  // Check for duplicate same-day same-action
  const { data: existing } = await supabase
    .from('activities')
    .select('id')
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .eq('date', today)
    .maybeSingle();

  if (actionType === 'ayah_completed' && existing) return; // prevent duplicate

  await supabase.from('activities').insert({
    user_id: userId,
    action_type: actionType,
    ayah_reference: ayahReference || null,
    metadata: metadata || {},
    date: today,
  });

  await updateStreak(userId);
}
