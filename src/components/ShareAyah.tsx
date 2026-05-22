import { useState, useRef } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Share2, Download, X, Copy } from 'lucide-react';
import type { AyahData } from '@/lib/quran-api';

interface ShareAyahProps {
  ayah: AyahData;
}

export default function ShareAyah({ ayah }: ShareAyahProps) {
  const [open, setOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cardReady, setCardReady] = useState(false);

  const translation = ayah.translationText || 'Translation not available';
  const shareText = `${ayah.arabicText}\n\n"${translation}"\n\n— Quran ${ayah.verseKey}\n\n📖 via QuranFlow`;
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = encodeURIComponent('https://quranflow-ai.vercel.app');

  const platforms = [
    { name: 'WhatsApp', bg: '#25D366', icon: '💬', url: `https://wa.me/?text=${encodedText}` },
    { name: 'Twitter / X', bg: '#000000', icon: '✕', url: `https://twitter.com/intent/tweet?text=${encodedText}` },
    { name: 'Facebook', bg: '#1877F2', icon: 'f', url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}` },
    { name: 'Telegram', bg: '#0088cc', icon: '✈', url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}` },
  ];

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
    setGenerating(true);
    const canvas = canvasRef.current;
    if (!canvas) { setGenerating(false); return; }

    const W = 1080, H = 1080;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#0a0f1e';
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 1;
    for (let r = 80; r < 700; r += 90) {
      ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke();
    }

    const goldGrad = ctx.createLinearGradient(80, 0, W - 80, 0);
    goldGrad.addColorStop(0, 'rgba(212,175,55,0)');
    goldGrad.addColorStop(0.3, 'rgba(212,175,55,0.9)');
    goldGrad.addColorStop(0.7, 'rgba(212,175,55,0.9)');
    goldGrad.addColorStop(1, 'rgba(212,175,55,0)');
    ctx.fillStyle = goldGrad;
    ctx.fillRect(80, 90, W - 160, 2);
    ctx.fillRect(80, H - 92, W - 160, 2);

    ctx.fillStyle = '#d4af37';
    ctx.font = '600 28px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('QuranFlow', W / 2, 68);

    ctx.fillStyle = '#ffffff';
    ctx.font = `${ayah.arabicText.length > 80 ? '38' : '44'}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.direction = 'rtl';
    wrapText(ctx, ayah.arabicText, W / 2, 280, W - 160, 64);
    ctx.direction = 'ltr';

    ctx.fillStyle = '#d4af37';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('· · ·', W / 2, 500);

    ctx.fillStyle = 'rgba(255,255,255,0.88)';
    const fontSize = translation.length > 150 ? 28 : 32;
    ctx.font = `400 ${fontSize}px Georgia, serif`;
    ctx.textAlign = 'center';
    const lastY = wrapText(ctx, `"${translation}"`, W / 2, 560, W - 200, fontSize + 14);

    ctx.fillStyle = '#d4af37';
    ctx.font = '500 26px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText(`— Surah ${ayah.surahName}, ${ayah.verseKey}`, W / 2, Math.max(lastY + 60, 820));

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '400 22px Georgia, serif';
    ctx.textAlign = 'center';
    ctx.fillText('quranflow-ai.vercel.app', W / 2, H - 52);

    setGenerating(false);
    setCardReady(true);
  };

  const downloadCard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `quran-${ayah.verseKey.replace(':', '-')}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    toast.success('Image saved!');
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareText);
    toast.success('Copied to clipboard!');
    setOpen(false);
  };

  const handleOpen = () => {
    setOpen(true);
    setCardReady(false);
    setTimeout(() => generateCard(), 100);
  };

  return (
    <>
      <Button variant="outline" className="rounded-xl" onClick={handleOpen}>
        <Share2 className="h-4 w-4 mr-1.5" /> Share
      </Button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-card border border-border rounded-3xl w-full max-w-sm p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="font-semibold text-foreground">Share this Ayah</p>
              <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
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
              <Button onClick={downloadCard} className="w-full rounded-xl">
                <Download className="h-4 w-4 mr-2" /> Download Image Card
              </Button>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-border" />
              <span className="text-xs text-muted-foreground">or share as text</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              {platforms.map(p => (
                <a key={p.name} href={p.url} target="_blank" rel="noopener noreferrer"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: p.bg }}
                >
                  <span className="text-base w-5 text-center">{p.icon}</span>
                  {p.name}
                </a>
              ))}
            </div>

            <button onClick={handleCopy}
              className="flex items-center justify-center gap-2 w-full px-3 py-2.5 rounded-xl text-sm font-medium bg-muted hover:bg-muted/80 text-foreground transition-colors"
            >
              <Copy className="h-4 w-4" /> Copy Text
            </button>
          </div>
        </div>
      )}
    </>
  );
}