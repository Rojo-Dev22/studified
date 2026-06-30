import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import {
  BookOpen,
  Zap,
  Sparkles,
  Timer,
  Trophy,
  GraduationCap,
  ChevronRight,
  Users,
} from 'lucide-react';
import AuthForm from '@/components/auth/AuthForm';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/lib/AuthContext';
import { Navigate } from 'react-router-dom';

const features = [
  {
    icon: BookOpen,
    title: 'MoE Assignments',
    desc: 'Built-in lessons aligned with the Ethiopian curriculum — pass in-app quizzes to earn XP.',
    color: 'text-accent',
  },
  {
    icon: Zap,
    title: 'Group Challenges',
    desc: 'Join curriculum challenges with classmates and verify your work inside the app.',
    color: 'text-blue-400',
  },
  {
    icon: Sparkles,
    title: 'Study AI',
    desc: 'Chat, summarize, 15-question quizzes, and note cards tuned for Grades 9–12.',
    color: 'text-violet-400',
  },
  {
    icon: Timer,
    title: 'Focus Timer',
    desc: 'Pomodoro-style sessions with XP rewards for every minute you stay on task.',
    color: 'text-amber-400',
  },
];

const floatingVariants = {
  animate: (i) => ({
    y: [0, -12, 0],
    transition: { duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut' },
  }),
};

function GlowOrb({ className, delay = 0 }) {
  return (
    <motion.div
      className={`absolute rounded-full blur-3xl pointer-events-none ${className}`}
      animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.65, 0.4] }}
      transition={{ duration: 6, repeat: Infinity, delay }}
    />
  );
}

