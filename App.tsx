import React, { useState, useEffect } from 'react';
import { 
  createBrowserRouter, 
  RouterProvider,
  createRoutesFromElements,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Login from './components/Login';
import Signup from './components/Signup';
import HealthLegalAgent from './components/HealthLegalAgent';
import SmartScheduling from './components/SmartScheduling';
import SkinHealthMonitor from './components/SkinHealthMonitor';
import HealthFitnessCoach from './components/HealthFitnessCoach';
import MedGuide from './components/MedGuide';
import SOSButton from './components/SOSButton';
import BloodTestAnalyzer from './components/BloodTestAnalyzer';
import ManageAppointments from './components/ManageAppointments';


// Protected Layout component that includes authentication check
const ProtectedLayout = () => {
  const isAuthenticated = localStorage.getItem('token');
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <Outlet />
    </div>
  );
};

// Auth Layout for login/signup pages
const AuthLayout = () => {
  const isAuthenticated = localStorage.getItem('token');
  const [showLogin, setShowLogin] = useState(true);

  if (isAuthenticated) {
    return <Navigate to="/" />;
  }

  const handleAuth = (token: string) => {
    localStorage.setItem('token', token);
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {showLogin ? (
        <Login onLogin={handleAuth} switchToSignup={() => setShowLogin(false)} />
      ) : (
        <Signup onSignup={handleAuth} switchToLogin={() => setShowLogin(true)} />
      )}
    </div>
  );
};

const router = createBrowserRouter(
  createRoutesFromElements(
    <>
      {/* Auth Routes */}
      <Route path="/login" element={<AuthLayout />} />
      <Route path="/signup" element={<AuthLayout />} />

      {/* Protected Routes */}
      <Route element={<ProtectedLayout />}>
        <Route path="/" element={<Hero />} />
        <Route path="/health" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Skin Health Monitor</h1>
            <div className="space-y-8">
              <SkinHealthMonitor className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl" />
            </div>
          </main>
        } />
        <Route path="/fitness" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Health & Fitness Coach</h1>
            <HealthFitnessCoach className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl" />
          </main>
        } />
        <Route path="/legal-agent" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Health Legal Assistant</h1>
            <HealthLegalAgent className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl" />
          </main>
        } />
        <Route path="/appointments" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Smart Scheduling</h1>
            <SmartScheduling className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl" />
          </main>
        } />
        <Route path="/medguide" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Medical Guide</h1>
            <MedGuide className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl" />
          </main>
        } />
        <Route path="/blood-test" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Blood Test Analyzer</h1>
            <BloodTestAnalyzer className="max-w-5xl mx-auto bg-white shadow-lg rounded-xl" />
          </main>
        } />
        <Route path="/sos" element={
          <main className="container mx-auto px-4 py-24">
            <h1 className="text-3xl font-bold text-gray-800 mb-8 text-center">Emergency SOS</h1>
            <SOSButton className="max-w-md mx-auto" />
          </main>
        } />
        <Route
          path="/manage-appointments"
          element={
            
              <main className="container mx-auto px-4 py-24">
                <ManageAppointments />
              </main>
            
          }
        />
      </Route>
    </>
  )
);

function App() {
  return <RouterProvider router={router} />;
}

export default App;