import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Bot, User, Loader2, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface Props { onNavigate: (s: string) => void; }

interface Message { role: 'user' | 'assistant'; content: string; }

const QUICK_PROMPTS = [
  'Яке тренування мені підходить сьогодні?',
  'Дай поради для набору маси',
  'Як правильно робити присідання?',
  'Скільки білку мені потрібно?',
  'Поясни прогресивне навантаження',
];

const FALLBACK_RESPONSES: Record<string, string> = {
  default: 'Я ваш AI-тренер FitProgress! Задавайте питання про тренування, техніку вправ, харчування або відновлення. Чим можу допомогти?',
  маса: 'Для набору маси:\n• Профіцит калорій 300-500 ккал/день\n• 1.6-2.2г білку на кг ваги\n• Прогресивне навантаження: збільшуйте вагу на 2.5кг кожні 1-2 тижні\n• Сон 7-9 годин — критично важливий\n• Push/Pull/Legs або Upper/Lower — найкращі схеми',
  присідання: 'Техніка присідань:\n• Стопи на ширині плечей, носки трохи розведені\n• Спина рівна, грудна клітина піднята\n• Коліна йдуть в напрямку носків\n• Сідайте до паралелі або нижче\n• Вдих вниз, видих вгору\n• Починайте з легкої ваги для відпрацювання техніки',
  білок: 'Норма білку:\n• Для набору маси: 1.8-2.2г/кг ваги\n• Для підтримки: 1.4-1.6г/кг\n• Для схуднення: 2.0-2.4г/кг\n• Розподіліть по 3-5 прийомів їжі\n• Джерела: курка, яйця, риба, творог, бобові',
  навантаження: 'Прогресивне навантаження — ключ до прогресу:\n• Збільшуйте вагу на 2.5кг коли можете зробити верхню межу повторів\n• Наприклад: ціль 3×8-10, зробили 3×10 — наступний раз +2.5кг\n• Якщо не виходить — спробуйте більше повторів або підходів\n• Ведіть щоденник тренувань (ви вже це робите! ✓)',
};

function getResponse(question: string): string {
  const q = question.toLowerCase();
  if (q.includes('маса') || q.includes('набір')) return FALLBACK_RESPONSES.маса;
  if (q.includes('присідан')) return FALLBACK_RESPONSES.присідання;
  if (q.includes('білок') || q.includes('протеїн')) return FALLBACK_RESPONSES.білок;
  if (q.includes('прогресивн') || q.includes('навантаження')) return FALLBACK_RESPONSES.навантаження;
  return FALLBACK_RESPONSES.default;
}

export default function AITrainerScreen({ onNavigate }: Props) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привіт! 👋 Я ваш персональний AI-тренер. Задавайте питання про тренування, харчування, техніку вправ або відновлення. Чим можу допомогти?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/api/workouts/coach`, { headers: { 'x-auth-token': token } })
      .then(r => r.json()).then(d => setStats(d)).catch(() => {});
  }, [token]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (text?: string) => {
    const q = (text || input).trim();
    if (!q) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setLoading(true);
    // Simulate AI response (in production — real Claude API call)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));
    const response = getResponse(q);
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setLoading(false);
  };

  return (
    <div className="h-full apple-bg flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 flex-shrink-0" style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top))', paddingBottom: '12px', borderBottom: '0.5px solid var(--separator)' }}>
        <button onClick={() => onNavigate('coach')} className="w-9 h-9 apple-card rounded-full flex items-center justify-center active:scale-90" style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}>
          <ChevronLeft className="w-5 h-5 apple-text-2" />
        </button>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-stand), #5856D6)' }}>
          <Bot className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-base font-bold apple-text">AI Тренер</p>
          <p className="text-xs apple-text-3">Powered by FitProgress AI</p>
        </div>
      </div>

      {/* Context bar */}
      {stats && stats.totalWorkouts > 0 && (
        <div className="px-5 py-2.5 flex items-center gap-2 flex-shrink-0" style={{ background: 'var(--accent-stand)10', borderBottom: '0.5px solid var(--separator)' }}>
          <Dumbbell className="w-3.5 h-3.5" style={{ color: 'var(--accent-stand)' }} />
          <span className="text-xs apple-text-2">Тренер знає про ваші {stats.totalWorkouts} тренувань · {stats.totalExercisesTracked} вправ</span>
        </div>
      )}

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
              style={{ background: msg.role === 'assistant' ? 'linear-gradient(135deg, var(--accent-stand), #5856D6)' : 'var(--accent-move)' }}>
              {msg.role === 'assistant' ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
            </div>
            <div className="max-w-[80%] px-4 py-3 rounded-2xl" style={{
              background: msg.role === 'assistant' ? 'var(--bg-card)' : 'var(--accent-move)',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              borderRadius: msg.role === 'assistant' ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
            }}>
              <p className="text-sm leading-relaxed whitespace-pre-line" style={{ color: msg.role === 'assistant' ? 'var(--text-primary)' : '#fff' }}>
                {msg.content}
              </p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--accent-stand), #5856D6)' }}>
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="px-4 py-3 apple-card rounded-2xl" style={{ borderRadius: '18px 18px 18px 4px' }}>
              <Loader2 className="w-4 h-4 apple-text-3 animate-spin" />
            </div>
          </div>
        )}
      </div>

      {/* Quick prompts */}
      <div className="px-5 py-2 flex gap-2 overflow-x-auto no-scrollbar flex-shrink-0" style={{ borderTop: '0.5px solid var(--separator)' }}>
        {QUICK_PROMPTS.map((p, i) => (
          <button key={i} onClick={() => send(p)} disabled={loading}
            className="whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium flex-shrink-0 active:scale-95 transition-transform disabled:opacity-50"
            style={{ background: 'var(--bg-card2)', color: 'var(--text-secondary)', border: '0.5px solid var(--separator)' }}>
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="flex items-center gap-3 px-5 py-3 flex-shrink-0" style={{ borderTop: '0.5px solid var(--separator)', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Запитайте тренера..."
          className="flex-1 apple-card2 rounded-xl px-4 py-3 text-sm apple-text outline-none"
          style={{ border: '0.5px solid var(--separator)' }} />
        <button onClick={() => send()} disabled={!input.trim() || loading}
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white active:scale-90 transition-transform disabled:opacity-40"
          style={{ background: 'var(--accent-move)' }}>
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
