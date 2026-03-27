import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState, PageSkeleton } from '@/components/UIStates';
import { Bookmark, BookOpen, PenLine, MessageCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface BookmarkItem {
  id: string;
  type: string;
  reference: string | null;
  content: Record<string, string>;
  created_at: string;
}

export default function BookmarksPage() {
  const { user } = useAuth();
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadBookmarks(); }, [user]);

  const loadBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase.from('bookmarks').select('*').eq('user_id', user.id).order('created_at', { ascending: false });
    if (data) setBookmarks(data as unknown as BookmarkItem[]);
    setLoading(false);
  };

  const handleRemove = async (id: string) => {
    await supabase.from('bookmarks').delete().eq('id', id);
    setBookmarks(prev => prev.filter(b => b.id !== id));
    toast.success('Bookmark removed.');
  };

  const byType = (type: string) => bookmarks.filter(b => b.type === type);

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const renderBookmark = (b: BookmarkItem) => (
    <motion.div key={b.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card rounded-2xl p-5">
      <div className="flex justify-between items-start mb-2">
        {b.reference && <span className="text-xs bg-primary/10 text-primary rounded-full px-2 py-0.5">{b.reference}</span>}
        <button onClick={() => handleRemove(b.id)} className="p-1.5 rounded-lg hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </button>
      </div>
      {b.type === 'ayah' && (
        <>
          {b.content.arabicText && <p className="text-lg text-right mb-2 font-serif" dir="rtl">{b.content.arabicText}</p>}
          <p className="text-sm text-muted-foreground italic">"{b.content.translationText}"</p>
          {b.content.surahName && <p className="text-xs text-muted-foreground mt-1">{b.content.surahName}</p>}
        </>
      )}
      {b.type === 'reflection' && <p className="text-sm text-foreground">{b.content.text}</p>}
      {b.type === 'ai_response' && <p className="text-sm text-foreground">{b.content.text}</p>}
      <p className="text-xs text-muted-foreground mt-2">{new Date(b.created_at).toLocaleDateString()}</p>
    </motion.div>
  );

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Bookmarks</h1>
          <p className="text-muted-foreground mt-1">Your saved spiritual treasures</p>
        </div>

        <Tabs defaultValue="ayah">
          <TabsList className="rounded-xl">
            <TabsTrigger value="ayah" className="rounded-lg"><BookOpen className="h-4 w-4 mr-1.5" /> Ayahs ({byType('ayah').length})</TabsTrigger>
            <TabsTrigger value="reflection" className="rounded-lg"><PenLine className="h-4 w-4 mr-1.5" /> Reflections ({byType('reflection').length})</TabsTrigger>
            <TabsTrigger value="ai_response" className="rounded-lg"><MessageCircle className="h-4 w-4 mr-1.5" /> AI ({byType('ai_response').length})</TabsTrigger>
          </TabsList>

          {['ayah', 'reflection', 'ai_response'].map(type => (
            <TabsContent key={type} value={type} className="mt-4">
              {byType(type).length === 0 ? (
                <EmptyState icon={<Bookmark className="h-12 w-12" />} title={`No saved ${type === 'ai_response' ? 'AI guidance' : type + 's'}`} description="Save content from across the app to revisit later." />
              ) : (
                <div className="space-y-3">{byType(type).map(renderBookmark)}</div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </motion.div>
    </AppLayout>
  );
}
