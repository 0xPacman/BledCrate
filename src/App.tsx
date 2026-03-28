import { useState, useEffect } from 'react';
import {
  ShoppingCart,
  ChefHat,
  Truck,
  Home,
  Star,
  Instagram,
  Facebook,
  Plus,
  Minus,
  X,
  Menu,
  Clock,
  Heart,
  MapPin,
  Globe,
  Mail,
  ArrowUp,
  ChevronRight,
  ChevronLeft,
  Package,
  Percent,
  Check,
  CalendarCheck,
  UtensilsCrossed,
  Salad,
  CakeSlice,
  ArrowRight,
  User,
  CreditCard,
  Shield,
  Sparkles,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import menuData from '@/data/menu.json';
import { fetchProducts as apiFetchProducts, createCheckout, validatePromo, fetchPublicSettings, fetchSubscriptionPlans, createSubscription, fetchPublicReviews } from '@/lib/api';
import type { Review } from '@/lib/api';
import type { SiteSettings, SubscriptionPlan } from '@/lib/api';
import './App.css';

// Types
interface Variant {
  name: string;
  price: number; // adjustment from base price (+/- $)
}

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'entree' | 'plat' | 'dessert';
  tags?: string[];
  variants?: Variant[];
}

interface CartItem extends MenuItem {
  quantity: number;
  selectedVariant?: string;
  variantPrice?: number; // final price after variant adjustment
}

// Fallback data from JSON
const fallbackMenuItems: MenuItem[] = menuData.menuItems as MenuItem[];
const testimonials = menuData.testimonials;

interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
  promoCode: string;
}