export default function Landing() {
  const { isAuthenticated, dbReady, isLoadingAuth, authError } = useAuth();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll();
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, 80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.3]);
  const [showAuth, setShowAuth] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Handle mouse move for interactive background
  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1, // Normalize to -1 to 1
        y: (e.clientY / window.innerHeight) * 2 - 1
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  if (isAuthenticated && dbReady && !isLoadingAuth) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
       <div className="fixed inset-0 -z-10">
         <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(142_71%_45%/0.15),transparent)]" />
         <GlowOrb 
           className={`w-[650px] h-[650px] bg-accent/20 -top-40 -left-40`} 
           style={{ 
             transform: `translate(${mousePos.x * 20}px, ${mousePos.y * 20}px)` 
           }} 
           delay={0} 
         />
         <GlowOrb 
           className={`w-[600px] h-[600px] bg-blue-500/15 top-1/3 -right-32`} 
           style={{ 
             transform: `translate(${-mousePos.x * 15}px, ${-mousePos.y * 15}px)` 
           }} 
           delay={2} 
         />
         <GlowOrb 
           className={`w-[550px] h-[550px] bg-violet-500/10 bottom-0 left-1/4`} 
           style={{ 
             transform: `translate(${mousePos.x * 10}px, ${-mousePos.y * 10}px)` 
           }} 
           delay={1} 
         />
         <div
           className="absolute inset-0 opacity-[0.03]"
           style={{
             backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
             backgroundSize: '32px 32px',
           }}
         />
       </div>

      <header className="relative z-10 flex items-center justify-between px-5 md:px-10 py-5">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-2.5"
        >
          <motion.div
            className="w-9 h-9 rounded-lg bg-foreground flex items-center justify-center"
            whileHover={{ scale: 1.05, rotate: 3 }}
          >
            <span className="text-background text-sm font-bold">S</span>
          </motion.div>
          <span className="text-lg font-semibold tracking-tight">Studified</span>
        </motion.div>
         <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
           <a href="#" onClick={(e) => { e.preventDefault(); setShowAuth(true); }} className="text-xs text-muted-foreground hover:text-accent transition-colors">
             Jump to sign in →
           </a>
         </motion.div>
      </header>

         <section ref={heroRef} className="relative px-5 md:px-10 pt-8 pb-20 md:pt-16">
           <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
             <motion.div style={{ y: heroY, opacity: heroOpacity }}>
               <motion.div
                 initial={{ opacity: 0, y: 24 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ duration: 0.6 }}
               >
                 <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-[10px] font-medium text-accent uppercase tracking-wider mb-4">
                   <GraduationCap className="w-3 h-3" />
                   Ethiopian General Education · Grades 9–12
                 </span>
                 <h1 className="text-3xl md:text-5xl font-bold leading-tight tracking-tight">
                   Study smarter.
                   <br />
                   <span className="text-accent">Level up</span> your grades.
                 </h1>
                 <p className="text-muted-foreground mt-4 text-sm md:text-base max-w-lg leading-relaxed">
                   Assignments, challenges, focus sessions, and AI tools — all built for the MoE curriculum.
                   Your progress syncs to your account.
                 </p>
               </motion.div>
 
               <motion.div
                 className="flex flex-wrap gap-3 mt-8"
                 initial={{ opacity: 0, y: 16 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.2 }}
               >
                 <a href="#" onClick={(e) => { e.preventDefault(); setShowAuth(true); }}>
                   <Button className="h-10 px-5 bg-accent text-accent-foreground hover:bg-accent/90 group">
                     Get started
                     <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
                   </Button>
                 </a>
                 <a href="#features">
                   <Button variant="outline" className="h-10 px-5 border-border">
                     See features
                   </Button>
                 </a>
               </motion.div>
 
               <motion.div
                 className="grid grid-cols-3 gap-4 mt-10 pt-8 border-t border-border/60"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.4 }}
               >
                 {[
                   { n: '20+', l: 'MoE assignments' },
                   { n: '10', l: 'Group challenges' },
                   { n: '∞', l: 'AI study help' },
                 ].map((stat, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     transition={{ delay: i * 0.1 }}
                     whileHover={{ scale: 1.05 }}
                   >
                     <div key={i}>
                       <p className="text-xl font-bold text-accent">{stat.n}</p>
                       <p className="text-[10px] text-muted-foreground">{stat.l}</p>
                     </div>
                   </motion.div>
                 ))}
               </motion.div>
             </motion.div>

         {showAuth && (
           <motion.div
             id="auth"
             initial={{ opacity: 0, scale: 0.96, y: 30 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             transition={{ duration: 0.55, delay: 0.15 }}
             className="relative"
           >
             <motion.div
               className="absolute -inset-1 rounded-2xl bg-gradient-to-br from-accent/40 via-transparent to-blue-500/30 blur-xl"
               animate={{ opacity: [0.5, 0.8, 0.5] }}
               transition={{ duration: 3, repeat: Infinity }}
             />
             <div className="relative rounded-2xl border border-border/80 bg-card/90 backdrop-blur-xl p-6 md:p-8 shadow-2xl">
               <div className="flex justify-between items-center mb-1">
                 <h2 className="text-lg font-semibold">Create your account</h2>
                 <button onClick={() => setShowAuth(false)} aria-label="Close" className="text-muted-foreground hover:text-accent">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                   </svg>
                 </button>
               </div>
               <p className="text-xs text-muted-foreground mb-5">Log in or sign up with Firebase — your data stays private.</p>
               {authError?.message ? (
                 <Alert variant="destructive" className="mb-4">
                   <AlertTitle>Sign in error</AlertTitle>
                   <AlertDescription>{authError.message}</AlertDescription>
                 </Alert>
               ) : null}
               <AuthForm />
             </div>

             {[BookOpen, Trophy, Users].map((Icon, i) => (
               <motion.div
                 key={i}
                 custom={i}
                 variants={floatingVariants}
                 animate="animate"
                 className={`absolute hidden md:flex w-10 h-10 rounded-lg border border-border bg-card/80 items-center justify-center shadow-lg
                   ${i === 0 ? '-left-4 top-1/4' : i === 1 ? '-right-4 top-1/2' : 'left-1/3 -bottom-4'}`}
               >
                 <Icon className="w-4 h-4 text-accent" />
               </motion.div>
             ))}
           </motion.div>
         )}
        </div>
      </section>

      <section id="features" className="px-5 md:px-10 py-20 border-t border-border/50">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-bold">Everything in one study hub</h2>
            <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
              Same dark, focused UI you will use after signing in — built for Ethiopian secondary students.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group rounded-xl border border-border bg-card/50 p-5 hover:border-accent/30 hover:bg-card transition-colors"
              >
                <f.icon className={`w-8 h-8 mb-3 ${f.color}`} />
                <h3 className="font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 md:px-10 py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/10 to-transparent p-10"
        >
          <Trophy className="w-10 h-10 text-accent mx-auto mb-4" />
          <h2 className="text-xl font-bold">Ready to earn XP?</h2>
          <p className="text-sm text-muted-foreground mt-2 mb-6">
            Join Studified — assignments, challenges, and AI study tools await.
          </p>
           <a href="#" onClick={(e) => { e.preventDefault(); setShowAuth(true); }}>
             <Button className="bg-foreground text-background hover:bg-foreground/90 h-10 px-6">
               Sign up free
             </Button>
           </a>
        </motion.div>
      </section>

      <footer className="px-5 py-8 border-t border-border text-center text-[10px] text-muted-foreground">
        Studified · Ethiopian General Education Curriculum (MoE) · Grades 9–12
      </footer>
    </div>
  );
}

