import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';
import { fetchTafsir } from '@/lib/quran-api';
import { cn } from '@/lib/utils';

interface TafsirViewerProps {
  verseKey: string;
  className?: string;
}

export default function TafsirViewer({ verseKey, className }: TafsirViewerProps) {
  const [tafsir, setTafsir] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const handleToggle = async () => {
    if (open) { setOpen(false); return; }
    if (tafsir) { setOpen(true); return; }
    setLoading(true);
    const text = await fetchTafsir(verseKey);
    setTafsir(text);
    setOpen(true);
    setLoading(false);
  };

  return (
    <div className={cn('glass-card rounded-2xl overflow-hidden', className)}>
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-accent/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">Tafsir Ibn Kathir</h3>
            <p className="text-xs text-muted-foreground">Scholarly commentary on this verse</p>
          </div>
        </div>
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : open ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        )}
      </button>

      {open && tafsir && (
        <div className="px-5 pb-5 border-t border-border">
          <div className="pt-4 text-sm text-muted-foreground leading-relaxed max-h-96 overflow-y-auto prose prose-sm dark:prose-invert">
            {tafsir}
          </div>
        </div>
      )}

      {open && !tafsir && !loading && (
        <div className="px-5 pb-5 border-t border-border">
          <p className="pt-4 text-sm text-muted-foreground italic">No tafsir available for this verse.</p>
        </div>
      )}
    </div>
  );
}
