// BledCrate API Worker — Cloudflare Workers + D1 + Stripe
// Environment bindings: DB (D1), STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, AUTH_SECRET, FRONTEND_URL

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', ...CORS } });
}

function err(message, status = 400) {
  return json({ error: message }, status);
}

function corsPreFlight() {
  return new Response(null, { status: 204, headers: CORS });
}

function uuid() {
  return crypto.randomUUID();
}

// ── Auth ──
async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return [...new Uint8Array(sig)].map(b => b.toString(16).padStart(2, '0')).join('');
}

async function createToken(email, secret) {
  const exp = Date.now() + 86400000; // 24h
  const payload = `${email}:${exp}`;
  const sig = await hmacSign(payload, secret);
  return btoa(`${payload}:${sig}`);
}

async function verifyToken(token, secret) {
  try {
    const decoded = atob(token);
    const parts = decoded.split(':');
    if (parts.length !== 3) return null;
    const [email, exp, sig] = parts;
    if (Date.now() > parseInt(exp)) return null;
    const expected = await hmacSign(`${email}:${exp}`, secret);
    if (sig !== expected) return null;
    return email;
  } catch { return null; }
}

async function requireAuth(request, env) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return verifyToken(auth.slice(7), env.AUTH_SECRET);
}

// ── Stripe helpers ──
async function stripePost(path, params, secretKey) {
  const body = new URLSearchParams();
  flattenParams(params, '', body);
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: { 'Authorization': `Basic ${btoa(secretKey + ':')}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });
  return res.json();
}

function flattenParams(obj, prefix, params) {
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}[${key}]` : key;
    if (Array.isArray(val)) {
      val.forEach((item, i) => {
        if (typeof item === 'object' && item !== null) flattenParams(item, `${fullKey}[${i}]`, params);
        else params.append(`${fullKey}[${i}]`, String(item));
      });
    } else if (typeof val === 'object' && val !== null) {
      flattenParams(val, fullKey, params);
    } else if (val !== undefined && val !== null) {
      params.append(fullKey, String(val));
    }
  }
}

async function verifyStripeWebhook(payload, sigHeader, secret) {
  try {
    const elements = sigHeader.split(',').reduce((acc, el) => {
      const [k, v] = el.split('=');
      if (k === 't') acc.timestamp = v;
      if (k === 'v1') acc.signatures.push(v);
      return acc;
    }, { timestamp: '', signatures: [] });
    const signedPayload = `${elements.timestamp}.${payload}`;
    const expected = await hmacSign(signedPayload, secret);
    return elements.signatures.includes(expected);
  } catch { return false; }
}

// ── Route handlers ──

async function handleLogin(request, env) {
  const { email, password } = await request.json();
  if (email !== env.ADMIN_EMAIL || password !== env.ADMIN_PASSWORD) return err('Identifiants invalides', 401);
  const token = await createToken(email, env.AUTH_SECRET);
  return json({ token });
}

// Products
async function handleGetProducts(env) {
  const { results } = await env.DB.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
  return json(results.map(p => ({ ...p, tags: JSON.parse(p.tags || '[]'), variants: JSON.parse(p.variants || '[]'), active: !!p.active })));
}

async function handleCreateProduct(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO products (id, name, description, price, image, category, tags, variants, active) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(id, data.name, data.description || '', data.price, data.image || '', data.category || 'plat', JSON.stringify(data.tags || []), JSON.stringify(data.variants || []), data.active !== false ? 1 : 0).run();
  return json({ id, ...data });
}

