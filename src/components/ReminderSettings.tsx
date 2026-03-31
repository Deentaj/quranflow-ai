import { useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export default function ReminderSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [enabled, setEnabled] = useState(profile?.reminder_enabled ?? false);
  const [time, setTime] = useState(profile?.reminder_time ?? '08:00');
  const [saving, setSaving] = useState(false);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser.');
      return false;
    }
    if (Notification.permission === 'granted') return true;
    const result = await Notification.requestPermission();
    if (result !== 'granted') {
      toast.error('Please allow notifications in your browser settings.');
      return false;
    }
    return true;
  };

  const handleToggle = async (checked: boolean) => {
    if (checked) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    setEnabled(checked);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from('profiles').update({
      reminder_enabled: enabled,
      reminder_time: time,
    } as any).eq('user_id', user.id);
    await refreshProfile();
    setSaving(false);
    toast.success(enabled ? `Reminder set for ${time} daily.` : 'Reminders disabled.');
  };

  return (
    <div className="glass-card rounded-3xl p-6 space-y-5">
      <div className="flex items-center gap-3">
        {enabled ? <Bell className="h-5 w-5 text-primary" /> : <BellOff className="h-5 w-5 text-muted-foreground" />}
        <div>
          <h3 className="font-heading text-lg font-semibold text-foreground">Daily Reminders</h3>
          <p className="text-xs text-muted-foreground">Get notified at your preferred time</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="reminder-toggle">Enable daily reminder</Label>
        <Switch id="reminder-toggle" checked={enabled} onCheckedChange={handleToggle} />
      </div>

      {enabled && (
        <div>
          <Label htmlFor="reminder-time">Reminder Time</Label>
          <Input
            id="reminder-time"
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="mt-1 rounded-xl"
          />
        </div>
      )}

      <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
        {saving ? 'Saving...' : 'Save Reminder Settings'}
      </Button>
    </div>
  );
}
