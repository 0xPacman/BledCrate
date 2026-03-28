import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Search, Package, ChefHat, Truck, CheckCircle, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchTrackOrder } from '@/lib/api';
import type { OrderTracking } from '@/lib/api';

const STEPS = [
  { label: 'Confirmée', labelEn: 'Confirmed', icon: Package, color: 'bg-moroccan-red' },
  { label: 'En préparation', labelEn: 'Preparing', icon: ChefHat, color: 'bg-moroccan-orange' },
  { label: 'En livraison', labelEn: 'Out for delivery', icon: Truck, color: 'bg-moroccan-green' },
  { label: 'Livrée', labelEn: 'Delivered', icon: CheckCircle, color: 'bg-green-500' },
];

export default function TrackPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderTracking | null>(null);
  const [error, setError] = useState('');

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    setOrder(null);
    try {
      const result = await fetchTrackOrder(code.trim());
      setOrder(result);
    } catch {
      setError('Commande introuvable. Vérifiez votre code de suivi.');
    } finally {
      setLoading(false);
    }
  };

  const currentStep = order ? Math.max(1, Math.min(4, order.tracking_step)) : 0;

  return (
    <div className="min-h-screen bg-moroccan-cream">
      {/* Nav */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="BledCrate" className="w-10 h-10 rounded-full object-cover" />
            <span className="font-display text-xl font-bold text-moroccan-brown">BledCrate</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-moroccan-brown/70 hover:text-moroccan-red transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-moroccan-red" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl text-moroccan-brown mb-3">
            Suivre ma commande
          </h1>
          <p className="text-moroccan-brown/60 text-lg">
            Entrez votre code de suivi reçu par email
          </p>
        </div>

        {/* Search form */}
        <form onSubmit={handleTrack} className="flex gap-3 mb-10">
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value.toUpperCase())}
            placeholder="Ex: AB1C2D"
            maxLength={8}
            className="flex-1 border-2 border-moroccan-brown/20 rounded-xl px-5 py-4 text-xl font-mono font-bold text-moroccan-brown text-center tracking-widest focus:outline-none focus:border-moroccan-red bg-white uppercase"
          />
          <Button
            type="submit"
            disabled={loading || !code.trim()}
            className="bg-moroccan-red hover:bg-moroccan-red-dark text-white px-6 py-4 rounded-xl font-semibold"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </Button>
        </form>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Result */}
        {order && (
          <div className="bg-white rounded-2xl shadow-lg border overflow-hidden animate-slide-up">
            {/* Header */}
            <div className="bg-gradient-to-r from-moroccan-brown to-moroccan-brown/80 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-sm">Code de suivi</p>
                  <p className="font-mono font-bold text-2xl tracking-widest">{order.tracking_code}</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-sm">Client</p>
                  <p className="font-semibold">{order.customer_name}</p>
                </div>
              </div>
              <p className="text-white/50 text-xs mt-3">
                Commandé le {new Date(order.created_at).toLocaleDateString('fr-CA', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            {/* Progress bar - Desktop (horizontal) */}
            <div className="hidden sm:block p-6">
              <div className="relative">
                <div className="absolute top-6 left-6 right-6 h-1 bg-gray-200 rounded-full" />
                <div
                  className="absolute top-6 left-6 h-1 bg-moroccan-red rounded-full transition-all duration-700"
                  style={{ width: `${((currentStep - 1) / 3) * 100}%`, maxWidth: 'calc(100% - 48px)' }}
                />
                <div className="relative flex justify-between">
                  {STEPS.map((step, idx) => {
                    const StepIcon = step.icon;
                    const stepNum = idx + 1;
                    const isDone = currentStep >= stepNum;
                    const isCurrent = currentStep === stepNum;
                    return (
                      <div key={step.label} className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500 ${
                          isDone
                            ? `${step.color} border-transparent text-white ${isCurrent ? 'ring-4 ring-moroccan-red/30 scale-110 animate-pulse' : ''}`
                            : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          <StepIcon className="w-5 h-5" />
                        </div>
                        <span className={`text-xs font-medium text-center leading-tight ${isDone ? 'text-moroccan-brown' : 'text-gray-400'}`}>
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Progress bar - Mobile (vertical) */}
            <div className="sm:hidden p-5">
              <div className="space-y-0">
                {STEPS.map((step, idx) => {
                  const StepIcon = step.icon;
                  const stepNum = idx + 1;
                  const isDone = currentStep >= stepNum;
                  const isCurrent = currentStep === stepNum;
                  const isLast = idx === STEPS.length - 1;
                  return (
                    <div key={step.label} className="flex items-start gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-[3px] transition-all duration-500 shrink-0 ${
                          isDone
                            ? `${step.color} border-transparent text-white ${isCurrent ? 'ring-4 ring-moroccan-red/20 scale-110' : ''}`
                            : 'bg-white border-gray-200 text-gray-300'
                        }`}>
                          <StepIcon className="w-4 h-4" />
                        </div>
                        {!isLast && (
                          <div className={`w-0.5 h-8 transition-colors duration-500 ${currentStep > stepNum ? 'bg-moroccan-red' : 'bg-gray-200'}`} />
                        )}
                      </div>
                      <div className={`pt-2 pb-4 ${isCurrent ? 'font-semibold' : ''}`}>
                        <p className={`text-sm leading-tight ${isDone ? 'text-moroccan-brown' : 'text-gray-400'}`}>
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-moroccan-red mt-0.5">En cours</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Admin note */}
            {order.tracking_note && (
              <div className="mx-5 sm:mx-6 mb-5 bg-moroccan-cream rounded-xl p-4 border-l-4 border-moroccan-red">
                <p className="text-xs font-semibold text-moroccan-brown/60 uppercase tracking-wide mb-1">Message</p>
                <p className="text-moroccan-brown text-sm">{order.tracking_note}</p>
              </div>
            )}

            {/* Status badge */}
            <div className="pb-5 text-center">
              <span className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold ${
                currentStep === 4 ? 'bg-green-100 text-green-700' : 'bg-moroccan-red/10 text-moroccan-red'
              }`}>
                {currentStep === 4 ? '✓ Livrée' : `Étape ${currentStep}/4 — ${STEPS[currentStep - 1]?.label}`}
              </span>
            </div>
          </div>
        )}

        {/* Help */}
        <p className="text-center text-moroccan-brown/50 text-sm mt-8">
          Code non trouvé ? Contactez-nous à{' '}
          <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline">
            contact@bledcrate.ca
          </a>
        </p>
      </div>
    </div>
  );
}