async function handleUpdateProduct(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const sets = [];
  const vals = [];
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.description !== undefined) { sets.push('description = ?'); vals.push(data.description); }
  if (data.price !== undefined) { sets.push('price = ?'); vals.push(data.price); }
  if (data.image !== undefined) { sets.push('image = ?'); vals.push(data.image); }
  if (data.category !== undefined) { sets.push('category = ?'); vals.push(data.category); }
  if (data.tags !== undefined) { sets.push('tags = ?'); vals.push(JSON.stringify(data.tags)); }
  if (data.variants !== undefined) { sets.push('variants = ?'); vals.push(JSON.stringify(data.variants)); }
  if (data.active !== undefined) { sets.push('active = ?'); vals.push(data.active ? 1 : 0); }
  sets.push("updated_at = datetime('now')");
  vals.push(id);
  await env.DB.prepare(`UPDATE products SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ id, ...data });
}

async function handleDeleteProduct(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  await env.DB.prepare('DELETE FROM products WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204, headers: CORS });
}

// Orders
async function handleGetOrders(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const { results } = await env.DB.prepare('SELECT * FROM orders ORDER BY created_at DESC').all();
  return json(results.map(o => ({ ...o, items: JSON.parse(o.items || '[]') })));
}

async function handleUpdateOrder(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const { status } = await request.json();
  await env.DB.prepare('UPDATE orders SET status = ? WHERE id = ?').bind(status, id).run();
  return json({ id, status });
}

// Promo Codes
async function handleGetPromoCodes(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const { results } = await env.DB.prepare('SELECT * FROM promo_codes ORDER BY created_at DESC').all();
  return json(results.map(c => ({ ...c, active: !!c.active })));
}

async function handleCreatePromoCode(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const id = uuid();
  await env.DB.prepare(
    'INSERT INTO promo_codes (id, code, discount_percent, max_uses, active, expires_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, data.code.toUpperCase(), data.discount_percent, data.max_uses || null, data.active !== false ? 1 : 0, data.expires_at || null).run();
  return json({ id, ...data, current_uses: 0 });
}

async function handleUpdatePromoCode(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const sets = [];
  const vals = [];
  if (data.code !== undefined) { sets.push('code = ?'); vals.push(data.code.toUpperCase()); }
  if (data.discount_percent !== undefined) { sets.push('discount_percent = ?'); vals.push(data.discount_percent); }
  if (data.max_uses !== undefined) { sets.push('max_uses = ?'); vals.push(data.max_uses); }
  if (data.active !== undefined) { sets.push('active = ?'); vals.push(data.active ? 1 : 0); }
  if (data.expires_at !== undefined) { sets.push('expires_at = ?'); vals.push(data.expires_at); }
  vals.push(id);
  if (sets.length > 0) await env.DB.prepare(`UPDATE promo_codes SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  return json({ id, ...data });
}

