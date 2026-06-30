import { useState, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import { Button } from '@/components/ui/button';
import { PageSkeleton } from '@/components/UIStates';
import { FileText, RefreshCw, Calendar, Activity, PenLine, Smile, Flame, Download } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface ReportMetadata {
  activeDays: number;
  totalActivities: number;
  totalReflections: number;
  totalMoodCheckins: number;
  dominantMood: string | null;
  streak: number;
}

export default function WeeklyReportPage() {
  const { user } = useAuth();
  const [report, setReport] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<ReportMetadata | null>(null);
  const [loading, setLoading] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  const downloadPDF = async () => {
    if (!reportRef.current) return;
    const html2pdf = (await import('html2pdf.js')).default;
    const opt = {
      margin: [0.75, 0.75] as [number, number],
      filename: `weekly-report-${new Date().toISOString().split('T')[0]}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const },
    };
    html2pdf().set(opt).from(reportRef.current).save();
  };

  const generateReport = async () => {
    if (!user) return;
    setLoading(true);
    setReport(null);

    try {
      const { data, error } = await supabase.functions.invoke('weekly-report', {});

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setReport(data.report);
      setMetadata(data.metadata);
    } catch (e: any) {
      console.error(e);
      toast.error('Failed to generate report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const MOOD_EMOJI: Record<string, string> = {
    stressed: '😰', calm: '😌', tired: '😴',
    hopeful: '🌟', grateful: '🤲', unmotivated: '😔',
  };

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Weekly Report</h1>
            <p className="text-muted-foreground mt-1">AI-generated spiritual summary of your week</p>
          </div>
          <div className="flex gap-2">
            {report && (
              <Button onClick={downloadPDF} variant="outline" className="rounded-xl">
                <Download className="h-4 w-4 mr-1.5" /> Download PDF
              </Button>
            )}
            <Button onClick={generateReport} disabled={loading} className="rounded-xl">
              {loading ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <FileText className="h-4 w-4 mr-1.5" />}
              {loading ? 'Generating...' : report ? 'Regenerate' : 'Generate Report'}
            </Button>
          </div>
        </div>

        {loading && (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
              <RefreshCw className="h-8 w-8 text-primary animate-spin" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Analyzing your spiritual journey...</p>
              <p className="text-sm text-muted-foreground mt-1">Reviewing your activities, moods, reflections, and goals</p>
            </div>
          </div>
        )}

        {!loading && !report && (
          <div className="glass-card rounded-2xl p-8 text-center space-y-4">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mx-auto">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <div>
              <p className="font-heading text-lg font-semibold text-foreground">Your Weekly Spiritual Report</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                Get a personalized AI summary of your week — mood trends, reflection highlights, goal progress, and suggestions for growth.
              </p>
            </div>
            <Button onClick={generateReport} className="rounded-xl">
              <FileText className="h-4 w-4 mr-1.5" /> Generate My Report
            </Button>
          </div>
        )}

        {metadata && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { icon: Calendar, label: 'Active Days', value: `${metadata.activeDays}/7` },
              { icon: Activity, label: 'Activities', value: metadata.totalActivities },
              { icon: PenLine, label: 'Reflections', value: metadata.totalReflections },
              { icon: Smile, label: 'Mood Check-ins', value: metadata.totalMoodCheckins },
              { icon: Flame, label: 'Streak', value: `${metadata.streak} days` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="glass-card rounded-xl p-3 text-center">
                <Icon className="h-4 w-4 text-primary mx-auto mb-1" />
                <p className="text-lg font-bold text-foreground">{value}</p>
                <p className="text-xs text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        )}

        {report && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card rounded-2xl p-6 md:p-8"
          >
            <div ref={reportRef} className="prose prose-sm dark:prose-invert max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-h1:text-2xl prose-h1:mb-4
              prose-h2:text-lg prose-h2:mt-6 prose-h2:mb-2
              prose-p:text-foreground/90 prose-p:leading-relaxed
              prose-li:text-foreground/90
              prose-strong:text-foreground
            ">
              <ReactMarkdown>{report}</ReactMarkdown>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AppLayout>
  );
}
