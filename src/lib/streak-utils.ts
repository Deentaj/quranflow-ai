import { supabase } from '@/integrations/supabase/client';

const GRACE_PERIOD_DAYS = 2; // allow up to 2 missed days before streak resets

export interface StreakResult {
  currentStreak: number;
  longestStreak: number;
  missedDays: number; // 0 = active today/yesterday, >0 = days since last activity
  previousStreak: number; // streak before the gap (useful for recovery messaging)
}

export async function updateStreak(userId: string): Promise<StreakResult> {
  const { data: activities } = await supabase
    .from('activities')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (!activities || activities.length === 0)
    return { currentStreak: 0, longestStreak: 0, missedDays: 0, previousStreak: 0 };

  const uniqueDates = [...new Set(activities.map(a => a.date))].sort().reverse();

  const today = new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();
  const lastActiveMs = new Date(uniqueDates[0]).getTime();
  const daysSinceLastActive = Math.round((todayMs - lastActiveMs) / 86400000);

  // Calculate the raw consecutive streak starting from the most recent activity
  let rawStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    const diffDays = (prev.getTime() - curr.getTime()) / 86400000;
    if (diffDays === 1) {
      rawStreak++;
    } else {
      break;
    }
  }

  let currentStreak: number;
  let missedDays: number;
  let previousStreak: number;

  if (daysSinceLastActive <= 1) {
    // Active today or yesterday — streak is alive
    currentStreak = rawStreak;
    missedDays = 0;
    previousStreak = rawStreak;
  } else if (daysSinceLastActive <= GRACE_PERIOD_DAYS + 1) {
    // Within grace period — preserve streak but flag missed days
    currentStreak = rawStreak;
    missedDays = daysSinceLastActive - 1;
    previousStreak = rawStreak;
  } else {
    // Beyond grace period — streak resets, but we remember what it was
    currentStreak = 0;
    missedDays = daysSinceLastActive - 1;
    previousStreak = rawStreak;
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

  return { currentStreak, longestStreak, missedDays, previousStreak };
}

/** Check streak status without updating (for dashboard display) */
export async function getStreakStatus(userId: string): Promise<StreakResult> {
  const { data: activities } = await supabase
    .from('activities')
    .select('date')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (!activities || activities.length === 0)
    return { currentStreak: 0, longestStreak: 0, missedDays: 0, previousStreak: 0 };

  const uniqueDates = [...new Set(activities.map(a => a.date))].sort().reverse();
  const today = new Date().toISOString().split('T')[0];
  const todayMs = new Date(today).getTime();
  const lastActiveMs = new Date(uniqueDates[0]).getTime();
  const daysSinceLastActive = Math.round((todayMs - lastActiveMs) / 86400000);

  let rawStreak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1]);
    const curr = new Date(uniqueDates[i]);
    if ((prev.getTime() - curr.getTime()) / 86400000 === 1) rawStreak++;
    else break;
  }

  const missedDays = daysSinceLastActive <= 1 ? 0 : daysSinceLastActive - 1;
  const currentStreak = daysSinceLastActive <= GRACE_PERIOD_DAYS + 1 ? rawStreak : 0;

  let longestStreak = 0;
  let tempStreak = 1;
  const sortedAsc = [...uniqueDates].reverse();
  for (let i = 1; i < sortedAsc.length; i++) {
    const prev = new Date(sortedAsc[i - 1]);
    const curr = new Date(sortedAsc[i]);
    if ((curr.getTime() - prev.getTime()) / 86400000 === 1) tempStreak++;
    else { longestStreak = Math.max(longestStreak, tempStreak); tempStreak = 1; }
  }
  longestStreak = Math.max(longestStreak, tempStreak);

  return { currentStreak, longestStreak, missedDays, previousStreak: rawStreak };
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

  await supabase.from('activities').insert([{
    user_id: userId,
    action_type: actionType,
    ayah_reference: ayahReference || null,
    metadata: (metadata || {}) as import('@/integrations/supabase/types').Json,
    date: today,
  }]);

  await updateStreak(userId);
}
