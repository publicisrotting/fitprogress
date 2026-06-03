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
import CoachScreen from './components/screens/CoachScreen';
import OnboardingScreen from './components/screens/OnboardingScreen';
import ExerciseProgressScreen from './components/screens/ExerciseProgressScreen';
import BodyWeightScreen from './components/screens/BodyWeightScreen';
import WorkoutTemplatesScreen from './components/screens/WorkoutTemplatesScreen';
import AITrainerScreen from './components/screens/AITrainerScreen';
import CalendarScreen from './components/screens/CalendarScreen';
import MuscleRecoveryScreen from './components/screens/MuscleRecoveryScreen';
import BottomNavigation from './components/BottomNavigation';
import { useAuth } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { useSettings } from './context/SettingsContext';

import { Toaster } from 'sonner';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  const { isAuthenticated, logout } = useAuth();
  const { theme } = useSettings();
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      const done = localStorage.getItem('onboardingComplete');
      if (!done) {
        setShowOnboarding(true);
      } else {
        setCurrentScreen('dashboard');
      }
    } else {
      setShowOnboarding(false);
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
      case 'coach':
        return <CoachScreen onNavigate={setCurrentScreen} />;
      case 'exercise-progress':
        return <ExerciseProgressScreen onNavigate={setCurrentScreen} />;
      case 'body-weight':
        return <BodyWeightScreen onNavigate={setCurrentScreen} />;
      case 'templates':
        return <WorkoutTemplatesScreen onNavigate={setCurrentScreen} />;
      case 'ai-trainer':
        return <AITrainerScreen onNavigate={setCurrentScreen} />;
      case 'calendar':
        return <CalendarScreen onNavigate={setCurrentScreen} />;
      case 'muscle-recovery':
        return <MuscleRecoveryScreen onNavigate={setCurrentScreen} />;
      case 'social':
        return <SocialScreen onNavigate={setCurrentScreen} />;
      default:
        return <DashboardScreen onNavigate={setCurrentScreen} />;
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white overflow-hidden">
      <div id="app-container" className="w-full h-full bg-slate-50 text-slate-950 dark:bg-slate-950 dark:text-white overflow-hidden relative">
        {isAuthenticated && showOnboarding ? (
          <OnboardingScreen onComplete={() => { setShowOnboarding(false); setCurrentScreen('dashboard'); }} />
        ) : (
          <div key={currentScreen} className="w-full h-full animate-fade-in">
            {renderScreen()}
          </div>
        )}
        {isAuthenticated && !showOnboarding && !['ai-trainer'].includes(currentScreen) && (
          <BottomNavigation currentScreen={currentScreen} onNavigate={setCurrentScreen} />
        )}
        <Toaster position="top-center" richColors theme={theme} />
      </div>
    </div>
  );
}
