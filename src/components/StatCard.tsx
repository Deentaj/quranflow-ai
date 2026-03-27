import { cn } from '@/lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}

export default function StatCard({ label, value, icon, className }: StatCardProps) {
  return (
    <div className={cn('glass-card rounded-2xl p-5', className)}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground">{label}</span>
        {icon && <span className="text-primary">{icon}</span>}
      </div>
      <p className="text-2xl font-heading font-semibold text-foreground">{value}</p>
    </div>
  );
}
