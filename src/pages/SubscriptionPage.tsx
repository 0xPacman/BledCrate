import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import {
  User, Users, ChefHat, Truck, Heart, ArrowLeft, Loader2,
  Check, Star, Package, Calendar, ShoppingCart, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast, Toaster } from 'sonner';
import { fetchSubscriptionPlans, fetchPublicSettings, createSubscription } from '@/lib/api';
import type { SubscriptionPlan, SiteSettings } from '@/lib/api';

type PlanType = 'moi' | 'bundle';
type BillingInterval = 'weekly' | 'monthly';

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
}

export default function SubscriptionPage() {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<PlanType>('moi');
  const [billingInterval, setBillingInterval] = useState<BillingInterval>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>(() => {
    try {
      const s = localStorage.getItem('bledcrate_sub_customer');
      return s ? { notes: '', ...JSON.parse(s) } : { name: '', email: '', phone: '', address: '', notes: '' };
    } catch { return { name: '', email: '', phone: '', address: '', notes: '' }; }
  });

  useEffect(() => {
    Promise.all([fetchSubscriptionPlans(), fetchPublicSettings()])
      .then(([p, s]) => { setPlans(p); setSettings(s); })
      .catch(() => toast.error('Erreur de chargement'))
      .finally(() => setLoading(false));
  }, []);

  const filteredPlans = plans.filter(p => p.plan_type === selectedType && (p.billing_interval || 'month') === billingInterval);

  // Get the highest price per meal to calculate savings
  const maxPricePerMeal = filteredPlans.length > 0
    ? Math.max(...filteredPlans.map(p => p.price_per_meal))
    : 0;

  const handleSubscribe = async () => {
    if (!selectedPlan) return;
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    setIsSubmitting(true);
    try {
      localStorage.setItem('bledcrate_sub_customer', JSON.stringify({ name: customerInfo.name, email: customerInfo.email, phone: customerInfo.phone, address: customerInfo.address }));
      const { url } = await createSubscription({
        plan_id: selectedPlan.id,
        customer: customerInfo,
      });
      // Save info for success page
      localStorage.setItem('bledcrate_pending_subscription', JSON.stringify({
        plan: selectedPlan,
        customer: { name: customerInfo.name, email: customerInfo.email },
        date: new Date().toISOString(),
      }));
      window.location.href = url;
    } catch {
      toast.error('Erreur lors de la création de l\'abonnement. Réessayez.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-moroccan-cream flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-moroccan-red" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-moroccan-cream">
      <Helmet>
        <title>Abonnement Repas Marocains | BledCrate - Livraison Hebdomadaire Montréal</title>
        <meta name="description" content="Abonnez-vous à BledCrate et recevez vos repas marocains authentiques chaque semaine. Livraison gratuite dans le Grand Montréal. Halal, fait maison." />
      </Helmet>
      {/* Top Banner */}
      {settings?.delivery_banner_enabled === 'true' && (
        <div className="bg-moroccan-red text-white text-center py-2 text-sm font-semibold">
          <div className="flex items-center justify-center gap-2">
            <Truck className="w-4 h-4" />
            <span>Livraison GRATUITE pour tous les abonnés !</span>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <img src="/logo.png" alt="BledCrate" className="w-10 h-10 rounded-full object-cover" />
            <span className="font-display text-xl font-bold text-moroccan-brown">BledCrate</span>
          </Link>
          <Link to="/" className="flex items-center gap-1 text-sm text-moroccan-brown/70 hover:text-moroccan-red transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Retour au menu
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative py-16 sm:py-24 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img src="/hero-moroccan.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-b from-moroccan-brown/80 via-moroccan-brown/60 to-moroccan-cream" />
        </div>
        <div className="relative z-10 max-w-4xl mx-auto text-center">
          <Badge className="bg-moroccan-gold text-moroccan-brown mb-4 text-sm px-4 py-2">
            <Calendar className="w-4 h-4 mr-1" />
            Abonnement Mensuel
          </Badge>
          <h1 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mb-4">
            Vos Repas Marocains,
            <br />
            <span className="text-moroccan-gold">Livrés Chaque Semaine</span>
          </h1>
          <p className="text-white/80 text-lg max-w-2xl mx-auto">
            Choisissez votre plan, recevez vos repas authentiques faits maison.
            Plus vous commandez, plus vous économisez.
          </p>
        </div>
      </section>

      {/* Steps indicator */}
      <div className="max-w-4xl mx-auto px-4 -mt-8 relative z-20 mb-12">
        <div className="bg-white rounded-2xl shadow-lg p-4 flex items-center justify-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-moroccan-red text-white flex items-center justify-center text-sm font-bold">1</div>
            <span className="text-sm font-medium text-moroccan-brown hidden sm:inline">Choisir le type</span>
          </div>
          <ChevronRight className="w-4 h-4 text-moroccan-brown/30" />
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${selectedPlan ? 'bg-moroccan-red text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
            <span className="text-sm font-medium text-moroccan-brown/60 hidden sm:inline">Choisir le plan</span>
          </div>
          <ChevronRight className="w-4 h-4 text-moroccan-brown/30" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
            <span className="text-sm font-medium text-moroccan-brown/60 hidden sm:inline">S'abonner</span>
          </div>
        </div>
      </div>

      {/* Billing Interval Toggle */}
      <div className="max-w-xs mx-auto px-4 mb-8">
        <div className="bg-white rounded-full border shadow-sm flex p-1">
          <button
            onClick={() => { setBillingInterval('weekly'); setSelectedPlan(null); }}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              billingInterval === 'weekly' ? 'bg-moroccan-red text-white shadow' : 'text-moroccan-brown/60 hover:text-moroccan-brown'
            }`}
          >
            Hebdomadaire
          </button>
          <button
            onClick={() => { setBillingInterval('monthly'); setSelectedPlan(null); }}
            className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
              billingInterval === 'monthly' ? 'bg-moroccan-red text-white shadow' : 'text-moroccan-brown/60 hover:text-moroccan-brown'
            }`}
          >
            Mensuel
          </button>
        </div>
      </div>

      {/* Plan Type Selection */}
      <section className="max-w-4xl mx-auto px-4 mb-12">
        <h2 className="font-display text-3xl text-moroccan-brown text-center mb-2">
          C'est pour qui ?
        </h2>
        <p className="text-moroccan-brown/60 text-center mb-8">
          Choisissez le type de plan qui vous convient
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto">
          {/* Moi */}
          <button
            onClick={() => { setSelectedType('moi'); setSelectedPlan(null); }}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all group hover:shadow-lg ${
              selectedType === 'moi'
                ? 'border-moroccan-red bg-moroccan-red/5 shadow-md'
                : 'border-gray-200 bg-white hover:border-moroccan-red/30'
            }`}
          >
            {selectedType === 'moi' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-moroccan-red flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'moi' ? 'bg-moroccan-red' : 'bg-moroccan-red/10 group-hover:bg-moroccan-red/20'
            }`}>
              <User className={`w-8 h-8 ${selectedType === 'moi' ? 'text-white' : 'text-moroccan-red'}`} />
            </div>
            <h3 className="font-display text-2xl text-moroccan-brown mb-1">Moi</h3>
            <p className="text-sm text-moroccan-brown/60">
              Pour une personne. Vos repas préférés livrés chaque semaine.
            </p>
          </button>

          {/* Bundle */}
          <button
            onClick={() => { setSelectedType('bundle'); setSelectedPlan(null); }}
            className={`relative p-6 rounded-2xl border-2 text-left transition-all group hover:shadow-lg ${
              selectedType === 'bundle'
                ? 'border-moroccan-red bg-moroccan-red/5 shadow-md'
                : 'border-gray-200 bg-white hover:border-moroccan-red/30'
            }`}
          >
            {selectedType === 'bundle' && (
              <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-moroccan-red flex items-center justify-center">
                <Check className="w-4 h-4 text-white" />
              </div>
            )}
            <Badge className="absolute top-3 left-3 bg-moroccan-gold text-moroccan-brown text-xs">
              Meilleure valeur
            </Badge>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
              selectedType === 'bundle' ? 'bg-moroccan-red' : 'bg-moroccan-red/10 group-hover:bg-moroccan-red/20'
            }`}>
              <Users className={`w-8 h-8 ${selectedType === 'bundle' ? 'text-white' : 'text-moroccan-red'}`} />
            </div>
            <h3 className="font-display text-2xl text-moroccan-brown mb-1">Bundle</h3>
            <p className="text-sm text-moroccan-brown/60">
              Pour la famille ou le partage. Plus de repas, prix réduit par plat.
            </p>
          </button>
        </div>
      </section>

      {/* Meal Plans Grid */}
      <section className="max-w-6xl mx-auto px-4 mb-16">
        <h2 className="font-display text-3xl text-moroccan-brown text-center mb-2">
          Combien de repas ?
        </h2>
        <p className="text-moroccan-brown/60 text-center mb-8">
          Choisissez votre plan idéal et profitez de repas marocains faits maison
        </p>

        {filteredPlans.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border">
            <Package className="w-12 h-12 text-moroccan-brown/30 mx-auto mb-3" />
            <p className="text-moroccan-brown/60">
              Aucun plan disponible pour "{selectedType === 'moi' ? 'Moi' : 'Bundle'}" pour le moment.
            </p>
            <p className="text-sm text-moroccan-brown/40 mt-1">
              Les plans seront ajoutés prochainement.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((plan) => {
              const savings = maxPricePerMeal > 0 ? Math.round((1 - plan.price_per_meal / maxPricePerMeal) * 100) : 0;
              const isSelected = selectedPlan?.id === plan.id;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`relative text-left rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg group ${
                    isSelected
                      ? 'border-moroccan-red shadow-md ring-2 ring-moroccan-red/20'
                      : 'border-gray-200 bg-white hover:border-moroccan-red/40'
                  }`}
                >
                  {/* Popular badge */}
                  {plan.is_popular && (
                    <div className="bg-moroccan-red text-white text-center py-1.5 text-xs font-bold uppercase tracking-wider">
                      <Star className="w-3 h-3 inline mr-1" />
                      Populaire
                    </div>
                  )}

                  <div className="p-6">
                    {/* Selected check */}
                    {isSelected && (
                      <div className="absolute top-3 right-3 w-7 h-7 rounded-full bg-moroccan-red flex items-center justify-center">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}

                    <h3 className="font-display text-3xl text-moroccan-brown mb-1">
                      {plan.meals_per_week} <span className="text-lg">repas</span>
                    </h3>
                    <p className="text-sm text-moroccan-brown/50 mb-4">par semaine</p>

                    <div className="border-t border-b py-3 mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-moroccan-brown/60">À partir de</span>
                        <span className="text-2xl font-bold text-moroccan-red">{plan.price_per_meal.toFixed(2)}$</span>
                        <span className="text-sm text-moroccan-brown/60">/plat</span>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4 text-sm text-moroccan-brown/70">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-moroccan-green shrink-0" />
                        <span>{plan.meals_per_week * 4} repas/mois</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-moroccan-green shrink-0" />
                        <span>Livraison gratuite</span>
                      </div>
                      {savings > 0 && (
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-moroccan-green shrink-0" />
                          <span className="text-green-600 font-medium">Économisez {savings}%</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-moroccan-cream/50 rounded-xl p-3 text-center">
                      <span className="text-sm text-moroccan-brown/60">{billingInterval === 'weekly' ? 'Total hebdomadaire' : 'Total mensuel'}</span>
                      <p className="text-xl font-bold text-moroccan-brown">{(billingInterval === 'weekly' ? plan.price_per_meal * plan.meals_per_week : plan.monthly_price).toFixed(2)}$ <span className="text-sm font-normal text-moroccan-brown/50">/{billingInterval === 'weekly' ? 'sem' : 'mois'}</span></p>
                    </div>
                  </div>

                  {/* CTA */}
                  <div className={`px-6 pb-6`}>
                    <div className={`w-full py-3 rounded-xl text-center font-semibold text-sm transition-all ${
                      isSelected
                        ? 'bg-moroccan-red text-white'
                        : 'bg-moroccan-red/10 text-moroccan-red group-hover:bg-moroccan-red group-hover:text-white'
                    }`}>
                      {isSelected ? 'Plan sélectionné' : 'Choisir ce plan'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Subscribe button */}
        {selectedPlan && (
          <div className="mt-8 text-center animate-slide-up">
            <div className="inline-flex flex-col sm:flex-row items-center gap-4 bg-white rounded-2xl shadow-lg p-6 border">
              <div className="text-left">
                <p className="text-sm text-moroccan-brown/60">Votre sélection</p>
                <p className="font-display text-xl text-moroccan-brown">
                  {selectedPlan.meals_per_week} repas/semaine — <span className="text-moroccan-red">{(billingInterval === 'weekly' ? selectedPlan.price_per_meal * selectedPlan.meals_per_week : selectedPlan.monthly_price).toFixed(2)}$/{billingInterval === 'weekly' ? 'sem' : 'mois'}</span>
                </p>
              </div>
              <Button
                onClick={() => setCheckoutOpen(true)}
                className="bg-moroccan-red hover:bg-moroccan-red-dark text-white px-8 py-6 text-lg font-semibold rounded-full"
              >
                S'abonner maintenant
                <ShoppingCart className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </section>

      {/* Benefits Section */}
      <section className="py-16 px-4 bg-moroccan-brown text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(/zellige-pattern.jpg)',
            backgroundSize: '150px 150px',
            backgroundRepeat: 'repeat'
          }} />
        </div>
        <div className="max-w-5xl mx-auto relative z-10">
          <h2 className="font-display text-4xl text-center mb-12">
            Pourquoi s'abonner ?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: ChefHat,
                title: 'Fait Maison',
                desc: 'Chaque repas est préparé avec amour, recettes traditionnelles transmises de génération en génération.',
                color: 'bg-moroccan-red',
              },
              {
                icon: Truck,
                title: 'Livraison Gratuite',
                desc: 'Tous les abonnés profitent de la livraison gratuite chaque semaine dans la région du Grand Montréal.',
                color: 'bg-moroccan-orange',
              },
              {
                icon: Heart,
                title: 'Économisez Plus',
                desc: 'Plus vous commandez de repas, plus le prix par plat diminue. Jusqu\'à 30% d\'économies.',
                color: 'bg-moroccan-green',
              },
            ].map((item) => (
              <div key={item.title} className="text-center">
                <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4`}>
                  <item.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="font-display text-xl mb-2">{item.title}</h3>
                <p className="text-white/70 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 px-4 max-w-3xl mx-auto">
        <h2 className="font-display text-3xl text-moroccan-brown text-center mb-8">
          Questions Fréquentes
        </h2>
        <div className="space-y-4">
          {[
            {
              q: 'Comment fonctionne l\'abonnement ?',
              a: 'Vous choisissez le nombre de repas par semaine et payez mensuellement. Chaque semaine, nous préparons et livrons vos repas marocains frais à votre porte.',
            },
            {
              q: 'Puis-je annuler à tout moment ?',
              a: 'Oui ! Vous pouvez annuler votre abonnement à tout moment. L\'annulation prend effet à la fin de votre période de facturation en cours.',
            },
            {
              q: 'Quelle est la zone de livraison ?',
              a: 'Nous livrons dans toute la région du Grand Montréal. La livraison est gratuite pour tous les abonnés.',
            },
            {
              q: 'Puis-je choisir mes repas chaque semaine ?',
              a: 'Pour le moment, nos chefs sélectionnent les meilleurs plats de la semaine pour vous. Vous recevrez une variété de nos meilleures recettes.',
            },
          ].map((faq) => (
            <details key={faq.q} className="bg-white rounded-xl border p-4 group">
              <summary className="font-medium text-moroccan-brown cursor-pointer list-none flex items-center justify-between">
                {faq.q}
                <ChevronRight className="w-4 h-4 text-moroccan-brown/40 transition-transform group-open:rotate-90" />
              </summary>
              <p className="mt-3 text-sm text-moroccan-brown/70 leading-relaxed">{faq.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-12 px-4 bg-moroccan-cream border-t">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-moroccan-brown/60 text-sm">
            Des questions ? Contactez-nous à{' '}
            <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline">
              contact@bledcrate.ca
            </a>
          </p>
        </div>
      </section>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-moroccan-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-moroccan-brown">
              Finaliser l'abonnement
            </DialogTitle>
            <DialogDescription className="text-moroccan-brown/70">
              Remplissez vos informations pour commencer votre abonnement
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Plan summary */}
            {selectedPlan && (
              <div className="bg-white rounded-xl p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-moroccan-brown font-medium">
                    {selectedPlan.meals_per_week} repas/semaine
                  </span>
                  <Badge className="bg-moroccan-red/10 text-moroccan-red">
                    {selectedType === 'moi' ? 'Solo' : 'Bundle'}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm text-moroccan-brown/70">
                  <span>{billingInterval === 'weekly' ? `${selectedPlan.price_per_meal.toFixed(2)}$/plat x ${selectedPlan.meals_per_week} repas` : `${selectedPlan.price_per_meal.toFixed(2)}$/plat x ${selectedPlan.meals_per_week} x 4 semaines`}</span>
                </div>
                <div className="border-t pt-2 flex justify-between font-bold text-moroccan-red text-lg">
                  <span>{billingInterval === 'weekly' ? 'Total hebdomadaire' : 'Total mensuel'}</span>
                  <span>{(billingInterval === 'weekly' ? selectedPlan.price_per_meal * selectedPlan.meals_per_week : selectedPlan.monthly_price).toFixed(2)}$ /{billingInterval === 'weekly' ? 'sem' : 'mois'}</span>
                </div>
                <p className="text-xs text-moroccan-brown/40">Livraison gratuite incluse. Annulable à tout moment.</p>
              </div>
            )}

            {/* Form */}
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-moroccan-brown mb-1 block">Nom complet *</label>
                <input
                  type="text"
                  placeholder="Ex: Fatima Benali"
                  value={customerInfo.name}
                  onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))}
                  className="w-full border border-moroccan-brown/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-moroccan-red bg-white text-moroccan-brown"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-moroccan-brown mb-1 block">Email *</label>
                <input
                  type="email"
                  placeholder="Ex: fatima@email.com"
                  value={customerInfo.email}
                  onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-moroccan-brown/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-moroccan-red bg-white text-moroccan-brown"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-moroccan-brown mb-1 block">Téléphone *</label>
                <input
                  type="tel"
                  placeholder="Ex: 438-808-4120"
                  value={customerInfo.phone}
                  onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))}
                  className="w-full border border-moroccan-brown/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-moroccan-red bg-white text-moroccan-brown"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-moroccan-brown mb-1 block">Adresse de livraison *</label>
                <input
                  type="text"
                  placeholder="Ex: 123 Rue Principale, Montréal"
                  value={customerInfo.address}
                  onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full border border-moroccan-brown/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-moroccan-red bg-white text-moroccan-brown"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-moroccan-brown mb-1 block">Notes (allergies, instructions...)</label>
                <textarea
                  placeholder="Allergies, instructions spéciales..."
                  value={customerInfo.notes}
                  onChange={e => setCustomerInfo(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  className="w-full border border-moroccan-brown/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-moroccan-red bg-white text-moroccan-brown resize-none"
                />
              </div>
            </div>

            <Button
              onClick={handleSubscribe}
              disabled={isSubmitting}
              className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-6 font-semibold text-base"
            >
              {isSubmitting
                ? 'Redirection vers le paiement...'
                : `S'abonner — ${(billingInterval === 'weekly' ? (selectedPlan?.price_per_meal ?? 0) * (selectedPlan?.meals_per_week ?? 0) : selectedPlan?.monthly_price ?? 0).toFixed(2)} $/${billingInterval === 'weekly' ? 'sem' : 'mois'}`
              }
            </Button>
            <div className="flex items-center justify-center gap-2 mt-1">
              <svg className="w-4 h-4 text-moroccan-brown/30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
              <p className="text-xs text-moroccan-brown/40">Paiement sécurisé par Stripe. Annulable à tout moment.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Toaster position="top-right" richColors />
    </div>
  );
}
