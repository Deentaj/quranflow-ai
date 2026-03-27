import { useState, useRef } from 'react';
import { Volume2, VolumeX, Loader2 } from 'lucide-react';
import type { AyahData } from '@/lib/quran-api';
import { cn } from '@/lib/utils';

interface AyahDisplayProps {
  ayah: AyahData;
  whyItMatters?: string;
  applyToday?: string;
  className?: string;
}

export default function AyahDisplay({ ayah, whyItMatters, applyToday, className }: AyahDisplayProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggleAudio = () => {
    if (!ayah.audioUrl) return;
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
    } else {
      setAudioLoading(true);
      const audio = new Audio(ayah.audioUrl);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.oncanplaythrough = () => setAudioLoading(false);
      audio.play().then(() => setIsPlaying(true)).catch(() => setAudioLoading(false));
    }
  };

  return (
    <div className={cn('glass-card rounded-3xl p-6 md:p-8 space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wider">
            {ayah.surahName} • Verse {ayah.verseNumber}
          </p>
          <p className="text-xs text-muted-foreground/60 mt-0.5">{ayah.surahNameArabic}</p>
        </div>
        {ayah.audioUrl && (
          <button
            onClick={toggleAudio}
            className="p-2 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
          >
            {audioLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : isPlaying ? (
              <VolumeX className="h-5 w-5" />
            ) : (
              <Volume2 className="h-5 w-5" />
            )}
          </button>
        )}
      </div>

      {/* Arabic text */}
      <p className="text-2xl md:text-3xl leading-loose text-right font-serif text-foreground" dir="rtl">
        {ayah.arabicText}
      </p>

      {/* Translation */}
      <p className="text-base md:text-lg text-muted-foreground leading-relaxed italic">
        "{ayah.translationText}"
      </p>

      {/* Explanation sections */}
      {whyItMatters && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-primary mb-1">Why this matters</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{whyItMatters}</p>
        </div>
      )}
      {applyToday && (
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-semibold text-accent-foreground mb-1">✨ Apply this today</h4>
          <p className="text-sm text-muted-foreground leading-relaxed">{applyToday}</p>
        </div>
      )}
    </div>
  );
}
