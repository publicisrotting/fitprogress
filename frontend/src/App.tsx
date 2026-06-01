import { useState, useEffect } from 'react';
import LoginScreen from './components/screens/LoginScreen';
import DashboardScreen from './components/screens/DashboardScreen';
import ProfileScreen from './components/screens/ProfileScreen';
import GeneratorScreen from './components/screens/GeneratorScreen';
import WorkoutDiaryScreen from './components/screens/WorkoutDiaryScreen';
import ExerciseLibraryScreen from './components/screens/ExerciseLibraryScreen';
import StatisticsScreen from './components/screens/StatisticsScreen';
import SocialScreen from './components/screens/SocialScreen';
import GamificationScreen from './components/screens/GamificationScreen';
import SettingsScreen from './components/screens/SettingsScreen';
import WorkoutHistoryScreen from './components/screens/WorkoutHistoryScreen';
import BottomNavigation from './components/BottomNavigation';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useSettings } from './context/SettingsContext';

import { Toaster } from 'sonner';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const { isAuthenticated, logout } = useAuth();
  const { theme } = useSettings();

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentScreen('dashboard');
    } else {
      setCurrentScreen('login');
    }
  }, [isAuthenticated]);

  const renderScreen = () => {
    if (!isAuthenticated) {
      return <LoginScreen onLogin={() => {}} />;
    }

    switch (currentScreen) {
      case 'dashboard':
        return (
            <ErrorBoundary>
                <DashboardScreen onNavigate={setCurrentScreen} />
            </ErrorBoundary>
        );
      case 'profile':
        return (
            <ErrorBoundary>
                <ProfileScreen onNavigate={setCurrentScreen} onLogout={logout} />
            </ErrorBoundary>
        );
      case 'generator':
        return <GeneratorScreen onNavigate={setCurrentScreen} />;
      case 'diary':
        return <WorkoutDiaryScreen onNavigate={setCurrentScreen} />;
      case 'library':
        return <ExerciseLibraryScreen onNavigate={setCurrentScreen} />;
      case 'statistics':
        return <StatisticsScreen onNavigate={setCurrentScreen} />;
      case 'social':
        return <SocialScreen onNavigate={setCurrentScreen} />;
      case 'gamification':
        return <GamificationScreen onNavigate={setCurrentScreen} />;
      case 'settings':
        return <SettingsScreen onNavigate={setCurrentScreen} onLogout={logout} />;
      case 'history':
        return <WorkoutHistoryScreen onNavigate={setCurrentScreen} />;
      default:
        return <DashboardScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white overflow-hidden">
      <div id="app-container" className="w-full h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white overflow-hidden relative">
        {renderScreen()}
        {isAuthenticated && <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />}
        <Toaster position="top-center" richColors theme={theme} />
      </div>
    </div>
  );
}
