import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Bot, User, Loader2, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface Props { onNavigate: (s: string) => void; }

interface Message { role: 'user' | 'assistant'; content: string; }

const QUICK_PROMPTS = [
  'Що тренувати сьогодні?',
  'Поради для набору маси',
  'Як схуднути правильно?',
  'Техніка присідань',
  'Скільки білку потрібно?',
  'Що таке прогресивне навантаження?',
  'Болять м\'язи — це нормально?',
  'Скільки відпочивати між тренуваннями?',
];

const KB: { keys: string[]; answer: string }[] = [
  { keys: ['маса', 'набір', 'набор', 'масу', 'росту м', 'качат'], answer: 'Набір м\'язової маси:\n• Профіцит 300–500 ккал/день\n• Білок 1.6–2.2 г на кг ваги\n• Прогресивне навантаження — головний драйвер росту\n• 10–20 робочих підходів на групу м\'язів на тиждень\n• Сон 7–9 год — м\'язи ростуть у відпочинку\n• Схеми: Push/Pull/Legs або Upper/Lower' },
  { keys: ['схуд', 'жир', 'похуд', 'сушк', 'дефіцит', 'дефицит'], answer: 'Схуднення (втрата жиру):\n• Дефіцит 300–500 ккал/день — близько -0.5 кг/тиждень\n• Білок ВИЩИЙ: 2.0–2.4 г/кг — зберігає м\'язи\n• Силові + 2–3 кардіо сесії на тиждень\n• Не кидай ваги — вони зберігають м\'язи в дефіциті\n• 8–10 тис кроків на день\n• Зважуйся раз на тиждень, дивись на тренд, не на день' },
  { keys: ['присідан', 'присед', 'squat'], answer: 'Техніка присідань:\n1. Стопи на ширині плечей, носки трохи назовні\n2. Грудна клітина вгору, спина нейтральна\n3. Почни рух з відведення тазу назад\n4. Коліна йдуть у напрямку носків\n5. Опускайся до паралелі стегна або нижче\n6. Вдих униз, видих угору\nПорада: відпрацюй техніку з порожнім грифом.' },
  { keys: ['жим', 'bench', 'груд'], answer: 'Жим лежачи — техніка:\n1. Лопатки зведені й опущені\n2. Легкий прогин у попереку, сідниці на лаві\n3. Хват трохи ширше плечей\n4. Гриф опускай до низу грудей\n5. Лікті під ~45° до тіла, не розводь повністю\n6. Жми по дузі назад до плечей\nЗавжди працюй зі страхувальником на робочих вагах.' },
  { keys: ['тяга', 'станов', 'deadlift', 'спин'], answer: 'Станова тяга — техніка:\n1. Гриф над серединою стопи\n2. Спина рівна, груди вгору\n3. Плечі трохи попереду грифа\n4. Штовхай підлогу ногами, не "тягни" спиною\n5. Гриф ковзає вздовж ніг\n6. У верхній точці — повне розгинання стегна\nНіколи не круглі поперек під вагою.' },
  { keys: ['білок', 'білк', 'протеїн', 'протеин', 'белок'], answer: 'Норма білка:\n• Набір маси: 1.8–2.2 г/кг\n• Підтримка: 1.4–1.6 г/кг\n• Схуднення: 2.0–2.4 г/кг\n• 3–5 прийомів по 25–40 г\nДжерела: курка, яйця, риба, творог, грецький йогурт, бобові, протеїн.' },
  { keys: ['прогресивн', 'навантаженн', 'прогрес', 'overload'], answer: 'Прогресивне навантаження:\nДодавай стимул щотижня, щоб м\'язи росли.\n• Дійшов до верхньої межі повторів (напр. 3×10) → +2.5 кг\n• Не вийшло — додай 1 повтор або 1 підхід\n• Або скороти відпочинок\nВеди щоденник (ти це вже робиш ✓) — без записів неможливо прогресувати.' },
  { keys: ['болят', 'болить', 'крепатур', 'крепатура', 'doms', 'ниют'], answer: 'Біль у м\'язах (крепатура / DOMS):\n• Нормально 24–72 год після нового навантаження\n• Це НЕ показник якості тренування\n• Полегшує: легке кардіо, розтяжка, сон, вода, білок\n• Тренуватись можна, якщо біль помірний\n• Гострий/різкий біль у суглобі — НЕ крепатура, відпочинь і перевір техніку' },
  { keys: ['відпоч', 'отдых', 'rest', 'відновл', 'восстановл', 'як часто', 'скільки раз'], answer: 'Відпочинок і відновлення:\n• Між тренуваннями однієї групи м\'язів: 48–72 год\n• Між підходами: сила 2–3 хв, маса 60–90 с\n• 1–2 повних дні відпочинку на тиждень\n• Сон 7–9 год — №1 фактор відновлення\nПеревір вкладку "Відновлення м\'язів" — там видно, що готове.' },
  { keys: ['кардіо', 'кардио', 'cardio', 'біг', 'бег'], answer: 'Кардіо:\n• Для здоров\'я: 150 хв помірного на тиждень\n• Для жиру: 2–4 сесії по 20–40 хв\n• LISS (спокійне) — не заважає силовим\n• HIIT — ефективно, але потребує відновлення\n• Роби кардіо ПІСЛЯ силових або в окремий день' },
  { keys: ['делоад', 'deload', 'розвантаж', 'плато', 'застій', 'застой', 'plateau'], answer: 'Плато / Деload:\n• Прогрес зупинився на 2–3 тижні? Час для розвантаження\n• Деload-тиждень: -40–50% обсягу, легкі ваги\n• Дай ЦНС і суглобам відновитись\n• Часто причина плато — мало сну/їжі, а не тренувань\n• Після деload ваги зазвичай ростуть знову' },
  { keys: ['сон', 'спат', 'sleep'], answer: 'Сон — найважливіший фактор:\n• 7–9 год щоночі\n• Гормон росту виділяється у глибокому сні\n• Менше 6 год → -60% росту м\'язів і гірша сила\n• Лягай у той самий час, темна прохолодна кімната\n• Без екранів за 30 хв до сну' },
  { keys: ['креатин', 'creatine', 'добав', 'спортпит'], answer: 'Добавки (що реально працює):\n• Креатин моногідрат — 5 г/день, найдоказовіша добавка\n• Протеїн — зручно добрати норму білка\n• Кофеїн — енергія перед тренуванням\n• Вітамін D, омега-3 — якщо дефіцит\nРешта — переважно маркетинг. Спочатку — їжа, сон, тренування.' },
  { keys: ['розминк', 'разминк', 'warmup', 'розігр'], answer: 'Розминка:\n• 5 хв легкого кардіо — підняти пульс\n• Динамічна мобілізація суглобів\n• 2–3 розминкові підходи з легшою вагою перед робочими\n• Не розтягуйся статично ПЕРЕД силовими — це знижує силу\nСтатична розтяжка — краще після тренування.' },
];