function App() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { const saved = localStorage.getItem('bledcrate_cart'); return saved ? JSON.parse(saved) : []; }
    catch { return []; }
  });
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuItem[]>(fallbackMenuItems);
  const [promoApplied, setPromoApplied] = useState<{ code: string; discount: number } | null>(null);
  const [siteSettings, setSiteSettings] = useState<SiteSettings | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);

  // Purchase flow state
  type PurchaseMode = null | 'onetime' | 'subscription';
  type OnetimeStep = 'entree' | 'plat' | 'dessert' | 'review';
  type SubStep = 'meals' | 'plats' | 'extras' | 'review';
  const [purchaseMode, setPurchaseMode] = useState<PurchaseMode>(null);
  const [onetimeStep, setOnetimeStep] = useState<OnetimeStep>('entree');
  const [subStep, setSubStep] = useState<SubStep>('meals');
  const [onetimeSelections, setOnetimeSelections] = useState<Record<string, { item: MenuItem; qty: number; variant?: Variant }>>({});
  const [subMealCount, setSubMealCount] = useState<number>(0);
  const [subSelectedPlan, setSubSelectedPlan] = useState<SubscriptionPlan | null>(null);
  const [subBillingInterval, setSubBillingInterval] = useState<'weekly' | 'monthly'>('monthly');
  const [subPlats, setSubPlats] = useState<Record<string, { item: MenuItem; qty: number }>>({});
  const [subExtras, setSubExtras] = useState<Record<string, { item: MenuItem; qty: number; category: string }>>({});
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [subCheckoutOpen, setSubCheckoutOpen] = useState(false);
  const [subCustomerInfo, setSubCustomerInfo] = useState({ name: '', email: '', phone: '', address: '', notes: '' });
  const [subSubmitting, setSubSubmitting] = useState(false);
  const [subExtrasMode, setSubExtrasMode] = useState<'recurring' | 'onetime'>('onetime');

  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    email: '',
    phone: '',
    address: '',
    notes: '',
    promoCode: '',
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('bledcrate_cart', JSON.stringify(cart));
  }, [cart]);

  // Load products from API (fallback to JSON) + settings
  useEffect(() => {
    apiFetchProducts()
      .then(products => {
        const active = products.filter(p => p.active);
        if (active.length > 0) setMenuItems(active as MenuItem[]);
      })
      .catch(() => { /* use fallback JSON data */ });
    fetchPublicSettings()
      .then(s => setSiteSettings(s))
      .catch(() => { /* use defaults */ });
    fetchSubscriptionPlans()
      .then(p => setSubscriptionPlans(p))
      .catch(() => {});
    fetchPublicReviews()
      .then(r => setReviews(r))
      .catch(() => {});
  }, []);

  // Handle scroll for navbar and back-to-top
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
      setShowBackToTop(window.scrollY > 600);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add to cart
  const addToCart = (item: MenuItem, variant?: Variant) => {
    const variantName = variant?.name;
    const finalPrice = variant ? item.price + variant.price : item.price;
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id && i.selectedVariant === variantName);
      if (existingItem) {
        return prev.map(i =>
          i.id === item.id && i.selectedVariant === variantName
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, price: finalPrice, quantity: 1, selectedVariant: variantName, variantPrice: finalPrice }];
    });
    toast.success(`${item.name} ajouté au panier !`, {
      description: variantName ? `${variantName}${variant!.price !== 0 ? ` (${variant!.price > 0 ? '+' : ''}${variant!.price.toFixed(2)} $)` : ''}` : undefined,
    });
    setSelectedItem(null);
    setSelectedVariant(null);
  };

  // Remove from cart
  const removeFromCart = (itemId: string, variant?: string) => {
    setCart(prev => prev.filter(i => !(i.id === itemId && i.selectedVariant === variant)));
  };

  // Update quantity
  const updateQuantity = (itemId: string, delta: number, variant?: string) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId && item.selectedVariant === variant) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // Cart total
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Apply promo code
  const applyPromoCode = async () => {
    if (!customerInfo.promoCode.trim()) return;
    try {
      const result = await validatePromo(customerInfo.promoCode.trim());
      if (result.valid) {
        setPromoApplied({ code: customerInfo.promoCode.trim().toUpperCase(), discount: result.discount_percent });
        toast.success(`Code promo appliqué : -${result.discount_percent}%`);
      } else {
        setPromoApplied(null);
        toast.error('Code promo invalide ou expiré');
      }
    } catch {
      setPromoApplied(null);
      toast.error('Code promo invalide');
    }
  };

  // Bundle discount logic
  const bundleEnabled = siteSettings?.bundle_enabled === 'true';
  const bundleMinItems = parseInt(siteSettings?.bundle_min_items || '3');
  const bundleDiscountPercent = parseInt(siteSettings?.bundle_discount_percent || '10');
  const qualifiesForBundle = bundleEnabled && cartCount >= bundleMinItems;
  const bundleDiscountAmount = qualifiesForBundle ? (cartTotal * bundleDiscountPercent / 100) : 0;
  const afterBundle = cartTotal - bundleDiscountAmount;

  // Promo discount (applied after bundle)
  const discountAmount = promoApplied ? (afterBundle * promoApplied.discount / 100) : 0;
  const afterDiscount = afterBundle - discountAmount;

  // Delivery fee
  const freeDeliveryThreshold = parseFloat(siteSettings?.free_delivery_threshold || '75');
  const baseDeliveryFee = parseFloat(siteSettings?.delivery_fee || '5');
  const deliveryFee = afterDiscount >= freeDeliveryThreshold ? 0 : baseDeliveryFee;
  const amountToFreeDelivery = freeDeliveryThreshold - afterDiscount;

  const finalTotal = Math.round((afterDiscount + deliveryFee) * 1.15 * 100) / 100;

  // Send order via Stripe Checkout
  const sendOrder = async () => {
    if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.address) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSubmitting(true);
    try {
      const { url } = await createCheckout({
        items: cart.map(i => ({
          name: i.name,
          variant: i.selectedVariant,
          quantity: i.quantity,
          price: i.price,
        })),
        customer: {
          name: customerInfo.name,
          email: customerInfo.email,
          phone: customerInfo.phone,
          address: customerInfo.address,
          notes: customerInfo.notes,
        },
        promo_code: promoApplied?.code,
        bundle_discount: qualifiesForBundle,
        delivery_fee: deliveryFee,
      });
      // Save order data to localStorage before redirect so success page can recover it
      localStorage.setItem('bledcrate_pending_order', JSON.stringify({
        items: cart.map(i => ({ name: i.name, variant: i.selectedVariant, quantity: i.quantity, price: i.price })),
        customer: { name: customerInfo.name, email: customerInfo.email },
        total: finalTotal,
        promo: promoApplied?.code || null,
        date: new Date().toISOString(),
      }));
      window.location.href = url;
    } catch {
      toast.error('Erreur lors de la création du paiement. Réessayez ou contactez-nous par email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  // ── One-time purchase helpers ──
  const onetimeSteps: OnetimeStep[] = ['entree', 'plat', 'dessert', 'review'];
  const onetimeStepLabels: Record<OnetimeStep, string> = { entree: 'Entrées', plat: 'Plats', dessert: 'Desserts', review: 'Récapitulatif' };
  const onetimeStepIcons: Record<OnetimeStep, typeof Salad> = { entree: Salad, plat: UtensilsCrossed, dessert: CakeSlice, review: Check };
  const currentOnetimeIdx = onetimeSteps.indexOf(onetimeStep);

  const toggleOnetimeItem = (item: MenuItem, variant?: Variant) => {
    const key = item.id + (variant?.name || '');
    setOnetimeSelections(prev => {
      const existing = prev[key];
      if (existing) {
        const newQty = existing.qty + 1;
        return { ...prev, [key]: { ...existing, qty: newQty } };
      }
      return { ...prev, [key]: { item, qty: 1, variant } };
    });
  };

  const updateOnetimeQty = (key: string, delta: number) => {
    setOnetimeSelections(prev => {
      const item = prev[key];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      }
      return { ...prev, [key]: { ...item, qty: newQty } };
    });
  };

  const onetimeItemsForCategory = (cat: string) =>
    Object.entries(onetimeSelections).filter(([, v]) => v.item.category === cat);

  const onetimeCategoryCount = (cat: string) =>
    onetimeItemsForCategory(cat).reduce((s, [, v]) => s + v.qty, 0);

  const addOnetimeToCart = () => {
    Object.values(onetimeSelections).forEach(({ item, qty, variant }) => {
      const finalPrice = variant ? item.price + variant.price : item.price;
      setCart(prev => {
        const existing = prev.find(i => i.id === item.id && i.selectedVariant === variant?.name);
        if (existing) {
          return prev.map(i =>
            i.id === item.id && i.selectedVariant === variant?.name
              ? { ...i, quantity: i.quantity + qty }
              : i
          );
        }
        return [...prev, { ...item, price: finalPrice, quantity: qty, selectedVariant: variant?.name, variantPrice: finalPrice }];
      });
    });
    toast.success('Box ajoutée au panier !');
    setOnetimeSelections({});
    setOnetimeStep('entree');
    setPurchaseMode(null);
    setCheckoutOpen(true);
  };

  // ── Subscription builder helpers ──
  const subSteps: SubStep[] = ['meals', 'plats', 'extras', 'review'];
  const subStepLabels: Record<SubStep, string> = { meals: 'Formule', plats: 'Plats', extras: 'Extras', review: 'Récapitulatif' };
  const currentSubIdx = subSteps.indexOf(subStep);

  const subPlatsCount = Object.values(subPlats).reduce((s, v) => s + v.qty, 0);
  const subExtrasCount = Object.values(subExtras).reduce((s, v) => s + v.qty, 0);
  const subExtrasTotal = Object.values(subExtras).reduce((s, v) => s + v.item.price * v.qty, 0);
  const subMonthlySubtotal = (subSelectedPlan?.monthly_price || 0) + (subExtrasMode === 'recurring' ? subExtrasTotal * 4 : 0);
  const subFirstOrderExtras = subExtrasMode === 'onetime' ? subExtrasTotal : 0;
  const subMonthlyTax = Math.round(subMonthlySubtotal * 0.15 * 100) / 100;
  const subOnetimeTax = Math.round(subFirstOrderExtras * 0.15 * 100) / 100;
  const subMonthlyTotal = Math.round((subMonthlySubtotal + subMonthlyTax) * 100) / 100;
  const subFirstOrderTotal = Math.round((subFirstOrderExtras + subOnetimeTax) * 100) / 100;

  const toggleSubPlat = (item: MenuItem) => {
    setSubPlats(prev => {
      const existing = prev[item.id];
      if (existing) {
        return { ...prev, [item.id]: { ...existing, qty: existing.qty + 1 } };
      }
      return { ...prev, [item.id]: { item, qty: 1 } };
    });
  };

  const updateSubPlatQty = (id: string, delta: number) => {
    setSubPlats(prev => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  };

  const toggleSubExtra = (item: MenuItem) => {
    setSubExtras(prev => {
      const existing = prev[item.id];
      if (existing) {
        return { ...prev, [item.id]: { ...existing, qty: existing.qty + 1 } };
      }
      return { ...prev, [item.id]: { item, qty: 1, category: item.category } };
    });
  };

  const updateSubExtraQty = (id: string, delta: number) => {
    setSubExtras(prev => {
      const item = prev[id];
      if (!item) return prev;
      const newQty = item.qty + delta;
      if (newQty <= 0) {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      }
      return { ...prev, [id]: { ...item, qty: newQty } };
    });
  };

  const handleSubscribe = async () => {
    if (!subSelectedPlan) return;
    if (!subCustomerInfo.name || !subCustomerInfo.email || !subCustomerInfo.phone || !subCustomerInfo.address) {
      toast.error('Veuillez remplir tous les champs.');
      return;
    }
    // Fallback plans (no stripe_price_id) can't be subscribed to
    if (!subSelectedPlan.stripe_price_id) {
      toast.error('Ce plan n\'est pas encore configuré pour le paiement. Veuillez contacter le support.');
      return;
    }
    setSubSubmitting(true);
    try {
      const { url } = await createSubscription({
        plan_id: subSelectedPlan.id,
        customer: subCustomerInfo,
        extras: subExtrasCount > 0 ? Object.values(subExtras).map(v => ({
          name: v.item.name,
          qty: v.qty,
          price: v.item.price,
          category: v.category,
        })) : undefined,
        extras_mode: subExtrasCount > 0 ? subExtrasMode : undefined,
      });
      if (!url) {
        toast.error('Erreur lors de la création de la session de paiement.');
        return;
      }
      localStorage.setItem('bledcrate_sub_selections', JSON.stringify({
        plan: subSelectedPlan,
        plats: Object.values(subPlats).map(v => ({ name: v.item.name, qty: v.qty })),
        extras: Object.values(subExtras).map(v => ({ name: v.item.name, qty: v.qty, price: v.item.price, category: v.category })),
        extras_mode: subExtrasMode,
      }));
      window.location.href = url;
    } catch (err: any) {
      const msg = err?.message || '';
      if (msg.includes('non configuré') || msg.includes('stripe')) {
        toast.error('Ce plan n\'est pas encore configuré. Contactez-nous à contact@bledcrate.ca');
      } else {
        toast.error('Erreur lors de la création de l\'abonnement. Réessayez ou contactez-nous.');
      }
    } finally {
      setSubSubmitting(false);
    }
  };

  const resetPurchaseFlow = () => {
    setPurchaseMode(null);
    setOnetimeStep('entree');
    setOnetimeSelections({});
    setSubStep('meals');
    setSubMealCount(0);
    setSubSelectedPlan(null);
    setSubPlats({});
    setSubExtras({});
    setSubExtrasMode('onetime');
  };

  // Box settings from admin
  const boxOnetimeEnabled = siteSettings?.box_onetime_enabled !== 'false';
  const boxSubscriptionEnabled = siteSettings?.box_subscription_enabled !== 'false';
  const boxSubMealCounts = (siteSettings?.box_sub_meal_counts || '3,5,7').split(',').map(Number).filter(n => n > 0);

  return (
    <div className="min-h-screen bg-moroccan-cream">
      {/* Navigation */}
      <nav className={`fixed left-0 right-0 z-50 transition-all duration-500 ${
        siteSettings?.delivery_banner_enabled === 'true' ? 'top-[32px]' : 'top-0'
      } ${
        isScrolled
          ? 'glass shadow-lg py-2'
          : 'bg-transparent py-4'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => scrollToSection('hero')}
              className="flex items-center gap-3 group"
            >
              <img 
                src="/logo.png" 
                alt="BledCrate" 
                className={`rounded-full object-cover transition-all ${
                  isScrolled ? 'w-12 h-12' : 'w-14 h-14'
                } group-hover:scale-110`}
              />
              <span className={`font-display text-2xl font-bold transition-colors ${
                isScrolled ? 'text-moroccan-brown' : 'text-white'
              }`}>
                BledCrate
              </span>
            </button>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {[
                { label: 'Nos Plats', action: () => scrollToSection('menu') },
                { label: 'Processus', action: () => scrollToSection('how-it-works') },
                { label: 'Track', action: () => window.location.href = '/track', isLink: true },
                { label: 'Politique', action: () => window.location.href = '/politique', isLink: true },
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className={`font-medium text-sm hover:text-moroccan-red transition-colors relative group ${
                    isScrolled ? 'text-moroccan-brown' : 'text-white'
                  }`}
                >
                  {item.label}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-moroccan-red transition-all group-hover:w-full" />
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
            {/* Cart */}
            <Sheet>
              <SheetTrigger asChild>
                <button className="relative p-2 hover:bg-white/10 rounded-full transition-colors">
                  <ShoppingCart className={`w-6 h-6 ${isScrolled ? 'text-moroccan-brown' : 'text-white'}`} />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-moroccan-red text-white text-xs w-5 h-5 flex items-center justify-center p-0 animate-scale-in">
                      {cartCount}
                    </Badge>
                  )}
                </button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md bg-moroccan-cream flex flex-col overflow-hidden">
                <SheetHeader className="shrink-0">
                  <SheetTitle className="font-display text-3xl text-moroccan-brown flex items-center gap-2 pr-8">
                    <ShoppingCart className="w-6 h-6" />
                    Votre Panier
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="flex-1 -mx-4 px-4 pb-4">{/* negative margin to allow full-width scroll */}
                  {cart.length === 0 ? (
                    <div className="text-center py-12">
                      <ShoppingCart className="w-16 h-16 text-moroccan-brown/30 mx-auto mb-4" />
                      <p className="text-moroccan-brown/60">Votre panier est vide</p>
                      <p className="text-sm text-moroccan-brown/40 mt-1">Ajoutez des délices marocains !</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {cart.map((item, idx) => (
                        <div key={`${item.id}-${item.selectedVariant}`} className="bg-white rounded-xl p-4 shadow-sm animate-slide-up" style={{ animationDelay: `${idx * 0.1}s` }}>
                          <div className="flex gap-3">
                            <img src={item.image} alt={item.name} className="w-20 h-20 object-cover rounded-lg" />
                            <div className="flex-1">
                              <h4 className="font-semibold text-moroccan-brown">{item.name}</h4>
                              {item.selectedVariant && (
                                <p className="text-sm text-moroccan-brown/60">{item.selectedVariant}</p>
                              )}
                              <p className="text-moroccan-red font-bold mt-1">{item.price.toFixed(2)} $</p>
                              <div className="flex items-center gap-2 mt-2">
                                <button 
                                  onClick={() => updateQuantity(item.id, -1, item.selectedVariant)}
                                  className="w-6 h-6 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-red hover:text-white transition-colors"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                                <button 
                                  onClick={() => updateQuantity(item.id, 1, item.selectedVariant)}
                                  className="w-6 h-6 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-red hover:text-white transition-colors"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                                <button 
                                  onClick={() => removeFromCart(item.id, item.selectedVariant)}
                                  className="ml-auto text-moroccan-brown/40 hover:text-moroccan-red transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {cart.length > 0 && (
                  <div className="shrink-0 p-4 bg-white border-t space-y-2 -mx-4 -mb-4">{/* shrink-0 keeps footer visible */}
                    {/* Bundle progress */}
                    {bundleEnabled && !qualifiesForBundle && cartCount > 0 && (
                      <div className="bg-orange-50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-orange-700 font-medium mb-1">
                          <Package className="w-3.5 h-3.5" />
                          Ajoutez {bundleMinItems - cartCount} plat{bundleMinItems - cartCount > 1 ? 's' : ''} de plus pour -{bundleDiscountPercent}%
                        </div>
                        <div className="w-full bg-orange-200 rounded-full h-1.5">
                          <div className="bg-orange-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (cartCount / bundleMinItems) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {qualifiesForBundle && (
                      <div className="bg-green-50 rounded-lg p-2.5 text-xs flex items-center gap-1.5 text-green-700 font-medium">
                        <Percent className="w-3.5 h-3.5" />
                        Bundle activé ! -{bundleDiscountPercent}% ({bundleDiscountAmount.toFixed(2)} $)
                      </div>
                    )}
                    {/* Delivery progress */}
                    {deliveryFee > 0 && amountToFreeDelivery > 0 && (
                      <div className="bg-blue-50 rounded-lg p-2.5 text-xs">
                        <div className="flex items-center gap-1.5 text-blue-700 font-medium mb-1">
                          <Truck className="w-3.5 h-3.5" />
                          Plus que {amountToFreeDelivery.toFixed(2)} $ pour la livraison gratuite !
                        </div>
                        <div className="w-full bg-blue-200 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${Math.min(100, (afterDiscount / freeDeliveryThreshold) * 100)}%` }} />
                        </div>
                      </div>
                    )}
                    {deliveryFee === 0 && cartCount > 0 && (
                      <div className="bg-green-50 rounded-lg p-2.5 text-xs flex items-center gap-1.5 text-green-700 font-medium">
                        <Truck className="w-3.5 h-3.5" />
                        Livraison gratuite !
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-moroccan-brown font-medium">Total</span>
                      <span className="text-2xl font-bold text-moroccan-red">{finalTotal.toFixed(2)} $</span>
                    </div>
                    <p className="text-xs text-moroccan-brown/40 text-right">Livraison, frais et taxes inclus</p>
                    <Button
                      onClick={() => setCheckoutOpen(true)}
                      className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white font-semibold py-6 btn-liquid"
                    >
                      Commander Maintenant
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              {mobileMenuOpen ? (
                <X className={`w-6 h-6 ${isScrolled ? 'text-moroccan-brown' : 'text-white'}`} />
              ) : (
                <Menu className={`w-6 h-6 ${isScrolled ? 'text-moroccan-brown' : 'text-white'}`} />
              )}
            </button>
            </div>
          </div>

          {/* Mobile Menu Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 animate-slide-up">
              <div className={`flex flex-col gap-2 ${isScrolled ? 'bg-white/90' : 'bg-black/40'} backdrop-blur-sm rounded-xl p-4`}>
                {[
                  { label: 'Nos Plats', action: () => { scrollToSection('menu'); setMobileMenuOpen(false); } },
                  { label: 'Processus', action: () => { scrollToSection('how-it-works'); setMobileMenuOpen(false); } },
                ].map((item) => (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                      isScrolled
                        ? 'text-moroccan-brown hover:bg-moroccan-red/10 hover:text-moroccan-red'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    {item.label}
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </button>
                ))}
                <Link
                  to="/track"
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    isScrolled
                      ? 'text-moroccan-brown hover:bg-moroccan-red/10 hover:text-moroccan-red'
                      : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Track
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
                <Link
                  to="/politique"
                  className={`flex items-center justify-between px-4 py-3 rounded-lg text-left font-medium transition-colors ${
                    isScrolled
                      ? 'text-moroccan-brown hover:bg-moroccan-red/10 hover:text-moroccan-red'
                      : 'text-white hover:bg-white/10'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Politique
                  <ChevronRight className="w-4 h-4 opacity-50" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Delivery Schedule Banner */}
      {siteSettings?.delivery_banner_enabled === 'true' && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-moroccan-brown text-white text-center py-2 text-xs sm:text-sm font-medium shadow-md">
          <div className="flex items-center justify-center gap-1.5 sm:gap-3 px-3">
            <Truck className="w-3.5 h-3.5 shrink-0 text-moroccan-gold" />
            <span className="hidden sm:inline">
              Dim–Mer → livraison Samedi
              <span className="mx-2 text-moroccan-gold/50">|</span>
              Jeu–Sam → livraison Mercredi
            </span>
            <span className="sm:hidden">
              Dim–Mer → Sam
              <span className="mx-1.5 text-moroccan-gold/50">|</span>
              Jeu–Sam → Mer
            </span>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src="/hero-moroccan.jpg"
            alt="Cuisine Marocaine"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-moroccan-cream" />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-5 max-w-3xl mx-auto pt-16 sm:pt-0">
          <div className="animate-fade-in">
            <Badge className="bg-white/15 backdrop-blur-sm text-white mb-6 text-sm px-5 py-2 border border-white/20">
              <span className="mr-1.5">🍲</span>
              Cuisine Authentique du Maroc
            </Badge>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white mb-5 animate-slide-up" style={{ textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}>
            BledCrate
            <br />
            <span className="text-moroccan-gold">Saveurs Royales</span>
          </h1>
          <p className="text-base sm:text-lg text-white/85 mb-8 max-w-xl mx-auto leading-relaxed animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Des meal boxes marocaines authentiques, préparées avec amour et livrées dans le Grand Montréal
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center animate-slide-up mb-10" style={{ animationDelay: '0.3s' }}>
            <Button
              onClick={() => scrollToSection('menu')}
              className="bg-moroccan-red hover:bg-moroccan-red-dark text-white px-8 py-6 text-lg font-semibold rounded-full shadow-lg shadow-moroccan-red/30 transition-all hover:shadow-xl hover:scale-[1.02]"
            >
              Commander
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              variant="outline"
              onClick={() => scrollToSection('how-it-works')}
              className="border-2 border-white/40 text-white hover:bg-white hover:text-moroccan-brown px-8 py-6 text-lg font-semibold rounded-full bg-white/10 backdrop-blur-sm"
            >
              Processus
            </Button>
          </div>
          <div className="flex items-center justify-center gap-4 sm:gap-8 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            {[
              { icon: Truck, label: 'Livraison rapide' },
              { icon: ChefHat, label: 'Fait maison' },
              { icon: Heart, label: '100% authentique' },
            ].map(({ icon: Icon, label }) => (
              <span key={label} className="flex items-center gap-1.5 text-white/70 text-xs sm:text-sm">
                <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-3.5 h-3.5" />
                </span>
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-7 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
            <div className="w-1 h-2.5 bg-white/50 rounded-full" />
          </div>
        </div>
      </section>

      {/* Purchase Flow Section */}
      <section id="menu" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative">
        <div className="max-w-7xl mx-auto relative z-10">
          {/* Section Header */}
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="bg-moroccan-red/10 text-moroccan-red mb-4 border border-moroccan-red/20">
              <Heart className="w-3.5 h-3.5 mr-1" />
              Notre Sélection
            </Badge>
            <h2 className="font-display text-5xl sm:text-6xl text-moroccan-brown mb-4">
              {purchaseMode === null ? 'Composez Votre Box' : purchaseMode === 'onetime' ? 'Votre Box Unique' : 'Votre Abonnement'}
            </h2>
            <p className="text-moroccan-brown/70 text-lg max-w-2xl mx-auto">
              {purchaseMode === null
                ? 'Choisissez votre formule et composez votre repas marocain authentique'
                : purchaseMode === 'onetime'
                ? 'Sélectionnez vos plats préférés étape par étape'
                : 'Choisissez votre formule et composez vos repas de la semaine'}
            </p>
          </div>

          {/* Bundle Promo Banner */}
          {bundleEnabled && purchaseMode === null && (
            <div className="mb-12 bg-gradient-to-r from-moroccan-red to-moroccan-orange rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10">
                <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover rounded-bl-full" />
              </div>
              <div className="relative z-10 flex flex-col sm:flex-row items-center gap-4 sm:gap-8">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center shrink-0">
                  <Package className="w-8 h-8" />
                </div>
                <div className="text-center sm:text-left flex-1">
                  <h3 className="font-display text-3xl sm:text-4xl mb-1">Offre Bundle</h3>
                  <p className="text-white/90 text-sm sm:text-base">
                    Commandez <strong>{bundleMinItems} plats ou plus</strong> et économisez <strong>{bundleDiscountPercent}%</strong> automatiquement !
                  </p>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-xl px-6 py-3 text-center shrink-0">
                  <span className="font-display text-4xl block">-{bundleDiscountPercent}%</span>
                  <span className="text-xs text-white/80">{bundleMinItems}+ plats</span>
                </div>
              </div>
            </div>
          )}

          {/* ═══ STEP 0: Purchase Type Selector ═══ */}
          {purchaseMode === null && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {boxOnetimeEnabled && (
                <button
                  onClick={() => { setPurchaseMode('onetime'); setOnetimeStep('entree'); }}
                  className="group bg-white rounded-2xl p-8 shadow-moroccan card-hover text-center border-2 border-transparent hover:border-moroccan-red transition-all"
                >
                  <div className="w-20 h-20 bg-moroccan-red/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-moroccan-red group-hover:text-white transition-all">
                    <ShoppingCart className="w-10 h-10 text-moroccan-red group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-display text-3xl text-moroccan-brown mb-3">Achat Unique</h3>
                  <p className="text-moroccan-brown/60 mb-4">
                    Composez votre box complète : entrée, plat principal et dessert
                  </p>
                  <div className="flex items-center justify-center gap-4 text-sm text-moroccan-brown/50">
                    <span className="flex items-center gap-1"><Salad className="w-4 h-4" /> Entrée</span>
                    <span>+</span>
                    <span className="flex items-center gap-1"><UtensilsCrossed className="w-4 h-4" /> Plat</span>
                    <span>+</span>
                    <span className="flex items-center gap-1"><CakeSlice className="w-4 h-4" /> Dessert</span>
                  </div>
                  <div className="mt-6 text-moroccan-red font-semibold flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                    Commander <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}
              {boxSubscriptionEnabled && (
                <button
                  onClick={() => { setPurchaseMode('subscription'); setSubStep('meals'); }}
                  className="group bg-white rounded-2xl p-8 shadow-moroccan card-hover text-center border-2 border-transparent hover:border-moroccan-gold relative overflow-hidden transition-all"
                >
                  <Badge className="absolute top-4 right-4 bg-moroccan-gold text-moroccan-brown">Économisez plus</Badge>
                  <div className="w-20 h-20 bg-moroccan-gold/10 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-moroccan-gold group-hover:text-white transition-all">
                    <CalendarCheck className="w-10 h-10 text-moroccan-gold group-hover:text-white transition-colors" />
                  </div>
                  <h3 className="font-display text-3xl text-moroccan-brown mb-3">Abonnement</h3>
                  <p className="text-moroccan-brown/60 mb-4">
                    Recevez vos repas chaque semaine avec livraison gratuite
                  </p>
                  <div className="flex items-center justify-center gap-3 text-sm text-moroccan-brown/50">
                    <span className="flex items-center gap-1"><Package className="w-4 h-4" /> Plats au choix</span>
                    <span className="flex items-center gap-1"><Truck className="w-4 h-4" /> Livraison gratuite</span>
                  </div>
                  <div className="mt-6 text-moroccan-gold font-semibold flex items-center justify-center gap-1 group-hover:gap-2 transition-all">
                    S'abonner <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              )}
            </div>
          )}

          {/* ═══ ONE-TIME PURCHASE: Meal Builder Wizard ═══ */}
          {purchaseMode === 'onetime' && (
            <div className="pb-20">
              {/* Back button */}
              <button onClick={() => {
                if (currentOnetimeIdx > 0) { setOnetimeStep(onetimeSteps[currentOnetimeIdx - 1]); scrollToSection('menu'); }
                else resetPurchaseFlow();
              }} className="flex items-center gap-1 text-moroccan-brown/60 hover:text-moroccan-red mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {currentOnetimeIdx > 0 ? 'Précédent' : 'Retour au choix'}
              </button>

              {/* Step Progress */}
              <div className="flex items-center justify-center gap-2 mb-12">
                {onetimeSteps.map((step, idx) => {
                  const Icon = onetimeStepIcons[step];
                  const isActive = idx === currentOnetimeIdx;
                  const isDone = idx < currentOnetimeIdx;
                  return (
                    <div key={step} className="flex items-center gap-2">
                      {idx > 0 && <div className={`w-8 sm:w-16 h-0.5 ${isDone ? 'bg-moroccan-red' : 'bg-moroccan-brown/20'} transition-colors`} />}
                      <button
                        onClick={() => { if (isDone) setOnetimeStep(step); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isActive ? 'bg-moroccan-red text-white shadow-lg' : isDone ? 'bg-moroccan-red/20 text-moroccan-red cursor-pointer' : 'bg-moroccan-brown/10 text-moroccan-brown/40'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">{onetimeStepLabels[step]}</span>
                        {isDone && <Check className="w-3 h-3" />}
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Product Grid for current category step */}
              {onetimeStep !== 'review' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-2xl text-moroccan-brown">
                      Choisissez vos {onetimeStepLabels[onetimeStep].toLowerCase()}
                    </h3>
                    <Badge className="bg-moroccan-red/10 text-moroccan-red">
                      {onetimeCategoryCount(onetimeStep)} sélectionné{onetimeCategoryCount(onetimeStep) > 1 ? 's' : ''}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menuItems.filter(item => item.category === onetimeStep).map((item, idx) => {
                      const isSelected = Object.entries(onetimeSelections).some(([, v]) => v.item.id === item.id);
                      const selKey = item.id;
                      const selQty = onetimeSelections[selKey]?.qty || 0;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-2xl overflow-hidden shadow-moroccan group animate-fade-in border-2 transition-all ${
                            isSelected ? 'border-moroccan-red shadow-lg' : 'border-transparent card-hover'
                          }`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="relative img-zoom h-48">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            {isSelected && (
                              <div className="absolute top-2 right-2 w-8 h-8 bg-moroccan-red rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {selQty}
                              </div>
                            )}
                            {item.tags?.map(tag => (
                              <Badge key={tag} className="absolute top-2 left-2 bg-moroccan-green text-white text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <div className="p-4">
                            <h3 className="font-display text-xl text-moroccan-brown mb-1">{item.name}</h3>
                            <p className="text-sm text-moroccan-brown/60 line-clamp-2 mb-3">{item.description}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-xl font-bold text-moroccan-red">{item.price.toFixed(2)} $</span>
                              {isSelected ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => updateOnetimeQty(selKey, -1)} className="w-8 h-8 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-red hover:text-white transition-colors">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="font-bold w-6 text-center">{selQty}</span>
                                  <button onClick={() => updateOnetimeQty(selKey, 1)} className="w-8 h-8 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-red hover:text-white transition-colors">
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => toggleOnetimeItem(item)}
                                  className="bg-moroccan-red hover:bg-moroccan-red-dark text-white rounded-full w-10 h-10 p-0"
                                >
                                  <Plus className="w-5 h-5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Navigation Buttons */}
                </div>
              )}

              {/* Sticky bottom navigation bar for one-time flow — always visible */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t shadow-lg z-50 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (onetimeStep === 'review') { setOnetimeStep('dessert'); scrollToSection('menu'); }
                      else if (currentOnetimeIdx === 0) resetPurchaseFlow();
                      else { setOnetimeStep(onetimeSteps[currentOnetimeIdx - 1]); scrollToSection('menu'); }
                    }}
                    className="border-moroccan-brown/20 text-moroccan-brown shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{currentOnetimeIdx === 0 && onetimeStep !== 'review' ? 'Retour' : 'Précédent'}</span>
                  </Button>
                  <span className="text-xs sm:text-sm font-medium text-moroccan-brown/60 text-center truncate">
                    {onetimeStep === 'review'
                      ? `${Object.keys(onetimeSelections).length} plat${Object.keys(onetimeSelections).length > 1 ? 's' : ''}`
                      : `${onetimeCategoryCount(onetimeStep)} sélectionné${onetimeCategoryCount(onetimeStep) > 1 ? 's' : ''}`}
                  </span>
                  {onetimeStep !== 'review' ? (
                    <Button
                      size="sm"
                      onClick={() => { setOnetimeStep(onetimeSteps[currentOnetimeIdx + 1]); scrollToSection('menu'); }}
                      className="bg-moroccan-red hover:bg-moroccan-red-dark text-white shrink-0"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={addOnetimeToCart}
                      disabled={Object.keys(onetimeSelections).length === 0}
                      className="bg-moroccan-red hover:bg-moroccan-red-dark text-white shrink-0"
                    >
                      <ShoppingCart className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Ajouter au Panier</span>
                      <span className="sm:hidden">Panier</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Review Step */}
              {onetimeStep === 'review' && (
                <div className="max-w-2xl mx-auto pb-16">
                  <h3 className="font-display text-2xl text-moroccan-brown mb-6 text-center">Récapitulatif de votre Box</h3>

                  {['entree', 'plat', 'dessert'].map(cat => {
                    const items = onetimeItemsForCategory(cat);
                    if (items.length === 0) return null;
                    return (
                      <div key={cat} className="mb-6">
                        <h4 className="font-semibold text-moroccan-brown mb-2 capitalize flex items-center gap-2">
                          {cat === 'entree' && <Salad className="w-4 h-4 text-moroccan-red" />}
                          {cat === 'plat' && <UtensilsCrossed className="w-4 h-4 text-moroccan-red" />}
                          {cat === 'dessert' && <CakeSlice className="w-4 h-4 text-moroccan-red" />}
                          {cat === 'entree' ? 'Entrées' : cat === 'plat' ? 'Plats' : 'Desserts'}
                        </h4>
                        <div className="space-y-2">
                          {items.map(([key, { item, qty, variant }]) => (
                            <div key={key} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                              <div className="flex items-center gap-3">
                                <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
                                <div>
                                  <p className="font-medium text-moroccan-brown">{item.name}</p>
                                  {variant && <p className="text-xs text-moroccan-brown/50">{variant.name}</p>}
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1">
                                  <button onClick={() => updateOnetimeQty(key, -1)} className="w-6 h-6 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-red hover:text-white transition-colors">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="w-6 text-center text-sm font-medium">{qty}</span>
                                  <button onClick={() => updateOnetimeQty(key, 1)} className="w-6 h-6 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-red hover:text-white transition-colors">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <span className="font-bold text-moroccan-red w-20 text-right">
                                  {((variant ? item.price + variant.price : item.price) * qty).toFixed(2)} $
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}

                  {Object.keys(onetimeSelections).length === 0 && (
                    <div className="text-center py-12 text-moroccan-brown/40">
                      <Package className="w-16 h-16 mx-auto mb-3 opacity-30" />
                      <p>Aucun plat sélectionné</p>
                    </div>
                  )}

                  {/* Total */}
                  {Object.keys(onetimeSelections).length > 0 && (
                    <div className="mt-8 bg-white rounded-2xl p-6 shadow-moroccan">
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-moroccan-brown font-medium">Total de la Box</span>
                        <span className="text-2xl font-bold text-moroccan-red">
                          {Object.values(onetimeSelections).reduce((s, { item, qty, variant }) =>
                            s + (variant ? item.price + variant.price : item.price) * qty, 0
                          ).toFixed(2)} $
                        </span>
                      </div>
                      <p className="text-xs text-moroccan-brown/40 text-right mb-4">Taxes et livraison calculées au panier</p>
                      <Button
                        onClick={addOnetimeToCart}
                        className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-6 text-lg font-semibold"
                      >
                        <ShoppingCart className="w-5 h-5 mr-2" />
                        Ajouter au Panier
                      </Button>
                    </div>
                  )}

                </div>
              )}
            </div>
          )}

          {/* ═══ SUBSCRIPTION: Builder Wizard ═══ */}
          {purchaseMode === 'subscription' && (
            <div className="pb-20">
              {/* Back button */}
              <button onClick={() => {
                if (currentSubIdx > 0) { setSubStep(subSteps[currentSubIdx - 1]); scrollToSection('menu'); }
                else resetPurchaseFlow();
              }} className="flex items-center gap-1 text-moroccan-brown/60 hover:text-moroccan-red mb-6 transition-colors">
                <ChevronLeft className="w-4 h-4" /> {currentSubIdx > 0 ? 'Précédent' : 'Retour au choix'}
              </button>

              {/* Step Progress */}
              <div className="flex items-center justify-center gap-2 mb-12">
                {subSteps.map((step, idx) => {
                  const isActive = idx === currentSubIdx;
                  const isDone = idx < currentSubIdx;
                  return (
                    <div key={step} className="flex items-center gap-2">
                      {idx > 0 && <div className={`w-8 sm:w-16 h-0.5 ${isDone ? 'bg-moroccan-gold' : 'bg-moroccan-brown/20'} transition-colors`} />}
                      <button
                        onClick={() => { if (isDone) setSubStep(step); }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                          isActive ? 'bg-moroccan-gold text-moroccan-brown shadow-lg' : isDone ? 'bg-moroccan-gold/20 text-moroccan-gold cursor-pointer' : 'bg-moroccan-brown/10 text-moroccan-brown/40'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs font-bold">
                          {isDone ? <Check className="w-3 h-3" /> : idx + 1}
                        </span>
                        <span className="hidden sm:inline">{subStepLabels[step]}</span>
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Step 1: Choose meal count */}
              {subStep === 'meals' && (
                <div className="max-w-3xl mx-auto">
                  <h3 className="font-display text-2xl text-moroccan-brown mb-8 text-center">Combien de repas par semaine ?</h3>
                  {/* Billing interval toggle */}
                  <div className="max-w-xs mx-auto mb-8">
                    <div className="bg-white rounded-full border shadow-sm flex p-1">
                      <button
                        onClick={() => { setSubBillingInterval('weekly'); setSubSelectedPlan(null); }}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                          subBillingInterval === 'weekly' ? 'bg-moroccan-red text-white shadow' : 'text-moroccan-brown/60 hover:text-moroccan-brown'
                        }`}
                      >
                        Hebdomadaire
                      </button>
                      <button
                        onClick={() => { setSubBillingInterval('monthly'); setSubSelectedPlan(null); }}
                        className={`flex-1 py-2 px-4 rounded-full text-sm font-semibold transition-all ${
                          subBillingInterval === 'monthly' ? 'bg-moroccan-red text-white shadow' : 'text-moroccan-brown/60 hover:text-moroccan-brown'
                        }`}
                      >
                        Mensuel
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {(subscriptionPlans.length > 0 ? subscriptionPlans.filter(p => {
                      const interval = p.billing_interval || 'month';
                      if (subBillingInterval === 'weekly') return interval === 'week' || interval === 'weekly';
                      return interval === 'month' || interval === 'monthly';
                    }) : boxSubMealCounts.map((n, i) => ({
                      id: `default-${n}`,
                      plan_type: 'moi' as const,
                      name: `${n} repas`,
                      meals_per_week: n,
                      price_per_meal: 12,
                      monthly_price: n * 12 * 4,
                      discount_percent: n >= 7 ? 15 : n >= 5 ? 10 : 0,
                      is_popular: n === 5,
                      stripe_price_id: null,
                      active: true,
                      sort_order: i,
                      created_at: '',
                    } as SubscriptionPlan))).map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => {
                          setSubSelectedPlan(plan);
                          setSubMealCount(plan.meals_per_week);
                        }}
                        className={`relative bg-white rounded-2xl p-6 shadow-moroccan text-center transition-all border-2 ${
                          subSelectedPlan?.id === plan.id ? 'border-moroccan-gold shadow-lg scale-[1.02]' : 'border-transparent hover:border-moroccan-gold/50 card-hover'
                        }`}
                      >
                        {plan.is_popular && (
                          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-moroccan-gold text-moroccan-brown">
                            <Star className="w-3 h-3 mr-1" /> Populaire
                          </Badge>
                        )}
                        <div className="font-display text-5xl text-moroccan-brown mb-2">{plan.meals_per_week}</div>
                        <p className="text-moroccan-brown/60 mb-4">repas / semaine</p>
                        <div className="text-2xl font-bold text-moroccan-red mb-1">{plan.price_per_meal.toFixed(2)} $ <span className="text-sm font-normal text-moroccan-brown/50">/ repas</span></div>
                        <div className="text-sm text-moroccan-brown/60">{plan.monthly_price.toFixed(2)} $ / {subBillingInterval === 'weekly' ? 'sem' : 'mois'}</div>
                        {plan.discount_percent > 0 && (
                          <Badge className="mt-3 bg-green-100 text-green-700">Économisez {plan.discount_percent}%</Badge>
                        )}
                        {subSelectedPlan?.id === plan.id && (
                          <div className="absolute top-3 right-3 w-6 h-6 bg-moroccan-gold rounded-full flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Choose plats */}
              {subStep === 'plats' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-2xl text-moroccan-brown">
                      Choisissez vos plats
                    </h3>
                    <Badge className={`${subPlatsCount >= subMealCount ? 'bg-green-100 text-green-700' : 'bg-moroccan-gold/10 text-moroccan-gold'}`}>
                      {subPlatsCount} / {subMealCount} plats sélectionnés
                    </Badge>
                  </div>

                  {subPlatsCount >= subMealCount && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-6 flex items-center gap-2 text-green-700 text-sm">
                      <Check className="w-4 h-4" /> Vous avez sélectionné tous vos plats !
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {menuItems.filter(item => item.category === 'plat').map((item, idx) => {
                      const sel = subPlats[item.id];
                      const qty = sel?.qty || 0;
                      return (
                        <div
                          key={item.id}
                          className={`bg-white rounded-2xl overflow-hidden shadow-moroccan group animate-fade-in border-2 transition-all ${
                            qty > 0 ? 'border-moroccan-gold shadow-lg' : 'border-transparent card-hover'
                          }`}
                          style={{ animationDelay: `${idx * 0.05}s` }}
                        >
                          <div className="relative img-zoom h-48">
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            {qty > 0 && (
                              <div className="absolute top-2 right-2 w-8 h-8 bg-moroccan-gold rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">{qty}</div>
                            )}
                            {item.tags?.map(tag => (
                              <Badge key={tag} className="absolute top-2 left-2 bg-moroccan-green text-white text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <div className="p-4">
                            <h3 className="font-display text-xl text-moroccan-brown mb-1">{item.name}</h3>
                            <p className="text-sm text-moroccan-brown/60 line-clamp-2 mb-3">{item.description}</p>
                            <div className="flex items-center justify-end">
                              {qty > 0 ? (
                                <div className="flex items-center gap-2">
                                  <button onClick={() => updateSubPlatQty(item.id, -1)} className="w-8 h-8 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-gold hover:text-white transition-colors">
                                    <Minus className="w-4 h-4" />
                                  </button>
                                  <span className="font-bold w-6 text-center">{qty}</span>
                                  <button
                                    onClick={() => { if (subPlatsCount < subMealCount) toggleSubPlat(item); }}
                                    disabled={subPlatsCount >= subMealCount}
                                    className="w-8 h-8 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-gold hover:text-white transition-colors disabled:opacity-30"
                                  >
                                    <Plus className="w-4 h-4" />
                                  </button>
                                </div>
                              ) : (
                                <Button
                                  size="sm"
                                  onClick={() => { if (subPlatsCount < subMealCount) toggleSubPlat(item); }}
                                  disabled={subPlatsCount >= subMealCount}
                                  className="bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-brown rounded-full w-10 h-10 p-0 disabled:opacity-30"
                                >
                                  <Plus className="w-5 h-5" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              )}

              {/* Step 3: Add extras (optional entrées + desserts) */}
              {subStep === 'extras' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-display text-2xl text-moroccan-brown">
                      Ajoutez des extras <span className="text-base font-normal text-moroccan-brown/50">(optionnel)</span>
                    </h3>
                    {subExtrasCount > 0 && (
                      <Badge className="bg-moroccan-gold/10 text-moroccan-gold">
                        {subExtrasCount} extra{subExtrasCount > 1 ? 's' : ''} ajouté{subExtrasCount > 1 ? 's' : ''}
                      </Badge>
                    )}
                  </div>

                  <Tabs defaultValue="entree" className="w-full">
                    <TabsList className="flex justify-center mb-8 bg-white/50 p-2 rounded-full max-w-md mx-auto">
                      <TabsTrigger value="entree" className="px-6 py-3 rounded-full data-[state=active]:bg-moroccan-gold data-[state=active]:text-white transition-all">
                        Entrées
                      </TabsTrigger>
                      <TabsTrigger value="dessert" className="px-6 py-3 rounded-full data-[state=active]:bg-moroccan-gold data-[state=active]:text-white transition-all">
                        Desserts
                      </TabsTrigger>
                    </TabsList>

                    {['entree', 'dessert'].map(cat => (
                      <TabsContent key={cat} value={cat} className="mt-0">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                          {menuItems.filter(item => item.category === cat).map((item, idx) => {
                            const sel = subExtras[item.id];
                            const qty = sel?.qty || 0;
                            return (
                              <div
                                key={item.id}
                                className={`bg-white rounded-2xl overflow-hidden shadow-moroccan group animate-fade-in border-2 transition-all ${
                                  qty > 0 ? 'border-moroccan-gold shadow-lg' : 'border-transparent card-hover'
                                }`}
                                style={{ animationDelay: `${idx * 0.05}s` }}
                              >
                                <div className="relative img-zoom h-48">
                                  <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                  {qty > 0 && (
                                    <div className="absolute top-2 right-2 w-8 h-8 bg-moroccan-gold rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg">{qty}</div>
                                  )}
                                </div>
                                <div className="p-4">
                                  <h3 className="font-display text-xl text-moroccan-brown mb-1">{item.name}</h3>
                                  <p className="text-sm text-moroccan-brown/60 line-clamp-2 mb-3">{item.description}</p>
                                  <div className="flex items-center justify-between">
                                    <span className="text-lg font-bold text-moroccan-red">+{item.price.toFixed(2)} $</span>
                                    {qty > 0 ? (
                                      <div className="flex items-center gap-2">
                                        <button onClick={() => updateSubExtraQty(item.id, -1)} className="w-8 h-8 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-gold hover:text-white transition-colors">
                                          <Minus className="w-4 h-4" />
                                        </button>
                                        <span className="font-bold w-6 text-center">{qty}</span>
                                        <button onClick={() => toggleSubExtra(item)} className="w-8 h-8 rounded-full bg-moroccan-cream flex items-center justify-center hover:bg-moroccan-gold hover:text-white transition-colors">
                                          <Plus className="w-4 h-4" />
                                        </button>
                                      </div>
                                    ) : (
                                      <Button size="sm" onClick={() => toggleSubExtra(item)} className="bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-brown rounded-full w-10 h-10 p-0">
                                        <Plus className="w-5 h-5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </TabsContent>
                    ))}
                  </Tabs>

                </div>
              )}

              {/* Sticky bottom navigation bar for subscription flow — always visible */}
              <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t shadow-lg z-50 px-3 sm:px-4 py-2.5 sm:py-3">
                <div className="max-w-4xl mx-auto flex justify-between items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (subStep === 'review') { setSubStep('extras'); scrollToSection('menu'); }
                      else if (subStep === 'meals') resetPurchaseFlow();
                      else { setSubStep(subStep === 'plats' ? 'meals' : 'plats'); scrollToSection('menu'); }
                    }}
                    className="border-moroccan-brown/20 text-moroccan-brown shrink-0"
                  >
                    <ChevronLeft className="w-4 h-4 sm:mr-1" />
                    <span className="hidden sm:inline">{subStep === 'meals' ? 'Retour' : 'Précédent'}</span>
                  </Button>
                  <span className="text-xs sm:text-sm font-medium text-moroccan-brown/60 text-center truncate">
                    {subStep === 'meals' && subSelectedPlan ? `${subSelectedPlan.meals_per_week} repas/sem` : ''}
                    {subStep === 'plats' ? `${subPlatsCount} plat${subPlatsCount > 1 ? 's' : ''}` : ''}
                    {subStep === 'extras' ? `${subExtrasCount} extra${subExtrasCount > 1 ? 's' : ''}` : ''}
                    {subStep === 'review' ? `${subMonthlyTotal.toFixed(2)} $/mois` : ''}
                  </span>
                  {subStep !== 'review' ? (
                    <Button
                      size="sm"
                      onClick={() => {
                        if (subStep === 'meals' && subSelectedPlan) { setSubStep('plats'); scrollToSection('menu'); }
                        else if (subStep === 'plats') { setSubStep('extras'); scrollToSection('menu'); }
                        else if (subStep === 'extras') { setSubStep('review'); scrollToSection('menu'); }
                      }}
                      disabled={subStep === 'meals' ? !subSelectedPlan : subStep === 'plats' ? subPlatsCount < (subSelectedPlan?.meals_per_week || 1) : false}
                      className="bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-brown shrink-0"
                    >
                      <span className="hidden sm:inline">{subStep === 'meals' ? 'Choisir mes plats' : subStep === 'plats' ? (subPlatsCount < (subSelectedPlan?.meals_per_week || 1) ? `${subPlatsCount}/${subSelectedPlan?.meals_per_week} plats` : 'Extras') : subExtrasCount > 0 ? 'Récapitulatif' : 'Passer'}</span>
                      <span className="sm:hidden">{subStep === 'meals' ? 'Suivant' : subStep === 'plats' ? (subPlatsCount < (subSelectedPlan?.meals_per_week || 1) ? `${subPlatsCount}/${subSelectedPlan?.meals_per_week}` : 'Extras') : 'Suivant'}</span>
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => setSubCheckoutOpen(true)}
                      className="bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-brown shrink-0"
                    >
                      <CalendarCheck className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">S'abonner</span>
                      <span className="sm:hidden">S'abonner</span>
                    </Button>
                  )}
                  </div>
                </div>

              {/* Step 4: Review & Subscribe */}
              {subStep === 'review' && subSelectedPlan && (
                <div className="max-w-2xl mx-auto pb-16">
                  <h3 className="font-display text-2xl text-moroccan-brown mb-6 text-center">Récapitulatif de votre Abonnement</h3>

                  {/* Plan summary */}
                  <div className="bg-gradient-to-r from-moroccan-gold/10 to-moroccan-gold/5 rounded-2xl p-6 mb-6 border border-moroccan-gold/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-display text-xl text-moroccan-brown">{subSelectedPlan.name || `${subSelectedPlan.meals_per_week} repas / semaine`}</span>
                      <Badge className="bg-moroccan-gold text-white">{subSelectedPlan.meals_per_week} repas/sem</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm text-moroccan-brown/60">
                      <span>{subSelectedPlan.price_per_meal.toFixed(2)} $ / repas</span>
                      <span className="text-lg font-bold text-moroccan-red">{subSelectedPlan.monthly_price.toFixed(2)} $ / mois</span>
                    </div>
                  </div>

                  {/* Selected plats */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-moroccan-brown mb-2 flex items-center gap-2">
                      <UtensilsCrossed className="w-4 h-4 text-moroccan-gold" /> Vos plats ({subPlatsCount})
                    </h4>
                    <div className="space-y-2">
                      {Object.values(subPlats).map(({ item, qty }) => (
                        <div key={item.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                            <span className="font-medium text-moroccan-brown">{item.name}</span>
                          </div>
                          <span className="text-sm text-moroccan-brown/50">x{qty}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Selected extras */}
                  {subExtrasCount > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-moroccan-brown mb-2 flex items-center gap-2">
                        <Salad className="w-4 h-4 text-moroccan-gold" /> Extras ({subExtrasCount})
                      </h4>
                      <div className="space-y-2">
                        {Object.values(subExtras).map(({ item, qty, category }) => (
                          <div key={item.id} className="bg-white rounded-xl p-3 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-3">
                              <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover" />
                              <div>
                                <span className="font-medium text-moroccan-brown">{item.name}</span>
                                <Badge className="ml-2 text-xs bg-moroccan-brown/10 text-moroccan-brown/50">{category === 'entree' ? 'Entrée' : 'Dessert'}</Badge>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="text-sm font-semibold text-moroccan-red">{(item.price * qty).toFixed(2)} $</span>
                              <span className="text-xs text-moroccan-brown/40 ml-1">x{qty}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Extras mode toggle */}
                      <div className="mt-4 bg-moroccan-gold/5 border border-moroccan-gold/20 rounded-xl p-4">
                        <p className="text-sm font-semibold text-moroccan-brown mb-3">Comment souhaitez-vous recevoir vos extras ?</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            onClick={() => setSubExtrasMode('onetime')}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              subExtrasMode === 'onetime'
                                ? 'border-moroccan-gold bg-moroccan-gold/10'
                                : 'border-moroccan-brown/10 bg-white hover:border-moroccan-gold/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="w-4 h-4 text-moroccan-gold shrink-0" />
                              <span className="text-sm font-semibold text-moroccan-brown">Première livraison</span>
                            </div>
                            <p className="text-xs text-moroccan-brown/50">Inclus uniquement avec votre 1er colis (+{subExtrasTotal.toFixed(2)} $)</p>
                          </button>
                          <button
                            onClick={() => setSubExtrasMode('recurring')}
                            className={`p-3 rounded-xl border-2 text-left transition-all ${
                              subExtrasMode === 'recurring'
                                ? 'border-moroccan-gold bg-moroccan-gold/10'
                                : 'border-moroccan-brown/10 bg-white hover:border-moroccan-gold/40'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <CalendarCheck className="w-4 h-4 text-moroccan-gold shrink-0" />
                              <span className="text-sm font-semibold text-moroccan-brown">Chaque semaine</span>
                            </div>
                            <p className="text-xs text-moroccan-brown/50">Ajoutés à chaque livraison (+{(subExtrasTotal * 4).toFixed(2)} $/mois)</p>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Subscribe button */}
                  <div className="bg-white rounded-2xl p-6 shadow-moroccan">
                    <div className="space-y-1.5 mb-4">
                      <div className="flex justify-between items-center text-sm text-moroccan-brown/60">
                        <span>Plan ({subSelectedPlan.meals_per_week} repas/sem)</span>
                        <span>{subSelectedPlan.monthly_price.toFixed(2)} $</span>
                      </div>
                      {subExtrasCount > 0 && subExtrasMode === 'recurring' && (
                        <div className="flex justify-between items-center text-sm text-moroccan-brown/60">
                          <span>Extras ({subExtrasCount}) x4 sem</span>
                          <span>+{(subExtrasTotal * 4).toFixed(2)} $</span>
                        </div>
                      )}
                      {subExtrasCount > 0 && subExtrasMode === 'onetime' && (
                        <div className="flex justify-between items-center text-sm text-moroccan-orange">
                          <span>Extras 1re livraison</span>
                          <span>+{subExtrasTotal.toFixed(2)} $ (une fois)</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center text-xs text-moroccan-brown/50">
                        <span>Taxes (TPS + TVQ 15%)</span>
                        <span>+{subMonthlyTax.toFixed(2)} $</span>
                      </div>
                      <div className="border-t border-moroccan-brown/10 pt-2 flex justify-between items-center">
                        <span className="text-moroccan-brown font-medium">Total mensuel</span>
                        <span className="text-2xl font-bold text-moroccan-red">{subMonthlyTotal.toFixed(2)} $ / mois</span>
                      </div>
                      {subFirstOrderExtras > 0 && (
                        <p className="text-xs text-moroccan-orange text-right">+ {subFirstOrderTotal.toFixed(2)} $ d'extras à la 1re livraison (taxes incl.)</p>
                      )}
                    </div>
                    <p className="text-xs text-moroccan-brown/40 text-right mb-4">Taxes et livraison gratuite incluses</p>
                    <Button
                      onClick={() => setSubCheckoutOpen(true)}
                      className="w-full bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-brown py-6 text-lg font-semibold"
                    >
                      <CalendarCheck className="w-5 h-5 mr-2" /> S'abonner maintenant
                    </Button>
                  </div>

                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-moroccan-brown text-white relative overflow-hidden">
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="bg-moroccan-gold/15 text-moroccan-gold mb-4 border border-moroccan-gold/20">
              <Clock className="w-3.5 h-3.5 mr-1" />
              Simple et Rapide
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl mb-4">
              Comment Ça Marche ?
            </h2>
            <p className="text-white/60 text-base sm:text-lg max-w-xl mx-auto">
              Commandez vos saveurs préférées en quelques clics
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Menu, title: 'Choisissez', desc: 'Parcourez le menu et sélectionnez vos plats', color: 'bg-moroccan-red' },
              { icon: ChefHat, title: 'On Prépare', desc: 'Nos chefs cuisinent avec des ingrédients frais', color: 'bg-moroccan-orange' },
              { icon: Truck, title: 'Livraison', desc: 'Livré frais dans le Grand Montréal', color: 'bg-moroccan-green' },
              { icon: Home, title: 'Dégustez', desc: 'Un repas marocain authentique chez vous', color: 'bg-moroccan-gold' },
            ].map((step, idx) => (
              <div
                key={step.title}
                className="text-center group animate-slide-up"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`${step.color} w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-105 transition-transform shadow-lg`}>
                  <step.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <div className="bg-white/5 rounded-xl p-4 sm:p-5 border border-white/10">
                  <div className="text-xs font-semibold text-moroccan-gold/80 mb-1">0{idx + 1}</div>
                  <h3 className="font-display text-xl sm:text-2xl mb-1.5">{step.title}</h3>
                  <p className="text-white/50 text-xs sm:text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white relative">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <Badge className="bg-moroccan-green/10 text-moroccan-green mb-4 border border-moroccan-green/20">
              <Star className="w-3.5 h-3.5 mr-1" />
              Avis Clients
            </Badge>
            <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-moroccan-brown mb-3">
              Ils Ont Adoré
            </h2>
            <p className="text-moroccan-brown/50 text-base sm:text-lg max-w-lg mx-auto">
              Ce que nos clients disent de BledCrate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {(reviews.length > 0 ? reviews : testimonials).map((review, idx) => (
              <div
                key={review.id}
                className="bg-moroccan-cream/50 rounded-2xl p-5 sm:p-6 animate-fade-in border border-moroccan-brown/5 hover:border-moroccan-red/15 transition-colors"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-3">
                  {'image_url' in review && (review as Review).image_url ? (
                    <img src={(review as Review).image_url} alt={review.name} className="w-10 h-10 rounded-full object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-moroccan-red rounded-full flex items-center justify-center text-white font-bold text-lg">
                      {review.avatar || review.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <h4 className="font-semibold text-moroccan-brown text-sm">{review.name}</h4>
                    <div className="flex gap-0.5">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-moroccan-gold text-moroccan-gold" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-moroccan-brown/60 text-sm leading-relaxed">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subscription CTA Section */}
      {siteSettings?.subscription_enabled === 'true' && (
        <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 bg-moroccan-brown text-white relative overflow-hidden">
          <div className="max-w-5xl mx-auto relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 text-center md:text-left">
              <Badge className="bg-moroccan-gold text-moroccan-brown mb-3">
                <Package className="w-3 h-3 mr-1" />
                Nouveau
              </Badge>
              <h2 className="font-display text-4xl sm:text-5xl mb-3">
                Abonnez-vous &<br />
                <span className="text-moroccan-gold">Économisez Plus</span>
              </h2>
              <p className="text-white/80 text-base mb-6 max-w-lg">
                Recevez vos repas marocains préférés chaque semaine. Livraison gratuite, prix réduits, et des saveurs authentiques à votre porte.
              </p>
              <Link to="/abonnement">
                <Button className="bg-moroccan-red hover:bg-moroccan-red-dark text-white px-8 py-6 text-lg font-semibold rounded-full">
                  Voir les plans
                  <ChevronRight className="w-5 h-5 ml-1" />
                </Button>
              </Link>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center shrink-0">
              <p className="text-moroccan-gold text-sm font-medium mb-1">À partir de</p>
              <p className="font-display text-5xl text-white">12<span className="text-2xl">$/plat</span></p>
              <p className="text-white/60 text-sm mt-1">Livraison gratuite incluse</p>
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <img src="/mint-tea.jpg" alt="Thé à la Menthe" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-moroccan-red/90 to-moroccan-red-dark/90" />
        </div>

        <div className="max-w-3xl mx-auto text-center relative z-10">
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-white mb-4">
            Prêt à Commander ?
          </h2>
          <p className="text-white/80 text-base sm:text-lg mb-8 max-w-lg mx-auto">
            Profitez de <span className="font-bold text-moroccan-gold">10% de réduction</span> sur votre première commande
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => scrollToSection('menu')}
              className="bg-white text-moroccan-red hover:bg-moroccan-cream px-8 py-6 text-lg font-semibold rounded-full shadow-lg transition-all hover:scale-[1.02]"
            >
              Commander
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            {siteSettings?.subscription_enabled === 'true' && (
              <Link to="/abonnement">
                <Button
                  variant="outline"
                  className="border-2 border-white/40 text-white hover:bg-white hover:text-moroccan-red px-8 py-6 text-lg font-semibold rounded-full bg-white/10 backdrop-blur-sm"
                >
                  S'abonner
                  <Package className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-moroccan-brown text-white py-12 sm:py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.png" 
                  alt="BledCrate" 
                  className="w-14 h-14 rounded-full object-cover border-2 border-moroccan-gold"
                />
                <span className="font-display text-2xl font-bold">BledCrate</span>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                Ramenez le Maroc à votre table avec nos meal boxes authentiques 
                préparées avec amour et tradition à région du Grand Montréal.
              </p>
            </div>
            <div>
              <h4 className="font-display text-xl mb-4">Liens Rapides</h4>
              <ul className="space-y-2 text-white/70">
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-moroccan-gold transition-colors">Nos Plats</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-moroccan-gold transition-colors">Processus</button></li>
                <li><Link to="/track" className="hover:text-moroccan-gold transition-colors">Track</Link></li>
                <li><Link to="/politique" className="hover:text-moroccan-gold transition-colors">Politique</Link></li>
                <li><Link to="/confidentialite" className="hover:text-moroccan-gold transition-colors">Confidentialité</Link></li>
                <li><Link to="/conditions" className="hover:text-moroccan-gold transition-colors">Conditions d'Utilisation</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xl mb-4">Contact</h4>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-moroccan-gold" />
                  <a href="https://www.bledcrate.ca" className="hover:text-moroccan-gold transition-colors">www.bledcrate.ca</a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-moroccan-gold" />
                  <a href="mailto:contact@bledcrate.ca" className="hover:text-moroccan-gold transition-colors">contact@bledcrate.ca</a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-moroccan-gold" />
                  région du Grand Montréal, Québec
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xl mb-4">Suivez-Nous</h4>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/bledcrate/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-moroccan-red transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="https://www.facebook.com/profile.php?id=61579503047042" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-moroccan-red transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="https://www.tiktok.com/@bledcrate" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-moroccan-red transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.87a8.16 8.16 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.3z"/></svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 mt-8 text-center text-white/40 text-sm">
            <p>© 2026 BledCrate. Tous droits réservés. | Saveurs Authentiques du Maroc</p>
            <p className="mt-1">région du Grand Montréal, Québec | contact@bledcrate.ca | <a href="https://www.bledcrate.ca" className="hover:text-moroccan-gold transition-colors">www.bledcrate.ca</a></p>
          </div>
        </div>
      </footer>

      {/* Subscription Checkout Dialog */}
      <Dialog open={subCheckoutOpen} onOpenChange={setSubCheckoutOpen}>
        <DialogContent className="bg-moroccan-cream max-w-lg p-0 gap-0 max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-moroccan-gold to-moroccan-gold/80 px-6 py-5 text-moroccan-brown">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-display text-2xl sm:text-3xl text-moroccan-brown flex items-center gap-2">
                <CalendarCheck className="w-6 h-6" /> S'abonner
              </DialogTitle>
              <DialogDescription className="text-moroccan-brown/70 text-sm">
                Vos repas livrés chaque semaine, sans effort
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Plan summary card */}
            {subSelectedPlan && (
              <div className="bg-white rounded-xl p-4 shadow-sm border border-moroccan-gold/20 space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-semibold text-moroccan-brown">{subSelectedPlan.meals_per_week} repas / semaine</span>
                    <p className="text-xs text-moroccan-brown/50 mt-0.5">{subSelectedPlan.price_per_meal.toFixed(2)} $ par repas</p>
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-moroccan-brown/60">{subSelectedPlan.monthly_price.toFixed(2)} $</span>
                  </div>
                </div>
                {subExtrasCount > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-moroccan-brown/60">
                      Extras ({subExtrasCount}) — {subExtrasMode === 'recurring' ? 'chaque semaine' : '1re livraison'}
                    </span>
                    <span className="text-moroccan-brown/60">
                      {subExtrasMode === 'recurring' ? `+${(subExtrasTotal * 4).toFixed(2)} $` : `+${subExtrasTotal.toFixed(2)} $ (1x)`}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-xs text-moroccan-brown/50">
                  <span>Taxes (TPS + TVQ 15%)</span>
                  <span>+{subMonthlyTax.toFixed(2)} $</span>
                </div>
                <div className="pt-2 border-t border-moroccan-brown/10 flex justify-between items-center">
                  <span className="font-semibold text-moroccan-brown text-sm">Total mensuel</span>
                  <span className="text-xl font-bold text-moroccan-red">{subMonthlyTotal.toFixed(2)} $ / mois</span>
                </div>
                {subFirstOrderExtras > 0 && (
                  <p className="text-xs text-moroccan-orange text-right">+ {subFirstOrderTotal.toFixed(2)} $ d'extras à la 1re livraison (taxes incl.)</p>
                )}
                <div className="flex items-center gap-1.5 text-xs text-green-600">
                  <Truck className="w-3.5 h-3.5" /> Taxes et livraison gratuite incluses
                </div>
              </div>
            )}

            {/* Personal info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-gold/15 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-moroccan-gold" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Informations personnelles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Nom complet *</label>
                  <input type="text" placeholder="Fatima Benali" value={subCustomerInfo.name}
                    onChange={e => setSubCustomerInfo(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold/30 focus:border-moroccan-gold bg-white text-moroccan-brown transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Téléphone *</label>
                  <input type="tel" placeholder="438-808-4120" value={subCustomerInfo.phone}
                    onChange={e => setSubCustomerInfo(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold/30 focus:border-moroccan-gold bg-white text-moroccan-brown transition-all" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Email *</label>
                <input type="email" placeholder="fatima@email.com" value={subCustomerInfo.email}
                  onChange={e => setSubCustomerInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold/30 focus:border-moroccan-gold bg-white text-moroccan-brown transition-all" />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-gold/15 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-moroccan-gold" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Livraison</span>
              </div>
              <div>
                <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Adresse complète *</label>
                <input type="text" placeholder="123 Rue Principale, Montréal, QC" value={subCustomerInfo.address}
                  onChange={e => setSubCustomerInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold/30 focus:border-moroccan-gold bg-white text-moroccan-brown transition-all" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-gold/15 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-moroccan-gold" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Notes <span className="font-normal text-moroccan-brown/40">(optionnel)</span></span>
              </div>
              <textarea placeholder="Allergies, préférences alimentaires, instructions de livraison..." value={subCustomerInfo.notes}
                onChange={e => setSubCustomerInfo(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-gold/30 focus:border-moroccan-gold bg-white text-moroccan-brown resize-none transition-all" />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="border-t bg-white/80 backdrop-blur-sm px-6 py-4 space-y-3">
            <Button
              onClick={handleSubscribe}
              disabled={subSubmitting}
              className="w-full bg-moroccan-gold hover:bg-moroccan-gold/90 text-moroccan-brown py-6 font-semibold text-base rounded-xl shadow-lg shadow-moroccan-gold/20 transition-all hover:shadow-xl hover:shadow-moroccan-gold/30"
            >
              {subSubmitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-moroccan-brown/30 border-t-moroccan-brown rounded-full animate-spin" /> Redirection...</span>
              ) : (
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> S'abonner — {subMonthlyTotal.toFixed(2)} $ / mois{subFirstOrderExtras > 0 ? ` + ${subFirstOrderTotal.toFixed(2)} $` : ''}</span>
              )}
            </Button>
            <div className="flex items-center justify-center gap-4 text-xs text-moroccan-brown/40">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Paiement sécurisé</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> Annulable à tout moment</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-moroccan-cream max-w-lg p-0 gap-0 max-h-[95vh] sm:max-h-[85vh] overflow-hidden flex flex-col">
          {/* Header with gradient */}
          <div className="bg-gradient-to-r from-moroccan-red to-moroccan-red-dark px-6 py-5 text-white">
            <DialogHeader className="space-y-1">
              <DialogTitle className="font-display text-2xl sm:text-3xl text-white flex items-center gap-2">
                <ShoppingCart className="w-6 h-6" /> Votre Commande
              </DialogTitle>
              <DialogDescription className="text-white/70 text-sm">
                Plus qu'une étape avant de savourer
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
            {/* Order Summary */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-red/10 flex items-center justify-center">
                  <Package className="w-3.5 h-3.5 text-moroccan-red" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Récapitulatif</span>
              </div>
              <div className="bg-white rounded-xl p-4 space-y-2 text-sm shadow-sm">
                {cart.map(i => (
                  <div key={`${i.id}-${i.selectedVariant}`} className="flex justify-between text-moroccan-brown items-center">
                    <span className="flex-1 flex items-center gap-2">
                      <span className="w-6 h-6 rounded-md bg-moroccan-red/10 flex items-center justify-center text-xs font-bold text-moroccan-red">{i.quantity}</span>
                      {i.name}{i.selectedVariant ? <span className="text-moroccan-brown/40 text-xs">({i.selectedVariant})</span> : ''}
                    </span>
                    <span className="font-semibold ml-4 text-moroccan-brown/80">{(i.price * i.quantity).toFixed(2)} $</span>
                  </div>
                ))}

                <div className="border-t border-dashed border-moroccan-brown/10 pt-2 mt-2 space-y-1">
                  {(qualifiesForBundle || promoApplied || deliveryFee > 0) && (
                    <>
                      <div className="flex justify-between text-moroccan-brown/50 text-xs">
                        <span>Sous-total</span>
                        <span>{cartTotal.toFixed(2)} $</span>
                      </div>
                      {qualifiesForBundle && (
                        <div className="flex justify-between text-green-600 text-xs font-medium">
                          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3" /> Bundle -{bundleDiscountPercent}%</span>
                          <span>-{bundleDiscountAmount.toFixed(2)} $</span>
                        </div>
                      )}
                      {promoApplied && (
                        <div className="flex justify-between text-green-600 text-xs font-medium">
                          <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> {promoApplied.code} -{promoApplied.discount}%</span>
                          <span>-{discountAmount.toFixed(2)} $</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-moroccan-brown/50">
                        <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Livraison</span>
                        <span className={deliveryFee === 0 ? 'text-green-600 font-medium' : ''}>
                          {deliveryFee === 0 ? 'GRATUITE' : `${deliveryFee.toFixed(2)} $`}
                        </span>
                      </div>
                    </>
                  )}
                  <div className="flex justify-between items-baseline pt-1">
                    <span className="font-bold text-moroccan-brown">Total</span>
                    <div className="text-right">
                      <span className="text-xl font-bold text-moroccan-red">{finalTotal.toFixed(2)} $</span>
                      <p className="text-[10px] text-moroccan-brown/40">Taxes et frais inclus</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Promo Code */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Code promo"
                value={customerInfo.promoCode}
                onChange={e => setCustomerInfo(p => ({ ...p, promoCode: e.target.value.toUpperCase() }))}
                className="flex-1 border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red/20 focus:border-moroccan-red bg-white text-moroccan-brown transition-all"
              />
              <Button onClick={applyPromoCode} variant="outline" className="border-moroccan-brown/15 text-moroccan-brown shrink-0 rounded-xl px-5">
                <Percent className="w-4 h-4 mr-1" /> Appliquer
              </Button>
            </div>

            {/* Personal info */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-red/10 flex items-center justify-center">
                  <User className="w-3.5 h-3.5 text-moroccan-red" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Informations personnelles</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Nom complet *</label>
                  <input type="text" placeholder="Fatima Benali" value={customerInfo.name}
                    onChange={e => setCustomerInfo(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red/20 focus:border-moroccan-red bg-white text-moroccan-brown transition-all" />
                </div>
                <div>
                  <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Téléphone *</label>
                  <input type="tel" placeholder="438-808-4120" value={customerInfo.phone}
                    onChange={e => setCustomerInfo(p => ({ ...p, phone: e.target.value }))}
                    className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red/20 focus:border-moroccan-red bg-white text-moroccan-brown transition-all" />
                </div>
              </div>
              <div className="mt-3">
                <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Email *</label>
                <input type="email" placeholder="fatima@email.com" value={customerInfo.email}
                  onChange={e => setCustomerInfo(p => ({ ...p, email: e.target.value }))}
                  className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red/20 focus:border-moroccan-red bg-white text-moroccan-brown transition-all" />
              </div>
            </div>

            {/* Delivery */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-red/10 flex items-center justify-center">
                  <MapPin className="w-3.5 h-3.5 text-moroccan-red" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Livraison</span>
              </div>
              <div>
                <label className="text-xs font-medium text-moroccan-brown/60 mb-1 block">Adresse complète *</label>
                <input type="text" placeholder="123 Rue Principale, Montréal, QC" value={customerInfo.address}
                  onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red/20 focus:border-moroccan-red bg-white text-moroccan-brown transition-all" />
              </div>
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-moroccan-red/10 flex items-center justify-center">
                  <MessageSquare className="w-3.5 h-3.5 text-moroccan-red" />
                </div>
                <span className="text-sm font-semibold text-moroccan-brown">Notes <span className="font-normal text-moroccan-brown/40">(optionnel)</span></span>
              </div>
              <textarea
                placeholder="Allergies, préférences alimentaires, instructions de livraison..."
                value={customerInfo.notes}
                onChange={e => setCustomerInfo(p => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full border border-moroccan-brown/15 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red/20 focus:border-moroccan-red bg-white text-moroccan-brown resize-none transition-all"
              />
            </div>
          </div>

          {/* Sticky footer */}
          <div className="border-t bg-white/80 backdrop-blur-sm px-6 py-4 space-y-3">
            <Button
              onClick={sendOrder}
              disabled={isSubmitting}
              className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-6 font-semibold text-base rounded-xl shadow-lg shadow-moroccan-red/20 transition-all hover:shadow-xl hover:shadow-moroccan-red/30"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Redirection vers le paiement...</span>
              ) : (
                <span className="flex items-center gap-2"><CreditCard className="w-4 h-4" /> Payer {finalTotal.toFixed(2)} $</span>
              )}
            </Button>
            <div className="flex items-center justify-center gap-4 text-xs text-moroccan-brown/40">
              <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Paiement sécurisé</span>
              <span className="flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Livraison rapide</span>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Variant Selection Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="bg-moroccan-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-moroccan-brown">
              {selectedItem?.name}
            </DialogTitle>
            <DialogDescription className="text-moroccan-brown/70">
              Choisissez votre variante préférée
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {selectedItem?.variants?.map((variant) => {
              const variantTotal = (selectedItem?.price || 0) + variant.price;
              return (
                <button
                  key={variant.name}
                  onClick={() => setSelectedVariant(variant)}
                  className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${
                    selectedVariant?.name === variant.name
                      ? 'border-moroccan-red bg-moroccan-red/10'
                      : 'border-moroccan-brown/20 hover:border-moroccan-red/50'
                  }`}
                >
                  <span className="font-medium text-moroccan-brown">{variant.name}</span>
                  <span className="text-sm font-semibold">
                    <span className="text-moroccan-red">{variantTotal.toFixed(2)} $</span>
                    {variant.price !== 0 && (
                      <span className={`ml-1.5 text-xs ${variant.price > 0 ? 'text-orange-500' : 'text-green-600'}`}>
                        ({variant.price > 0 ? '+' : ''}{variant.price.toFixed(2)} $)
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
            <Button
              onClick={() => selectedItem && selectedVariant && addToCart(selectedItem, selectedVariant)}
              className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-6 mt-2"
            >
              Ajouter au Panier — {selectedItem && selectedVariant ? (selectedItem.price + selectedVariant.price).toFixed(2) : selectedItem?.price.toFixed(2)} $
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Back to Top Button — hidden when sticky nav bar is active */}
      {showBackToTop && purchaseMode === null && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-40 w-12 h-12 bg-moroccan-red text-white rounded-full shadow-lg flex items-center justify-center hover:bg-moroccan-red-dark transition-all animate-scale-in hover:scale-110"
          aria-label="Retour en haut"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Floating Contact Button — hidden when sticky nav bar is active */}
      {purchaseMode === null && (
        <a
          href="mailto:contact@bledcrate.ca"
          className="fixed bottom-6 left-6 z-40 flex items-center gap-2 bg-moroccan-brown text-white px-4 py-3 rounded-full shadow-lg hover:bg-moroccan-brown-light transition-all hover:scale-105 group"
          aria-label="Nous contacter"
        >
          <Mail className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-medium">Nous contacter</span>
        </a>
      )}

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
