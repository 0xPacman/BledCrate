import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle, ShoppingCart, Package, Copy, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_BASE = import.meta.env.VITE_API_URL || 'https://bledcrate.ca';

interface OrderData {
  id: string;
  tracking_code: string;
  customer_name: string;
  total: number;
  items: { name: string; variant?: string; quantity: number; price: number }[];
  created_at: string;
}

export default function SuccessPage() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(!!sessionId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!sessionId) { setLoading(false); return; }

    // Fetch order from API by Stripe session ID
    const fetchOrder = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/orders/by-session?session_id=${sessionId}`);
        if (res.ok) {
          const data = await res.json();
          setOrder(data);
          // Clear cart from localStorage after successful payment
          localStorage.removeItem('bledcrate_cart');
          localStorage.removeItem('bledcrate_pending_order');
        }
      } catch { /* silent */ }
      finally { setLoading(false); }
    };

    // Webhook may not have processed yet — retry a few times
    let attempts = 0;
    const tryFetch = () => {
      attempts++;
      fetchOrder().then(() => {
        if (!order && attempts < 5) {
          setTimeout(tryFetch, 2000);
        }
      });
    };
    tryFetch();
  }, [sessionId]);

  const copyTracking = () => {
    if (!order?.tracking_code) return;
    navigator.clipboard.writeText(order.tracking_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-moroccan-cream flex items-center justify-center p-4">
      <Helmet>
        <title>Commande Confirmée | BledCrate</title>
        <meta name="robots" content="noindex" />
      </Helmet>
      <div className="bg-white rounded-2xl shadow-moroccan p-8 sm:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-5xl text-moroccan-brown mb-4">Merci !</h1>
        <p className="text-moroccan-brown/70 leading-relaxed mb-2">
          Votre commande a été confirmée et payée avec succès.
        </p>
        <p className="text-moroccan-brown/70 leading-relaxed mb-6">
          Nous préparons votre commande avec amour et vous contacterons bientôt pour la livraison.
        </p>

        {loading && (
          <div className="flex items-center justify-center gap-2 mb-6 text-moroccan-brown/60">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">Chargement de votre commande...</span>
          </div>
        )}

        {order && (
          <>
            {/* Tracking Code Card */}
            {order.tracking_code && (
              <div className="bg-moroccan-gold/10 border-2 border-moroccan-gold/30 rounded-xl p-4 mb-6">
                <p className="text-xs text-moroccan-brown/60 mb-1">Votre code de suivi</p>
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono text-2xl font-bold text-moroccan-brown tracking-wider">{order.tracking_code}</span>
                  <button onClick={copyTracking} className="p-1.5 rounded-lg hover:bg-moroccan-gold/20 transition-colors">
                    {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-moroccan-brown/40" />}
                  </button>
                </div>
                <p className="text-xs text-moroccan-brown/50 mt-2">
                  Utilisez ce code sur la page <Link to="/track" className="text-moroccan-red underline">Track</Link> pour suivre votre commande
                </p>
              </div>
            )}

            {/* Order Summary */}
            <div className="bg-moroccan-cream rounded-xl p-4 mb-6 text-left text-sm">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-moroccan-red" />
                <span className="font-semibold text-moroccan-brown">Résumé de votre commande</span>
              </div>
              <div className="space-y-1 text-moroccan-brown/70">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>{item.name}{item.variant ? ` (${item.variant})` : ''} x{item.quantity}</span>
                    <span className="font-medium">{(item.price * item.quantity).toFixed(2)} $</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-moroccan-brown/10 mt-2 pt-2 flex justify-between font-bold text-moroccan-red">
                <span>Total payé</span>
                <span>{order.total.toFixed(2)} $</span>
              </div>
              <p className="text-xs text-moroccan-brown/40 text-right mt-1">TPS + TVQ incluses</p>
            </div>
          </>
        )}

        <Link to="/">
          <Button className="bg-moroccan-red hover:bg-moroccan-red-dark text-white rounded-full px-8 py-6 font-semibold">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Retour au menu
          </Button>
        </Link>
      </div>
    </div>
  );
}
