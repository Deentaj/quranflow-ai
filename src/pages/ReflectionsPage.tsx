import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { logActivity } from '@/lib/streak-utils';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { EmptyState, PageSkeleton } from '@/components/UIStates';
import { PenLine, Plus, Search, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Database } from '@/integrations/supabase/types';

type MoodType = Database['public']['Enums']['mood_type'];

const MOODS: MoodType[] = ['stressed', 'calm', 'tired', 'hopeful', 'grateful', 'unmotivated'];
const MOOD_EMOJI: Record<string, string> = { stressed: '😰', calm: '😌', tired: '😴', hopeful: '🌟', grateful: '🤲', unmotivated: '😔' };

interface Reflection {
  id: string;
  ayah_reference: string | null;
  reflection_text: string;
  mood: MoodType | null;
  date: string;
  created_at: string;
}

export default function ReflectionsPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterMood, setFilterMood] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');

  // Form state
  const [form, setForm] = useState({ ayahRef: searchParams.get('ayah') || '', text: '', mood: '' as string });

  useEffect(() => { loadReflections(); }, [user]);

  const loadReflections = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reflections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (data) setReflections(data as Reflection[]);
    setLoading(false);
  };

  const handleSubmit = async () => {
    if (!user || !form.text.trim()) { toast.error('Please write a reflection.'); return; }

    if (editingId) {
      await supabase.from('reflections').update({
        ayah_reference: form.ayahRef || null,
        reflection_text: form.text,
        mood: (form.mood || null) as MoodType | null,
      }).eq('id', editingId);
      toast.success('Reflection updated.');
    } else {
      await supabase.from('reflections').insert([{
        user_id: user.id,
        ayah_reference: form.ayahRef || null,
        reflection_text: form.text,
        mood: (form.mood || null) as MoodType | null,
      }]);
      await logActivity(user.id, 'reflection_written', form.ayahRef || undefined);
      toast.success('Reflection saved. Beautiful.');
    }
    
    setForm({ ayahRef: '', text: '', mood: '' });
    setEditingId(null);
    setDialogOpen(false);
    loadReflections();
  };

  const handleEdit = (r: Reflection) => {
    setEditingId(r.id);
    setForm({ ayahRef: r.ayah_reference || '', text: r.reflection_text, mood: r.mood || '' });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('reflections').delete().eq('id', id);
    setReflections(prev => prev.filter(r => r.id !== id));
    toast.success('Reflection removed.');
  };

  const filtered = reflections
    .filter(r => {
      if (filterMood !== 'all' && r.mood !== filterMood) return false;
      if (search && !r.reflection_text.toLowerCase().includes(search.toLowerCase()) && 
          !(r.ayah_reference || '').includes(search)) return false;
      return true;
    })
    .sort((a, b) => sortOrder === 'newest' 
      ? new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      : new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Reflection Journal</h1>
            <p className="text-muted-foreground mt-1">Your private spiritual journal</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingId(null); setForm({ ayahRef: '', text: '', mood: '' }); } }}>
            <DialogTrigger asChild>
              <Button className="rounded-xl"><Plus className="h-4 w-4 mr-1.5" /> New</Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-heading">{editingId ? 'Edit Reflection' : 'New Reflection'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label>Ayah Reference (optional)</Label>
                  <Input placeholder="e.g. 2:255" value={form.ayahRef} onChange={e => setForm(f => ({ ...f, ayahRef: e.target.value }))} className="mt-1 rounded-xl" />
                </div>
                <div>
                  <Label>Mood</Label>
                  <Select value={form.mood} onValueChange={v => setForm(f => ({ ...f, mood: v }))}>
                    <SelectTrigger className="mt-1 rounded-xl"><SelectValue placeholder="How are you feeling?" /></SelectTrigger>
                    <SelectContent>
                      {MOODS.map(m => <SelectItem key={m} value={m}>{MOOD_EMOJI[m]} {m.charAt(0).toUpperCase() + m.slice(1)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Your reflection</Label>
                  <Textarea placeholder="What's on your heart..." value={form.text} onChange={e => setForm(f => ({ ...f, text: e.target.value }))} className="mt-1 rounded-xl min-h-[120px]" />
                </div>
                <Button onClick={handleSubmit} className="w-full rounded-xl">{editingId ? 'Update' : 'Save Reflection'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search reflections..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 rounded-xl" />
          </div>
          <Select value={filterMood} onValueChange={setFilterMood}>
            <SelectTrigger className="w-36 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All moods</SelectItem>
              {MOODS.map(m => <SelectItem key={m} value={m}>{MOOD_EMOJI[m]} {m}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl" onClick={() => setSortOrder(s => s === 'newest' ? 'oldest' : 'newest')}>
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Button>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<PenLine className="h-12 w-12" />}
            title="No reflections yet"
            description="Start your reflection journal. Every thought is a step closer to understanding."
            action={<Button className="rounded-xl" onClick={() => setDialogOpen(true)}>Write your first reflection</Button>}
          />
        ) : (
          <div className="space-y-3">
            {filtered.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-5">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {r.mood && <span className="text-lg">{MOOD_EMOJI[r.mood]}</span>}
                    {r.ayah_reference && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{r.ayah_reference}</span>}
                    <span className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => handleEdit(r)} className="p-1.5 rounded-lg hover:bg-muted transition-colors"><Edit className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors"><Trash2 className="h-3.5 w-3.5 text-destructive" /></button>
                  </div>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{r.reflection_text}</p>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </AppLayout>
  );
}