async function handleDeletePromoCode(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  await env.DB.prepare('DELETE FROM promo_codes WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204, headers: CORS });
}

// Validate promo (public)
async function handleValidatePromo(request, env) {
  const { code } = await request.json();
  if (!code) return err('Code requis');
  const promo = await env.DB.prepare(
    "SELECT * FROM promo_codes WHERE code = ? AND active = 1 AND (expires_at IS NULL OR expires_at >= date('now')) AND (max_uses IS NULL OR current_uses < max_uses)"
  ).bind(code.toUpperCase()).first();
  if (!promo) return json({ valid: false, discount_percent: 0 });
  return json({ valid: true, discount_percent: promo.discount_percent });
}

// ── Subscription Plans ──
async function handleGetSubscriptionPlans(env) {
  const { results } = await env.DB.prepare('SELECT * FROM subscription_plans WHERE active = 1 ORDER BY plan_type, sort_order, meals_per_week').all();
  return json(results.map(p => ({ ...p, active: !!p.active, is_popular: !!p.is_popular })));
}

async function handleGetAllSubscriptionPlans(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const { results } = await env.DB.prepare('SELECT * FROM subscription_plans ORDER BY plan_type, sort_order, meals_per_week').all();
  return json(results.map(p => ({ ...p, active: !!p.active, is_popular: !!p.is_popular })));
}

async function handleCreateSubscriptionPlan(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const id = uuid();
  const mealsPerWeek = parseInt(data.meals_per_week) || 3;
  const pricePerMeal = parseFloat(data.price_per_meal) || 12;
  const monthlyPrice = parseFloat(data.monthly_price) || (pricePerMeal * mealsPerWeek * 4);

  // Create Stripe Product + Price for recurring billing
  let stripePriceId = null;
  try {
    const product = await stripePost('/products', {
      name: `BledCrate - ${data.name || data.plan_type} (${mealsPerWeek} repas/sem)`,
      metadata: { plan_id: id },
    }, env.STRIPE_SECRET_KEY);

    const price = await stripePost('/prices', {
      product: product.id,
      unit_amount: Math.round(monthlyPrice * 100),
      currency: 'cad',
      recurring: { interval: 'month' },
    }, env.STRIPE_SECRET_KEY);

    stripePriceId = price.id;
  } catch (e) {
    console.error('Stripe price creation failed:', e);
  }

  await env.DB.prepare(
    'INSERT INTO subscription_plans (id, plan_type, name, meals_per_week, price_per_meal, monthly_price, discount_percent, is_popular, stripe_price_id, active, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
  ).bind(
    id, data.plan_type || 'moi', data.name || '', mealsPerWeek, pricePerMeal, monthlyPrice,
    parseFloat(data.discount_percent) || 0, data.is_popular ? 1 : 0,
    stripePriceId, data.active !== false ? 1 : 0, parseInt(data.sort_order) || 0
  ).run();

  return json({ id, stripe_price_id: stripePriceId, ...data });
}

async function handleUpdateSubscriptionPlan(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const sets = [];
  const vals = [];

  if (data.plan_type !== undefined) { sets.push('plan_type = ?'); vals.push(data.plan_type); }
  if (data.name !== undefined) { sets.push('name = ?'); vals.push(data.name); }
  if (data.meals_per_week !== undefined) { sets.push('meals_per_week = ?'); vals.push(parseInt(data.meals_per_week)); }
  if (data.price_per_meal !== undefined) { sets.push('price_per_meal = ?'); vals.push(parseFloat(data.price_per_meal)); }
  if (data.monthly_price !== undefined) { sets.push('monthly_price = ?'); vals.push(parseFloat(data.monthly_price)); }
  if (data.discount_percent !== undefined) { sets.push('discount_percent = ?'); vals.push(parseFloat(data.discount_percent)); }
  if (data.is_popular !== undefined) { sets.push('is_popular = ?'); vals.push(data.is_popular ? 1 : 0); }
  if (data.active !== undefined) { sets.push('active = ?'); vals.push(data.active ? 1 : 0); }
  if (data.sort_order !== undefined) { sets.push('sort_order = ?'); vals.push(parseInt(data.sort_order)); }

  // If price changed, create new Stripe Price (can't update existing)
  if (data.monthly_price !== undefined) {
    try {
      const plan = await env.DB.prepare('SELECT * FROM subscription_plans WHERE id = ?').bind(id).first();
      if (plan) {
        const product = await stripePost('/products', {
          name: `BledCrate - ${data.name || plan.name} (${data.meals_per_week || plan.meals_per_week} repas/sem)`,
          metadata: { plan_id: id },
        }, env.STRIPE_SECRET_KEY);
        const price = await stripePost('/prices', {
          product: product.id,
          unit_amount: Math.round(parseFloat(data.monthly_price) * 100),
          currency: 'cad',
          recurring: { interval: 'month' },
        }, env.STRIPE_SECRET_KEY);
        sets.push('stripe_price_id = ?');
        vals.push(price.id);
      }
    } catch (e) { console.error('Stripe price update failed:', e); }
  }

  sets.push("updated_at = datetime('now')");
  vals.push(id);
  if (sets.length > 1) {
    await env.DB.prepare(`UPDATE subscription_plans SET ${sets.join(', ')} WHERE id = ?`).bind(...vals).run();
  }
  return json({ id, ...data });
}

async function handleDeleteSubscriptionPlan(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  await env.DB.prepare('DELETE FROM subscription_plans WHERE id = ?').bind(id).run();
  return new Response(null, { status: 204, headers: CORS });
}

// ── Subscribe (create Stripe Checkout in subscription mode) ──
async function handleSubscribe(request, env) {
  const { plan_id, customer } = await request.json();
  if (!plan_id || !customer || !customer.email || !customer.name) return err('Données manquantes');

  const plan = await env.DB.prepare('SELECT * FROM subscription_plans WHERE id = ? AND active = 1').bind(plan_id).first();
  if (!plan) return err('Plan non trouvé', 404);
  if (!plan.stripe_price_id) return err('Plan non configuré pour le paiement', 400);

  const sessionParams = {
    mode: 'subscription',
    line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
    success_url: `${env.FRONTEND_URL}/abonnement/merci?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${env.FRONTEND_URL}/abonnement`,
    customer_email: customer.email,
    metadata: {
      plan_id: plan.id,
      customer_name: customer.name,
      customer_phone: customer.phone || '',
      customer_address: customer.address || '',
    },
    subscription_data: {
      metadata: {
        plan_id: plan.id,
        customer_name: customer.name,
        customer_phone: customer.phone || '',
        customer_address: customer.address || '',
      },
    },
  };

  const session = await stripePost('/checkout/sessions', sessionParams, env.STRIPE_SECRET_KEY);
  if (session.error) return err(session.error.message || 'Erreur Stripe', 500);

  return json({ url: session.url });
}

// ── Subscriptions Management ──
async function handleGetSubscriptions(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const { results } = await env.DB.prepare(
    'SELECT s.*, sp.name as plan_name, sp.plan_type, sp.meals_per_week, sp.monthly_price FROM subscriptions s LEFT JOIN subscription_plans sp ON s.plan_id = sp.id ORDER BY s.created_at DESC'
  ).all();
  return json(results);
}

async function handleCancelSubscription(request, env, id) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);

  const sub = await env.DB.prepare('SELECT * FROM subscriptions WHERE id = ?').bind(id).first();
  if (!sub) return err('Abonnement non trouvé', 404);

  // Cancel on Stripe
  try {
    await stripePost(`/subscriptions/${sub.stripe_subscription_id}`, { cancel_at_period_end: true }, env.STRIPE_SECRET_KEY);
  } catch (e) { console.error('Stripe cancel failed:', e); }

  await env.DB.prepare("UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now') WHERE id = ?").bind(id).run();
  return json({ id, status: 'cancelled' });
}

