import { useState } from 'react';
import { ChevronRight, Dumbbell, Target, Zap, User } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const GOALS = [
  { id: 'mass', icon: Dumbbell, color: 'from-blue-500 to-blue-600' },
  { id: 'strength', icon: Zap, color: 'from-orange-500 to-orange-600' },
  { id: 'fat_loss', icon: Target, color: 'from-green-500 to-green-600' },
  { id: 'fitness', icon: User, color: 'from-purple-500 to-purple-600' },
];

const EXPERIENCE = ['beginner', 'intermediate', 'advanced'] as const;

export default function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const { t } = useSettings();
  const { token } = useAuth();
  const [step, setStep] = useState(0);
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('mass');
  const [experience, setExperience] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [saving, setSaving] = useState(false);

  const handleFinish = async () => {
    setSaving(true);
    try {
      await fetch(`${API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-auth-token': token || '' },
        body: JSON.stringify({
          age: Number(age) || undefined,
          weight: Number(weight) || undefined,
          height: Number(height) || undefined,
          goal,
          experienceLevel: experience,
        })
      });
    } catch { /* non-blocking */ }
    localStorage.setItem('onboardingComplete', 'true');
    onComplete();
    setSaving(false);
  };

  const steps = [
    // Step 0: Physical stats
    <div key="stats" className="space-y-6 animate-fade-in-up">
      <div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{t('onboarding.age') || 'Age'}</p>
        <input
          type="number" inputMode="numeric" value={age} onChange={e => setAge(e.target.value)}
          placeholder="25"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xl font-black outline-none focus:border-orange-500 transition-all"
        />
      </div>
      <div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{t('onboarding.weight') || 'Weight (kg)'}</p>
        <input
          type="number" inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)}
          placeholder="70"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xl font-black outline-none focus:border-orange-500 transition-all"
        />
      </div>
      <div>
        <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-2">{t('onboarding.height') || 'Height (cm)'}</p>
        <input
          type="number" inputMode="numeric" value={height} onChange={e => setHeight(e.target.value)}
          placeholder="175"
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white text-xl font-black outline-none focus:border-orange-500 transition-all"
        />
      </div>
    </div>,

    // Step 1: Goal
    <div key="goal" className="space-y-4 animate-fade-in-up">
      {GOALS.map(g => (
        <button
          key={g.id}
          onClick={() => setGoal(g.id)}
          className={`w-full flex items-center gap-5 p-6 rounded-[2rem] border-2 transition-all text-left active:scale-[0.98] ${
            goal === g.id ? 'border-orange-500 bg-orange-500/10 shadow-[0_0_20px_rgba(249,115,22,0.15)]' : 'border-white/5 bg-white/5'
          }`}
        >
          <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${g.color} flex items-center justify-center`}>
            <g.icon className="w-7 h-7 text-white" />
          </div>
          <span className={`text-lg font-black ${goal === g.id ? 'text-white' : 'text-white/60'}`}>
            {t(`generator.goals.${g.id}`) || g.id}
          </span>
          {goal === g.id && <div className="ml-auto w-2.5 h-2.5 bg-orange-500 rounded-full shadow-[0_0_10px_rgba(249,115,22,0.8)]" />}
        </button>
      ))}
    </div>,

    // Step 2: Experience
    <div key="exp" className="space-y-4 animate-fade-in-up">
      {EXPERIENCE.map(lvl => (
        <button
          key={lvl}
          onClick={() => setExperience(lvl)}
          className={`w-full p-6 rounded-[2rem] border-2 transition-all text-left active:scale-[0.98] ${
            experience === lvl ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.15)]' : 'border-white/5 bg-white/5'
          }`}
        >
          <p className={`text-lg font-black mb-1 ${experience === lvl ? 'text-white' : 'text-white/60'}`}>
            {t(`onboarding.${lvl}`) || lvl}
          </p>
          <p className="text-xs text-white/30 font-medium uppercase tracking-wider">
            {lvl === 'beginner' ? '< 1 year' : lvl === 'intermediate' ? '1-3 years' : '3+ years'}
          </p>
        </button>
      ))}
    </div>,
  ];

  const stepTitles = [
    t('onboarding.step1') || 'Your stats',
    t('onboarding.step2') || 'Your goal',
    t('onboarding.step3') || 'Experience',
  ];

  return (
    <div className="h-full bg-slate-950 overflow-y-auto pb-10 relative overflow-x-hidden">
      <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-600/10 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] right-[-10%] w-[40%] aspect-square bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="relative z-10 px-6 pt-[calc(3rem+env(safe-area-inset-top))] pb-8">
        {/* Progress indicator */}
        <div className="flex gap-2 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-500 ${i <= step ? 'bg-orange-500' : 'bg-white/10'}`} />
          ))}
        </div>

        <div className="mb-8">
          {step === 0 && (
            <>
              <p className="text-white/40 text-sm font-black uppercase tracking-[0.2em] mb-2">{t('onboarding.welcome') || 'Welcome'}</p>
              <h1 className="text-white text-3xl font-black tracking-tight leading-tight mb-3">
                {t('onboarding.subtitle') || 'Tell us about yourself'}
              </h1>
            </>
          )}
          {step > 0 && (
            <h1 className="text-white text-3xl font-black tracking-tight leading-tight mb-3">
              {stepTitles[step]}
            </h1>
          )}
        </div>

        {steps[step]}

        <div className="mt-10 flex gap-4">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-6 py-4 bg-white/5 border border-white/10 text-white/60 rounded-[2rem] font-black uppercase tracking-widest text-xs"
            >
              {t('common.back') || 'Back'}
            </button>
          )}

          {step < steps.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all"
            >
              {t('onboarding.next') || 'Next'}
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-3 py-4 bg-gradient-to-r from-orange-500 to-pink-500 text-white rounded-[2rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-60"
            >
              {saving ? '...' : (t('onboarding.finish') || 'Start Training')}
              {!saving && <ChevronRight className="w-5 h-5" />}
            </button>
          )}
        </div>

        <button onClick={() => { localStorage.setItem('onboardingComplete', 'true'); onComplete(); }} className="w-full mt-4 text-white/20 text-xs font-bold uppercase tracking-widest py-3">
          {t('onboarding.skip') || 'Skip'}
        </button>
      </div>
    </div>
  );
}
