import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function PageSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="h-8 w-48 bg-muted rounded-lg animate-pulse" />
      <div className="h-4 w-72 bg-muted/60 rounded animate-pulse" />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-muted rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="h-64 bg-muted rounded-3xl animate-pulse" />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 text-muted-foreground">{icon}</div>
      <h3 className="font-heading text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{description}</p>
      {action}
    </div>
  );
}

export function LoadingSpinner({ className }: { className?: string }) {
  return <Loader2 className={cn('h-6 w-6 animate-spin text-primary', className)} />;
}
