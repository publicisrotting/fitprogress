import { useState } from 'react';
import { Dumbbell, Mail, Lock, Eye, EyeOff, AlertCircle, ChevronLeft, ArrowRight, Chrome } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { apiJson } from '../../config';

interface LoginScreenProps {
  onLogin: () => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      if (isForgotPassword) {
        await apiJson('/api/auth/forgot-password', {
          method: 'POST',
          body: { email }
        });
        setSuccessMessage('Інструкції надіслано на пошту');
        return;
      }

      if (!isLogin && password !== confirmPassword) {
        throw new Error('Паролі не співпадають');
      }

      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const body: any = { email, password };
      if (!isLogin) body.name = name;

      const data = await apiJson<{ token: string; userId: string }>(endpoint, {
        method: 'POST',
        body
      });

      login(data.token, data.userId);
      onLogin();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const containerClasses = "h-full bg-slate-950 flex flex-col items-center justify-center p-6 relative overflow-hidden";
  const glassClasses = "w-full max-w-sm bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-xl relative z-10 animate-fade-in-up";
  const inputClasses = "w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all";
  const labelClasses = "block text-[10px] font-black uppercase tracking-widest mb-2 text-white/40 ml-1";

  const decorativeElements = (
    <>
      <div className="absolute top-[-10%] right-[-10%] w-[60%] aspect-square bg-orange-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] aspect-square bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute top-[20%] left-[-5%] w-[30%] aspect-square bg-purple-600/5 blur-[80px] rounded-full pointer-events-none" />
    </>
  );

  if (isForgotPassword) {
    return (
      <div className={containerClasses}>
        {decorativeElements}
        <div className={glassClasses}>
          <button 
            onClick={() => { setIsForgotPassword(false); setError(''); setSuccessMessage(''); }}
            className="flex items-center gap-2 text-white/40 mb-8 hover:text-white transition-colors group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-[10px] font-black uppercase tracking-widest">Назад до входу</span>
          </button>

          <div className="mb-8">
            <h1 className="text-3xl font-black text-white tracking-tight mb-2">Відновлення</h1>
            <p className="text-white/40 text-sm font-medium">Введіть ваш email для отримання інструкцій</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className={labelClasses}>Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClasses}
                  placeholder="example@email.com"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {successMessage && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-emerald-500 text-xs font-bold uppercase tracking-wider">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {successMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {loading ? 'Відправка...' : 'Відправити'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      {decorativeElements}
      
      <div className="relative z-10 flex flex-col items-center mb-10 animate-fade-in">
        <div className="relative mb-6">
          <div className="absolute -inset-4 bg-gradient-to-tr from-orange-500 to-pink-500 rounded-full blur-2xl opacity-20 animate-pulse" />
          <div className="w-24 h-24 bg-gradient-to-tr from-orange-500 via-pink-500 to-purple-600 rounded-[2.5rem] flex items-center justify-center shadow-2xl relative border-4 border-slate-950">
            <Dumbbell className="w-12 h-12 text-white" />
          </div>
        </div>
        <h1 className="text-white text-4xl font-black tracking-tighter">FitProgress</h1>
      </div>

      <div className={glassClasses}>
        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div className="animate-fade-in">
              <label className={labelClasses}>Ім'я та Прізвище</label>
              <div className="relative">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={inputClasses}
                  placeholder="Андрій Петренко"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className={labelClasses}>Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
                placeholder="example@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Пароль</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {!isLogin && (
            <div className="animate-fade-in">
              <label className={labelClasses}>Підтвердити пароль</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/20" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={inputClasses}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {isLogin && (
            <div className="flex justify-end">
              <button 
                type="button" 
                onClick={() => setIsForgotPassword(true)}
                className="text-[10px] font-black uppercase tracking-widest text-white/30 hover:text-orange-400 transition-colors"
              >
                Забули пароль?
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-xs font-bold uppercase tracking-wider animate-shake">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-orange-500 to-pink-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl shadow-orange-500/20 active:scale-[0.98] transition-all disabled:opacity-50 mt-4 group"
          >
            <div className="flex items-center justify-center gap-2">
              {loading ? 'Завантаження...' : (isLogin ? 'Увійти' : 'Зареєструватися')}
              {!loading && <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />}
            </div>
          </button>
        </form>

        <div className="mt-8 text-center">
          <p className="text-white/30 text-[10px] font-black uppercase tracking-widest">
            {isLogin ? 'Ще не маєте акаунту?' : 'Вже маєте акаунт?'}
            <button
              onClick={() => { setIsLogin(!isLogin); setError(''); }}
              className="ml-2 text-white hover:text-orange-400 transition-colors"
            >
              {isLogin ? 'Зареєструватися' : 'Увійти'}
            </button>
          </p>
        </div>

        <div className="mt-10">
          <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] mb-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/5"></div>
            </div>
            <span className="relative px-4 bg-slate-900/50 backdrop-blur-md text-white/20">
              Або увійти через
            </span>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex justify-center group">
              <div className="relative">
                <div className="absolute -inset-1 bg-white/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <GoogleLogin
                  onSuccess={async (credentialResponse) => {
                    try {
                      const data = await apiJson<{ token: string; userId: string }>('/api/auth/google', {
                        method: 'POST',
                        body: { token: credentialResponse.credential }
                      });
                      login(data.token, data.userId);
                      onLogin();
                    } catch (err: any) {
                      setError(err.message || 'Помилка входу через Google');
                    }
                  }}
                  theme="filled_black"
                  shape="pill"
                  size="large"
                  text="signin_with"
                  onError={() => {
                    setError('Помилка входу через Google');
                  }}
                  useOneTap
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
