import { Home, Dumbbell, BarChart3, User } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface BottomNavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const { t } = useSettings();
  
  const navItems = [
    { id: 'dashboard', label: t('navigation.home'), icon: Home },
    { id: 'generator', label: t('navigation.generator'), icon: Dumbbell },
    { id: 'statistics', label: t('navigation.statistics'), icon: BarChart3 },
    { id: 'profile', label: t('navigation.profile'), icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 backdrop-blur-2xl border-t border-slate-200/70 dark:border-white/5 px-4 pt-4 pb-[calc(1rem+env(safe-area-inset-bottom))] z-[1000] animate-slide-up shadow-[0_-10px_40px_rgba(0,0,0,0.12)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between max-w-lg mx-auto">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onNavigate(item.id)}
            className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all duration-300 ${
              currentScreen === item.id
                ? 'text-orange-500 scale-105'
                : 'text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <item.icon className={`w-6 h-6 ${currentScreen === item.id ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className={`text-[10px] font-medium ${currentScreen === item.id ? 'opacity-100' : 'opacity-70'}`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
