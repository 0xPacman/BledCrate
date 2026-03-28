import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail, Shield, Database, Users, Lock, Cookie, UserX, RefreshCw, MessageCircle, Eye, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-moroccan-cream">
      <Helmet>
        <title>Politique de Confidentialité | BledCrate</title>
        <meta name="description" content="Politique de confidentialité de BledCrate. Comment nous protégeons vos données personnelles." />
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
            Politique de Confidentialité
          </h1>
          <p className="text-moroccan-brown/50 text-sm mb-10">Date d'entrée en vigueur : 23 mars 2026</p>

          <p className="text-moroccan-brown/80 leading-relaxed mb-6">
            Chez BledCrate (« nous », « notre », « nos »), la protection de la vie privée de nos clients est une priorité absolue. Nous nous engageons à assurer transparence, sécurité et contrôle aux utilisateurs de nos services.
          </p>
          <p className="text-moroccan-brown/80 leading-relaxed mb-10">
            La présente politique de confidentialité décrit la manière dont nous collectons, utilisons, stockons et protégeons vos données personnelles lorsque vous interagissez avec notre entreprise, que ce soit via notre site web, lors d'un achat ou dans le cadre de communications avec nous.
          </p>

          {/* Les Informations que Nous Collectons */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-green rounded-full flex items-center justify-center">
                <Database className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Les Informations que Nous Collectons</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nous collectons différentes catégories de données personnelles afin d'assurer le bon fonctionnement de nos services et d'améliorer votre expérience :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Nom et prénom</li>
                <li>Adresse postale (domicile et/ou professionnelle)</li>
                <li>Adresse e-mail</li>
                <li>Numéro de téléphone</li>
                <li>Informations de paiement</li>
                <li>Toute autre information permettant de vous identifier directement ou indirectement</li>
              </ul>
              <p>Nous pouvons également recueillir des données lorsque vous :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Contactez notre service client</li>
                <li>Naviguez sur notre site web</li>
                <li>Laissez des avis ou commentaires</li>
              </ul>
              <p>En utilisant nos services, vous consentez à la collecte et à l'utilisation de vos données conformément à cette politique.</p>
            </div>
          </section>

          {/* Utilisation des Données */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-orange rounded-full flex items-center justify-center">
                <Eye className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Utilisation des Données et Finalités</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Les données collectées sont utilisées pour :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Traiter et expédier vos commandes</li>
                <li>Gérer les paiements et la facturation</li>
                <li>Répondre à vos demandes et questions</li>
                <li>Améliorer nos produits et services</li>
                <li>Personnaliser votre expérience utilisateur</li>
                <li>Vous envoyer des communications pertinentes (offres, nouveautés, mises à jour)</li>
                <li>Réaliser des analyses internes et études de marché</li>
              </ul>
              <p className="font-medium">Nous nous engageons à ne jamais vendre vos données personnelles à des tiers.</p>
            </div>
          </section>

          {/* Partage des Données */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-red rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Partage des Données et Tiers</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nous pouvons partager certaines données avec des prestataires de confiance afin d'assurer :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>La livraison de vos commandes</li>
                <li>Le traitement des paiements</li>
                <li>L'hébergement et la sécurité des données</li>
              </ul>
              <p>Ces partenaires sont contractuellement tenus de protéger vos informations et de les utiliser uniquement dans le cadre des services fournis à BledCrate.</p>
              <p>Nous pouvons également utiliser des données anonymisées à des fins statistiques et d'amélioration continue.</p>
            </div>
          </section>

          {/* Vos Droits */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-gold rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Vos Droits</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Conformément aux lois applicables (notamment au Canada), vous disposez des droits suivants :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Accéder à vos données personnelles</li>
                <li>Corriger ou mettre à jour vos informations</li>
                <li>Demander la suppression de vos données (sous réserve d'obligations légales)</li>
                <li>Vous opposer à certains traitements</li>
              </ul>
              <p>Pour exercer vos droits, contactez-nous à : <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-medium">contact@bledcrate.ca</a></p>
              <p>Nous traiterons votre demande dans les meilleurs délais.</p>
            </div>
          </section>

          {/* Durée de Conservation */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-terracotta rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Durée de Conservation</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Vos données sont conservées uniquement pendant la durée nécessaire aux finalités décrites dans cette politique, sauf obligation légale contraire.</p>
              <p>Une fois cette période écoulée, vos données seront supprimées ou anonymisées.</p>
            </div>
          </section>

          {/* Sécurité des Données */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-green rounded-full flex items-center justify-center">
                <Lock className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Sécurité des Données</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nous mettons en place des mesures de sécurité rigoureuses :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Hébergement sur des plateformes sécurisées</li>
                <li>Chiffrement des données sensibles</li>
                <li>Accès limité aux personnes autorisées</li>
              </ul>
              <p>Malgré tout, aucun système n'étant totalement sécurisé, nous améliorons continuellement nos pratiques pour garantir la protection maximale de vos données.</p>
            </div>
          </section>

          {/* Cookies */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-orange rounded-full flex items-center justify-center">
                <Cookie className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Cookies et Technologies de Suivi</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Notre site utilise des cookies pour :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Améliorer votre expérience utilisateur</li>
                <li>Analyser le trafic</li>
                <li>Personnaliser le contenu et les offres</li>
              </ul>
              <p>Vous pouvez configurer votre navigateur pour refuser ou limiter les cookies.</p>
            </div>
          </section>

          {/* Protection des Mineurs */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-red rounded-full flex items-center justify-center">
                <UserX className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Protection des Mineurs</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nos services ne sont pas destinés aux personnes de moins de 18 ans. Nous ne collectons pas volontairement de données concernant des mineurs. Si une telle situation est détectée, les données seront supprimées rapidement.</p>
            </div>
          </section>

          {/* Modifications */}
          <section className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-gold rounded-full flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Modifications de la Politique</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Nous pouvons mettre à jour cette politique de confidentialité à tout moment afin de refléter :</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Des changements légaux</li>
                <li>Des évolutions de nos services</li>
              </ul>
              <p>Toute modification importante sera communiquée via notre site ou par e-mail.</p>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-moroccan-brown rounded-full flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="font-display text-3xl text-moroccan-brown">Nous Contacter</h2>
            </div>
            <div className="pl-[52px] text-moroccan-brown/80 leading-relaxed space-y-4">
              <p>Pour toute question ou demande concernant vos données personnelles, vous pouvez nous contacter à :</p>
              <div className="bg-moroccan-cream rounded-xl p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-moroccan-red" />
                <a href="mailto:contact@bledcrate.ca" className="text-moroccan-red hover:underline font-semibold text-lg">contact@bledcrate.ca</a>
              </div>
              <p>Merci d'inclure les informations nécessaires afin que nous puissions traiter votre demande efficacement.</p>
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
