import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, dbReady } = useAuth();

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-accent/30 border-t-accent rounded-full"
        />
        <p className="text-sm font-medium text-foreground">Preparing your arcade…</p>
        <p className="text-[11px] text-muted-foreground">Syncing your profile &amp; coins — this only takes a moment</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
