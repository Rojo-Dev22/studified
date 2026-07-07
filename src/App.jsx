import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Landing from './pages/Landing';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Quests from './pages/Quests';
import Focus from './pages/Focus';
import Guild from './pages/Guild';
import GuildRoom from './pages/GuildRoom';
import Raids from './pages/Raids';
import AITools from './pages/AITools';
import Lessons from './pages/Lessons';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import MiniGames from './pages/MiniGames';
import { motion } from 'framer-motion';

function AppLoading() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <motion.div
          className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/30 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-accent/10"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            ease: 'easeInOut'
          }}
        >
          <span className="text-2xl font-bold text-accent">S</span>
        </motion.div>
        <motion.p 
          className="text-sm text-foreground font-medium mb-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          Studified
        </motion.p>
        <motion.p 
          className="text-xs text-muted-foreground tracking-widest uppercase"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Loading your experience...
        </motion.p>
        <motion.div 
          className="flex gap-1 justify-center mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2 h-2 rounded-full bg-accent/60"
              animate={{ 
                scale: [1, 1.3, 1],
                opacity: [0.4, 1, 0.4]
              }}
              transition={{ 
                duration: 1.2, 
                repeat: Infinity,
                delay: i * 0.2
              }}
            />
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}

function AppRoutes() {
  const { isLoadingAuth, authChecked, isAuthenticated, dbReady } = useAuth();

  if (!authChecked || isLoadingAuth) {
    return <AppLoading />;
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAuthenticated && dbReady ? <Navigate to="/dashboard" replace /> : <Landing />
        }
      />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/quests" element={<Quests />} />
          <Route path="/focus" element={<Focus />} />
          <Route path="/guild" element={<Guild />} />
          <Route path="/guild/:guildId" element={<GuildRoom />} />
          <Route path="/raids" element={<Raids />} />
          <Route path="/ai-tools" element={<AITools />} />
          <Route path="/lessons" element={<Lessons />} />
          <Route path="/minigames" element={<MiniGames />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AppRoutes />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
