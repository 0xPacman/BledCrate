import { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  ChefHat, 
  Truck, 
  Home, 
  Star, 
  Instagram, 
  Facebook, 
  Twitter, 
  Plus, 
  Minus, 
  X,
  Menu,
  Clock,
  Heart,
  MapPin,
  Phone,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast, Toaster } from 'sonner';
import menuData from '@/data/menu.json';
import './App.css';

// Types
interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: 'entree' | 'plat' | 'dessert';
  tags?: string[];
  variants?: string[];
}

interface CartItem extends MenuItem {
  quantity: number;
  selectedVariant?: string;
}

// Menu Data — edit src/data/menu.json to add, remove or update products
const menuItems: MenuItem[] = menuData.menuItems as MenuItem[];

// Testimonials — edit src/data/menu.json to update reviews
const testimonials = menuData.testimonials;

interface CustomerInfo {
  name: string;
  phone: string;
  address: string;
  notes: string;
}

const WEB3FORMS_KEY = '45c5d973-c371-49f1-aba6-71053b2a9bd2';

function App() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo>({
    name: '',
    phone: '',
    address: '',
    notes: '',
  });

  // Handle scroll for navbar
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Add to cart
  const addToCart = (item: MenuItem, variant?: string) => {
    setCart(prev => {
      const existingItem = prev.find(i => i.id === item.id && i.selectedVariant === variant);
      if (existingItem) {
        return prev.map(i => 
          i.id === item.id && i.selectedVariant === variant 
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { ...item, quantity: 1, selectedVariant: variant }];
    });
    toast.success(`${item.name} ajouté au panier !`, {
      description: variant ? `Variant: ${variant}` : undefined,
    });
    setSelectedItem(null);
    setSelectedVariant('');
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

  // Send order via Web3Forms
  const sendOrder = async () => {
    if (!customerInfo.name || !customerInfo.phone || !customerInfo.address) {
      toast.error('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    setIsSubmitting(true);
    const orderLines = cart
      .map(i => `• ${i.name}${i.selectedVariant ? ` (${i.selectedVariant})` : ''} x${i.quantity} — ${(i.price * i.quantity).toFixed(2)} $`)
      .join('\n');
    const body = {
      access_key: WEB3FORMS_KEY,
      subject: `🛒 Nouvelle commande BledCrate — ${customerInfo.name}`,
      from_name: 'BledCrate Website',
      name: customerInfo.name,
      phone: customerInfo.phone,
      address: customerInfo.address,
      message: `Nouvelle commande reçue !\n\n👤 Client : ${customerInfo.name}\n📞 Téléphone : ${customerInfo.phone}\n📍 Adresse : ${customerInfo.address}\n📝 Notes : ${customerInfo.notes || 'Aucune'}\n\n🍽️ Commande :\n${orderLines}\n\n💰 Total : ${cartTotal.toFixed(2)} $`,
    };
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Commande envoyée avec succès ! Nous vous contacterons bientôt.', { duration: 6000 });
        setCart([]);
        setCheckoutOpen(false);
        setCustomerInfo({ name: '', phone: '', address: '', notes: '' });
      } else {
        toast.error('Erreur lors de l\'envoi. Réessayez ou appelez-nous.');
      }
    } catch {
      toast.error('Erreur réseau. Vérifiez votre connexion.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-moroccan-cream">
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
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
              {['Nos Plats', 'Comment Ça Marche', 'Avis'].map((item, idx) => (
                <button
                  key={item}
                  onClick={() => scrollToSection(['menu', 'how-it-works', 'testimonials'][idx])}
                  className={`font-medium text-sm hover:text-moroccan-red transition-colors relative group ${
                    isScrolled ? 'text-moroccan-brown' : 'text-white'
                  }`}
                >
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-moroccan-red transition-all group-hover:w-full" />
                </button>
              ))}
            </div>

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
              <SheetContent className="w-full sm:max-w-md bg-moroccan-cream">
                <SheetHeader>
                  <SheetTitle className="font-display text-3xl text-moroccan-brown flex items-center gap-2">
                    <ShoppingCart className="w-6 h-6" />
                    Votre Panier
                  </SheetTitle>
                </SheetHeader>
                <ScrollArea className="h-[calc(100vh-200px)] mt-6">
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
                  <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-moroccan-brown font-medium">Total</span>
                      <span className="text-2xl font-bold text-moroccan-red">{cartTotal.toFixed(2)} $</span>
                    </div>
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
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="hero" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img 
            src="/hero-moroccan.jpg" 
            alt="Cuisine Marocaine" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-moroccan-cream" />
        </div>

        {/* Zellige Corner Decorations */}
        <div className="absolute top-0 left-0 w-32 h-32 opacity-60">
          <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover rounded-br-full" />
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 opacity-60">
          <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover rounded-bl-full" />
        </div>

        {/* Steam Particles */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="steam-particle animate-steam"
              style={{
                left: `${20 + i * 15}%`,
                bottom: `${10 + (i % 3) * 5}%`,
                animationDelay: `${i * 0.5}s`,
                width: `${10 + i * 3}px`,
                height: `${10 + i * 3}px`,
              }}
            />
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <div className="animate-fade-in">
            <Badge className="bg-moroccan-red/90 text-white mb-6 text-sm px-4 py-2">
              <span className="mr-1">🍲</span>
              Cuisine Authentique du Maroc
            </Badge>
          </div>
          <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-white text-shadow-lg mb-6 animate-slide-up">
            BledCrate
            <br />
            <span className="text-moroccan-gold">Saveurs Royales</span>
          </h1>
          <p className="text-lg sm:text-xl text-white/90 mb-8 max-w-2xl mx-auto animate-slide-up" style={{ animationDelay: '0.2s' }}>
            Découvrez l'authenticité de la cuisine marocaine avec nos meal boxes 
            préparées avec amour et livrées à région du Grand Montréal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <Button 
              onClick={() => scrollToSection('menu')}
              className="bg-moroccan-red hover:bg-moroccan-red-dark text-white px-8 py-6 text-lg font-semibold rounded-full btn-liquid animate-float"
            >
              Découvrir Nos Box
              <Menu className="w-5 h-5 ml-2" />
            </Button>
            <Button 
              variant="outline"
              onClick={() => scrollToSection('how-it-works')}
              className="border-2 border-white text-white hover:bg-white hover:text-moroccan-brown px-8 py-6 text-lg font-semibold rounded-full bg-transparent"
            >
              Comment Ça Marche
            </Button>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <div className="w-8 h-12 border-2 border-white/50 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-white/70 rounded-full" />
          </div>
        </div>
      </section>

      {/* Menu Section */}
      <section id="menu" className="py-20 px-4 sm:px-6 lg:px-8 relative">
        {/* Zellige Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(/zellige-pattern.jpg)',
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }} />
        </div>
        
        {/* Zellige Border Top */}
        <div className="absolute top-0 left-0 right-0 h-4 overflow-hidden">
          <div className="w-full h-full" style={{
            backgroundImage: 'url(/zellige-pattern.jpg)',
            backgroundSize: '100px 100%',
            backgroundRepeat: 'repeat-x'
          }} />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-moroccan-red shadow-lg">
                <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <Badge className="bg-moroccan-orange text-white mb-4">
              <Heart className="w-4 h-4 mr-1" />
              Notre Sélection
            </Badge>
            <h2 className="font-display text-5xl sm:text-6xl text-moroccan-brown mb-4">
              Notre Marché Aux Saveurs
            </h2>
            <p className="text-moroccan-brown/70 text-lg max-w-2xl mx-auto">
              Des recettes traditionnelles transmises de génération en génération, 
              préparées avec les meilleurs ingrédients
            </p>
          </div>

          <Tabs defaultValue="entree" className="w-full">
            <TabsList className="flex justify-center mb-12 bg-white/50 p-2 rounded-full max-w-md mx-auto">
              <TabsTrigger 
                value="entree" 
                className="px-6 py-3 rounded-full data-[state=active]:bg-moroccan-red data-[state=active]:text-white transition-all"
              >
                Entrées
              </TabsTrigger>
              <TabsTrigger 
                value="plat"
                className="px-6 py-3 rounded-full data-[state=active]:bg-moroccan-red data-[state=active]:text-white transition-all"
              >
                Plats
              </TabsTrigger>
              <TabsTrigger 
                value="dessert"
                className="px-6 py-3 rounded-full data-[state=active]:bg-moroccan-red data-[state=active]:text-white transition-all"
              >
                Desserts
              </TabsTrigger>
            </TabsList>

            {['entree', 'plat', 'dessert'].map((category) => (
              <TabsContent key={category} value={category} className="mt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {menuItems.filter(item => item.category === category).map((item, idx) => (
                    <div 
                      key={item.id}
                      className="bg-white rounded-2xl overflow-hidden shadow-moroccan card-hover group animate-fade-in"
                      style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                      <div className="relative img-zoom h-48">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        {item.tags?.map(tag => (
                          <Badge 
                            key={tag} 
                            className="absolute top-2 left-2 bg-moroccan-green text-white text-xs"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <div className="p-4">
                        <h3 className="font-display text-xl text-moroccan-brown mb-1">{item.name}</h3>
                        <p className="text-sm text-moroccan-brown/60 line-clamp-2 mb-3">{item.description}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-moroccan-red">{item.price.toFixed(2)} $</span>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (item.variants && item.variants.length > 0) {
                                setSelectedItem(item);
                                setSelectedVariant(item.variants[0]);
                              } else {
                                addToCart(item);
                              }
                            }}
                            className="bg-moroccan-red hover:bg-moroccan-red-dark text-white rounded-full w-10 h-10 p-0"
                          >
                            <Plus className="w-5 h-5" />
                          </Button>
                        </div>
                        {item.variants && (
                          <p className="text-xs text-moroccan-brown/50 mt-2">
                            {item.variants.length} variantes disponibles
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 px-4 sm:px-6 lg:px-8 bg-moroccan-brown text-white relative overflow-hidden">
        {/* Zellige Pattern Background */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(/zellige-pattern.jpg)',
            backgroundSize: '150px 150px',
            backgroundRepeat: 'repeat'
          }} />
        </div>

        {/* Decorative Circles */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 left-0 w-64 h-64 border-4 border-white rounded-full -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 border-4 border-white rounded-full translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-moroccan-gold shadow-lg">
                <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <Badge className="bg-moroccan-gold text-moroccan-brown mb-4">
              <Clock className="w-4 h-4 mr-1" />
              Simple et Rapide
            </Badge>
            <h2 className="font-display text-5xl sm:text-6xl mb-4">
              Comment Ça Marche ?
            </h2>
            <p className="text-white/70 text-lg max-w-2xl mx-auto">
              Commandez vos saveurs préférées en quelques clics et laissez-nous 
              vous emmener au Maroc
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Menu, 
                title: 'Choisissez Vos Saveurs', 
                desc: 'Parcourez notre menu et sélectionnez vos plats préférés',
                color: 'bg-moroccan-red'
              },
              { 
                icon: ChefHat, 
                title: 'On Prépare avec Amour', 
                desc: 'Nos chefs préparent votre commande avec des ingrédients frais',
                color: 'bg-moroccan-orange'
              },
              { 
                icon: Truck, 
                title: 'Livraison Express', 
                desc: 'Recevez votre meal box chaude et fraîche à région du Grand Montréal',
                color: 'bg-moroccan-green'
              },
              { 
                icon: Home, 
                title: 'Dégustez Chez Vous', 
                desc: 'Profitez d\'un authentique repas marocain dans votre salon',
                color: 'bg-moroccan-gold'
              },
            ].map((step, idx) => (
              <div 
                key={step.title}
                className="text-center group animate-slide-up"
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className={`${step.color} w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform shadow-lg`}>
                  <step.icon className="w-10 h-10 text-white" />
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 hover:bg-white/20 transition-colors border border-white/10">
                  <div className="text-4xl font-display text-moroccan-gold mb-2">0{idx + 1}</div>
                  <h3 className="font-display text-2xl mb-2">{step.title}</h3>
                  <p className="text-white/70 text-sm">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-moroccan-cream relative">
        {/* Zellige Border */}
        <div className="absolute top-0 left-0 right-0 h-4 overflow-hidden">
          <div className="w-full h-full" style={{
            backgroundImage: 'url(/zellige-pattern.jpg)',
            backgroundSize: '100px 100%',
            backgroundRepeat: 'repeat-x'
          }} />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-moroccan-green shadow-lg">
                <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover" />
              </div>
            </div>
            <Badge className="bg-moroccan-green text-white mb-4">
              <Star className="w-4 h-4 mr-1" />
              Avis Clients
            </Badge>
            <h2 className="font-display text-5xl sm:text-6xl text-moroccan-brown mb-4">
              Ils Ont Voyagé
            </h2>
            <p className="text-moroccan-brown/70 text-lg max-w-2xl mx-auto">
              Découvrez ce que nos clients disent de leur expérience BledCrate
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((review, idx) => (
              <div 
                key={review.id}
                className={`bg-white rounded-2xl p-6 shadow-moroccan card-hover animate-fade-in border-2 border-transparent hover:border-moroccan-red/20`}
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-moroccan-red rounded-full flex items-center justify-center text-white font-bold text-xl">
                    {review.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-moroccan-brown">{review.name}</h4>
                    <div className="flex gap-1">
                      {[...Array(review.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-moroccan-gold text-moroccan-gold" />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-moroccan-brown/70 italic">"{review.text}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="/mint-tea.jpg" 
            alt="Thé à la Menthe" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-moroccan-red/80" />
        </div>
        
        {/* Zellige Corners */}
        <div className="absolute top-0 left-0 w-24 h-24 opacity-40">
          <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover rounded-br-full" />
        </div>
        <div className="absolute bottom-0 right-0 w-24 h-24 opacity-40">
          <img src="/zellige-pattern.jpg" alt="" className="w-full h-full object-cover rounded-tl-full" />
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <h2 className="font-display text-5xl sm:text-6xl text-white mb-6">
            Prêt à Voyager au Maroc ?
          </h2>
          <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
            Commandez dès maintenant et profitez automatiquement d'une réduction de <span className="font-bold text-moroccan-gold">10%</span> sur votre première commande.
          </p>
          <Button 
            onClick={() => scrollToSection('menu')}
            className="bg-white text-moroccan-red hover:bg-moroccan-cream px-10 py-6 text-lg font-semibold rounded-full btn-liquid"
          >
            Commander Maintenant
            <ShoppingCart className="w-5 h-5 ml-2" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-moroccan-brown text-white py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Zellige Background */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'url(/zellige-pattern.jpg)',
            backgroundSize: '100px 100px',
            backgroundRepeat: 'repeat'
          }} />
        </div>

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
                <li><button onClick={() => scrollToSection('menu')} className="hover:text-moroccan-gold transition-colors">Notre Menu</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-moroccan-gold transition-colors">Comment Ça Marche</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-moroccan-gold transition-colors">Avis Clients</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display text-xl mb-4">Contact</h4>
              <ul className="space-y-3 text-white/70 text-sm">
                <li className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-moroccan-gold" />
                  www.bledcrate.com
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-moroccan-gold" />
                  438-808-412
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
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-moroccan-red transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-moroccan-red transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-moroccan-red transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          
          {/* Zellige Separator */}
          <div className="h-4 overflow-hidden mb-8 opacity-30">
            <div className="w-full h-full" style={{
              backgroundImage: 'url(/zellige-pattern.jpg)',
              backgroundSize: '100px 100%',
              backgroundRepeat: 'repeat-x'
            }} />
          </div>
          
          <div className="text-center text-white/50 text-sm">
            <p>© 2024 BledCrate. Tous droits réservés. | Saveurs Authentiques du Maroc</p>
            <p className="mt-1">région du Grand Montréal, Québec | 438-808-412 | www.bledcrate.com</p>
          </div>
        </div>
      </footer>

      {/* Checkout Dialog */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="bg-moroccan-cream max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-3xl text-moroccan-brown">
              Finaliser la Commande
            </DialogTitle>
            <DialogDescription className="text-moroccan-brown/70">
              Remplissez vos informations pour que nous puissions vous livrer
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {/* Order Summary */}
            <div className="bg-white rounded-xl p-4 space-y-1 text-sm">
              {cart.map(i => (
                <div key={`${i.id}-${i.selectedVariant}`} className="flex justify-between text-moroccan-brown">
                  <span>{i.name}{i.selectedVariant ? ` (${i.selectedVariant})` : ''} ×{i.quantity}</span>
                  <span className="font-semibold">{(i.price * i.quantity).toFixed(2)} $</span>
                </div>
              ))}
              <div className="border-t pt-2 flex justify-between font-bold text-moroccan-red">
                <span>Total</span>
                <span>{cartTotal.toFixed(2)} $</span>
              </div>
            </div>
            {/* Form Fields */}
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
                  placeholder="Ex: 123 Rue Principale, région du Grand Montréal"
                  value={customerInfo.address}
                  onChange={e => setCustomerInfo(p => ({ ...p, address: e.target.value }))}
                  className="w-full border border-moroccan-brown/20 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-moroccan-red bg-white text-moroccan-brown"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-moroccan-brown mb-1 block">Notes (optionnel)</label>
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
              onClick={sendOrder}
              disabled={isSubmitting}
              className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-6 font-semibold text-base"
            >
              {isSubmitting ? 'Envoi en cours...' : `Confirmer la commande — ${cartTotal.toFixed(2)} $`}
            </Button>
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
          <div className="space-y-4 mt-4">
            {selectedItem?.variants?.map((variant) => (
              <button
                key={variant}
                onClick={() => setSelectedVariant(variant)}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  selectedVariant === variant
                    ? 'border-moroccan-red bg-moroccan-red/10'
                    : 'border-moroccan-brown/20 hover:border-moroccan-red/50'
                }`}
              >
                <span className="font-medium text-moroccan-brown">{variant}</span>
              </button>
            ))}
            <Button
              onClick={() => selectedItem && addToCart(selectedItem, selectedVariant)}
              className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-6"
            >
              Ajouter au Panier - {selectedItem?.price.toFixed(2)} $
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Toast Notifications */}
      <Toaster position="top-right" richColors />
    </div>
  );
}

export default App;
