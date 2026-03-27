import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState, PageSkeleton } from '@/components/UIStates';
import { Progress } from '@/components/ui/progress';
import { Target, Plus, Trash2, Edit, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface Goal {
  id: string;
  title: string;
  target_type: string;
  target_value: number;
  progress: number;
  deadline: string | null;
  completed: boolean;
  created_at: string;
}

export default function GoalsPage() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', targetType: 'ayahs', targetValue: '7', deadline: '' });

  useEffect(() => { loadGoals(); }, [user]);

  const loadGoals = async () => {
    if (!user) return;
    const { data } = await supabase.from('goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setGoals(data as Goal[]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !form.title.trim()) { toast.error('Please enter a goal title.'); return; }
    const val = parseInt(form.targetValue) || 1;
    
    if (editingId) {
      await supabase.from('goals').update({
        title: form.title, target_type: form.targetType, target_value: val,
        deadline: form.deadline || null,
      }).eq('id', editingId);
      toast.success('Goal updated.');
    } else {
      await supabase.from('goals').insert([{
        user_id: user.id, title: form.title, target_type: form.targetType,
        target_value: val, deadline: form.deadline || null,
      }]);
      toast.success('Goal created. Small steps, big rewards.');
    }
    
    resetForm();
    loadGoals();
  };

  const resetForm = () => { setForm({ title: '', targetType: 'ayahs', targetValue: '7', deadline: '' }); setEditingId(null); setDialogOpen(false); };

  const handleEdit = (g: Goal) => {
    setEditingId(g.id);
    setForm({ title: g.title, targetType: g.target_type, targetValue: String(g.target_value), deadline: g.deadline || '' });
    setDialogOpen(true);
  };

  const handleProgress = async (g: Goal) => {
    const newProgress = Math.min(g.progress + 1, g.target_value);
    const completed = newProgress >= g.target_value;
    await supabase.from('goals').update({ progress: newProgress, completed }).eq('id', g.id);
    if (completed) toast.success('Goal completed! MashaAllah 🎉');
    loadGoals();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('goals').delete().eq('id', id);
    setGoals(prev => prev.filter(g => g.id !== id));
    toast.success('Goal removed.');
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Goal Planner</h1>
            <p className="text-muted-foreground mt-1">Set intentions and track your Qur'anic goals</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild><Button className="rounded-xl"><Plus className="h-4 w-4 mr-1.5" /> New Goal</Button></DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader><DialogTitle className="font-heading">{editingId ? 'Edit Goal' : 'New Goal'}</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div><Label>Goal title</Label><Input placeholder="e.g. Read 1 ayah daily" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="mt-1 rounded-xl" /></div>
                <div><Label>Target type</Label>
                  <Select value={form.targetType} onValueChange={v => setForm(f => ({ ...f, targetType: v }))}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ayahs">Ayahs</SelectItem>
                      <SelectItem value="reflections">Reflections</SelectItem>
                      <SelectItem value="streak_days">Streak Days</SelectItem>
                      <SelectItem value="surahs">Surahs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Target value</Label><Input type="number" min="1" value={form.targetValue} onChange={e => setForm(f => ({ ...f, targetValue: e.target.value }))} className="mt-1 rounded-xl" /></div>
                <div><Label>Deadline (optional)</Label><Input type="date" value={form.deadline} onChange={e => setForm(f => ({ ...f, deadline: e.target.value }))} className="mt-1 rounded-xl" /></div>
                <Button onClick={handleSubmit} className="w-full rounded-xl">{editingId ? 'Update' : 'Create Goal'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {goals.length === 0 ? (
          <EmptyState icon={<Target className="h-12 w-12" />} title="No goals yet" description="Set your first Qur'an goal. Even small intentions carry great reward."
            action={<Button className="rounded-xl" onClick={() => setDialogOpen(true)}>Create your first goal</Button>} />
        ) : (
          <div className="space-y-3">
            {goals.map(g => {
              const pct = g.target_value > 0 ? Math.round((g.progress / g.target_value) * 100) : 0;
              const isOverdue = g.deadline && !g.completed && new Date(g.deadline) < new Date();
              return (
                <motion.div key={g.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className={cn('glass-card rounded-2xl p-5', g.completed && 'border-primary/30')}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className={cn('font-medium text-foreground', g.completed && 'line-through opacity-60')}>{g.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {g.target_type} • {g.progress}/{g.target_value}
                        {g.deadline && <span className={cn(isOverdue && 'text-destructive')}> • Due {new Date(g.deadline).toLocaleDateString()}</span>}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      {!g.completed && <button onClick={() => handleProgress(g)} className="p-1.5 rounded-lg hover:bg-primary/10 transition-colors"><CheckCircle2 className="h-4 w-4 text-primary" /></button>}
                      <button onClick={() => handleEdit(g)} className="p-1.5 rounded-lg hover:bg-muted"><Edit className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => handleDelete(g.id)} className="p-1.5 rounded-lg hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2 rounded-full" />
                  <p className="text-xs text-muted-foreground mt-1">{pct}% complete</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
