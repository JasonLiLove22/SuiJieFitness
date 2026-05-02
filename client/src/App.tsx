import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import BottomTabBar from './components/layout/BottomTabBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TrainingPage from './pages/TrainingPage';
import RunningPage from './pages/RunningPage';
import HistoryPage from './pages/HistoryPage';
import ProfilePage from './pages/ProfilePage';
import RunDetailPage, { RideDetailPage } from './pages/RunDetailPage';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/register" element={user ? <Navigate to="/" replace /> : <RegisterPage />} />
      <Route
        path="/*"
        element={
          <AuthGate>
            <Routes>
              {/* Pages with bottom tab */}
              <Route path="/" element={<TabLayout><TrainingPage /></TabLayout>} />
              <Route path="/running" element={<TabLayout><RunningPage /></TabLayout>} />
              <Route path="/history" element={<TabLayout><HistoryPage /></TabLayout>} />
              <Route path="/profile" element={<TabLayout><ProfilePage /></TabLayout>} />
              {/* Detail pages without tab */}
              <Route path="/run-detail" element={<div className="min-h-screen bg-gray-50"><RunDetailPage /></div>} />
              <Route path="/ride-detail" element={<div className="min-h-screen bg-gray-50"><RideDetailPage /></div>} />
            </Routes>
          </AuthGate>
        }
      />
    </Routes>
  );
}

function TabLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
      <BottomTabBar />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
