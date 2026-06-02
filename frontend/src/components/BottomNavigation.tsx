import { Home, Dumbbell, Brain, BarChart3, User } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';

interface BottomNavigationProps {
  currentScreen: string;
  onNavigate: (screen: string) => void;
}

export default function BottomNavigation({ currentScreen, onNavigate }: BottomNavigationProps) {
  const { t } = useSettings();

  const navItems = [
    { id: 'dashboard',  label: t('navigation.home'),       icon: Home },
    { id: 'diary',      label: t('navigation.diary') || 'Diary', icon: Dumbbell },
    { id: 'coach',      label: t('navigation.coach') || 'Coach', icon: Brain },
    { id: 'statistics', label: t('navigation.statistics'), icon: BarChart3 },
    { id: 'profile',    label: t('navigation.profile'),    icon: User },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[1000]">
      {/* Frosted glass bar */}
      <div
        className="bg-white/80 dark:bg-[#1C1C1E]/90 backdrop-blur-2xl"
        style={{
          borderTop: '0.5px solid var(--separator)',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
        }}
      >
        <div className="flex items-center justify-around px-2 pt-2 max-w-lg mx-auto">
          {navItems.map((item) => {
            const active = currentScreen === item.id ||
              (item.id === 'diary' && currentScreen === 'history');
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center gap-0.5 py-1 px-3 min-w-[52px] active:scale-90 transition-transform"
              >
                <item.icon
                  className="w-6 h-6 transition-colors"
                  style={{
                    color: active ? 'var(--accent-move)' : 'var(--text-secondary)',
                    strokeWidth: active ? 2.5 : 1.8,
                  }}
                />
                <span
                  className="text-[10px] font-medium transition-colors truncate"
                  style={{ color: active ? 'var(--accent-move)' : 'var(--text-secondary)' }}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
