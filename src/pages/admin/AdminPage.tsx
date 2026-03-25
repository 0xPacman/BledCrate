import { useState, useEffect, useCallback } from 'react';
import {
  Package, ClipboardList, Tag, LogOut, Plus, Pencil, Trash2,
  Eye, Search, Loader2, ImageIcon, DollarSign, Users, Settings, Truck, PackageOpen, Save,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast, Toaster } from 'sonner';
import * as api from '@/lib/api';
import type { Product, ProductVariant, Order, PromoCode } from '@/lib/api';

type Tab = 'products' | 'orders' | 'promos' | 'settings';
type ProductForm = {
  name: string; description: string; price: string; image: string;
  category: 'entree' | 'plat' | 'dessert'; tags: string; variants: ProductVariant[]; active: boolean;
};
type PromoForm = {
  code: string; discount_percent: string; max_uses: string; active: boolean; expires_at: string;
};

const emptyProduct: ProductForm = { name: '', description: '', price: '', image: '', category: 'plat', tags: '', variants: [], active: true };
const emptyPromo: PromoForm = { code: '', discount_percent: '', max_uses: '', active: true, expires_at: '' };

function productToForm(p: Product): ProductForm {
  return {
    name: p.name, description: p.description, price: String(p.price), image: p.image,
    category: p.category, tags: (p.tags || []).join(', '), variants: p.variants || [], active: p.active,
  };
}

function promoToForm(p: PromoCode): PromoForm {
  return {
    code: p.code, discount_percent: String(p.discount_percent),
    max_uses: p.max_uses !== null ? String(p.max_uses) : '', active: p.active,
    expires_at: p.expires_at ? p.expires_at.slice(0, 10) : '',
  };
}

