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
import { Loader2, Mail, Lock, User } from 'lucide-react';

export default function AuthForm() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || password.length < 6) {
      toast.error('Use a valid email and password (6+ characters)');
      return;
    }
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
      const msg =
        err.code === 'auth/email-already-in-use'
          ? 'Email already registered — try logging in'
          : err.code === 'auth/operation-not-allowed'
            ? 'Email/Password sign-in is disabled in Firebase. Enable it in Firebase Console → Authentication.'
          : err.code === 'auth/invalid-credential'
            ? 'Invalid email or password'
            : err.code === 'auth/unauthorized-domain'
              ? 'This domain is not authorized for Firebase Auth. Add it in Firebase Console → Authentication → Settings → Authorized domains.'
            : err.code === 'auth/network-request-failed'
              ? 'Network error — check your connection and try again'
            : err.code === 'auth/too-many-requests'
              ? 'Too many attempts — try again later'
            : err.code === 'auth/user-disabled'
              ? 'This user account is disabled'
            : err.code === 'auth/weak-password'
              ? 'Password should be at least 6 characters'
              : err.message || 'Authentication failed';
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
            onClick={() => setMode(m)}
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
             onClick={async () => {
               try {
                 setLoading(true);
                 const provider = new GoogleAuthProvider();
                 await signInWithPopup(auth, provider);
                 toast.success('Welcome back!');
               } catch (err) {
                 const msg =
                   err.code === 'auth/popup-closed-by-user'
                     ? 'Sign in cancelled'
                     : err.message || 'Authentication failed';
                 toast.error(msg);
               } finally {
                 setLoading(false);
               }
             }}
             disabled={loading}
             className="w-full h-10 flex items-center justify-center gap-2 bg-white text-muted-foreground border border-input hover:bg-muted/50"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 2a.5.5 0 01.5-.5h1a.5.5 0 010 1h-1a.5.5 0 01-.5-.5zm0-3a6 6 0 00-7.214 8.786c-.39.59-.59 1.31-.59 2.086V20h5.04l1.825-2.738a5.957 5.957 0 012.16-2.086H12zm5.786-3a5.957 5.957 0 01-2.16 2.086l-1.825 2.738V20h5.04c.39-.775.59-1.496.59-2.086v-1.114c0-.775-.2-1.496-.59-2.086z" />
             </svg>
             Continue with Google
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
