import { useState, useEffect, useRef } from 'react';
import { Mail, Lock, Eye, EyeOff, ChevronLeft, Dumbbell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { apiJson } from '../../config';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Email verification (2FA) state
  const [verifyEmail, setVerifyEmail] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [devCode, setDevCode] = useState<string | null>(null);
  const [wasRegister, setWasRegister] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const autoSubmitted = useRef(false);

  // Resend cooldown ticker
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // Start a 60s cooldown when entering the verify view
  useEffect(() => {
    if (verifyEmail) { setCooldown(60); autoSubmitted.current = false; }
  }, [verifyEmail]);

  const inputCls = [
    'w-full px-4 py-3.5 rounded-xl text-sm font-medium outline-none transition-all',
    'apple-card apple-text placeholder:apple-text-3',
    'border focus:border-[--accent-stand]',
    'apple-separator',
  ].join(' ');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      if (isForgot) {
        await apiJson('/api/auth/forgot-password', { method: 'POST', body: { email } });
        setSuccess('Інструкції надіслано на email');
        return;
      }
      if (!isLogin && password !== confirm) throw new Error('Паролі не співпадають');
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body: any = { email, password };
      if (!isLogin) body.name = name;
      const data = await apiJson<any>(endpoint, { method: 'POST', body });
      // Email not confirmed yet → switch to code-entry view
      if (data.requiresVerification) {
        setWasRegister(!isLogin);
        setVerifyEmail(data.email || email);
        setDevCode(data.devCode || null);
        return;
      }
      if (!isLogin) localStorage.removeItem('onboardingComplete');
      login(data.token, data.userId);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    setLoading(true); setError('');
    try {
      const data = await apiJson<{ token: string; userId: string }>('/api/auth/verify-email', {
        method: 'POST', body: { email: verifyEmail, code }
      });
      if (wasRegister) localStorage.removeItem('onboardingComplete');
      login(data.token, data.userId);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (cooldown > 0) return;
    setLoading(true); setError(''); setSuccess('');
    try {
      const data = await apiJson<any>('/api/auth/resend-code', { method: 'POST', body: { email: verifyEmail } });
      setDevCode(data.devCode || null);
      setSuccess('Новий код надіслано');
      setCode('');
      autoSubmitted.current = false;
      setCooldown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Auto-submit once 6 digits are entered
  useEffect(() => {
    if (verifyEmail && code.length === 6 && !loading && !autoSubmitted.current) {
      autoSubmitted.current = true;
      verifyCode();
    }
    if (code.length < 6) autoSubmitted.current = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code, verifyEmail]);

  // ── Email verification (2FA) view ─────────────────────────────────────────
  if (verifyEmail) {
    return (
      <div className="h-full apple-bg flex flex-col items-center justify-center px-5 relative overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-72 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(109,74,255,0.14) 0%, transparent 100%)' }} />
        <div className="w-full max-w-sm relative z-10">
          <button onClick={() => { setVerifyEmail(null); setCode(''); setError(''); setSuccess(''); }}
            className="flex items-center gap-1.5 mb-6 text-sm font-medium" style={{ color: 'var(--c-primary)' }}>
            <ChevronLeft className="w-4 h-4" /> Назад
          </button>
          <div className="w-16 h-16 rounded-[20px] flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, var(--c-primary), #9A6BFF)' }}>
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold apple-text mb-1.5">Підтвердіть email</h1>
          <p className="text-sm apple-text-2 mb-6">Ми надіслали 6-значний код на<br /><span className="font-semibold apple-text">{verifyEmail}</span></p>

          {devCode && (
            <div className="mb-4 px-4 py-3 rounded-xl text-sm" style={{ background: 'var(--c-accent)15', border: '1px solid var(--c-accent)30', color: 'var(--text-primary)' }}>
              Демо-режим (email не налаштований): ваш код <b style={{ letterSpacing: '2px' }}>{devCode}</b>
            </div>
          )}

          <input
            value={code}
            onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyDown={e => e.key === 'Enter' && code.length === 6 && verifyCode()}
            inputMode="numeric"
            placeholder="••••••"
            className="w-full text-center text-3xl font-bold tracking-[0.5em] py-4 rounded-2xl outline-none mb-2"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--separator)', color: 'var(--text-primary)' }}
          />

          {error && <p className="text-sm font-medium text-center mt-2" style={{ color: 'var(--c-accent)' }}>{error}</p>}
          {success && <p className="text-sm font-medium text-center mt-2" style={{ color: 'var(--c-success)' }}>{success}</p>}

          <button onClick={verifyCode} disabled={loading || code.length !== 6}
            className="w-full py-4 rounded-xl text-white text-base font-semibold mt-4 active:scale-[0.98] transition-transform disabled:opacity-50"
            style={{ background: 'var(--c-primary)', boxShadow: '0 4px 14px rgba(109,74,255,0.35)' }}>
            {loading ? '...' : 'Підтвердити'}
          </button>

          <button onClick={resendCode} disabled={loading || cooldown > 0}
            className="w-full text-center text-sm font-medium mt-4 disabled:opacity-50"
            style={{ color: 'var(--c-primary)' }}>
            {cooldown > 0 ? `Надіслати повторно через ${cooldown}с` : 'Надіслати код повторно'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full apple-bg flex flex-col overflow-hidden">
      {/* Top gradient */}
      <div className="absolute inset-x-0 top-0 h-72 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(109,74,255,0.12) 0%, transparent 100%)' }} />

      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-5 py-10 relative z-10">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="w-20 h-20 rounded-[22px] flex items-center justify-center mb-5 shadow-xl" style={{ background: 'linear-gradient(135deg, var(--accent-move) 0%, #FF6B9D 100%)' }}>
            <Dumbbell className="w-10 h-10 text-white" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-bold apple-text tracking-tight">FitProgress</h1>
          <p className="text-sm apple-text-2 mt-1">
            {isForgot ? 'Відновлення пароля' : isLogin ? 'Вхід в акаунт' : 'Створити акаунт'}
          </p>
        </div>

        {/* Card */}
        <div className="w-full max-w-sm">
          {isForgot && (
            <button onClick={() => { setIsForgot(false); setError(''); setSuccess(''); }}
              className="flex items-center gap-1.5 mb-6 text-sm font-medium" style={{ color: 'var(--accent-stand)' }}>
              <ChevronLeft className="w-4 h-4" /> Назад
            </button>
          )}

          <form onSubmit={submit} className="space-y-3">
            {!isLogin && !isForgot && (
              <input value={name} onChange={e => setName(e.target.value)} className={inputCls}
                placeholder="Ім'я та Прізвище" required />
            )}

            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 apple-text-3" />
              <input value={email} onChange={e => setEmail(e.target.value)} type="email"
                className={inputCls + ' pl-10'} placeholder="Email" required />
            </div>

            {!isForgot && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 apple-text-3" />
                <input value={password} onChange={e => setPassword(e.target.value)}
                  type={showPw ? 'text' : 'password'} className={inputCls + ' pl-10 pr-10'} placeholder="Пароль" required />
                <button type="button" onClick={() => setShowPw(!showPw)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 apple-text-3">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {!isLogin && !isForgot && (
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 apple-text-3" />
                <input value={confirm} onChange={e => setConfirm(e.target.value)}
                  type={showPw ? 'text' : 'password'} className={inputCls + ' pl-10'} placeholder="Підтвердити пароль" required />
              </div>
            )}

            {isLogin && !isForgot && (
              <div className="text-right">
                <button type="button" onClick={() => setIsForgot(true)} className="text-sm font-medium" style={{ color: 'var(--accent-stand)' }}>
                  Забули пароль?
                </button>
              </div>
            )}

            {error && <p className="text-sm font-medium text-center" style={{ color: 'var(--accent-move)' }}>{error}</p>}
            {success && <p className="text-sm font-medium text-center" style={{ color: 'var(--accent-exercise)' }}>{success}</p>}

            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl text-white text-base font-semibold mt-2 active:scale-[0.98] transition-transform disabled:opacity-50"
              style={{ background: 'var(--accent-move)', boxShadow: '0 4px 14px rgba(255,55,95,0.35)' }}>
              {loading ? '...' : isForgot ? 'Надіслати' : isLogin ? 'Увійти' : 'Зареєструватися'}
            </button>
          </form>

          {!isForgot && (
            <>
              <p className="text-center text-sm apple-text-2 mt-5">
                {isLogin ? 'Ще не маєте акаунту? ' : 'Вже маєте акаунт? '}
                <button onClick={() => { setIsLogin(!isLogin); setError(''); }}
                  className="font-semibold" style={{ color: 'var(--accent-stand)' }}>
                  {isLogin ? 'Реєстрація' : 'Увійти'}
                </button>
              </p>

              <div className="flex items-center gap-3 my-6">
                <div className="flex-1 h-px" style={{ background: 'var(--separator)' }} />
                <span className="text-xs apple-text-3">або</span>
                <div className="flex-1 h-px" style={{ background: 'var(--separator)' }} />
              </div>

              <div className="flex justify-center">
                <GoogleLogin
                  onSuccess={async cr => {
                    try {
                      const data = await apiJson<{ token: string; userId: string }>('/api/auth/google', {
                        method: 'POST', body: { token: cr.credential }
                      });
                      login(data.token, data.userId); onLogin();
                    } catch (err: any) { setError(err.message); }
                  }}
                  onError={() => setError('Помилка Google')}
                  theme="filled_black" shape="pill" size="large" text="signin_with" useOneTap
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
