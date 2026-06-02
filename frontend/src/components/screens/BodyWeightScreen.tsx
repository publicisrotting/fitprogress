import { useState, useEffect } from 'react';
import { ChevronLeft, Plus, TrendingDown, TrendingUp, Minus } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { toast } from 'sonner';

interface Props { onNavigate: (s: string) => void; }

export default function BodyWeightScreen({ onNavigate }: Props) {
  const { units } = useSettings();
  const { token } = useAuth();
  const [history, setHistory] = useState<{ date: string; weight: number; rawDate: string }[]>([]);
  const [current, setCurrent] = useState<number | null>(null);
  const [inputWeight, setInputWeight] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const weightUnit = units === 'imperial' ? 'lb' : 'кг';

  const load = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${API_URL}/api/user/profile`, { headers: { 'x-auth-token': token } });
      const data = await res.json();
      setCurrent(data.weight || null);
      const hist = (data.bodyWeightHistory || [])
        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map((e: any) => ({
          date: new Date(e.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short' }),
          weight: e.weight,
          rawDate: e.date,
        }));
      setHistory(hist);
    } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, [token]);

  const save = async () => {
    const w = parseFloat(inputWeight);
    if (!w || w < 20 || w > 400) return toast.error('Введи коректну вагу');
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({ weight: w }),
      });
      toast.success('Збережено!');
      setInputWeight('');
      load();
    } catch { toast.error('Помилка'); }
    setSaving(false);
  };

  const trend = history.length >= 2
    ? history[history.length - 1].weight - history[history.length - 2].weight
    : 0;
  const avg = history.length > 0
    ? Math.round(history.reduce((a, d) => a + d.weight, 0) / history.length * 10) / 10
    : null;

  if (loading) return (
    <div className="h-full apple-bg flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--accent-stand)', borderTopColor: 'transparent' }} />
    </div>
  );

  return (
    <div className="h-full apple-bg overflow-y-auto pb-28">
      <div className="px-5 pt-[calc(3rem+env(safe-area-inset-top))] pb-4">
        <div className="flex items-center gap-3">
          <button onClick={() => onNavigate('profile')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90 transition-transform" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
            <ChevronLeft className="w-5 h-5 apple-text-2" />
          </button>
          <h1 className="text-2xl font-bold apple-text">Вага тіла</h1>
        </div>
      </div>

      <div className="px-5 space-y-5">
        {/* Log new weight */}
        <div className="apple-card rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
          <p className="text-sm font-semibold apple-text mb-3">Записати сьогоднішню вагу</p>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <input type="number" inputMode="decimal" step="0.1" value={inputWeight} onChange={e => setInputWeight(e.target.value)}
                placeholder={current ? String(current) : '70.0'}
                className="w-full apple-card2 rounded-xl px-4 py-3.5 text-lg font-bold apple-text outline-none pr-12"
                style={{ border: '0.5px solid var(--separator)' }} />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm apple-text-3">{weightUnit}</span>
            </div>
            <button onClick={save} disabled={saving || !inputWeight}
              className="px-5 py-3.5 rounded-xl text-white font-semibold active:scale-90 transition-transform disabled:opacity-50 flex items-center gap-2"
              style={{ background: 'var(--accent-move)' }}>
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current + trend */}
        {current && (
          <div className="grid grid-cols-3 gap-3">
            <div className="apple-card rounded-2xl p-4 col-span-1" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="text-xs apple-text-3 mb-1">Зараз</p>
              <p className="text-2xl font-bold apple-text">{current}</p>
              <p className="text-xs apple-text-3">{weightUnit}</p>
            </div>
            {avg && (
              <div className="apple-card rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
                <p className="text-xs apple-text-3 mb-1">Середнє</p>
                <p className="text-2xl font-bold apple-text">{avg}</p>
                <p className="text-xs apple-text-3">{weightUnit}</p>
              </div>
            )}
            <div className="apple-card rounded-2xl p-4" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              <p className="text-xs apple-text-3 mb-1">Зміна</p>
              <div className="flex items-center gap-1">
                {trend > 0 ? <TrendingUp className="w-4 h-4" style={{ color: 'var(--accent-move)' }} /> :
                 trend < 0 ? <TrendingDown className="w-4 h-4" style={{ color: 'var(--accent-exercise)' }} /> :
                 <Minus className="w-4 h-4 apple-text-3" />}
                <p className="text-xl font-bold" style={{ color: trend > 0 ? 'var(--accent-move)' : trend < 0 ? 'var(--accent-exercise)' : 'var(--text-secondary)' }}>
                  {trend > 0 ? '+' : ''}{trend.toFixed(1)}
                </p>
              </div>
              <p className="text-xs apple-text-3">{weightUnit}</p>
            </div>
          </div>
        )}

        {/* Chart */}
        {history.length > 1 && (
          <div className="apple-card rounded-2xl p-5" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
            <h3 className="text-base font-semibold apple-text mb-5">Динаміка</h3>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--separator)" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} dy={6} />
                  <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11, fill: 'var(--text-tertiary)' }} axisLine={false} tickLine={false} />
                  {avg && <ReferenceLine y={avg} stroke="var(--accent-stand)" strokeDasharray="4 2" strokeWidth={1.5} />}
                  <Tooltip contentStyle={{ background: 'var(--bg-card)', border: '0.5px solid var(--separator)', borderRadius: 12, color: 'var(--text-primary)', fontSize: 13 }} />
                  <Line type="monotone" dataKey="weight" stroke="var(--accent-move)" strokeWidth={2.5} dot={{ fill: 'var(--accent-move)', r: 4 }} name={`Вага (${weightUnit})`} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* History list */}
        {history.length > 0 && (
          <div>
            <h3 className="text-base font-semibold apple-text mb-3">Записи</h3>
            <div className="apple-card rounded-2xl overflow-hidden" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
              {[...history].reverse().slice(0, 20).map((d, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3.5"
                  style={{ borderBottom: i < Math.min(history.length, 20) - 1 ? '0.5px solid var(--separator)' : 'none' }}>
                  <span className="text-sm apple-text-2">{d.date}</span>
                  <span className="text-base font-bold apple-text">{d.weight} <span className="text-xs font-normal apple-text-3">{weightUnit}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && !loading && (
          <div className="py-14 text-center">
            <p className="text-base font-semibold apple-text mb-1">Ще немає записів</p>
            <p className="text-sm apple-text-2">Введи свою вагу вище щоб почати відстежування</p>
          </div>
        )}
      </div>
    </div>
  );
}
