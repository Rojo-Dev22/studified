import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { motion } from 'framer-motion';

export default function ProtectedRoute() {
  const { isAuthenticated, isLoadingAuth, authChecked, dbReady } = useAuth();

  if (!authChecked || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 border-accent/30 border-t-accent rounded-full"
        />
      </div>
    );
  }

  if (!isAuthenticated || !dbReady) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
