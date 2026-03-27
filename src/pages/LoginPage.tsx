import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) { toast.error('Please fill in all fields.'); return; }
    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);
    if (error) { toast.error(error.message); return; }
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8 animate-fade-in">
        <div className="text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <Sparkles className="h-8 w-8 text-primary" />
            <span className="font-heading text-2xl font-bold text-foreground">QuranFlow AI</span>
          </Link>
          <h1 className="font-heading text-3xl font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground mt-2">Continue your journey with the Qur'an</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-3xl p-8 space-y-5">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="mt-1.5 rounded-xl" />
          </div>
          <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sign In'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Don't have an account?{' '}
          <Link to="/register" className="text-primary font-medium hover:underline">Create one</Link>
        </p>
      </div>
    </div>
  );
}
