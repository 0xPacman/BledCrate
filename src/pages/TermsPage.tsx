import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, FileText, Truck, CreditCard, ShoppingCart, Users, Shield, Scale, RefreshCw, MessageCircle, AlertTriangle, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-moroccan-cream">
      <Helmet>
        <title>Conditions Générales | BledCrate</title>
        <meta name="description" content="Conditions générales d'utilisation de BledCrate. Termes de vente pour les commandes de repas marocains." />
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
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-moroccan-brown/50 text-sm mb-10">Date d'entrée en vigueur : 23 mars 2026</p>

          <p className="text-moroccan-brown/80 leading-relaxed mb-6">
            Bienvenue sur BledCrate (« nous », « notre », « nos »), un service de vente et de livraison de produits. En utilisant nos services, incluant la commande, la réception et l'utilisation de nos produits, vous acceptez de respecter les présentes Conditions Générales d'Utilisation (« Conditions »).
          </p>
          <p className="text-moroccan-brown/80 leading-relaxed mb-10">
            Ces conditions constituent un accord juridiquement contraignant qui définit vos droits et obligations lors de l'utilisation de nos services.
          </p>

          {/* Portée des Services */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-green rounded-full flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Portée des Services</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>BledCrate propose la vente et la livraison de produits (notamment des box et articles sélectionnés).</p>
              <p>Nous nous efforçons de respecter les délais de livraison indiqués lors de la commande, mais ceux-ci restent estimatifs et peuvent varier selon plusieurs facteurs, notamment :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>La logistique</li>
                <li>Les conditions météorologiques</li>
                <li>La disponibilité des produits</li>
              </ul>
              <p>Nous ne garantissons donc pas des délais de livraison exacts et recommandons aux clients de prévoir une certaine flexibilité.</p>
            </div>
          </section>

          {/* Admissibilité */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-orange rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Admissibilité des Clients</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nos services sont accessibles à toute personne ayant la capacité légale de conclure une transaction.</p>
              <p>En passant une commande, vous confirmez :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Avoir l'âge légal requis</li>
                <li>Avoir la capacité juridique de conclure cet accord</li>
                <li>Fournir des informations exactes et complètes</li>
              </ul>
            </div>
          </section>

          {/* Commandes, Paiements */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-red rounded-full flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Commandes, Paiements et Politique de Remboursement</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Les commandes peuvent être effectuées via notre plateforme en ligne avec paiement sécurisé (carte de crédit ou débit).</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Les annulations sont possibles uniquement si elles sont effectuées avant le traitement ou l'expédition de la commande.</li>
                <li>Les modifications doivent être demandées par e-mail à <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-medium">contact@bledcrate.ca</a>.</li>
                <li>Les remboursements sont évalués au cas par cas et ne sont pas garantis. Ils sont accordés à notre discrétion, selon la situation et l'état des produits reçus.</li>
              </ul>
            </div>
          </section>

          {/* Livraison */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-gold rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Livraison et Zones Desservies</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>BledCrate livre selon les zones disponibles au moment de la commande.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nous nous réservons le droit de refuser ou annuler une commande si la livraison présente un risque ou une contrainte.</li>
                <li>Le client est responsable de fournir une adresse de livraison valide et accessible.</li>
                <li>Nous ne sommes pas responsables des colis laissés à l'extérieur en cas d'absence du client.</li>
                <li>Les retards causés par des facteurs externes ne peuvent engager notre responsabilité.</li>
              </ul>
            </div>
          </section>

          {/* Informations sur les Produits */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-terracotta rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Informations sur les Produits</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nous faisons de notre mieux pour fournir des descriptions précises de nos produits.</p>
              <p>Cependant :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Certaines variations peuvent exister (emballage, contenu, disponibilité)</li>
                <li>Les produits alimentaires peuvent contenir des allergènes</li>
              </ul>
              <p>Nous recommandons aux clients ayant des restrictions ou allergies de nous contacter avant toute commande.</p>
            </div>
          </section>

          {/* Abonnements */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-green rounded-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Abonnements (si applicable)</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>BledCrate peut proposer des services d'abonnement récurrents.</p>
              <p>Les clients abonnés peuvent :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Modifier, suspendre ou annuler leur abonnement avec un préavis minimum de 48 heures avant la prochaine facturation ou expédition</li>
                <li>Bénéficier d'offres promotionnelles, susceptibles d'être modifiées à tout moment</li>
              </ul>
            </div>
          </section>

          {/* Comportement et Fraudes */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-red rounded-full flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Comportement des Utilisateurs et Prévention des Fraudes</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Toute activité frauduleuse est strictement interdite, notamment :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>L'utilisation abusive des moyens de paiement</li>
                <li>Les commandes frauduleuses</li>
                <li>Tout comportement inapproprié envers notre équipe</li>
              </ul>
              <p>Nous nous réservons le droit de refuser ou annuler toute commande suspecte et de prendre les mesures nécessaires.</p>
            </div>
          </section>

          {/* Propriété Intellectuelle */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-gold rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Propriété Intellectuelle</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Tous les contenus associés à BledCrate (nom, logo, visuels, textes) sont protégés par les lois applicables.</p>
              <p>Toute reproduction, utilisation ou diffusion sans autorisation est strictement interdite.</p>
            </div>
          </section>

          {/* Limitation de Responsabilité */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-orange rounded-full flex items-center justify-center">
                <Scale className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Limitation de Responsabilité</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>BledCrate ne peut être tenu responsable des éléments suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Retards de livraison dus à des facteurs externes</li>
                <li>Perte ou détérioration après livraison</li>
                <li>Mauvaise utilisation des produits</li>
                <li>Réactions allergiques ou effets liés aux produits</li>
                <li>Informations incorrectes fournies par des tiers</li>
              </ul>
            </div>
          </section>

          {/* Modifications */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-terracotta rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Modifications des Conditions</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nous nous réservons le droit de modifier ces Conditions à tout moment.</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Les modifications seront communiquées via notre site ou par e-mail.</li>
                <li>L'utilisation continue de nos services vaut acceptation des nouvelles conditions.</li>
              </ul>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-brown rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Contact et Assistance</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Pour toute question concernant ces Conditions Générales d'Utilisation, vous pouvez nous contacter à :</p>
              <div className="bg-moroccan-cream rounded-xl p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-moroccan-red" />
                <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-semibold text-lg">contact@bledcrate.ca</a>
              </div>
              <p>Nous nous engageons à répondre dans les meilleurs délais.</p>
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
