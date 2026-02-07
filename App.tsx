import { ReactNode, useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './context/DataProvider';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { IdleTimeout } from './components/auth/IdleTimeout';
import { UpdatePasswordModal } from './components/auth/UpdatePasswordModal';
import { AdminUserView } from './components/AdminUserView';
import { supabase } from './lib/supabase';

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

// Dashboard Content Wrapper (handles Data Loading)
const DashboardContent = () => {
  const { loading, error } = useData();

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-[400px]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
    </div>
  );

  if (error) return (
    <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
      Error loading data: {error}
    </div>
  );

  return <Dashboard />
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Protected Dashboard Routes */}
        <Route path="/dashboard/*" element={
          <ProtectedRoute>
            <DataProvider>
              <IdleTimeout />
              <Layout>
                <Routes>
                  <Route index element={<DashboardContent />} />
                  <Route path="admin" element={<AdminUserView />} />
                </Routes>
              </Layout>
            </DataProvider>
          </ProtectedRoute>
        } />

        {/* Redirect unknown routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;