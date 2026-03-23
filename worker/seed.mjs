#!/usr/bin/env node
// Seed script: deletes all existing products, then creates all 35 from menu data.
// Usage: node seed.mjs <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>
// Example: node seed.mjs https://your-worker.workers.dev contact@bledcrate.ca "20260xP4CM4Nl0v30xTh0rf1nn@@"

const API_URL = process.argv[2];
const EMAIL = process.argv[3];
const PASSWORD = process.argv[4];

if (!API_URL || !EMAIL || !PASSWORD) {
  console.error('Usage: node seed.mjs <API_URL> <ADMIN_EMAIL> <ADMIN_PASSWORD>');
  process.exit(1);
}

const products = [
  { name: "Salade Marocaine", description: "Tomates, concombres, oignons frais, persil, huile d'olive et citron", price: 6.50, image: "/salade-marocaine.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "Salade de Khizo Mchermel", description: "Carottes râpées marinées à la marocaine avec cumin et ail", price: 5.50, image: "/khizo.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "Briouates au Fromage", description: "Triangles croustillants au fromage frais et herbes", price: 7.00, image: "/briouates-triangle.jpg", category: "entree", tags: ["Végétarien"], variants: [{name:"Fromage",price:0},{name:"Kefta",price:1.5},{name:"Poulet",price:1},{name:"Épinards",price:0}] },
  { name: "Cigares au Fromage", description: "Rouleaux croustillants farcis au fromage", price: 7.00, image: "/cigares.jpg", category: "entree", tags: [], variants: [{name:"Fromage",price:0},{name:"Kefta",price:1.5},{name:"Poulet",price:1},{name:"Épinards",price:0}] },
  { name: "Soupe Harira", description: "Soupe traditionnelle marocaine aux légumes, vermicelles et épices", price: 5.50, image: "/harira.jpg", category: "entree", tags: [], variants: [] },
  { name: "Soupe Belboula", description: "Soupe d'orge aux légumes et épices", price: 5.00, image: "/belboula.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "Soupe Chorba", description: "Soupe aux viandes hachées et vermicelles", price: 5.50, image: "/chorba.jpg", category: "entree", tags: [], variants: [] },
  { name: "Bissara", description: "Purée de fèves aux épices et huile d'olive", price: 4.50, image: "/bissara.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "L'3des", description: "Soupe traditionnelle aux lentilles", price: 5.00, image: "/loubia.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "Loubia", description: "Haricots blancs mijotés à la tomate et épices", price: 5.50, image: "/bissara.jpg", category: "entree", tags: [], variants: [] },
  { name: "Zaalouk", description: "Caviar d'aubergines fumées aux tomates et épices", price: 5.00, image: "/zaalouk.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "Msemen", description: "Crêpes feuilletées marocaines", price: 3.50, image: "/msemen.jpg", category: "entree", tags: [], variants: [] },
  { name: "Mlwi", description: "Pain marocain traditionnel", price: 3.00, image: "/mlwi.jpg", category: "entree", tags: [], variants: [] },
  { name: "Baghrir", description: "Crêpes mille trous servies avec miel et beurre", price: 4.00, image: "/baghrir.jpg", category: "entree", tags: ["Végétarien"], variants: [] },
  { name: "Harcha", description: "Galette de semoule dorée et croustillante", price: 3.50, image: "/harcha.jpg", category: "entree", tags: [], variants: [{name:"Nature",price:0},{name:"Fromage",price:1},{name:"Olives",price:0.5},{name:"Zaatar",price:0.5}] },
  { name: "Msemen M'3mar", description: "Msemen farci à la viande hachée", price: 6.00, image: "/msemen-stuffed.jpg", category: "entree", tags: [], variants: [] },
  { name: "Couscous", description: "Semoule vapeur avec légumes de saison et viande au choix", price: 16.00, image: "/couscous-royal.jpg", category: "plat", tags: [], variants: [{name:"Agneau",price:0},{name:"Veau",price:0},{name:"Poulet",price:-2},{name:"Végétarien",price:-3},{name:"Royal",price:5}] },
  { name: "Poulet au Deghmira", description: "Poulet mijoté dans une sauce onctueuse aux olives et frites", price: 15.50, image: "/poulet-deghmira.jpg", category: "plat", tags: [], variants: [] },
  { name: "Agneau aux Abricots", description: "Tendre agneau aux abricots secs et amandes", price: 18.00, image: "/agneau-abricots.jpg", category: "plat", tags: [], variants: [] },
  { name: "Veau aux Pruneaux", description: "Veau fondant aux pruneaux et amandes grillées", price: 17.50, image: "/veau-pruneaux.jpg", category: "plat", tags: [], variants: [] },
  { name: "Poulet aux Légumes", description: "Poulet mijoté avec légumes de saison", price: 14.50, image: "/poulet-legumes.jpg", category: "plat", tags: [], variants: [{name:"Poulet",price:0},{name:"Veau",price:2},{name:"Agneau",price:3}] },
  { name: "Tajine au Poisson", description: "Poisson frais aux légumes et citron confit", price: 16.50, image: "/tagine-poisson.jpg", category: "plat", tags: [], variants: [] },
  { name: "Tajine Kefta et Oeufs", description: "Boulettes de viande hachée aux épices et oeufs", price: 15.00, image: "/tagine-kefta.jpg", category: "plat", tags: [], variants: [] },
  { name: "Rfissa", description: "Msemen émietté avec poulet, lentilles et fenugrec", price: 17.00, image: "/rfissa.jpg", category: "plat", tags: [], variants: [] },
  { name: "Bastilla au Poulet", description: "Feuilleté sucré-salé au poulet, amandes et cannelle", price: 19.00, image: "/bastilla-poulet.jpg", category: "plat", tags: [], variants: [] },
  { name: "Bastilla au Poisson", description: "Feuilleté croustillant au poisson et vermicelles", price: 18.50, image: "/bastilla-poisson.jpg", category: "plat", tags: [], variants: [] },
  { name: "Tanjia", description: "Agneau mijoté lentement aux épices et citron confit", price: 18.50, image: "/tanjia.jpg", category: "plat", tags: [], variants: [] },
  { name: "Mrouzia", description: "Agneau aux raisins secs, amandes et miel", price: 19.00, image: "/mrouzia.jpg", category: "plat", tags: [], variants: [] },
  { name: "Hergma", description: "Pieds de veau aux pois chiches et raisins secs", price: 16.00, image: "/hergma.jpg", category: "plat", tags: [], variants: [] },
  { name: "Seffa", description: "Vermicelles vapeur sucrés avec poulet et cannelle", price: 15.00, image: "/seffa.jpg", category: "plat", tags: [], variants: [] },
  { name: "Tajine aux Légumes", description: "Légumes de saison mijotés aux épices", price: 13.50, image: "/tagine-legumes.jpg", category: "plat", tags: ["Végétarien"], variants: [] },
  { name: "Kika", description: "Gâteau marocain traditionnel moelleux", price: 4.50, image: "/kaab-ghorib.jpg", category: "dessert", tags: [], variants: [] },
  { name: "Assortiment de Gâteaux Marocains", description: "Sélection de cornes de gazelle, ghriba et chebakia", price: 6.50, image: "/desserts.jpg", category: "dessert", tags: [], variants: [] },
  { name: "Flan Crème Caramel", description: "Flan onctueux au caramel maison", price: 4.00, image: "/flan.jpg", category: "dessert", tags: ["Végétarien"], variants: [] },
  { name: "Salade de Fruits", description: "Fruits frais de saison parfumés à l'eau de fleur d'oranger", price: 5.00, image: "/salade-fruits.jpg", category: "dessert", tags: ["Végétarien", "Santé"], variants: [] },
];

async function main() {
  // 1. Login
  console.log('Logging in...');
  const loginRes = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const { token } = await loginRes.json();
  if (!token) { console.error('Login failed'); process.exit(1); }
  console.log('Logged in.');

  const headers = { 'Content-Type': 'application/json; charset=utf-8', Authorization: `Bearer ${token}` };

  // 2. Delete all existing products
  console.log('Fetching existing products...');
  const existingRes = await fetch(`${API_URL}/api/products`);
  const existing = await existingRes.json();
  console.log(`Found ${existing.length} existing products. Deleting...`);
  for (const p of existing) {
    await fetch(`${API_URL}/api/products/${p.id}`, { method: 'DELETE', headers });
    console.log(`  Deleted: ${p.name}`);
  }

  // 3. Create all products
  console.log('Creating products...');
  for (const p of products) {
    const res = await fetch(`${API_URL}/api/products`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ ...p, active: true }),
    });
    const data = await res.json();
    if (data.error) console.error(`  ERROR creating ${p.name}: ${data.error}`);
    else console.log(`  Created: ${p.name} (${p.variants.length} variants)`);
  }

  console.log(`\nDone! ${products.length} products seeded.`);
}

main().catch(e => { console.error(e); process.exit(1); });
