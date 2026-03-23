import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingCart, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SavedOrder {
  id: string;
  items: { name: string; variant?: string; quantity: number; price: number }[];
  customer: { name: string; email: string };
  total: number;
  promo: string | null;
  date: string;
  status: string;
}

export default function SuccessPage() {
  const [order, setOrder] = useState<SavedOrder | null>(null);

  useEffect(() => {
    // Recover pending order data saved before Stripe redirect
    const pendingRaw = localStorage.getItem('bledcrate_pending_order');
    if (!pendingRaw) return;

    try {
      const pending = JSON.parse(pendingRaw);
      const savedOrder: SavedOrder = {
        id: crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36),
        ...pending,
        status: 'paid',
      };

      // Add to persistent orders array
      const existingRaw = localStorage.getItem('bledcrate_orders');
      const existing: SavedOrder[] = existingRaw ? JSON.parse(existingRaw) : [];
      existing.unshift(savedOrder);
      localStorage.setItem('bledcrate_orders', JSON.stringify(existing));

      // Clean up pending
      localStorage.removeItem('bledcrate_pending_order');

      setOrder(savedOrder);
    } catch {
      localStorage.removeItem('bledcrate_pending_order');
    }
  }, []);

  return (
    <div className="min-h-screen bg-moroccan-cream flex items-center justify-center p-4">
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

        {order && (
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
            <p className="text-xs text-moroccan-brown/40 text-right mt-1">Frais et taxes inclus</p>
          </div>
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
