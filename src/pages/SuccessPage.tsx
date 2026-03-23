import { Link } from 'react-router-dom';
import { CheckCircle, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SuccessPage() {
  return (
    <div className="min-h-screen bg-moroccan-cream flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-moroccan p-8 sm:p-12 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-display text-5xl text-moroccan-brown mb-4">Merci !</h1>
        <p className="text-moroccan-brown/70 leading-relaxed mb-2">
          Votre commande a été confirmée et payée avec succès.
        </p>
        <p className="text-moroccan-brown/70 leading-relaxed mb-8">
          Nous préparons votre commande avec amour et vous contacterons bientôt pour la livraison.
        </p>
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
