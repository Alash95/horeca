import { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataProvider';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { IdleTimeout } from './components/auth/IdleTimeout';
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal';
import { AdminUserView } from './components/AdminUserView';
import { PendingAccess } from './components/auth/PendingAccess';
import { ProfilePage } from './pages/ProfilePage';
import { supabase } from './lib/supabase';
import { LanguageProvider } from './context/LanguageContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth Event:', event);
      setSession(session);

      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (isRecovering) {
    return <UpdatePasswordModal onSuccess={() => setIsRecovering(false)} />;
  }

  return <>{children}</>;
};

const LoadingView = ({ progress }: { progress: number }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
    <div className="mb-8 flex flex-col items-center">
      <div className="text-teal-500 font-bold text-3xl mb-2 tracking-tighter">HORECA INTELLIGENCE</div>
      <div className="text-slate-500 text-xs tracking-[0.3em] uppercase">Advanced Dashboard Analytics</div>
    </div>

    <div className="w-full max-w-md bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl">
      <div className="flex justify-between items-end mb-4">
        <span className="text-slate-400 text-sm font-medium">Initializing Data</span>
        <span className="text-teal-400 font-mono text-2xl font-bold">{progress}%</span>
      </div>

      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden shadow-inner">
        <div
          className="bg-gradient-to-r from-teal-600 to-teal-400 h-full transition-all duration-700 ease-in-out shadow-[0_0_12px_rgba(20,184,166,0.3)]"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="mt-6 flex justify-center">
        <div className="flex space-x-1">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>

    <div className="mt-12 text-slate-600 text-[10px] uppercase tracking-widest">
      &copy; 2026 HORECA INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED.
    </div>
  </div>
);

// Dashboard Content Wrapper (handles Data Loading)
const DashboardContent = () => {
  const { loading, error, loadingProgress } = useData();

  if (loading) return <LoadingView progress={loadingProgress} />;

  if (error) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg m-6">
      Error loading data: {error}
    </div>
  );

  return <Dashboard />
};

// Access Guard Component
const DashboardAccessGuard = ({ children }: { children: ReactNode }) => {
  const { userPermissions, loading, loadingProgress } = useData();

  if (loading) return <LoadingView progress={loadingProgress} />;

  // Super admins skip the check
  if (userPermissions.role === 'super_admin' || userPermissions.role === 'admin') {
    return <>{children}</>;
  }

  // If brand is PENDING, show the pending screen
  if (userPermissions.brand === 'PENDING') {
    return <PendingAccess />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          {/* Public Landing Page */}
          <Route path="/" element={<LandingPage />} />

          {/* Protected Dashboard Routes */}
          <Route path="/dashboard/*" element={
            <ProtectedRoute>
              <DataProvider>
                <IdleTimeout />
                <DashboardAccessGuard>
                  <Layout>
                    <Routes>
                      <Route index element={<DashboardContent />} />
                      <Route path="admin" element={<AdminUserView />} />
                      <Route path="profile" element={<ProfilePage />} />
                    </Routes>
                  </Layout>
                </DashboardAccessGuard>
              </DataProvider>
            </ProtectedRoute>
          } />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;