import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard, BookOpen, MessageCircle, PenLine,
  BarChart3, Target, Bookmark, RefreshCw, User, LogOut, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/daily-ayah', label: 'Daily Ayah', icon: BookOpen },
  { path: '/ai-assistant', label: 'Companion', icon: MessageCircle },
  { path: '/reflections', label: 'Reflections', icon: PenLine },
  { path: '/progress', label: 'Progress', icon: BarChart3 },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/bookmarks', label: 'Bookmarks', icon: Bookmark },
  { path: '/reconnect', label: 'Reconnect', icon: RefreshCw },
  { path: '/profile', label: 'Profile', icon: User },
];

const mobileNavItems = navItems.slice(0, 5);

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { signOut, profile } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-secondary text-secondary-foreground fixed inset-y-0 left-0 z-30">
        <div className="p-6 border-b border-sidebar-border">
          <Link to="/dashboard" className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <span className="font-heading text-xl font-semibold">QuranFlow AI</span>
          </Link>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                location.pathname === path
                  ? 'bg-sidebar-accent text-sidebar-primary'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="text-xs text-sidebar-foreground/50 mb-2 truncate">
            {profile?.full_name || 'Welcome'}
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 pb-20 md:pb-0">
        <div className="max-w-5xl mx-auto p-4 md:p-8">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 bg-card border-t border-border z-30">
        <div className="flex justify-around py-2">
          {mobileNavItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2 py-1 text-xs transition-colors',
                location.pathname === path
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
