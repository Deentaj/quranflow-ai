import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Loader2, Trash2, Plus, EyeOff, Eye, Copy, Shield, Users, Activity, BookOpen, Swords } from 'lucide-react';

interface Profile { id: string; user_id: string; full_name: string; current_streak: number | null; created_at: string; }
interface Reflection { id: string; user_id: string; reflection_text: string; ayah_reference: string | null; is_public: boolean; hidden: boolean; created_at: string; }
interface InviteCode { id: string; code: string; used_by: string | null; used_at: string | null; created_at: string; expires_at: string | null; }
interface GlobalChallenge { id: string; challenge_type: string; title: string; description: string; target_value: number; xp_reward: number; active: boolean; created_at: string; }

export default function AdminPanelPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-primary" />
          <div>
            <h1 className="font-heading text-3xl font-bold">Admin Panel</h1>
            <p className="text-muted-foreground text-sm">Manage users, content, challenges and view analytics.</p>
          </div>
        </div>

        <Tabs defaultValue="analytics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="analytics"><Activity className="h-4 w-4 mr-1" />Analytics</TabsTrigger>
            <TabsTrigger value="users"><Users className="h-4 w-4 mr-1" />Users</TabsTrigger>
            <TabsTrigger value="moderation"><EyeOff className="h-4 w-4 mr-1" />Moderation</TabsTrigger>
            <TabsTrigger value="challenges"><Swords className="h-4 w-4 mr-1" />Challenges</TabsTrigger>
            <TabsTrigger value="invites"><Shield className="h-4 w-4 mr-1" />Invites</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics"><AnalyticsTab /></TabsContent>
          <TabsContent value="users"><UsersTab /></TabsContent>
          <TabsContent value="moderation"><ModerationTab /></TabsContent>
          <TabsContent value="challenges"><ChallengesTab /></TabsContent>
          <TabsContent value="invites"><InvitesTab /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

