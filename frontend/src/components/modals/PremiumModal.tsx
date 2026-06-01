import React, { useEffect, useState } from 'react';
import { X, Crown, Zap, ShieldCheck, PlayCircle, TrendingUp } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';
import { useAuth } from '../../context/AuthContext';
import { API_URL } from '../../config';
import { toast } from 'sonner';

interface PremiumModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isPremium?: boolean;
  premiumExpiresAt?: string | Date | null;
}

export default function PremiumModal({ isOpen, onClose, onSuccess, isPremium = false, premiumExpiresAt }: PremiumModalProps) {
  const { t } = useSettings();
  const { token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<{ id: string; priceUah: number; periodDays: number }[]>([]);
  const [lastInvoice, setLastInvoice] = useState<{ invoiceId: string; pageUrl?: string; status?: string; createdAt?: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch(`${API_URL}/api/billing/plans`)
      .then(r => r.json())
      .then(data => setPlans(Array.isArray(data?.plans) ? data.plans : []))
      .catch(() => setPlans([]));

    fetch(`${API_URL}/api/billing/latest`, {
      headers: { 'x-auth-token': token || '' }
    })
      .then(r => r.json())
      .then(data => {
        const invoice = data?.invoice;
        if (invoice) {
          const createdAt = new Date(invoice.createdAt);
          const now = new Date();
          const diff = now.getTime() - createdAt.getTime();
          if (invoice.status === 'created' && diff > 15 * 60 * 1000) {
            // cancel invoice
            fetch(`${API_URL}/api/billing/cancel`, {
              method: 'POST',
              headers: { 'x-auth-token': token || '', 'Content-Type': 'application/json' },
              body: JSON.stringify({ invoiceId: invoice.invoiceId })
            }).then(() => {
              setLastInvoice(null);
              localStorage.removeItem('lastSubscriptionInvoiceId');
            }).catch(() => {});
          } else {
            setLastInvoice({ invoiceId: invoice.invoiceId, pageUrl: invoice.pageUrl, status: invoice.status, createdAt: invoice.createdAt });
          }
        } else {
          setLastInvoice(null);
        }
      })
      .catch(() => setLastInvoice(null));
  }, [isOpen, token]);

  if (!isOpen) return null;

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ planId: 'premium_monthly' })
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.pageUrl) {
          if (data?.invoiceId) {
            localStorage.setItem('lastSubscriptionInvoiceId', String(data.invoiceId));
            setLastInvoice({ invoiceId: String(data.invoiceId), pageUrl: String(data.pageUrl), status: 'created' });
          }
          window.location.href = data.pageUrl;
        } else {
          toast.error(t('common.error'));
        }
      } else {
        const data = await response.json();
        toast.error(data.message || t('common.error'));
      }
    } catch (error) {
      console.error('Premium purchase error:', error);
      toast.error(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/billing/downgrade`, {
        method: 'POST',
        headers: {
          'x-auth-token': token || ''
        }
      });

      if (response.ok) {
        toast.success(t('common.success'));
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.error(t('common.error'));
      }
    } catch (error) {
      console.error('Premium cancel error:', error);
      toast.error(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPayment = async () => {
    const savedId = localStorage.getItem('lastSubscriptionInvoiceId') || '';
    const invoiceId = lastInvoice?.invoiceId || savedId;
    if (!invoiceId) {
      toast.error(t('common.error'));
      return;
    }
    setLoading(true);
    try {
      const resp = await fetch(`${API_URL}/api/billing/status?invoiceId=${encodeURIComponent(invoiceId)}`, {
        headers: { 'x-auth-token': token || '' }
      });
      const data = await resp.json();
      if (!resp.ok) {
        toast.error(data?.message || t('common.error'));
        return;
      }
      setLastInvoice({ invoiceId, pageUrl: data?.pageUrl, status: data?.status });
      if (data?.status === 'success') {
        toast.success(t('common.success'));
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.success(`${t('common.success')}: ${data?.status || 'unknown'}`);
      }
    } catch (e) {
      toast.error(t('common.networkError'));
    } finally {
      setLoading(false);
    }
  };

  const handleContinue = () => {
    if (lastInvoice?.pageUrl) {
      window.location.href = lastInvoice.pageUrl;
    }
  };

  const handleCancel = async () => {
    if (!lastInvoice?.invoiceId) return;
    setLoading(true);
    try {
      await fetch(`${API_URL}/api/billing/cancel`, {
        method: 'POST',
        headers: { 'x-auth-token': token || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: lastInvoice.invoiceId })
      });
      setLastInvoice(null);
      localStorage.removeItem('lastSubscriptionInvoiceId');
      toast.success('Payment cancelled');
    } catch (e) {
      toast.error('Failed to cancel');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, label: t('premium.feature1') || 'AI Generator' },
    { icon: TrendingUp, label: t('premium.feature2') || 'Analytics' },
    { icon: PlayCircle, label: t('premium.feature3') || 'HD Videos' },
    { icon: ShieldCheck, label: t('premium.feature4') || 'No Ads' }
  ];

  const expiresText = premiumExpiresAt ? new Date(premiumExpiresAt).toLocaleString() : '';

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xl" onClick={onClose} />
      
      <div className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[3rem] shadow-2xl overflow-hidden animate-scale-in max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)]">
        {/* Background Decor */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500/10 blur-3xl rounded-full -ml-20 -mb-20 pointer-events-none" />

        <div className="relative z-10 p-8 overflow-y-auto max-h-[calc(100dvh-2rem)] sm:max-h-[calc(100dvh-4rem)] pb-[calc(2rem+env(safe-area-inset-bottom))]">
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Crown className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-white font-black text-2xl tracking-tight">Premium Plus</h2>
            </div>
            <button 
              onClick={onClose}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all active:scale-90"
            >
              <X className="w-6 h-6 text-white/40" />
            </button>
          </div>

          {!isPremium ? (
            <div className="space-y-8">
              <div className="text-center bg-white/5 rounded-[2.5rem] py-8 border border-white/5 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl font-black text-white tracking-tighter">
                    {plans.find(p => p.id === 'premium_monthly')?.priceUah ? `${plans.find(p => p.id === 'premium_monthly')?.priceUah}₴` : (t('premium.price') || '$9.99')}
                  </span>
                  <span className="text-white/40 font-black uppercase text-xs tracking-widest">{t('premium.perMonth') || '/ month'}</span>
                </div>
                <p className="text-white/30 text-[10px] font-black uppercase tracking-[0.3em]">{t('premium.planTitle') || 'Professional Training'}</p>
              </div>

              {lastInvoice && lastInvoice.status === 'created' ? (
                <div className="space-y-3">
                  <button
                    onClick={handleContinue}
                    className="w-full py-6 bg-white text-slate-950 font-black rounded-[2rem] uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-white/5 active:scale-[0.98] transition-all"
                  >
                    Продолжить оплату
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={loading}
                    className="w-full py-5 bg-red-500/20 text-red-400 font-black rounded-[2rem] uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : 'Отменить оплату'}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-6 bg-white text-slate-950 font-black rounded-[2rem] uppercase tracking-[0.3em] text-[10px] shadow-2xl shadow-white/5 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {loading ? t('common.loading') : (t('premium.subscribe') || 'Pay with mono')}
                </button>
              )}
              {lastInvoice?.invoiceId ? (
                <button
                  onClick={handleCheckPayment}
                  disabled={loading}
                  className="w-full py-5 bg-white/5 text-white/70 font-black rounded-[2rem] uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? t('common.loading') : 'Check payment'}
                </button>
              ) : null}

              <div className="grid grid-cols-2 gap-3">
                {features.map((feature, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 group hover:bg-white/10 transition-all">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                      <feature.icon className="w-4 h-4 text-orange-400" />
                    </div>
                    <span className="text-white/60 font-black uppercase text-[9px] tracking-widest leading-tight">{feature.label}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-8 py-10 text-center">
              <div className="w-24 h-24 bg-green-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border border-green-500/20">
                <ShieldCheck className="w-12 h-12 text-green-500" />
              </div>
              <div>
                <h3 className="text-white font-black text-2xl tracking-tight mb-2">{t('premium.active') || 'Subscribed!'}</h3>
                <p className="text-white/40 text-xs font-bold uppercase tracking-widest">{t('premium.planTitle') || 'Pro Plan Active'}</p>
              </div>
              
              <div className="bg-white/5 border border-white/5 rounded-[2.5rem] p-8">
                <p className="text-white/60 text-sm font-medium leading-relaxed mb-8">
                  {t('premium.description') || 'You have unlimited access to all features, AI generation, and detailed statistics.'}
                </p>
                {expiresText ? (
                  <p className="text-white/30 text-[10px] font-black uppercase tracking-widest mb-6">
                    {t('settings.version') || 'Expires'}: {expiresText}
                  </p>
                ) : null}
                <button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full py-5 bg-white text-slate-950 font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 mb-3"
                >
                  {loading ? t('common.loading') : (t('premium.subscribe') || 'Go to Payment')}
                </button>
                <button
                  onClick={handleCheckPayment}
                  disabled={loading}
                  className="w-full py-5 bg-white/5 text-white/70 font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50 mb-3"
                >
                  {loading ? t('common.loading') : 'Check payment'}
                </button>
                <button
                  onClick={handleDowngrade}
                  disabled={loading}
                  className="w-full py-5 bg-red-500/10 text-red-500 border border-red-500/20 font-black rounded-2xl uppercase tracking-widest text-[10px] transition-all active:scale-95 disabled:opacity-50"
                >
                  {loading ? t('common.loading') : (t('premium.cancelSubscription') || 'Switch to Free')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
