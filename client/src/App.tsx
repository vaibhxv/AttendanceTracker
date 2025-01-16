import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useLocation } from 'react-router-dom';
import AttendanceTracker from './components/AttendanceTracker';
import Login from './components/Login';
import Register from './components/Register';
import Navbar from './components/Navbar';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { Toaster } from "@/components/ui/toaster";

// Protected Route Component with location state handling
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const location = useLocation();
  
  if (!user) {
    // Pass the attempted location to login for redirect after authentication
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return <>{children}</>;
};

// Main App Content Component
const AppContent = () => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Get the redirect path from location state or default to '/'
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || '/';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AttendanceTracker />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/login" 
          element={
            user ? <Navigate to={from} replace /> : <Login />
          } 
        />
        <Route 
          path="/register" 
          element={
            user ? <Navigate to={from} replace /> : <Register />
          } 
        />
        {/* Custom 404 route */}
        <Route 
          path="*" 
          element={
            <Navigate to="/" replace />
          } 
        />
      </Routes>
      <Toaster />
    </div>
  );
};

// Add basename for Vercel deployment
const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router basename={process.env.NODE_ENV === 'production' ? '' : '/'}>
        <AppContent />
      </Router>
    </AuthProvider>
  );
};

export default App;