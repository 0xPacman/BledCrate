import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Truck, RotateCcw, CreditCard, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PolicyPage() {
  return (
    <div className="min-h-screen bg-moroccan-cream">
      <Helmet>
        <title>Politique de Livraison et Retours | BledCrate</title>
        <meta name="description" content="Politique de livraison, retours et remboursements de BledCrate. Livraison gratuite dans le Grand Montréal pour les abonnements." />
      </Helmet>
      {/* Header */}
      <header className="bg-moroccan-brown text-white py-6 px-4 sm:px-6 lg:px-8 sticky top-0 z-50 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/">
            <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BledCrate" className="w-10 h-10 rounded-full object-cover border-2 border-moroccan-gold" />
            <span className="font-display text-xl font-bold">BledCrate</span>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-moroccan p-8 sm:p-12">
          <h1 className="font-display text-4xl sm:text-5xl text-moroccan-brown mb-2">
            Politique de Livraison, Retours et Remboursements
          </h1>
          <p className="text-moroccan-brown/50 text-sm mb-10">Date d'entrée en vigueur : 23 mars 2026</p>

          <p className="text-moroccan-brown/80 leading-relaxed mb-10">
            Chez BledCrate, la satisfaction de nos clients est une priorité. Cette politique décrit nos pratiques concernant la livraison, les retours et les remboursements. En passant commande sur notre plateforme, vous acceptez les conditions ci-dessous.
          </p>

          {/* Livraison */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-green rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Politique de Livraison</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>
                BledCrate s'engage à expédier et livrer les commandes dans les meilleurs délais via des services de livraison fiables. Cependant, les délais de livraison sont estimatifs et peuvent être affectés par plusieurs facteurs, notamment :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Les conditions météorologiques</li>
                <li>Les contraintes logistiques</li>
                <li>Les retards des transporteurs tiers</li>
              </ul>
              <p>
                En cas de retard, nous nous efforcerons de vous informer rapidement avec une mise à jour du statut de votre livraison.
              </p>
              <p>
                Nous livrons uniquement dans les zones desservies au moment de la commande. Nous nous réservons le droit de refuser ou d'annuler une commande si la livraison présente un risque ou une contrainte opérationnelle.
              </p>
            </div>
          </section>

          {/* Retour */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-orange rounded-full flex items-center justify-center">
                <RotateCcw className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Politique de Retour</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>
                En raison de la nature de certains produits (notamment alimentaires ou sensibles), les retours ne sont généralement pas acceptés une fois la commande livrée. Toutefois, des exceptions peuvent s'appliquer dans les cas suivants :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Produit endommagé à la réception</li>
                <li>Produit incorrect</li>
                <li>Article manquant</li>
              </ul>
              <p>
                Dans ces situations, veuillez nous contacter rapidement à{' '}
                <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-medium">contact@bledcrate.ca</a>{' '}
                en fournissant :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Votre numéro de commande</li>
                <li>Une description du problème</li>
                <li>Des photos (si applicable)</li>
              </ul>
              <p>
                Chaque demande sera analysée au cas par cas, et une solution appropriée sera proposée (remplacement, crédit ou remboursement).
              </p>
            </div>
          </section>

          {/* Remboursement */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-red rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Politique de Remboursement</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>
                Pour toute demande de remboursement, vous devez nous contacter à{' '}
                <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-medium">contact@bledcrate.ca</a>{' '}
                avec les informations pertinentes. Les demandes seront évaluées selon les critères suivants :
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Erreur dans la commande</li>
                <li>Produit défectueux ou endommagé</li>
                <li>Livraison non effectuée pour des raisons imputables à BledCrate</li>
              </ul>
              <p>Si la demande est approuvée :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Le remboursement sera effectué via le mode de paiement initial</li>
                <li>Le délai de traitement est généralement de 7 à 14 jours ouvrables</li>
              </ul>
              <p>Nous nous réservons le droit de refuser une demande si :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Les conditions ne sont pas respectées</li>
                <li>Les preuves fournies sont insuffisantes</li>
              </ul>
            </div>
          </section>

          {/* Communication */}
          <section className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-gold rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Communication et Assistance</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>
                Pour toute question concernant une livraison, un retour ou un remboursement, vous pouvez nous contacter à :
              </p>
              <div className="bg-moroccan-cream rounded-xl p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-moroccan-red" />
                <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-semibold text-lg">contact@bledcrate.ca</a>
              </div>
              <p>
                Nous nous engageons à répondre rapidement et à trouver une solution juste et satisfaisante.
              </p>
            </div>
          </section>
        </div>

        {/* Back link */}
        <div className="text-center mt-8">
          <Link to="/">
            <Button className="bg-moroccan-red hover:bg-moroccan-red-dark text-white rounded-full px-8 py-6 font-semibold">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Retour à l'accueil
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
