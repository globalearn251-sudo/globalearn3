import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import IntersectObserver from '@/components/common/IntersectObserver';
import { AuthProvider } from '@/contexts/AuthContext';
import { RouteGuard } from '@/components/common/RouteGuard';
import { BottomNav } from '@/components/layouts/BottomNav';
import { Toaster } from '@/components/ui/toaster';
import routes from './routes';

function AppContent() {
  const location = useLocation();
  const hideBottomNav = location.pathname.startsWith('/admin') || 
                        location.pathname === '/login' || 
                        location.pathname === '/signup';

  return (
    <>
      <IntersectObserver />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      }>
        <Routes>
          {routes.map((route, index) => {
            if (route.children) {
              return (
                <Route key={index} path={route.path} element={route.element}>
                  {route.children.map((child, childIndex) => (
                    <Route key={childIndex} path={child.path} element={child.element} />
                  ))}
                </Route>
              );
            }
            return <Route key={index} path={route.path} element={route.element} />;
          })}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      {!hideBottomNav && <BottomNav />}
      <Toaster />
    </>
  );
}

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <RouteGuard>
          <AppContent />
        </RouteGuard>
      </AuthProvider>
    </Router>
  );
};

export default App;
