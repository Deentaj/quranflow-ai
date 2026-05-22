import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchAyah, getAyahByMood, getMoodAyahExplanation, type AyahData } from '@/lib/quran-api';
import { logActivity } from '@/lib/streak-utils';
import AppLayout from '@/components/AppLayout';
import AyahDisplay from '@/components/AyahDisplay';
import TafsirViewer from '@/components/TafsirViewer';
import { PageSkeleton } from '@/components/UIStates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle2, PenLine, MessageCircle, Bookmark, Search, Share2, Download, X, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function DailyAyahPage() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [ayah, setAyah] = useState<AyahData | null>(null);
  const [explanation, setExplanation] = useState<{ whyItMatters: string; applyToday: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);
  const [searchRef, setSearchRef] = useState('');
  const [shareOpen, setShareOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [cardReady, setCardReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => { loadAyah(); }, [user]);

  const loadAyah = async () => {
    if (!user) return;
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];
    const [ayahData, moodRes, actRes] = await Promise.all([
      fetchAyah(),
      supabase.from('moods').select('mood').eq('user_id', user.id).eq('date', today).maybeSingle(),
      supabase.from('activities').select('id').eq('user_id', user.id).eq('action_type', 'ayah_completed').eq('date', today),
    ]);
    const mood = moodRes.data?.mood || 'calm';
    if (moodRes.data?.mood) {
      const moodAyah = await fetchAyah(getAyahByMood(moodRes.data.mood));
      if (moodAyah) { setAyah(moodAyah); setExplanation(getMoodAyahExplanation(mood)); }
      else if (ayahData) { setAyah(ayahData); setExplanation(getMoodAyahExplanation(mood)); }
    } else if (ayahData) {
      setAyah(ayahData);
      setExplanation(getMoodAyahExplanation(mood));
    }
    setCompleted((actRes.data?.length || 0) > 0);
    setLoading(false);
  };

  const handleComplete = async () => {
    if (!user || !ayah) return;
    await logActivity(user.id, 'ayah_completed', ayah.verseKey);
    await refreshProfile();
    setCompleted(true);
    toast.success('Ayah completed. You showed up today — that matters.');
  };

  const handleBookmark = async () => {
    if (!user || !ayah) return;
    const { error } = await supabase.from('bookmarks').insert([{
      user_id: user.id, type: 'ayah', reference: ayah.verseKey,
      content: { arabicText: ayah.arabicText, translationText: ayah.translationText, surahName: ayah.surahName } as unknown as import('@/integrations/supabase/types').Json,
    }]);
    if (error?.code === '23505') { toast.info('Already bookmarked.'); return; }
    toast.success('Bookmarked.');
  };

  const handleSearch = async () => {
    if (!searchRef.match(/^\d+:\d+$/)) { toast.error('Use format: surah:verse (e.g. 2:255)'); return; }
    setLoading(true);
    const data = await fetchAyah(searchRef);
    if (data) { setAyah(data); setExplanation(getMoodAyahExplanation('calm')); }
    else toast.error('Verse not found.');
    setLoading(false);
  };

  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number): number => {
    const words = text.split(' ');
    let line = '';
    let currentY = y;
    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + ' ';
      if (ctx.measureText(testLine).width > maxWidth && n > 0) {
        ctx.fillText(line.trim(), x, currentY);
        line = words[n] + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line.trim(), x, currentY);
    return currentY;
  };

  const generateCard = async () => {
    if (!ayah) return;
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) { setGenerating(false); return; }
    const W = 1080, H = 1080;
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let r = 80; r < 700; r += 90) { ctx.beginPath(); ctx.arc(W/2, H/2, r, 0, Math.PI*2); ctx.stroke(); }
    const goldGrad = ctx.createLinearGradient(80, 0, W-80, 0);
    goldGrad.addColorStop(0, 'rgba(212,175,55,0)'); goldGrad.addColorStop(0.3, 'rgba(212,175,55,0.9)');
    goldGrad.addColorStop(0.7, 'rgba(212,175,55,0.9)'); goldGrad.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(80, 90, W-160, 2); ctx.fillRect(80, H-92, W-160, 2);
    ctx.fillStyle = '#d4af37'; ctx.font = '600 28px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('QuranFlow', W/2, 68);
    ctx.fillStyle = '#ffffff';
    ctx.font = `${ayah.arabicText.length > 80 ? '38' : '44'}px Arial, sans-serif`;
    ctx.textAlign = 'center'; ctx.direction = 'rtl';
    wrapText(ctx, ayah.arabicText, W/2, 280, W-160, 64);
    ctx.direction = 'ltr';
    ctx.fillStyle = '#d4af37'; ctx.font = '20px Arial'; ctx.textAlign = 'center';
    ctx.fillText('· · ·', W/2, 500);
    const translation = ayah.translationText || 'Translation not available';
    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    const fontSize = translation.length > 150 ? 28 : 32;
    ctx.font = `400 ${fontSize}px Georgia, serif`; ctx.textAlign = 'center';
    const lastY = wrapText(ctx, `"${translation}"`, W/2, 560, W-200, fontSize+14);
    ctx.fillStyle = '#d4af37'; ctx.font = '500 26px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText(`— Surah ${ayah.surahName}, ${ayah.verseKey}`, W/2, Math.max(lastY+60, 820));
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.font = '400 22px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('quranflow-ai.vercel.app', W/2, H-52);
    setGenerating(false); setCardReady(true);
  };

  const handleShareOpen = () => { setShareOpen(true); setCardReady(false); setTimeout(() => generateCard(), 100); };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !ayah) return;
    const link = document.createElement('a');
    link.download = `quran-${ayah.verseKey.replace(':', '-')}.png`;
    link.href = canvas.toDataURL('image/png'); link.click();
    toast.success('Image saved!');
  };

  const handleCopy = async () => {
    if (!ayah) return;
    await navigator.clipboard.writeText(`${ayah.arabicText}\n\n"${ayah.translationText || ''}"\n\n— Quran ${ayah.verseKey}\n\n📖 via QuranFlow`);
    toast.success('Copied to clipboard!'); setShareOpen(false);
  };

  if (loading) return <AppLayout><PageSkeleton /></AppLayout>;

  const shareText = ayah ? encodeURIComponent(`${ayah.arabicText}\n\n"${ayah.translationText || ''}"\n\n— Quran ${ayah.verseKey}\n\n📖 via QuranFlow`) : '';

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Daily Ayah Journey</h1>
          <p className="text-muted-foreground mt-1">Your guided spiritual experience for today</p>
        </div>

        <div className="flex gap-2">
          <Input placeholder="Search verse (e.g. 2:255)" value={searchRef} onChange={e => setSearchRef(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()} className="rounded-xl max-w-xs" />
          <Button variant="outline" className="rounded-xl" onClick={handleSearch}><Search className="h-4 w-4" /></Button>
        </div>

        {ayah && (
          <>
            <AyahDisplay ayah={ayah} whyItMatters={explanation?.whyItMatters} applyToday={explanation?.applyToday} />
            <TafsirViewer verseKey={ayah.verseKey} />

            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-heading text-lg font-semibold mb-2">Reflection Prompt</h3>
              <p className="text-sm text-muted-foreground italic">
                "How does this verse connect to something happening in your life right now?"
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={handleComplete} disabled={completed} className="rounded-xl" variant={completed ? 'outline' : 'default'}>
                <CheckCircle2 className="h-4 w-4 mr-1.5" /> {completed ? 'Completed' : 'Mark Complete'}
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate(`/reflections?ayah=${ayah.verseKey}`)}>
                <PenLine className="h-4 w-4 mr-1.5" /> Save Reflection
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={() => navigate('/ai-assistant')}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> Ask Companion
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleBookmark}>
                <Bookmark className="h-4 w-4 mr-1.5" /> Bookmark
              </Button>
              <Button variant="outline" className="rounded-xl" onClick={handleShareOpen}>
                <Share2 className="h-4 w-4 mr-1.5" /> Share
              </Button>
            </div>
          </>
        )}
      </motion.div>

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setShareOpen(false)}>
          <div className="bg-card border border-border rounded-3xl w-full max-w-sm p-5 space-y-4"
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Share this Ayah</p>
              <button onClick={() => setShareOpen(false)} className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="relative rounded-2xl overflow-hidden bg-[#0a0f1e] aspect-square w-full">
              <canvas ref={canvasRef} className="w-full h-full object-contain" />
              {generating && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                </div>
              )}
            </div>
            {cardReady && (
              <Button onClick={handleDownload} className="w-full rounded-xl">
                <Download className="h-4 w-4 mr-2" /> Download Image Card
              </Button>
            )}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or share as text</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {[
                { name: 'WhatsApp', bg: '#25D366', icon: '💬', url: `https://wa.me/?text=${shareText}` },
                { name: 'Twitter / X', bg: '#000000', icon: '✕', url: `https://twitter.com/intent/tweet?text=${shareText}` },
                { name: 'Facebook', bg: '#1877F2', icon: 'f', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://quranflow-ai.vercel.app')}&quote=${shareText}` },
                { name: 'Telegram', bg: '#0088cc', icon: '✈', url: `https://t.me/share/url?url=${encodeURIComponent('https://quranflow-ai.vercel.app')}&text=${shareText}` },
              ].map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setShareOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: p.bg }}>
                  <span className="text-base w-5 text-center">{p.icon}</span>
                  {p.name}
                </a>
              ))}
            </div>
            <button onClick={handleCopy}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors">
              <Copy className="h-4 w-4" /> Copy Text
            </button>
          </div>
        </div>
      )}
    </AppLayout>
  );
}