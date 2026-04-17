import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sparkles, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [adminCode, setAdminCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !email.trim() || !password) { toast.error('Please fill in all fields.'); return; }
    if (password.length < 6) { toast.error('Password must be at least 6 characters.'); return; }
    setLoading(true);
    const { error } = await signUp(email, password, fullName);
    if (error) { setLoading(false); toast.error(error.message); return; }

    if (adminCode.trim()) {
      // Wait briefly for session, then attempt redemption
      const { supabase } = await import('@/integrations/supabase/client');
      await new Promise(r => setTimeout(r, 400));
      const { data, error: rpcError } = await supabase.rpc('redeem_admin_invite_code', { _code: adminCode.trim() });
      if (rpcError || !data) toast.error('Admin code invalid or already used. Account created without admin role.');
      else toast.success('Admin access granted!');
    }

    setLoading(false);
    toast.success('Account created! Welcome to QuranFlow AI.');
    navigate('/onboarding');
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    const result = await lovable.auth.signInWithOAuth('google', {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error('Google sign-in failed. Please try again.');
      setGoogleLoading(false);
      return;
    }
    if (result.redirected) return;
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
          <h1 className="font-heading text-3xl font-bold text-foreground">Begin your journey</h1>
          <p className="text-muted-foreground mt-2">A small return today can become a lasting habit</p>
        </div>

        <div className="glass-card rounded-3xl p-8 space-y-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogleSignIn}
            disabled={googleLoading}
            className="w-full rounded-xl h-11 gap-2"
          >
            {googleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
              <svg className="h-4 w-4" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            )}
            Continue with Google
          </Button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
            <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Your name" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="At least 6 characters" className="mt-1.5 rounded-xl" />
            </div>
            <div>
              <Label htmlFor="adminCode" className="text-muted-foreground">Admin invite code <span className="text-xs">(optional)</span></Label>
              <Input id="adminCode" value={adminCode} onChange={e => setAdminCode(e.target.value)} placeholder="Leave blank for normal signup" className="mt-1.5 rounded-xl font-mono text-sm" />
            </div>
            <Button type="submit" disabled={loading} className="w-full rounded-xl h-11">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Account'}
            </Button>
          </form>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  );
}