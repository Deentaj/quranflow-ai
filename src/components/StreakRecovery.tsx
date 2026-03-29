import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchAyah, type AyahData } from '@/lib/quran-api';
import { Button } from '@/components/ui/button';
import { Heart, BookOpen, PenLine, RefreshCw, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const RECOVERY_AYAHS = [
  { ref: '39:53', label: 'Hope & Mercy' },
  { ref: '94:5', label: 'Ease after hardship' },
  { ref: '2:286', label: 'No burden beyond capacity' },
];

const RECOVERY_PLAN = [
  {
    day: 1,
    title: 'Read one ayah',
    description: 'Just open the app and read today\'s verse. That\'s it — no pressure.',
    icon: BookOpen,
  },
  {
    day: 2,
    title: 'Read & reflect',
    description: 'Read the daily ayah and write one sentence about what it means to you.',
    icon: PenLine,
  },
  {
    day: 3,
    title: 'Complete a reconnect session',
    description: 'Do the 5-minute reconnect flow. You\'re back on track.',
    icon: RefreshCw,
  },
];

interface StreakRecoveryProps {
  missedDays: number;
  previousStreak: number;
  onDismiss: () => void;
  className?: string;
}

export default function StreakRecovery({ missedDays, previousStreak, onDismiss, className }: StreakRecoveryProps) {
  const navigate = useNavigate();
  const [comebackAyah, setComebackAyah] = useState<AyahData | null>(null);
  const [loadingAyah, setLoadingAyah] = useState(false);
  const [showPlan, setShowPlan] = useState(false);

  const loadComebackAyah = async () => {
    setLoadingAyah(true);
    const pick = RECOVERY_AYAHS[Math.floor(Math.random() * RECOVERY_AYAHS.length)];
    const data = await fetchAyah(pick.ref);
    if (data) setComebackAyah(data);
    setLoadingAyah(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('glass-card rounded-3xl p-6 md:p-8 border-primary/20 relative overflow-hidden', className)}
    >
      {/* Decorative glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/5 blur-3xl pointer-events-none" />

      <button onClick={onDismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors">
        <X className="h-4 w-4" />
      </button>

      {/* Main message */}
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-primary/10 text-primary shrink-0 mt-0.5">
          <Heart className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-heading text-xl font-bold text-foreground">You're still on the journey</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {missedDays === 1
              ? 'You missed a day — that\'s completely okay.'
              : `It's been ${missedDays} days since your last visit.`}
            {previousStreak > 0 && ` Your ${previousStreak}-day streak shows real dedication.`}
            {' '}A small return today can become a lasting habit.
          </p>
        </div>
      </div>

      {/* Comeback ayah */}
      <AnimatePresence>
        {comebackAyah && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="rounded-2xl bg-accent/30 p-5 mb-4 space-y-2"
          >
            <p className="text-lg leading-loose text-right font-serif text-foreground" dir="rtl">
              {comebackAyah.arabicText}
            </p>
            <p className="text-sm text-muted-foreground italic">"{comebackAyah.translationText}"</p>
            <p className="text-xs text-muted-foreground">{comebackAyah.surahName} • {comebackAyah.verseKey}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3-day recovery plan */}
      <AnimatePresence>
        {showPlan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-4"
          >
            <h4 className="font-heading text-sm font-semibold text-foreground mb-3">Your 3-Day Gentle Recovery Plan</h4>
            <div className="space-y-3">
              {RECOVERY_PLAN.map((step) => (
                <div key={step.day} className="flex items-start gap-3 rounded-xl bg-card border border-border p-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                    {step.day}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        {!comebackAyah && (
          <Button size="sm" className="rounded-xl" onClick={loadComebackAyah} disabled={loadingAyah}>
            <BookOpen className="h-4 w-4 mr-1.5" />
            {loadingAyah ? 'Loading…' : 'Show Comeback Ayah'}
          </Button>
        )}
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => setShowPlan(!showPlan)}>
          <CheckCircle2 className="h-4 w-4 mr-1.5" />
          {showPlan ? 'Hide Plan' : '3-Day Recovery Plan'}
        </Button>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={() => navigate('/reconnect')}>
          <RefreshCw className="h-4 w-4 mr-1.5" />
          Reconnect Now
        </Button>
      </div>
    </motion.div>
  );
}