// Settings
async function handleGetPublicSettings(env) {
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of results) settings[row.key] = row.value;
  return json(settings);
}

async function handleGetSettings(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const { results } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of results) settings[row.key] = row.value;
  return json(settings);
}

async function handleUpdateSettings(request, env) {
  const user = await requireAuth(request, env);
  if (!user) return err('Non autorisé', 401);
  const data = await request.json();
  const allowed = ['bundle_enabled', 'bundle_min_items', 'bundle_discount_percent', 'delivery_fee', 'free_delivery_threshold', 'delivery_banner_enabled', 'subscription_enabled', 'subscription_free_delivery'];
  for (const [key, value] of Object.entries(data)) {
    if (!allowed.includes(key)) continue;
    await env.DB.prepare(
      "INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now')) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at"
    ).bind(key, String(value)).run();
  }
  return handleGetSettings(request, env);
}

// Stripe Checkout
async function handleCheckout(request, env) {
  const { items, customer, promo_code, bundle_discount, delivery_fee: clientDeliveryFee } = await request.json();
  if (!items || !items.length || !customer) return err('Données manquantes');

  // Load settings for server-side validation
  const { results: settingsRows } = await env.DB.prepare('SELECT key, value FROM settings').all();
  const settings = {};
  for (const row of settingsRows) settings[row.key] = row.value;

  let discountPercent = 0;
  let promoId = null;
  if (promo_code) {
    const promo = await env.DB.prepare(
      "SELECT * FROM promo_codes WHERE code = ? AND active = 1 AND (expires_at IS NULL OR expires_at >= date('now')) AND (max_uses IS NULL OR current_uses < max_uses)"
    ).bind(promo_code.toUpperCase()).first();
    if (promo) { discountPercent = promo.discount_percent; promoId = promo.id; }
  }

  // Validate bundle discount server-side
  let bundleDiscountPercent = 0;
  if (bundle_discount && settings.bundle_enabled === 'true') {
    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const minItems = parseInt(settings.bundle_min_items || '3');
    if (totalItems >= minItems) {
      bundleDiscountPercent = parseInt(settings.bundle_discount_percent || '10');
    }
  }

  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  const bundleDiscount = subtotal * bundleDiscountPercent / 100;
  const afterBundle = subtotal - bundleDiscount;
  const promoDiscount = afterBundle * discountPercent / 100;
  const afterDiscounts = afterBundle - promoDiscount;

  // Calculate delivery fee server-side
  const freeThreshold = parseFloat(settings.free_delivery_threshold || '75');
  const baseFee = parseFloat(settings.delivery_fee || '5');
  const deliveryFee = afterDiscounts >= freeThreshold ? 0 : baseFee;

  // Build Stripe line items
  const line_items = items.map(item => ({
    price_data: {
      currency: 'cad',
      product_data: { name: item.variant ? `${item.name} (${item.variant})` : item.name },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity,
  }));

  // Add delivery fee as a line item if applicable
  if (deliveryFee > 0) {
    line_items.push({
      price_data: {
        currency: 'cad',
        product_data: { name: 'Frais de livraison' },
        unit_amount: Math.round(deliveryFee * 100),
      },
      quantity: 1,
    });
  }

  // Add discount as a coupon if applicable
  const totalDiscountPercent = bundleDiscountPercent + discountPercent - (bundleDiscountPercent * discountPercent / 100);
  const sessionParams = {
    mode: 'payment',
    line_items,
    success_url: `${env.FRONTEND_URL}/merci`,
    cancel_url: env.FRONTEND_URL,
    customer_email: customer.email,
    metadata: {
      customer_name: customer.name,
      customer_phone: customer.phone,
      customer_address: customer.address,
      customer_notes: customer.notes || '',
      items_json: JSON.stringify(items),
      promo_code: promo_code || '',
      discount_percent: String(discountPercent),
      bundle_discount_percent: String(bundleDiscountPercent),
      subtotal: String(subtotal),
      delivery_fee: String(deliveryFee),
    },
  };

  // If there's any discount, create a Stripe coupon
  const combinedDiscountAmount = bundleDiscount + promoDiscount;
  if (combinedDiscountAmount > 0) {
    const coupon = await stripePost('/coupons', {
      amount_off: Math.round(combinedDiscountAmount * 100),
      currency: 'cad',
      duration: 'once',
      name: [
        bundleDiscountPercent > 0 ? `Bundle -${bundleDiscountPercent}%` : '',
        discountPercent > 0 ? `Promo ${promo_code} -${discountPercent}%` : '',
      ].filter(Boolean).join(' + '),
    }, env.STRIPE_SECRET_KEY);
    if (coupon.id) {
      sessionParams.discounts = [{ coupon: coupon.id }];
    }
  }

  const session = await stripePost('/checkout/sessions', sessionParams, env.STRIPE_SECRET_KEY);
  if (session.error) return err(session.error.message || 'Erreur Stripe', 500);

  return json({ url: session.url });
}

// Stripe Webhook
async function handleWebhook(request, env) {
  const payload = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (env.STRIPE_WEBHOOK_SECRET && sig) {
    const valid = await verifyStripeWebhook(payload, sig, env.STRIPE_WEBHOOK_SECRET);
    if (!valid) return err('Signature invalide', 400);
  }

  const event = JSON.parse(payload);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const meta = session.metadata || {};

    if (session.mode === 'subscription') {
      // ── Subscription checkout completed ──
      const subId = uuid();
      const stripeSubId = session.subscription;
      const stripeCustomerId = session.customer;

      await env.DB.prepare(
        'INSERT INTO subscriptions (id, stripe_subscription_id, stripe_customer_id, plan_id, customer_name, customer_email, customer_phone, customer_address, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        subId, stripeSubId || '', stripeCustomerId || '',
        meta.plan_id || '', meta.customer_name || '', session.customer_email || '',
        meta.customer_phone || '', meta.customer_address || '', 'active'
      ).run();
    } else {
      // ── Regular payment checkout ──
      const items = JSON.parse(meta.items_json || '[]');
      const subtotal = parseFloat(meta.subtotal || '0');
      const discountPercent = parseInt(meta.discount_percent || '0');
      const discount = subtotal * discountPercent / 100;
      const total = (session.amount_total || 0) / 100;
      const id = uuid();

      await env.DB.prepare(
        'INSERT INTO orders (id, stripe_session_id, stripe_payment_intent, customer_name, customer_email, customer_phone, customer_address, customer_notes, items, subtotal, discount, total, promo_code, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(
        id, session.id, session.payment_intent || '',
        meta.customer_name || '', session.customer_email || '',
        meta.customer_phone || '', meta.customer_address || '', meta.customer_notes || '',
        meta.items_json || '[]', subtotal, discount, total,
        meta.promo_code || null, 'paid'
      ).run();

      if (meta.promo_code) {
        await env.DB.prepare('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = ?').bind(meta.promo_code.toUpperCase()).run();
      }
    }
  }

  // Handle subscription lifecycle events
  if (event.type === 'customer.subscription.updated') {
    const sub = event.data.object;
    const status = sub.cancel_at_period_end ? 'cancelling' : sub.status === 'active' ? 'active' : sub.status === 'past_due' ? 'past_due' : sub.status;
    await env.DB.prepare(
      "UPDATE subscriptions SET status = ?, current_period_start = ?, current_period_end = ?, updated_at = datetime('now') WHERE stripe_subscription_id = ?"
    ).bind(
      status,
      sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      sub.id
    ).run();
  }

  if (event.type === 'customer.subscription.deleted') {
    await env.DB.prepare(
      "UPDATE subscriptions SET status = 'cancelled', updated_at = datetime('now') WHERE stripe_subscription_id = ?"
    ).bind(event.data.object.id).run();
  }

  if (event.type === 'invoice.payment_failed') {
    const invoice = event.data.object;
    if (invoice.subscription) {
      await env.DB.prepare(
        "UPDATE subscriptions SET status = 'past_due', updated_at = datetime('now') WHERE stripe_subscription_id = ?"
      ).bind(invoice.subscription).run();
    }
  }

  return json({ received: true });
}

