import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Check, Calendar, ArrowRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SubscriptionSuccessPage() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem('bledcrate_pending_subscription');
    if (raw) {
      try { setData(JSON.parse(raw)); } catch {}
      localStorage.removeItem('bledcrate_pending_subscription');
    }
  }, []);

  return (
    <div className="min-h-screen bg-moroccan-cream flex items-center justify-center p-4">
      <Helmet>
        <title>Abonnement Confirmé | BledCrate</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <Check className="w-10 h-10 text-green-600" />
          </div>

          <h1 className="font-display text-3xl text-moroccan-brown mb-2">
            Abonnement Confirmé !
          </h1>
          <p className="text-moroccan-brown/60 mb-6">
            Merci{data?.customer?.name ? `, ${data.customer.name}` : ''} ! Votre abonnement est maintenant actif.
          </p>

          {data?.plan && (
            <div className="bg-moroccan-cream rounded-xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-moroccan-red" />
                <span className="font-medium text-moroccan-brown">Votre plan</span>
              </div>
              <p className="text-sm text-moroccan-brown/70">
                {data.plan.meals_per_week} repas/semaine — {data.plan.monthly_price?.toFixed(2)}$/mois
              </p>
            </div>
          )}

          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left text-sm">
            <div className="flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-800">Prochaines étapes</span>
            </div>
            <p className="text-blue-700">
              Vous recevrez un email de confirmation avec les détails de votre abonnement.
              Vos premiers repas seront livrés cette semaine !
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link to="/">
              <Button className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-5">
                Découvrir le menu
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/abonnement" className="text-sm text-moroccan-brown/50 hover:text-moroccan-red transition-colors">
              Voir les plans d'abonnement
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
