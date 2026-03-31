import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { User, LogOut } from 'lucide-react';
import ReminderSettings from '@/components/ReminderSettings';
import { useReminder } from '@/hooks/useReminder';

export default function ProfilePage() {
  useReminder();
  const { user, profile, signOut, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.full_name || '');
  const [language, setLanguage] = useState(profile?.preferred_language || 'en');
  const [dailyGoal, setDailyGoal] = useState(String(profile?.daily_goal || 1));
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      full_name: name, preferred_language: language, daily_goal: parseInt(dailyGoal) || 1,
    }).eq('user_id', user.id);
    await refreshProfile();
    setSaving(false);
    toast.success('Profile updated.');
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-lg">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Profile</h1>
          <p className="text-muted-foreground mt-1">Manage your account settings</p>
        </div>
        <div className="glass-card rounded-3xl p-6 space-y-5">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-6 w-6 text-primary" /></div>
            <div><p className="font-medium text-foreground">{profile?.full_name}</p><p className="text-xs text-muted-foreground">{user?.email}</p></div>
          </div>
          <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} className="mt-1 rounded-xl" /></div>
          <div><Label>Preferred Language</Label><Input value={language} onChange={e => setLanguage(e.target.value)} placeholder="en" className="mt-1 rounded-xl" /></div>
          <div><Label>Daily Goal (ayahs)</Label><Input type="number" min="1" value={dailyGoal} onChange={e => setDailyGoal(e.target.value)} className="mt-1 rounded-xl" /></div>
          <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
        <ReminderSettings />
        <Button variant="outline" className="w-full rounded-xl" onClick={signOut}><LogOut className="h-4 w-4 mr-2" /> Sign Out</Button>
      </motion.div>
    </AppLayout>
  );
}
