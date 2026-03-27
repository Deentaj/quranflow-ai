import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Sparkles, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

const steps = [
  {
    question: 'Why are you here?',
    key: 'why_here',
    options: ['Build consistency', 'Understand the Qur\'an better', 'Reflect more deeply', 'Reconnect after Ramadan'],
  },
  {
    question: 'How much time can you commit daily?',
    key: 'daily_time',
    options: ['5 min', '10 min', '15 min', '20+ min'],
  },
  {
    question: 'How are you feeling spiritually?',
    key: 'spiritual_state',
    options: ['Just restarting', 'Trying to be consistent', 'Already regular', 'Feeling disconnected'],
  },
  {
    question: 'What would help you most?',
    key: 'help_needed',
    options: ['Daily reminders', 'Motivation', 'Reflection prompts', 'Simpler understanding'],
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const step = steps[currentStep];

  const handleSelect = (option: string) => {
    setAnswers(prev => ({ ...prev, [step.key]: option }));
  };

  const handleNext = async () => {
    if (!answers[step.key]) { toast.error('Please select an option.'); return; }

    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      setLoading(true);
      if (user) {
        await supabase.from('onboarding_answers').insert([{
          user_id: user.id,
          why_here: answers.why_here,
          daily_time: answers.daily_time,
          spiritual_state: answers.spiritual_state,
          help_needed: answers.help_needed,
        }]);
        
        const dailyGoalMap: Record<string, number> = { '5 min': 1, '10 min': 2, '15 min': 3, '20+ min': 5 };
        await supabase.from('profiles').update({
          onboarding_completed: true,
          daily_goal: dailyGoalMap[answers.daily_time] || 1,
        }).eq('user_id', user.id);
        
        await refreshProfile();
      }
      setLoading(false);
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-8">
        <div className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">Step {currentStep + 1} of {steps.length}</p>
          <div className="flex gap-1.5 justify-center mt-3">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1.5 rounded-full transition-all', i <= currentStep ? 'w-8 bg-primary' : 'w-4 bg-muted')} />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="glass-card rounded-3xl p-8"
          >
            <h2 className="font-heading text-2xl font-semibold text-foreground mb-6">{step.question}</h2>
            <div className="space-y-3">
              {step.options.map(option => (
                <button
                  key={option}
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full text-left px-4 py-3.5 rounded-2xl border text-sm font-medium transition-all',
                    answers[step.key] === option
                      ? 'bg-primary/10 border-primary text-primary'
                      : 'bg-card border-border text-foreground hover:border-primary/30'
                  )}
                >
                  {option}
                </button>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        <Button onClick={handleNext} disabled={loading || !answers[step.key]} className="w-full rounded-xl h-11">
          {currentStep < steps.length - 1 ? (
            <>Continue <ArrowRight className="h-4 w-4 ml-2" /></>
          ) : loading ? 'Setting up...' : 'Start your journey'}
        </Button>
      </div>
    </div>
  );
}