function AnalyticsTab() {
  const [stats, setStats] = useState({ users: 0, activitiesToday: 0, reflections: 0, publicReflections: 0, challengesCompleted: 0, admins: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const today = new Date().toISOString().split('T')[0];
      const [u, a, r, rp, cc, ad] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('activities').select('*', { count: 'exact', head: true }).eq('date', today),
        supabase.from('reflections').select('*', { count: 'exact', head: true }),
        supabase.from('reflections').select('*', { count: 'exact', head: true }).eq('is_public', true).eq('hidden', false),
        supabase.from('daily_challenges').select('*', { count: 'exact', head: true }).eq('completed', true),
        supabase.from('user_roles').select('*', { count: 'exact', head: true }).eq('role', 'admin'),
      ]);
      setStats({
        users: u.count ?? 0,
        activitiesToday: a.count ?? 0,
        reflections: r.count ?? 0,
        publicReflections: rp.count ?? 0,
        challengesCompleted: cc.count ?? 0,
        admins: ad.count ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const cards = [
    { label: 'Total Users', value: stats.users, icon: Users },
    { label: 'Active Today', value: stats.activitiesToday, icon: Activity },
    { label: 'Reflections', value: stats.reflections, icon: BookOpen },
    { label: 'Public Reflections', value: stats.publicReflections, icon: Eye },
    { label: 'Challenges Completed', value: stats.challengesCompleted, icon: Swords },
    { label: 'Admins', value: stats.admins, icon: Shield },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
      {cards.map(c => (
        <Card key={c.label} className="rounded-2xl">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <c.icon className="h-5 w-5 text-primary" />
              <span className="text-3xl font-bold">{c.value}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">{c.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UsersTab() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [adminIds, setAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabase.from('profiles').select('id, user_id, full_name, current_streak, created_at').order('created_at', { ascending: false }).limit(200),
      supabase.from('user_roles').select('user_id').eq('role', 'admin'),
    ]);
    setUsers(profiles ?? []);
    setAdminIds(new Set((roles ?? []).map(r => r.user_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleAdmin = async (userId: string, isAdmin: boolean) => {
    if (isAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin');
      if (error) return toast.error(error.message);
      toast.success('Admin role removed');
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' });
      if (error) return toast.error(error.message);
      toast.success('Admin role granted');
    }
    load();
  };

  const filtered = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <Card className="rounded-2xl mt-4">
      <CardHeader>
        <CardTitle className="text-lg">All Users ({users.length})</CardTitle>
        <Input placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm rounded-xl" />
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
          <div className="space-y-2">
            {filtered.map(u => {
              const isAdmin = adminIds.has(u.user_id);
              return (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border bg-card">
                  <div className="min-w-0">
                    <div className="font-medium flex items-center gap-2">
                      <span className="truncate">{u.full_name || 'Unnamed'}</span>
                      {isAdmin && <Badge variant="default" className="text-xs">Admin</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">Streak: {u.current_streak ?? 0} · Joined {new Date(u.created_at).toLocaleDateString()}</div>
                  </div>
                  <Button size="sm" variant={isAdmin ? 'outline' : 'default'} onClick={() => toggleAdmin(u.user_id, isAdmin)}>
                    {isAdmin ? 'Revoke admin' : 'Make admin'}
                  </Button>
                </div>
              );
            })}
            {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No users found.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModerationTab() {
  const [reflections, setReflections] = useState<Reflection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showHidden, setShowHidden] = useState(false);

  const load = async () => {
    setLoading(true);
    const q = supabase.from('reflections').select('*').eq('is_public', true).order('created_at', { ascending: false }).limit(100);
    const { data } = showHidden ? await q : await q.eq('hidden', false);
    setReflections(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [showHidden]);

  const toggleHide = async (r: Reflection) => {
    const { error } = await supabase.from('reflections').update({ hidden: !r.hidden }).eq('id', r.id);
    if (error) return toast.error(error.message);
    toast.success(r.hidden ? 'Reflection restored' : 'Reflection hidden');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Permanently delete this reflection?')) return;
    const { error } = await supabase.from('reflections').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <Card className="rounded-2xl mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Public Reflections</CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="showHidden" className="text-sm">Show hidden</Label>
            <Switch id="showHidden" checked={showHidden} onCheckedChange={setShowHidden} />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
          <div className="space-y-3">
            {reflections.map(r => (
              <div key={r.id} className={`p-4 rounded-xl border ${r.hidden ? 'bg-muted/40 opacity-70' : 'bg-card'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {r.ayah_reference && <Badge variant="secondary" className="mb-1 text-xs">{r.ayah_reference}</Badge>}
                    <p className="text-sm whitespace-pre-wrap">{r.reflection_text}</p>
                    <p className="text-xs text-muted-foreground mt-2">{new Date(r.created_at).toLocaleString()}{r.hidden && ' · HIDDEN'}</p>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => toggleHide(r)} title={r.hidden ? 'Restore' : 'Hide'}>
                      {r.hidden ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)} title="Delete">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
            {reflections.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No reflections.</p>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ChallengesTab() {
  const [items, setItems] = useState<GlobalChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title: '', description: '', challenge_type: 'reflect', target_value: 1, xp_reward: 10 });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('global_challenges').select('*').order('created_at', { ascending: false });
    setItems(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.title.trim() || !form.description.trim()) return toast.error('Title and description required');
    const { error } = await supabase.from('global_challenges').insert(form);
    if (error) return toast.error(error.message);
    toast.success('Challenge created');
    setForm({ title: '', description: '', challenge_type: 'reflect', target_value: 1, xp_reward: 10 });
    load();
  };

  const toggleActive = async (c: GlobalChallenge) => {
    const { error } = await supabase.from('global_challenges').update({ active: !c.active }).eq('id', c.id);
    if (error) return toast.error(error.message);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this challenge?')) return;
    const { error } = await supabase.from('global_challenges').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">Create Global Challenge</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid md:grid-cols-2 gap-3">
            <div>
              <Label>Title</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={form.challenge_type} onChange={e => setForm({ ...form, challenge_type: e.target.value })} className="rounded-xl mt-1" placeholder="reflect, read, recite..." />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Target value</Label>
              <Input type="number" min={1} value={form.target_value} onChange={e => setForm({ ...form, target_value: +e.target.value })} className="rounded-xl mt-1" />
            </div>
            <div>
              <Label>XP reward</Label>
              <Input type="number" min={1} value={form.xp_reward} onChange={e => setForm({ ...form, xp_reward: +e.target.value })} className="rounded-xl mt-1" />
            </div>
          </div>
          <Button onClick={create} className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Create</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">All Global Challenges ({items.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
            <div className="space-y-2">
              {items.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border bg-card gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate">{c.title}</span>
                      <Badge variant="secondary" className="text-xs">{c.challenge_type}</Badge>
                      <Badge variant="outline" className="text-xs">+{c.xp_reward} XP</Badge>
                      {!c.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{c.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={c.active} onCheckedChange={() => toggleActive(c)} />
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No global challenges yet.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function InvitesTab() {
  const [codes, setCodes] = useState<InviteCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('admin_invite_codes').select('*').order('created_at', { ascending: false });
    setCodes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const generate = () => {
    const code = 'ADM-' + Math.random().toString(36).slice(2, 8).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
    setNewCode(code);
  };

  const create = async () => {
    if (!newCode.trim()) return toast.error('Generate or enter a code');
    const { error } = await supabase.from('admin_invite_codes').insert({ code: newCode.trim() });
    if (error) return toast.error(error.message);
    toast.success('Invite code created');
    setNewCode('');
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this invite code?')) return;
    const { error } = await supabase.from('admin_invite_codes').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted');
    load();
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Copied to clipboard');
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">Create Admin Invite Code</CardTitle></CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-2">
          <Input value={newCode} onChange={e => setNewCode(e.target.value)} placeholder="Code..." className="rounded-xl" />
          <Button variant="outline" onClick={generate} className="rounded-xl">Generate</Button>
          <Button onClick={create} className="rounded-xl"><Plus className="h-4 w-4 mr-1" />Create</Button>
        </CardContent>
      </Card>

      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-lg">Invite Codes ({codes.length})</CardTitle></CardHeader>
        <CardContent>
          {loading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : (
            <div className="space-y-2">
              {codes.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 rounded-xl border bg-card gap-2">
                  <div className="min-w-0">
                    <div className="font-mono text-sm flex items-center gap-2">
                      <span className="truncate">{c.code}</span>
                      {c.used_by ? <Badge variant="outline" className="text-xs">Used</Badge> : <Badge className="text-xs">Available</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {c.used_at ? `Used ${new Date(c.used_at).toLocaleString()}` : `Created ${new Date(c.created_at).toLocaleDateString()}`}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="icon" variant="ghost" onClick={() => copy(c.code)}><Copy className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </div>
              ))}
              {codes.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No invite codes.</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
