import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sparkles, BookOpen, Brain, Target, RefreshCw, PenLine, BarChart3, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  { icon: BookOpen, title: 'Daily Ayah Journey', desc: 'A personalized verse each day with meaning, context, and reflection prompts.' },
  { icon: Brain, title: 'AI Companion', desc: 'Ask questions, get verse recommendations, and receive gentle spiritual guidance.' },
  { icon: PenLine, title: 'Reflection Journal', desc: 'Record your thoughts and connect deeply with every verse you encounter.' },
  { icon: Target, title: 'Goal Planner', desc: 'Set and track Qur\'anic goals at your own pace.' },
  { icon: RefreshCw, title: '5-Min Reconnect', desc: 'A low-pressure way to return when you feel disconnected.' },
  { icon: BarChart3, title: 'Progress Tracking', desc: 'See your streaks, consistency, and spiritual growth over time.' },
];

const steps = [
  { step: '1', title: 'Sign Up', desc: 'Create your account in seconds.' },
  { step: '2', title: 'Set Your Intention', desc: 'Tell us your goals and how much time you have.' },
  { step: '3', title: 'Show Up Daily', desc: 'Read, reflect, and grow — one ayah at a time.' },
];

const faqs = [
  { q: 'Is this app free?', a: 'Yes, QuranFlow AI is free to use with all core features.' },
  { q: 'Do I need to read Arabic?', a: 'No — every ayah comes with an English translation and simple explanation.' },
  { q: 'Is the AI giving religious rulings?', a: 'No. The AI provides Qur\'anic references and gentle guidance. For rulings, consult a qualified scholar.' },
  { q: 'How much time do I need?', a: 'As little as 5 minutes a day. The Reconnect feature is designed for exactly that.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-bold text-foreground">QuranFlow AI</span>
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild className="rounded-xl"><Link to="/login">Sign In</Link></Button>
            <Button asChild className="rounded-xl"><Link to="/register">Get Started</Link></Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <span className="inline-block text-xs font-medium bg-primary/10 text-primary px-3 py-1 rounded-full mb-6">Your Qur'anic companion</span>
            <h1 className="font-heading text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Stay Connected to the Qur'an Beyond Ramadan
            </h1>
            <p className="text-lg text-muted-foreground mt-6 max-w-xl mx-auto">
              Build a gentle, lasting relationship with the Qur'an through daily verses, AI-powered guidance, reflections, and habit tracking.
            </p>
            <div className="flex gap-3 justify-center mt-8">
              <Button size="lg" asChild className="rounded-xl h-12 px-8"><Link to="/register">Get Started <ArrowRight className="h-4 w-4 ml-2" /></Link></Button>
              <Button size="lg" variant="outline" asChild className="rounded-xl h-12 px-8"><Link to="#features">Explore Features</Link></Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-4">The Challenge</h2>
          <p className="text-muted-foreground text-lg">
            Many Muslims reconnect with the Qur'an during Ramadan, but struggle to maintain that connection afterwards. 
            QuranFlow AI makes daily Qur'anic engagement simple, personal, and sustainable — no guilt, just growth.
          </p>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">Everything you need</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map(({ icon: Icon, title, desc }) => (
              <motion.div key={title} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="glass-card rounded-2xl p-6">
                <Icon className="h-8 w-8 text-primary mb-3" />
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-4 bg-muted/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold text-foreground mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map(({ step, title, desc }) => (
              <div key={step}>
                <div className="h-12 w-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mx-auto mb-4">{step}</div>
                <h3 className="font-heading text-lg font-semibold text-foreground mb-1">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 px-4">
        <div className="max-w-2xl mx-auto">
          <h2 className="font-heading text-3xl font-bold text-foreground text-center mb-12">FAQ</h2>
          <div className="space-y-4">
            {faqs.map(({ q, a }) => (
              <div key={q} className="glass-card rounded-2xl p-5">
                <h3 className="font-medium text-foreground mb-1">{q}</h3>
                <p className="text-sm text-muted-foreground">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-secondary text-secondary-foreground">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="font-heading text-3xl font-bold mb-4">Begin your journey today</h2>
          <p className="text-secondary-foreground/70 mb-8">A small return today can become a lasting habit.</p>
          <Button size="lg" asChild className="rounded-xl h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90">
            <Link to="/register">Get Started Free <ArrowRight className="h-4 w-4 ml-2" /></Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-4 border-t border-border">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span className="font-heading font-semibold text-foreground">QuranFlow AI</span>
          </div>
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} QuranFlow AI. Built with love and intention.</p>
        </div>
      </footer>
    </div>
  );
}