// ── Login Screen ──
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await api.login(email, password);
      onLogin();
    } catch (err: any) {
      setError(err.message || 'Identifiants invalides');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-moroccan-brown flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="BledCrate" className="w-16 h-16 rounded-full mx-auto mb-3 border-2 border-moroccan-gold" />
          <h1 className="font-display text-4xl text-moroccan-brown">BledCrate</h1>
          <p className="text-moroccan-brown/50 text-sm mt-1">Administration</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-moroccan-brown block mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
          </div>
          <div>
            <label className="text-sm font-medium text-moroccan-brown block mb-1">Mot de passe</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full bg-moroccan-red hover:bg-moroccan-red-dark text-white py-5">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Connexion'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Input helpers ──
function Input({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <input {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
    </div>
  );
}

function TextArea({ label, ...props }: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <textarea {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red resize-none" />
    </div>
  );
}

function Select({ label, options, ...props }: { label: string; options: { value: string; label: string }[] } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-1">{label}</label>
      <select {...props} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red bg-white">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// ── Products Panel ──
function ProductsPanel() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(emptyProduct);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setProducts(await api.fetchProducts()); }
    catch { toast.error('Impossible de charger les produits'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => { setEditingId(null); setForm(emptyProduct); setDialogOpen(true); };
  const openEdit = (p: Product) => { setEditingId(p.id); setForm(productToForm(p)); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      name: form.name, description: form.description, price: parseFloat(form.price) || 0,
      image: form.image, category: form.category, active: form.active,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      variants: form.variants,
    };
    try {
      if (editingId) { await api.updateProduct(editingId, data); toast.success('Produit mis à jour'); }
      else { await api.createProduct(data as any); toast.success('Produit ajouté'); }
      setDialogOpen(false);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ?')) return;
    try { await api.deleteProduct(id); toast.success('Produit supprimé'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const set = (key: keyof ProductForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-moroccan-red" /></div>;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Produits</h2>
          <p className="text-gray-500 text-sm">{products.length} produits</p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
          </div>
          <Button onClick={openAdd} className="bg-moroccan-red hover:bg-moroccan-red-dark text-white shrink-0">
            <Plus className="w-4 h-4 mr-1" /> Ajouter
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produit</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Catégorie</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Tags</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(p => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900">{p.name}</p>
                      <p className="text-gray-500 text-xs line-clamp-1">{p.description}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold text-moroccan-red">{p.price.toFixed(2)} $</td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Badge variant="outline" className="capitalize">{p.category === 'entree' ? 'Entrée' : p.category === 'plat' ? 'Plat' : 'Dessert'}</Badge>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  <div className="flex gap-1 flex-wrap">{(p.tags || []).map(t => <Badge key={t} className="bg-gray-100 text-gray-600 text-xs">{t}</Badge>)}</div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={p.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}>{p.active ? 'Actif' : 'Inactif'}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Aucun produit trouvé</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">{editingId ? 'Modifier le Produit' : 'Nouveau Produit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input label="Nom *" value={form.name} onChange={e => set('name', e.target.value)} required />
            <TextArea label="Description" value={form.description} onChange={e => set('description', e.target.value)} rows={2} />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Prix ($) *" type="number" step="0.01" min="0" value={form.price} onChange={e => set('price', e.target.value)} />
              <Select label="Catégorie *" value={form.category} onChange={e => set('category', e.target.value)} options={[
                { value: 'entree', label: 'Entrée' }, { value: 'plat', label: 'Plat' }, { value: 'dessert', label: 'Dessert' },
              ]} />
            </div>
            <Input label="Image (URL)" value={form.image} onChange={e => set('image', e.target.value)} placeholder="/image.jpg ou https://..." />
            {form.image && <img src={form.image} alt="Preview" className="h-24 w-auto rounded-lg object-cover" />}
            <Input label="Tags (séparés par virgule)" value={form.tags} onChange={e => set('tags', e.target.value)} placeholder="Populaire, Nouveau, Épicé" />
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Variantes</label>
              {form.variants.map((v, i) => (
                <div key={i} className="flex items-center gap-2 mb-2">
                  <input value={v.name} onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], name: e.target.value }; set('variants', vs); }}
                    placeholder="Nom (ex: Agneau)" className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
                  <input type="number" step="0.01" value={v.price} onChange={e => { const vs = [...form.variants]; vs[i] = { ...vs[i], price: parseFloat(e.target.value) || 0 }; set('variants', vs); }}
                    placeholder="+/- $" className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
                  <button type="button" onClick={() => { const vs = form.variants.filter((_, j) => j !== i); set('variants', vs); }}
                    className="p-1.5 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
              <button type="button" onClick={() => set('variants', [...form.variants, { name: '', price: 0 }])}
                className="text-sm text-moroccan-red hover:underline flex items-center gap-1 mt-1"><Plus className="w-3 h-3" /> Ajouter une variante</button>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-moroccan-red" />
              <span className="text-sm font-medium text-gray-700">Actif (visible sur le site)</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !form.name || !form.price} className="bg-moroccan-red hover:bg-moroccan-red-dark text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Mettre à jour' : 'Ajouter'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Orders Panel ──
function OrdersPanel() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [detailOrder, setDetailOrder] = useState<Order | null>(null);

  const load = useCallback(async () => {
    try { setOrders(await api.fetchOrders()); }
    catch { toast.error('Impossible de charger les commandes'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter(o => {
    const matchSearch = o.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_email.toLowerCase().includes(search.toLowerCase()) || o.id.includes(search);
    const matchStatus = statusFilter === 'all' || o.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const statusColors: Record<string, string> = {
    paid: 'bg-blue-100 text-blue-700',
    preparing: 'bg-yellow-100 text-yellow-700',
    shipped: 'bg-purple-100 text-purple-700',
    delivered: 'bg-green-100 text-green-700',
    cancelled: 'bg-red-100 text-red-700',
  };

  const statusLabels: Record<string, string> = {
    paid: 'Payé', preparing: 'En préparation', shipped: 'Expédié', delivered: 'Livré', cancelled: 'Annulé',
  };

  const handleStatusChange = async (orderId: string, status: string) => {
    try {
      await api.updateOrderStatus(orderId, status);
      toast.success('Statut mis à jour');
      load();
    } catch (err: any) { toast.error(err.message); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-moroccan-red" /></div>;

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center"><ClipboardList className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-sm text-gray-500">Total Commandes</p><p className="text-2xl font-bold">{orders.length}</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><DollarSign className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-sm text-gray-500">Revenus</p><p className="text-2xl font-bold">{totalRevenue.toFixed(2)} $</p></div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center"><Users className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-sm text-gray-500">En cours</p><p className="text-2xl font-bold">{orders.filter(o => ['paid', 'preparing', 'shipped'].includes(o.status)).length}</p></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Commandes</h2>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm w-full sm:w-56 focus:outline-none focus:ring-2 focus:ring-moroccan-red" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-moroccan-red">
            <option value="all">Tous</option>
            <option value="paid">Payé</option>
            <option value="preparing">En préparation</option>
            <option value="shipped">Expédié</option>
            <option value="delivered">Livré</option>
            <option value="cancelled">Annulé</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Commande</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Articles</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-mono text-xs text-gray-500">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-CA')}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{o.customer_name}</p>
                  <p className="text-xs text-gray-500">{o.customer_email}</p>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <p className="text-gray-600">{o.items.reduce((s, i) => s + i.quantity, 0)} articles</p>
                </td>
                <td className="px-4 py-3 font-semibold text-moroccan-red">
                  {o.total.toFixed(2)} $
                  {o.discount > 0 && <span className="text-xs text-green-600 block">-{o.discount.toFixed(2)} $</span>}
                </td>
                <td className="px-4 py-3">
                  <select value={o.status} onChange={e => handleStatusChange(o.id, e.target.value)}
                    className={`text-xs font-medium px-2 py-1 rounded-full border-0 cursor-pointer ${statusColors[o.status] || 'bg-gray-100 text-gray-600'}`}>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setDetailOrder(o)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Eye className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Aucune commande trouvée</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Commande #{detailOrder?.id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {detailOrder && (
            <div className="space-y-4 mt-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-gray-500">Client</p><p className="font-medium">{detailOrder.customer_name}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{detailOrder.customer_email}</p></div>
                <div><p className="text-gray-500">Téléphone</p><p className="font-medium">{detailOrder.customer_phone || '—'}</p></div>
                <div><p className="text-gray-500">Date</p><p className="font-medium">{new Date(detailOrder.created_at).toLocaleString('fr-CA')}</p></div>
              </div>
              <div><p className="text-gray-500">Adresse</p><p className="font-medium">{detailOrder.customer_address}</p></div>
              {detailOrder.customer_notes && <div><p className="text-gray-500">Notes</p><p className="font-medium">{detailOrder.customer_notes}</p></div>}
              <div className="border-t pt-4">
                <p className="font-medium text-gray-900 mb-2">Articles</p>
                <div className="space-y-2">
                  {detailOrder.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.name}{item.variant ? ` (${item.variant})` : ''} x{item.quantity}</span>
                      <span className="font-medium">{(item.price * item.quantity).toFixed(2)} $</span>
                    </div>
                  ))}
                </div>
                <div className="border-t mt-3 pt-3 space-y-1">
                  <div className="flex justify-between"><span>Sous-total</span><span>{detailOrder.subtotal.toFixed(2)} $</span></div>
                  {detailOrder.discount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Réduction{detailOrder.promo_code ? ` (${detailOrder.promo_code})` : ''}</span>
                      <span>-{detailOrder.discount.toFixed(2)} $</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-moroccan-red text-base">
                    <span>Total</span><span>{detailOrder.total.toFixed(2)} $</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Promo Codes Panel ──
function PromoCodesPanel() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PromoForm>(emptyPromo);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setCodes(await api.fetchPromoCodes()); }
    catch { toast.error('Impossible de charger les codes promo'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditingId(null); setForm(emptyPromo); setDialogOpen(true); };
  const openEdit = (c: PromoCode) => { setEditingId(c.id); setForm(promoToForm(c)); setDialogOpen(true); };

  const handleSave = async () => {
    setSaving(true);
    const data = {
      code: form.code.toUpperCase().trim(),
      discount_percent: parseInt(form.discount_percent) || 0,
      max_uses: form.max_uses ? parseInt(form.max_uses) : null,
      active: form.active,
      expires_at: form.expires_at || null,
    };
    try {
      if (editingId) { await api.updatePromoCode(editingId, data); toast.success('Code promo mis à jour'); }
      else { await api.createPromoCode(data); toast.success('Code promo créé'); }
      setDialogOpen(false);
      load();
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce code promo ?')) return;
    try { await api.deletePromoCode(id); toast.success('Code promo supprimé'); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const handleToggle = async (c: PromoCode) => {
    try { await api.updatePromoCode(c.id, { active: !c.active }); load(); }
    catch (err: any) { toast.error(err.message); }
  };

  const set = (key: keyof PromoForm, val: any) => setForm(f => ({ ...f, [key]: val }));

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-moroccan-red" /></div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Codes Promo</h2>
          <p className="text-gray-500 text-sm">{codes.length} codes</p>
        </div>
        <Button onClick={openAdd} className="bg-moroccan-red hover:bg-moroccan-red-dark text-white">
          <Plus className="w-4 h-4 mr-1" /> Nouveau Code
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Réduction</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Utilisations</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Expiration</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {codes.map(c => (
              <tr key={c.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono font-bold text-moroccan-brown">{c.code}</td>
                <td className="px-4 py-3"><Badge className="bg-green-100 text-green-700">{c.discount_percent}%</Badge></td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-600">
                  {c.current_uses}{c.max_uses !== null ? ` / ${c.max_uses}` : ' / ∞'}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-gray-500">
                  {c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-CA') : '—'}
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => handleToggle(c)}>
                    <Badge className={c.active ? 'bg-green-100 text-green-700 cursor-pointer' : 'bg-gray-100 text-gray-500 cursor-pointer'}>
                      {c.active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-1">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-600"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
            {codes.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">Aucun code promo</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier le Code' : 'Nouveau Code Promo'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <Input label="Code *" value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="BIENVENUE10" />
            <div className="grid grid-cols-2 gap-4">
              <Input label="Réduction (%) *" type="number" min="1" max="100" value={form.discount_percent} onChange={e => set('discount_percent', e.target.value)} />
              <Input label="Max utilisations" type="number" min="1" value={form.max_uses} onChange={e => set('max_uses', e.target.value)} placeholder="Illimité" />
            </div>
            <Input label="Date d'expiration" type="date" value={form.expires_at} onChange={e => set('expires_at', e.target.value)} />
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.active} onChange={e => set('active', e.target.checked)} className="w-4 h-4 accent-moroccan-red" />
              <span className="text-sm font-medium text-gray-700">Actif</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button>
              <Button onClick={handleSave} disabled={saving || !form.code || !form.discount_percent} className="bg-moroccan-red hover:bg-moroccan-red-dark text-white">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Settings Panel ──
function SettingsPanel() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    bundle_enabled: true,
    bundle_min_items: '3',
    bundle_discount_percent: '10',
    delivery_fee: '5',
    free_delivery_threshold: '75',
    delivery_banner_enabled: true,
  });

  const load = useCallback(async () => {
    try {
      const s = await api.fetchAdminSettings();
      setForm({
        bundle_enabled: s.bundle_enabled === 'true',
        bundle_min_items: s.bundle_min_items || '3',
        bundle_discount_percent: s.bundle_discount_percent || '10',
        delivery_fee: s.delivery_fee || '5',
        free_delivery_threshold: s.free_delivery_threshold || '75',
        delivery_banner_enabled: s.delivery_banner_enabled === 'true',
      });
    } catch { toast.error('Impossible de charger les paramètres'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateSettings({
        bundle_enabled: String(form.bundle_enabled),
        bundle_min_items: form.bundle_min_items,
        bundle_discount_percent: form.bundle_discount_percent,
        delivery_fee: form.delivery_fee,
        free_delivery_threshold: form.free_delivery_threshold,
        delivery_banner_enabled: String(form.delivery_banner_enabled),
      });
      toast.success('Paramètres sauvegardés');
    } catch (err: any) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-moroccan-red" /></div>;

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Paramètres</h2>
        <p className="text-gray-500 text-sm">Configurez les bundles et la livraison</p>
      </div>

      {/* Bundle Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <PackageOpen className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Bundle / Lot</h3>
            <p className="text-xs text-gray-500">Réduction automatique quand le client commande plusieurs plats</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.bundle_enabled}
              onChange={e => setForm(f => ({ ...f, bundle_enabled: e.target.checked }))}
              className="w-5 h-5 accent-moroccan-red"
            />
            <span className="text-sm font-medium text-gray-700">Activer les bundles</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nombre minimum de plats"
              type="number"
              min="2"
              max="20"
              value={form.bundle_min_items}
              onChange={e => setForm(f => ({ ...f, bundle_min_items: e.target.value }))}
            />
            <Input
              label="Réduction bundle (%)"
              type="number"
              min="1"
              max="50"
              value={form.bundle_discount_percent}
              onChange={e => setForm(f => ({ ...f, bundle_discount_percent: e.target.value }))}
            />
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-sm text-orange-800">
            <strong>Aperçu :</strong> Les clients qui commandent <strong>{form.bundle_min_items}+ plats</strong> recevront <strong>{form.bundle_discount_percent}% de réduction</strong> automatiquement.
          </div>
        </div>
      </div>

      {/* Delivery Settings */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
            <Truck className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">Livraison</h3>
            <p className="text-xs text-gray-500">Frais de livraison et seuil de gratuité</p>
          </div>
        </div>
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.delivery_banner_enabled}
              onChange={e => setForm(f => ({ ...f, delivery_banner_enabled: e.target.checked }))}
              className="w-5 h-5 accent-moroccan-red"
            />
            <span className="text-sm font-medium text-gray-700">Afficher la bannière de livraison sur le site</span>
          </label>
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Frais de livraison ($)"
              type="number"
              min="0"
              step="0.5"
              value={form.delivery_fee}
              onChange={e => setForm(f => ({ ...f, delivery_fee: e.target.value }))}
            />
            <Input
              label="Livraison gratuite à partir de ($)"
              type="number"
              min="0"
              step="5"
              value={form.free_delivery_threshold}
              onChange={e => setForm(f => ({ ...f, free_delivery_threshold: e.target.value }))}
            />
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
            <strong>Aperçu :</strong> Livraison à <strong>{parseFloat(form.delivery_fee).toFixed(2)} $</strong> — <strong>GRATUITE</strong> à partir de <strong>{parseFloat(form.free_delivery_threshold).toFixed(2)} $</strong> d'achat.
          </div>
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving} className="bg-moroccan-red hover:bg-moroccan-red-dark text-white px-8 py-5">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Sauvegarder les paramètres
      </Button>
    </div>
  );
}

// ── Main Admin Page ──
export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(api.isLoggedIn());
  const [activeTab, setActiveTab] = useState<Tab>('orders');

  const handleLogout = () => {
    api.logout();
    setAuthenticated(false);
  };

  if (!authenticated) return <LoginScreen onLogin={() => setAuthenticated(true)} />;

  const tabs: { key: Tab; label: string; icon: typeof Package }[] = [
    { key: 'orders', label: 'Commandes', icon: ClipboardList },
    { key: 'products', label: 'Produits', icon: Package },
    { key: 'promos', label: 'Promos', icon: Tag },
    { key: 'settings', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <header className="bg-moroccan-brown text-white px-4 sm:px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-lg">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="BledCrate" className="w-9 h-9 rounded-full object-cover border-2 border-moroccan-gold" />
          <span className="font-display text-xl font-bold hidden sm:inline">BledCrate Admin</span>
        </div>
        <button onClick={handleLogout} className="flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm">
          <LogOut className="w-4 h-4" /> Déconnexion
        </button>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-16 sm:w-56 bg-white border-r min-h-[calc(100vh-52px)] sticky top-[52px] shrink-0">
          <nav className="p-2 sm:p-4 space-y-1">
            {tabs.map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === t.key ? 'bg-moroccan-red text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}>
                <t.icon className="w-5 h-5 shrink-0" />
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 p-4 sm:p-8 min-w-0">
          {activeTab === 'products' && <ProductsPanel />}
          {activeTab === 'orders' && <OrdersPanel />}
          {activeTab === 'promos' && <PromoCodesPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </main>
      </div>

      <Toaster position="top-right" richColors />
    </div>
  );
}