// ── Router ──
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return corsPreFlight();

    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    try {
      // Auth
      if (path === '/api/auth/login' && method === 'POST') return handleLogin(request, env);

      // Products
      if (path === '/api/products' && method === 'GET') return handleGetProducts(env);
      if (path === '/api/products' && method === 'POST') return handleCreateProduct(request, env);
      if (path.startsWith('/api/products/') && method === 'PUT') return handleUpdateProduct(request, env, path.split('/')[3]);
      if (path.startsWith('/api/products/') && method === 'DELETE') return handleDeleteProduct(request, env, path.split('/')[3]);

      // Orders
      if (path === '/api/orders' && method === 'GET') return handleGetOrders(request, env);
      if (path.startsWith('/api/orders/') && method === 'PATCH') return handleUpdateOrder(request, env, path.split('/')[3]);

      // Promo Codes
      if (path === '/api/promo-codes' && method === 'GET') return handleGetPromoCodes(request, env);
      if (path === '/api/promo-codes' && method === 'POST') return handleCreatePromoCode(request, env);
      if (path === '/api/promo-codes/validate' && method === 'POST') return handleValidatePromo(request, env);
      if (path.startsWith('/api/promo-codes/') && method === 'PUT') return handleUpdatePromoCode(request, env, path.split('/')[3]);
      if (path.startsWith('/api/promo-codes/') && method === 'DELETE') return handleDeletePromoCode(request, env, path.split('/')[3]);

      // Subscription Plans
      if (path === '/api/subscription-plans' && method === 'GET') return handleGetSubscriptionPlans(env);
      if (path === '/api/subscription-plans/admin' && method === 'GET') return handleGetAllSubscriptionPlans(request, env);
      if (path === '/api/subscription-plans' && method === 'POST') return handleCreateSubscriptionPlan(request, env);
      if (path.startsWith('/api/subscription-plans/') && method === 'PUT') return handleUpdateSubscriptionPlan(request, env, path.split('/')[3]);
      if (path.startsWith('/api/subscription-plans/') && method === 'DELETE') return handleDeleteSubscriptionPlan(request, env, path.split('/')[3]);

      // Subscribe
      if (path === '/api/subscribe' && method === 'POST') return handleSubscribe(request, env);

      // Subscriptions Management
      if (path === '/api/subscriptions' && method === 'GET') return handleGetSubscriptions(request, env);
      if (path.startsWith('/api/subscriptions/') && path.endsWith('/cancel') && method === 'POST') {
        const subId = path.split('/')[3];
        return handleCancelSubscription(request, env, subId);
      }

      // Settings
      if (path === '/api/settings' && method === 'GET') return handleGetPublicSettings(env);
      if (path === '/api/settings/admin' && method === 'GET') return handleGetSettings(request, env);
      if (path === '/api/settings' && method === 'PUT') return handleUpdateSettings(request, env);

      // Checkout
      if (path === '/api/checkout' && method === 'POST') return handleCheckout(request, env);

      // Webhook
      if (path === '/api/webhook/stripe' && method === 'POST') return handleWebhook(request, env);

      return err('Not found', 404);
    } catch (e) {
      console.error(e);
      return err('Internal server error', 500);
    }
  },
};
