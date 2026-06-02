import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight as ChevronR, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { API_URL } from '../../config';

interface Props { onNavigate: (s: string) => void; }

export default function CalendarScreen({ onNavigate }: Props) {
  const { token } = useAuth();
  const { language } = useSettings();
  const [workouts, setWorkouts] = useState<any[]>([]);
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const locale = language === 'uk' ? 'uk-UA' : language === 'ru' ? 'ru-RU' : 'en-US';

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/workouts`, { headers: { 'x-auth-token': token } })
      .then(r => r.json()).then(d => setWorkouts(Array.isArray(d) ? d : [])).catch(() => {});
  }, [token]);

  // Build workout map by date string
  const workoutsByDate: Record<string, any[]> = {};
  workouts.forEach(w => {
    const key = new Date(w.date).toISOString().split('T')[0];
    if (!workoutsByDate[key]) workoutsByDate[key] = [];
    workoutsByDate[key].push(w);
  });

  const year = month.getFullYear();
  const mon = month.getMonth();
  const firstDow = (new Date(year, mon, 1).getDay() + 6) % 7; // Mon=0
  const daysInMonth = new Date(year, mon + 1, 0).getDate();
  const todayStr = new Date().toISOString().split('T')[0];

  const prev = () => setMonth(new Date(year, mon - 1, 1));
  const next = () => setMonth(new Date(year, mon + 1, 1));

  const selectedWorkouts = selectedDay ? (workoutsByDate[selectedDay] || []) : [];
  const DAYS = ['Пн','Вт','Ср','Чт','Пт','Сб','Нд'];

  // Stats
  const monthKey = `${year}-${String(mon+1).padStart(2,'0')}`;
  const monthWorkouts = Object.entries(workoutsByDate).filter(([k]) => k.startsWith(monthKey));
  const totalDays = new Set(monthWorkouts.map(([k]) => k)).size;

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3 mb-4">
          <button onClick={() => onNavigate('statistics')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <h1 className="text-2xl font-bold apple-text">Календар</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Month header */}
        <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: '0.5px solid var(--separator)' }}>
            <button onClick={prev} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90" style={{ background: 'var(--bg-card2)' }}>
              <ChevronLeft className="w-5 h-5 apple-text-2" />
            </button>
            <p className="text-base font-bold apple-text capitalize">
              {month.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
            </p>
            <button onClick={next} className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-90" style={{ background: 'var(--bg-card2)' }}>
              <ChevronR className="w-5 h-5 apple-text-2" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 px-3 pt-3">
            {DAYS.map(d => <div key={d} className="text-center text-xs font-medium apple-text-3 pb-2">{d}</div>)}
          </div>

          {/* Days grid */}
          <div className="grid grid-cols-7 px-3 pb-4 gap-y-1">
            {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${year}-${String(mon+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
              const hasWorkout = !!workoutsByDate[dateStr];
              const isToday = dateStr === todayStr;
              const isSelected = dateStr === selectedDay;
              return (
                <button key={day} onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl transition-all active:scale-90"
                  style={{
                    background: isSelected ? 'var(--accent-move)' : isToday ? 'var(--accent-move)20' : 'transparent',
                    outline: isToday && !isSelected ? '1px solid var(--accent-move)' : 'none',
                  }}>
                  <span className="text-sm font-semibold" style={{ color: isSelected ? '#fff' : 'var(--text-primary)' }}>{day}</span>
                  {hasWorkout && <div className="w-1.5 h-1.5 rounded-full mt-0.5" style={{ background: isSelected ? '#fff' : 'var(--accent-move)' }} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="apple-card rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-xs apple-text-3 mb-1">Тренувань у місяці</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--accent-move)' }}>{totalDays}</p>
          </div>
          <div className="apple-card rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <p className="text-xs apple-text-3 mb-1">Активних тижнів</p>
            <p className="text-3xl font-bold" style={{ color: 'var(--accent-exercise)' }}>{Math.min(4, Math.ceil(totalDays / 2))}</p>
          </div>
        </div>

        {/* Selected day workouts */}
        {selectedDay && (
          <div>
            <p className="text-sm font-semibold apple-text mb-3">
              {new Date(selectedDay).toLocaleDateString(locale, { day: 'numeric', month: 'long', weekday: 'long' })}
            </p>
            {selectedWorkouts.length === 0 ? (
              <div className="apple-card rounded-2xl p-5 text-center" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-sm apple-text-2">Тренувань не було</p>
                <button onClick={() => onNavigate('diary')} className="mt-3 px-5 py-2 rounded-xl text-white text-sm font-medium" style={{ background: 'var(--accent-move)' }}>Додати</button>
              </div>
            ) : (
              <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                {selectedWorkouts.map((w, i) => {
                  const vol = (w.exercises||[]).reduce((a:number,ex:any)=>a+(ex.sets||[]).reduce((b:number,s:any)=>b+((s.weight||0)*(s.reps||0)),0),0);
                  return (
                    <div key={w._id||i} className="flex items-center gap-3 px-4 py-3.5" style={{ borderBottom: i<selectedWorkouts.length-1?'0.5px solid var(--separator)':'none' }}>
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-move)20' }}>
                        <Dumbbell className="w-5 h-5" style={{ color: 'var(--accent-move)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold apple-text truncate">{w.name}</p>
                        <p className="text-xs apple-text-3">{(w.exercises||[]).length} вправ · {vol.toLocaleString()} кг</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