function getResponse(question: string, ctx?: any): string {
  const q = question.toLowerCase();

  // Context-aware "what to train today"
  if (/сьогодн|today|що трен|зараз трен/.test(q)) {
    if (!ctx || !ctx.totalWorkouts) {
      return 'Почни з базової повнотілової програми 3 рази на тиждень: присідання, жим лежачи, тяга, жим стоячи, планка. Відкрий "Готові програми" в Генераторі — я підібрав кілька під тебе.';
    }
    const d = ctx.daysSinceLastWorkout;
    if (d === 0) return 'Ти вже тренувався сьогодні 💪 Дай тілу відновитись. Якщо є сили — легке кардіо або розтяжка. Завтра — повноцінне тренування.';
    if (ctx.deloadRecommended) return 'Ти тренуєшся вже 4+ тижні поспіль. Рекомендую розвантажувальний тиждень: -40% обсягу. Це дасть суперкомпенсацію і нові рекорди.';
    if (d >= 4) return `Останнє тренування було ${d} днів тому. Почни спокійніше — трохи зменши робочі ваги перших підходів, добре розімнись. Сьогодні гарний день для повного тіла.`;
    return 'Ти добре відновився! Перевір вкладку "Відновлення м\'язів" — там видно, які групи готові. Тренуй ті, що показані зеленим, і додай прогресію де можеш.';
  }

  for (const item of KB) {
    if (item.keys.some(k => q.includes(k))) return item.answer;
  }

  return 'Я можу допомогти з: набором маси, схудненням, технікою вправ (присідання, жим, тяга), білком і харчуванням, прогресивним навантаженням, відновленням, сном, кардіо та добавками.\n\nСпробуй питання нижче 👇 або запитай своїми словами.';
}

export default function AITrainerScreen({ onNavigate }: Props) {
  const { token } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Привіт! Я твій персональний AI-тренер. Запитай про тренування, харчування, техніку вправ, відновлення чи добавки — і я дам конкретну пораду.' }
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
    await new Promise(r => setTimeout(r, 600 + Math.random() * 500));
    const response = getResponse(q, stats);
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
