import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  signInWithPopup,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Mail, Lock, User } from '@/components/ui/icons';

function getAuthErrorMessage(err) {
  if (!err || typeof err !== 'object') return 'Authentication failed';
  
  const code = err.code;
  const message = err.message;
  
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Email already registered — try logging in';
    case 'auth/operation-not-allowed':
      return 'Email/Password sign-in is disabled in Firebase. Enable it in Firebase Console → Authentication.';
    case 'auth/invalid-credential':
      return 'Invalid email or password';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Firebase Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.';
    case 'auth/network-request-failed':
      return 'Network error — check your connection and try again';
    case 'auth/too-many-requests':
      return 'Too many attempts — try again later';
    case 'auth/user-disabled':
      return 'This user account is disabled';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters';
    case 'auth/popup-closed-by-user':
      return 'Sign in cancelled';
    default:
      return message || 'Authentication failed';
  }
}

export default function AuthForm({ mode, onModeChange }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isFirebaseConfigured()) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-1">Firebase not configured</p>
        <p className="text-xs">
          Copy <code className="bg-secondary px-1 rounded">.env.example</code> to{' '}
          <code className="bg-secondary px-1 rounded">.env.local</code> and set the <code className="bg-secondary px-1 rounded">VITE_FIREBASE_*</code> values.
          Enable Email/Password auth and Firestore in the Firebase console.
        </p>
      </div>
    );
  }

  const googleSignIn = async () => {
    try {
      setError('');
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast.success('Welcome back!');
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      const msg = 'Use a valid email and password (6+ characters)';
      setError(msg);
      toast.error(msg);
      return;
    }
    setError('');
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(cred.user, { displayName: name.trim() });
        }
        toast.success('Account created — welcome to Studified!');
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        toast.success('Welcome back!');
      }
    } catch (err) {
      const msg = getAuthErrorMessage(err);
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="flex rounded-lg bg-secondary/80 p-1 mb-4">
        {['login', 'signup'].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => { onModeChange(m); setError(''); }}
            className={`flex-1 py-2 text-xs font-medium rounded-md transition-all ${
              mode === m ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {m === 'login' ? 'Log in' : 'Sign up'}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          onSubmit={handleSubmit}
          className="space-y-3"
        >
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs"
            >
              {error}
            </motion.div>
          )}
          {mode === 'signup' && (
            <div>
              <Label className="text-xs text-muted-foreground">Full name</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Hana Bekele"
                  className="pl-9 h-10 bg-card border-border"
                />
              </div>
            </div>
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Email</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.et"
                className="pl-9 h-10 bg-card border-border"
                required
              />
            </div>
          </div>
           <div>
             <Label className="text-xs text-muted-foreground">Password</Label>
             <div className="relative mt-1">
               <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
               <Input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="••••••••"
                 className="pl-9 h-10 bg-card border-border"
                 required
                 minLength={6}
               />
             </div>
           </div>
           
           {/* Google Sign In Button */}
           <Button
             type="button"
             onClick={googleSignIn}
             disabled={loading}
             className="w-full h-11 flex items-center justify-center gap-2.5 rounded-lg bg-white text-gray-800 border border-border hover:bg-muted/60 active:scale-[0.98] transition-all shadow-sm"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
               <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
               <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
               <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
               <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.82 14.97 2 12 2 7.7 2 3.99 4.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
             </svg>
             <span className="text-sm font-medium">Continue with Google</span>
           </Button>
           
           <Button
            type="submit"
            disabled={loading}
            className="w-full h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'login' ? (
              'Log in'
            ) : (
              'Create account'
            )}
          </Button>
        </motion.form>
      </AnimatePresence>
      <p className="text-[10px] text-center text-muted-foreground mt-3">
        Your assignments, XP, and progress are saved to your account.
      </p>
    </div>
  );
}