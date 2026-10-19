/* ================= ADE'S GADGET — app.js ================= */
'use strict';

/* ---------- Business config ---------- */
const WHATSAPP = '2348167035215';              // digits only, with country code
const PHONE_DISPLAY = '+234 816 703 5215';
const FREE_DELIVERY_MIN = 500000;              // free nationwide delivery above this
const PROMOS = {
  ADE10:    { type: 'pct',   value: 10,  cap: 50000, label: '10% off' },
  TECH5:    { type: 'flat',  value: 5000, min: 200000, label: '₦5,000 off' },
  FREESHIP: { type: 'ship',  value: 0,   label: 'Free delivery' }
};

/* ---------- Fallback SVG phone art (used if a photo fails to load) ---------- */
function phoneArt(c1, c2, label) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 460">
<defs>
<linearGradient id="s" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a4152"/><stop offset="1" stop-color="#14181f"/></linearGradient>
<radialGradient id="g" cx=".28" cy=".18" r="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
<rect x="18" y="8" width="264" height="444" rx="44" fill="url(#b)" stroke="#4a5266" stroke-width="2"/>
<rect x="29" y="19" width="242" height="422" rx="35" fill="url(#s)"/>
<rect x="29" y="19" width="242" height="422" rx="35" fill="url(#g)"/>
<rect x="104" y="33" width="92" height="26" rx="13" fill="#0a0c11"/>
<text x="150" y="236" font-family="Arial,Helvetica,sans-serif" font-size="34" font-weight="800" text-anchor="middle" fill="#ffffff" opacity=".96">${label}</text>
<text x="150" y="266" font-family="Arial,Helvetica,sans-serif" font-size="12" letter-spacing="4" text-anchor="middle" fill="#ffffff" opacity=".62">ADE'S GADGET</text>
<rect x="118" y="418" width="64" height="6" rx="3" fill="#fff" opacity=".45"/>
</svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}
window.imgFallback = function (img) {
  if (img.dataset.fb && img.src !== img.dataset.fb) img.src = img.dataset.fb;
};

/* ---------- Catalogue (prices in ₦, realistic Nigerian retail) ---------- */
const PRODUCTS = [
  { id:'iphone-17-pro-max', name:'iPhone 17 Pro Max', brand:'Apple', chip:'A19 Pro', rating:4.9, reviews:128, isNew:true,
    colors:['Desert Titanium','Silver Titanium','Black Titanium'],
    variants:[{label:'256GB',price:2150000,old:2290000},{label:'512GB',price:2450000},{label:'1TB',price:2780000}],
    specs:{Display:'6.9" Super Retina XDR, 120Hz',Chip:'A19 Pro',Camera:'48MP triple (5x zoom)',Battery:'Up to 33h video',SIM:'Dual eSIM'},
    img:'img/iphone-17-pro-max.jpg', art:phoneArt('#c98a4b','#5a3a24','17 Pro Max') },

  { id:'iphone-16-pro', name:'iPhone 16 Pro', brand:'Apple', chip:'A18 Pro', rating:4.9, reviews:96, hot:true,
    colors:['Desert Titanium','Natural Titanium','White Titanium'],
    variants:[{label:'128GB',price:1750000,old:1890000},{label:'256GB',price:1980000},{label:'512GB',price:2320000}],
    specs:{Display:'6.3" Super Retina XDR, 120Hz',Chip:'A18 Pro',Camera:'48MP fusion + 5x zoom',Battery:'Up to 27h video',SIM:'Dual eSIM'},
    img:'img/iphone-16-pro.jpg', art:phoneArt('#b58a5e','#4a3526','16 Pro') },

  { id:'iphone-15', name:'iPhone 15', brand:'Apple', chip:'A16 Bionic', rating:4.8, reviews:210,
    colors:['Blue','Black','Green','Yellow','Pink'],
    variants:[{label:'128GB',price:980000,old:1050000},{label:'256GB',price:1150000}],
    specs:{Display:'6.1" Super Retina XDR',Chip:'A16 Bionic',Camera:'48MP dual camera',Battery:'Up to 20h video',SIM:'Nano + eSIM'},
    img:'img/iphone-15.jpg', art:phoneArt('#a7c7dc','#4a7691','15') },

  { id:'iphone-14', name:'iPhone 14', brand:'Apple', chip:'A15 Bionic', rating:4.7, reviews:184,
    colors:['Midnight','Starlight','Blue','Purple'],
    variants:[{label:'128GB',price:720000,old:799000},{label:'256GB',price:850000}],
    specs:{Display:'6.1" Super Retina XDR',Chip:'A15 Bionic',Camera:'12MP dual camera',Battery:'Up to 20h video',SIM:'Nano + eSIM'},
    img:'img/iphone-14.jpg', art:phoneArt('#5a6f9e','#2c3a58','14') },

  { id:'galaxy-s25-ultra', name:'Galaxy S25 Ultra', brand:'Samsung', chip:'Snapdragon 8 Elite', rating:4.9, reviews:87, hot:true,
    colors:['Titanium Gray','Titanium Black','Titanium Blue'],
    variants:[{label:'256GB',price:1875000,old:1990000},{label:'512GB',price:2090000},{label:'1TB',price:2380000}],
    specs:{Display:'6.9" QHD+ AMOLED 120Hz',Chip:'Snapdragon 8 Elite',Camera:'200MP + 50MP periscope',Battery:'5,000mAh · 45W',SIM:'Dual SIM'},
    img:'img/galaxy-s25-ultra.jpg', art:phoneArt('#8f9bb3','#3c4557','S25 Ultra') },

  { id:'galaxy-a56', name:'Galaxy A56 5G', brand:'Samsung', chip:'Exynos 1580', rating:4.7, reviews:143, isNew:true,
    colors:['Awesome Graphite','Awesome Olive','Awesome Lavender'],
    variants:[{label:'128GB',price:545000},{label:'256GB',price:620000}],
    specs:{Display:'6.7" Super AMOLED 120Hz',Chip:'Exynos 1580',Camera:'50MP OIS triple',Battery:'5,000mAh · 45W',SIM:'Dual SIM'},
    img:'img/galaxy-a56.jpg', art:phoneArt('#6f7686','#2f3542','A56') },

  { id:'galaxy-a16', name:'Galaxy A16', brand:'Samsung', chip:'Helio G99', rating:4.5, reviews:260,
    colors:['Blue Black','Light Green','Light Gray'],
    variants:[{label:'128GB',price:245000,old:268000}],
    specs:{Display:'6.7" Super AMOLED 90Hz',Chip:'Helio G99',Camera:'50MP triple',Battery:'5,000mAh · 25W',SIM:'Dual SIM'},
    img:'img/galaxy-a16.jpg', art:phoneArt('#3f5878','#1e2a3c','A16') },

  { id:'pixel-9-pro', name:'Google Pixel 9 Pro', brand:'Google', chip:'Tensor G4', rating:4.8, reviews:64,
    colors:['Obsidian','Porcelain','Hazel'],
    variants:[{label:'128GB',price:1380000},{label:'256GB',price:1550000,old:1620000},{label:'512GB',price:1780000}],
    specs:{Display:'6.3" Super Actua 120Hz',Chip:'Tensor G4',Camera:'50MP triple · 42MP selfie',Battery:'4,700mAh · 27W',SIM:'Dual SIM'},
    img:'img/pixel-9-pro.jpg', art:phoneArt('#c9c2b6','#6b665c','Pixel 9 Pro') },

  { id:'xiaomi-14t-pro', name:'Xiaomi 14T Pro', brand:'Xiaomi', chip:'Dimensity 9300+', rating:4.7, reviews:58, hot:true,
    colors:['Titan Gray','Titan Blue','Titan Black'],
    variants:[{label:'256GB',price:845000},{label:'512GB',price:935000,old:999000}],
    specs:{Display:'6.67" AMOLED 144Hz',Chip:'Dimensity 9300+',Camera:'50MP Leica triple',Battery:'5,000mAh · 120W',SIM:'Dual SIM'},
    img:'img/xiaomi-14t-pro.jpg', art:phoneArt('#5c6470','#252a33','14T Pro') },

  { id:'redmi-note-14-pro', name:'Redmi Note 14 Pro', brand:'Xiaomi', chip:'Helio G100', rating:4.6, reviews:312,
    colors:['Midnight Black','Ocean Blue','Lavender Purple'],
    variants:[{label:'128GB',price:352000},{label:'256GB',price:420000,old:455000}],
    specs:{Display:'6.67" AMOLED 120Hz',Chip:'Helio G100',Camera:'200MP OIS main',Battery:'5,110mAh · 45W',SIM:'Dual SIM'},
    img:'img/redmi-note-14-pro.jpg', art:phoneArt('#7a5cb0','#33244d','Note 14 Pro') },

  { id:'tecno-camon-40-pro', name:'Tecno Camon 40 Pro', brand:'Tecno', chip:'Dimensity 7300', rating:4.6, reviews:198,
    colors:['Ink Black','Lake Blue','Snow White'],
    variants:[{label:'256GB',price:395000,old:425000}],
    specs:{Display:'6.78" AMOLED 120Hz',Chip:'Dimensity 7300',Camera:'50MP OIS + 50MP selfie',Battery:'5,200mAh · 45W',SIM:'Dual SIM'},
    img:'img/tecno-camon-40-pro.jpg', art:phoneArt('#2f4f46','#152521','Camon 40') },

  { id:'tecno-spark-30-pro', name:'Tecno Spark 30 Pro', brand:'Tecno', chip:'Helio G100', rating:4.5, reviews:176,
    colors:['Ink Black','Winter Blue','Savage Sea'],
    variants:[{label:'256GB',price:245000,old:265000}],
    specs:{Display:'6.78" LCD 120Hz',Chip:'Helio G100',Camera:'108MP main',Battery:'5,000mAh · 33W',SIM:'Dual SIM'},
    img:'img/tecno-spark-30-pro.jpg', art:phoneArt('#2a3b52','#111a26','Spark 30') },

  { id:'infinix-note-40-pro', name:'Infinix Note 40 Pro', brand:'Infinix', chip:'Helio G99', rating:4.5, reviews:154,
    colors:['Vintage Green','Titan Gold','Obsidian Black'],
    variants:[{label:'256GB',price:405000,old:438000}],
    specs:{Display:'6.78" AMOLED 120Hz',Chip:'Helio G99',Camera:'108MP OIS main',Battery:'5,000mAh · 70W',SIM:'Dual SIM'},
    img:'img/infinix-note-40-pro.jpg', art:phoneArt('#3d5a45','#1a2a1f','Note 40 Pro') },

  { id:'itel-s25', name:'itel S25', brand:'itel', chip:'Unisoc T620', rating:4.4, reviews:221,
    colors:['Ink Black','Misty Blue','Sandy Beach'],
    variants:[{label:'128GB',price:205000,old:219000}],
    specs:{Display:'6.6" HD+ 90Hz',Chip:'Unisoc T620',Camera:'50MP dual',Battery:'5,000mAh · 18W',SIM:'Dual SIM'},
    img:'img/itel-s25.jpg', art:phoneArt('#4a4f5a','#1d2027','S25') },

  { id:'oneplus-13', name:'OnePlus 13', brand:'OnePlus', chip:'Snapdragon 8 Elite', rating:4.8, reviews:72, isNew:true,
    colors:['Midnight Ocean','Arctic Dawn','Obsidian'],
    variants:[{label:'256GB',price:1450000,old:1520000},{label:'512GB',price:1660000}],
    specs:{Display:'6.82" 2K ProXDR 120Hz',Chip:'Snapdragon 8 Elite',Camera:'50MP Hasselblad triple',Battery:'6,000mAh · 100W',SIM:'Dual SIM'},
    img:'img/oneplus-13.jpg', art:phoneArt('#24425c','#0f1d29','13') },

  { id:'realme-c75', name:'realme C75', brand:'realme', chip:'Unisoc T7250', rating:4.4, reviews:137,
    colors:['Moonlight Blue','Starry Black'],
    variants:[{label:'128GB',price:275000,old:295000}],
    specs:{Display:'6.72" HD+ 90Hz',Chip:'Unisoc T7250',Camera:'50MP dual',Battery:'6,000mAh · 45W',SIM:'Dual SIM'},
    img:'img/realme-c75.jpg', art:phoneArt('#2e5b7a','#122633','C75') }
];

/* ---------- Catalog persistence (admin overrides file) ---------- */
var CATALOG_KEY = 'ag_catalog';
var CATALOG_VERSION = 2;
var _catalogCache = null;
function readCatalogStorage() {
  try {
    var raw = localStorage.getItem(CATALOG_KEY);
    if (!raw) return null;
    var d = JSON.parse(raw);
    if (d && d.v === CATALOG_VERSION && Array.isArray(d.phones)) return d.phones;
  } catch (e) { /* ignore */ }
  return null;
}
function brandColors(brand) {
  switch ((brand || '').toLowerCase()) {
    case 'apple': return ['#c98a4b', '#5a3a24'];
    case 'samsung': return ['#8f9bb3', '#3c4557'];
    case 'google': return ['#c9c2b6', '#6b665c'];
    case 'xiaomi': return ['#5c6470', '#252a33'];
    case 'tecno': return ['#2f4f46', '#152521'];
    case 'infinix': return ['#3d5a45', '#1a2a1f'];
    case 'itel': return ['#4a4f5a', '#1d2027'];
    case 'oneplus': return ['#24425c', '#0f1d29'];
    case 'realme': return ['#2e5b7a', '#122633'];
    default: return ['#1a1a2e', '#16213e'];
  }
}
function catalog() {
  if (_catalogCache) return _catalogCache;
  var phones = readCatalogStorage();
  if (phones) {
    for (var i = 0; i < phones.length; i++) {
      var ph = phones[i];
      if (!ph.art) {
        var cs = brandColors(ph.brand);
        ph.art = phoneArt(cs[0], cs[1], (ph.name || '').slice(0, 2));
      }
    }
    _catalogCache = phones;
    return phones;
  }
  return PRODUCTS;
}
function saveCatalog(phones) {
  _catalogCache = null;
  try { localStorage.setItem(CATALOG_KEY, JSON.stringify({ v: CATALOG_VERSION, phones: phones })); } catch (e) { /* ignore */ }
}
function seedDefaultCatalog() {
  var src = (typeof PRODUCTS !== 'undefined') ? PRODUCTS : [];
  var normalized = src.map(normalizePhone);
  saveCatalog(normalized);
  _catalogCache = normalized;
  return normalized;
}
function normalizePhone(p) {
  return {
    id: p.id || ('ph_' + Math.floor(Math.random() * 1e9)),
    name: p.name || '',
    brand: p.brand || '',
    chip: p.chip || '',
    rating: (typeof p.rating === 'number') ? p.rating : 4.5,
    reviews: (Number(p.reviews || 0) || 0),
    isNew: !!p.isNew,
    hot: !!p.hot,
    outOfStock: !!p.outOfStock,
    colors: (Array.isArray(p.colors) ? p.colors.slice() : []),
    variants: (p.variants || []).map(function (v) { return { label: String(v.label || ''), price: Number(v.price || 0), old: Number(v.old || 0) }; }),
    specs: {
      Display: p.specs && p.specs.Display || '',
      Chip: p.specs && p.specs.Chip || '',
      Camera: p.specs && p.specs.Camera || '',
      Battery: p.specs && p.specs.Battery || '',
      SIM: p.specs && p.specs.SIM || ''
    },
    img: p.img || ''
  };
}
function resetCatalogCache() { _catalogCache = null; }

/* ---------- Delivery zones ---------- */
const DELIVERY = [
  { id:'pickup', name:'Pick up in Lagos', fee:0, time:'Ready in 2 hours', icon:'🏬', desc:'Collect from our Lagos store — free' },
  { id:'lagos',  name:'Lagos delivery',    fee:2500, time:'Same day', icon:'🛵', desc:'Doorstep delivery anywhere in Lagos' },
  { id:'state',  name:'Other states',      fee:4000, time:'2–4 days', icon:'🚚', desc:'Nationwide courier to your address' }
];
const STATES = ['Abia','Adamawa','Akwa Ibom','Anambra','Bauchi','Bayelsa','Benue','Borno','Cross River','Delta','Ebonyi','Edo','Ekiti','Enugu','FCT (Abuja)','Gombe','Imo','Jigawa','Kaduna','Kano','Katsina','Kebbi','Kogi','Kwara','Lagos','Nasarawa','Niger','Ogun','Ondo','Osun','Oyo','Plateau','Rivers','Sokoto','Taraba','Yobe','Zamfara'];

/* ---------- Testimonials ---------- */
const TESTIMONIALS = [
  { stars:5, text:'Bought my iPhone 15 here and it came sealed with full accessories. Delivery to Lekki was same day. Ade\'s Gadget is now my plug for every gadget.', name:'Chinedu Okafor', role:'Lagos', init:'C' },
  { stars:5, text:'I was sceptical ordering online, but they video-called me to show the phone before delivery. The Camon 40 Pro is original and the price beat Jumia.', name:'Aisha Bakare', role:'Abuja', init:'A' },
  { stars:5, text:'Got the Galaxy A56 delivered to Port Harcourt in 3 days, well packaged with warranty card. Customer service on WhatsApp is top notch.', name:'Emeka Nwosu', role:'Port Harcourt', init:'E' },
  { stars:5, text:'Third phone I\'ve bought from them. Transparent prices, no stories, and they honoured the warranty when my charger developed a fault.', name:'Blessing Adeyemi', role:'Ibadan', init:'B' }
];

/* ---------- FAQ ---------- */
const FAQS = [
  { q:'Are your phones original and sealed?', a:'Yes. Every phone we sell is brand new, factory sealed and comes with full accessories. We are an authorised retailer and every device carries a 12-month warranty.' },
  { q:'How long does delivery take?', a:'Same-day delivery anywhere in Lagos (order before 4pm). For other states, delivery takes 2–4 working days via trusted courier partners. Delivery is free on orders above ₦500,000.' },
  { q:'What payment methods do you accept?', a:'Bank transfer, pay-on-delivery in Lagos, and card payments. You can also spread payment over 3–6 months with our finance partners — ask us on WhatsApp for details.' },
  { q:'Can I see the phone before paying?', a:'Absolutely. For Lagos deliveries our rider waits while you confirm the phone is sealed and working. If you\'re not satisfied, you can reject it at no cost.' },
  { q:'What if the phone develops a fault?', a:'Contact us within 12 months of purchase. Manufacturing faults are repaired or replaced free of charge. Physical or water damage is not covered.' },
  { q:'Do you have a physical store?', a:'Yes — visit us in Lagos, Nigeria. You can also order online and pick up in store for free. Call or WhatsApp +234 816 703 5215 for directions and opening hours (Mon–Sat, 8am–7pm).' }
];

/* ---------- State ---------- */
const store = {
  cart: JSON.parse(localStorage.getItem('ag_cart') || '[]'),   // [{id, storage, qty}]
  wish: JSON.parse(localStorage.getItem('ag_wish') || '[]'),   // [id]
  promo: JSON.parse(localStorage.getItem('ag_promo') || 'null'),
  filter: 'All', q: '', sort: 'popular'
};
const save = () => {
  localStorage.setItem('ag_cart', JSON.stringify(store.cart));
  localStorage.setItem('ag_wish', JSON.stringify(store.wish));
  localStorage.setItem('ag_promo', JSON.stringify(store.promo));
};

/* ---------- Helpers ---------- */
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const naira = n => '₦' + Math.round(n).toLocaleString('en-NG');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
var prod = function (id) { return catalog().find(function (p) { return p.id === id; }); };
const variantOf = (p, storage) => p.variants.find(v => v.label === storage) || p.variants[0];
const lowest = p => Math.min(...p.variants.map(v => v.price));
const highestOld = p => Math.max(0, ...p.variants.map(v => v.old || 0));
const offPct = p => { const o = highestOld(p); return o ? Math.round((1 - lowest(p) / o) * 100) : 0; };
const starsHtml = r => '★★★★★'.slice(0, Math.round(r)) + '☆☆☆☆☆'.slice(0, 5 - Math.round(r));
const waLink = text => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(text)}`;

/* ---------- Toast ---------- */
function toast(msg, kind = 'ok') {
  const el = document.createElement('div');
  el.className = 'toast' + (kind === 'err' ? ' toast--err' : kind === 'info' ? ' toast--info' : '');
  const ic = kind === 'err' ? '⚠️' : kind === 'info' ? 'ℹ️' : '✅';
  el.innerHTML = `<span>${ic}</span><span>${esc(msg)}</span>`;
  $('#toastWrap').appendChild(el);
  setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 380); }, 2600);
}

/* ---------- Body scroll lock ---------- */
const lockCount = () => $$('.drawer.on, .modal.on').length + $$('.nav.on').length;
function syncLock() { document.body.classList.toggle('locked', lockCount() > 0); }

/* ================= CART ================= */
function cartLineKey(it) { return it.id + '|' + it.storage; }
function cartQtyTotal() { return store.cart.reduce((s, i) => s + i.qty, 0); }
function cartSubtotal() {
  return store.cart.reduce((s, i) => { const p = prod(i.id); return p ? s + variantOf(p, i.storage).price * i.qty : s; }, 0);
}
function discountFor(sub) {
  const pr = store.promo; if (!pr) return 0;
  if (pr.type === 'pct')  return Math.min(sub * pr.value / 100, pr.cap || Infinity);
  if (pr.type === 'flat') return sub >= (pr.min || 0) ? pr.value : 0;
  return 0;
}
function addToCart(id, storage, qty = 1) {
  const p = prod(id); if (!p) return;
  storage = storage || p.variants[0].label;
  const line = store.cart.find(i => i.id === id && i.storage === storage);
  if (line) line.qty = Math.min(line.qty + qty, 9);
  else store.cart.push({ id, storage, qty: Math.min(qty, 9) });
  save(); renderCart(); bumpCart();
  toast(`${p.name} (${storage}) added to cart`);
}
function setQty(key, qty) {
  const it = store.cart.find(i => cartLineKey(i) === key); if (!it) return;
  it.qty = qty;
  if (it.qty <= 0) store.cart = store.cart.filter(i => cartLineKey(i) !== key);
  save(); renderCart();
}
function bumpCart() {
  const c = $('#cartCount');
  c.textContent = cartQtyTotal();
  c.classList.toggle('show', cartQtyTotal() > 0);
  c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump');
}
function applyPromo() {
  const code = $('#promoInput').value.trim().toUpperCase();
  if (!code) return toast('Enter a promo code', 'info');
  const pr = PROMOS[code];
  if (!pr) { store.promo = null; save(); renderCart(); return toast('Invalid promo code', 'err'); }
  const sub = cartSubtotal();
  if (pr.min && sub < pr.min) return toast(`This code needs a minimum of ${naira(pr.min)}`, 'err');
  store.promo = { code, ...pr }; save(); renderCart();
  toast(`Promo applied: ${pr.label}`);
}

function renderCart() {
  bumpCart();
  $('#drawerCount').textContent = cartQtyTotal() ? `(${cartQtyTotal()} items)` : '';
  const box = $('#cartItems'), foot = $('#cartFoot');
  if (!store.cart.length) {
    box.innerHTML = `<div class="cart-empty">
      <div class="cart-empty__ic">🛒</div>
      <h4>Your cart is empty</h4>
      <p>Looks like you haven\'t added anything yet.</p>
      <button class="btn btn--accent" id="emptyShop">Browse Phones</button></div>`;
    foot.style.display = 'none';
    $('#emptyShop').onclick = () => { closeDrawer(); $('#shop').scrollIntoView({ behavior:'smooth' }); };
    return;
  }
  foot.style.display = '';
  box.innerHTML = store.cart.map(it => {
    const p = prod(it.id); if (!p) return '';
    const v = variantOf(p, it.storage);
    return `<div class="ci">
      <div class="ci__img"><img src="${p.img}" data-fb="${p.art}" onerror="imgFallback(this)" alt="${esc(p.name)}"></div>
      <div>
        <div class="ci__name">${esc(p.name)}</div>
        <div class="ci__meta">${esc(v.label)} · ${esc(p.colors[0])}</div>
        <div class="ci__price">${naira(v.price * it.qty)}</div>
        <div class="qty">
          <button data-dec="${cartLineKey(it)}" aria-label="Decrease">−</button>
          <span>${it.qty}</span>
          <button data-inc="${cartLineKey(it)}" aria-label="Increase">+</button>
        </div>
      </div>
      <div class="ci__right">
        <button class="ci__rm" data-rm="${cartLineKey(it)}" aria-label="Remove">&times;</button>
      </div></div>`;
  }).join('');

  const sub = cartSubtotal(), disc = discountFor(sub);
  $('#cartSubtotal').textContent = naira(sub);
  $('#discountRow').hidden = !disc;
  $('#cartDiscount').textContent = '-' + naira(disc);
  $('#cartTotal').textContent = naira(sub - disc);
}

/* ---------- Drawer ---------- */
function openDrawer() { $('#cartDrawer').classList.add('on'); $('#overlay').classList.add('on'); syncLock(); }
function closeDrawer() { $('#cartDrawer').classList.remove('on'); $('#overlay').classList.remove('on'); syncLock(); }

/* ================= PRODUCT MODAL ================= */
let pmQty = 1, pmVariant = 0, pmColors = 0;
function openProduct(id) {
  const p = prod(id); if (!p) return;
  pmQty = 1; pmVariant = 0; pmColors = 0;
  renderProductModal(p);
  $('#productModal').classList.add('on'); syncLock();
}
function renderProductModal(p) {
  const v = p.variants[pmVariant];
  const badges = [];
  if (p.isNew) badges.push('<span class="badge badge--new">New</span>');
  if (p.hot)   badges.push('<span class="badge badge--hot">Hot</span>');
  if (v.old)   badges.push(`<span class="badge badge--off">-${offPct(p)}%</span>`);
  const saveAmt = v.old ? v.old - v.price : 0;

  $('#pmContent').innerHTML = `
    <div class="pm__media">
      <div class="card__badges">${badges.join('')}</div>
      <img id="pmImg" src="${p.img}" data-fb="${p.art}" onerror="imgFallback(this)" alt="${esc(p.name)}">
    </div>
    <div class="pm__info">
      <span class="pm__brand">${esc(p.brand)}</span>
      <h2 class="pm__name">${esc(p.name)}</h2>
      <div class="pm__rating"><span class="stars">${starsHtml(p.rating)}</span> ${p.rating} · ${p.reviews} reviews</div>
      <div class="pm__price">
        <span class="price">${naira(v.price)}</span>
        ${v.old ? `<span class="price--old">${naira(v.old)}</span><span class="pm__save">You save ${naira(saveAmt)}</span>` : ''}
      </div>
      ${p.variants.length > 1 ? `<div><div class="pm__label">Storage</div>
        <div class="opts">${p.variants.map((vv, i) => `<button class="opt ${i === pmVariant ? 'on' : ''}" data-variant="${i}">${esc(vv.label)}</button>`).join('')}</div></div>` : ''}
      <div><div class="pm__label">Colour — ${esc(p.colors[pmColors])}</div>
        <div class="opts">${p.colors.map((c, i) => `<button class="opt ${i === pmColors ? 'on' : ''}" data-color="${i}">${esc(c)}</button>`).join('')}</div></div>
      <div class="pm__specs">${Object.entries(p.specs).map(([k, val]) => `<div class="spec"><b>${k}</b><span>${esc(val)}</span></div>`).join('')}</div>
      <ul class="pm__notes">
        <li>✅ Brand new, factory sealed with full accessories</li>
        <li>🛡️ 12-month warranty included</li>
        <li>🚚 ${lowest(p) >= FREE_DELIVERY_MIN ? 'Free nationwide delivery' : 'Delivery: same-day in Lagos · 2–4 days nationwide'}</li>
      </ul>
      <div class="pm__buy">
        <div class="qty qty--lg">
          <button data-pmdec aria-label="Decrease">−</button><span id="pmQty">${pmQty}</span><button data-pminc aria-label="Increase">+</button>
        </div>
        <button class="btn btn--accent btn--lg" data-pmadd>Add to Cart</button>
        <button class="btn btn--ghost btn--lg" data-pmbuy>Buy Now</button>
      </div>
    </div>`;

  const box = $('#pmContent');
  box.querySelectorAll('[data-variant]').forEach(b => b.onclick = () => { pmVariant = +b.dataset.variant; renderProductModal(p); });
  box.querySelectorAll('[data-color]').forEach(b => b.onclick = () => { pmColors = +b.dataset.color; renderProductModal(p); });
  box.querySelector('[data-pmdec]').onclick = () => { pmQty = Math.max(1, pmQty - 1); $('#pmQty').textContent = pmQty; };
  box.querySelector('[data-pminc]').onclick = () => { pmQty = Math.min(9, pmQty + 1); $('#pmQty').textContent = pmQty; };
  box.querySelector('[data-pmadd]').onclick = () => { addToCart(p.id, v.label, pmQty); closeModal($('#productModal')); openDrawer(); };
  box.querySelector('[data-pmbuy]').onclick = () => { addToCart(p.id, v.label, pmQty); closeModal($('#productModal')); openCheckout(); };
}
function closeModal(m) { m.classList.remove('on'); syncLock(); }

/* ================= CHECKOUT ================= */
let coStep = 1, coData = {};
function openCheckout() {
  if (!store.cart.length) return toast('Your cart is empty', 'err');
  coStep = 1; coData = { method:'lagos', state:'Lagos', pay:'transfer' };
  renderCheckout();
  closeDrawer();
  $('#checkoutModal').classList.add('on'); syncLock();
}
function coTotals() {
  const sub = cartSubtotal(), disc = discountFor(sub);
  // fee follows the destination state, not just the radio choice
  let ship, name, time;
  if (coData.method === 'pickup') { ship = 0; name = 'Pick up in Lagos'; time = 'Ready in 2 hours'; }
  else if (coData.state === 'Lagos') { ship = 2500; name = 'Lagos delivery'; time = 'Same day'; }
  else { ship = 4000; name = 'Nationwide delivery'; time = '2–4 days'; }
  if (sub >= FREE_DELIVERY_MIN) ship = 0;
  if (store.promo && store.promo.type === 'ship') ship = 0;
  const d = { name, time };
  return { sub, disc, ship, total: Math.max(0, sub - disc + ship), d };
}
function stepsHtml() {
  const names = ['Delivery', 'Payment', 'Confirm'];
  return `<div class="steps">${names.map((n, i) => {
    const num = i + 1;
    const cls = coStep === num ? 'on' : coStep > num ? 'done' : '';
    return `<div class="step ${cls}" data-n="${num}">${n}</div>`;
  }).join('')}</div>`;
}
function summaryHtml() {
  const t = coTotals();
  return `<div class="summary">${store.cart.map(it => {
    const p = prod(it.id), v = variantOf(p, it.storage);
    return `<div class="summary__row"><span>${esc(p.name)} <span class="qty-x">(${esc(v.label)}) × ${it.qty}</span></span><b>${naira(v.price * it.qty)}</b></div>`;
  }).join('')}
    <div class="summary__row"><span>Subtotal</span><b>${naira(t.sub)}</b></div>
    ${t.disc ? `<div class="summary__row" style="color:var(--accent2)"><span>Discount (${esc(store.promo.code)})</span><b>-${naira(t.disc)}</b></div>` : ''}
    <div class="summary__row"><span>Delivery${t.ship === 0 && coData.method !== 'pickup' ? ' (free over ₦500k)' : ''}</span><b>${t.ship === 0 ? 'FREE' : naira(t.ship)}</b></div>
    <div class="summary__row" style="font-size:1.05rem"><span><b>Total</b></span><b style="color:var(--accent)">${naira(t.total)}</b></div>
  </div>`;
}
function renderCheckout() {
  const c = $('#checkoutContent');
  if (coStep === 4) return renderSuccess(c);

  let body = '';
  if (coStep === 1) {
    body = `
      <div class="form-grid">
        <div class="field" data-f="name"><label>Full name <span>*</span></label><input id="coName" value="${esc(coData.name || '')}" placeholder="e.g. Chinedu Okafor"><small class="field__err">Please enter your full name</small></div>
        <div class="field" data-f="phone"><label>Phone number <span>*</span></label><input id="coPhone" value="${esc(coData.phone || '')}" placeholder="0803 123 4567" inputmode="tel"><small class="field__err">Enter a valid Nigerian number</small></div>
        <div class="field field--full" data-f="email"><label>Email (optional)</label><input id="coEmail" value="${esc(coData.email || '')}" placeholder="you@email.com"></div>
        <div class="field field--full"><label>How should you get it?</label>
          <div class="radio-cards">${DELIVERY.map(d => `
            <label class="radio-card ${coData.method === d.id ? 'on' : ''}" data-method="${d.id}">
              <input type="radio" name="method" ${coData.method === d.id ? 'checked' : ''}>
              <span class="radio-card__dot"></span>
              <span class="radio-card__ic">${d.icon}</span>
              <span><span class="radio-card__t">${d.name} — ${d.fee ? naira(d.fee) : 'Free'}</span><span class="radio-card__d">${d.desc} · ${d.time}</span></span>
            </label>`).join('')}</div>
        </div>
        ${coData.method !== 'pickup' ? `
        <div class="field" data-f="state"><label>State <span>*</span></label>
          <select id="coState">${STATES.map(s => `<option ${coData.state === s ? 'selected' : ''}>${s}</option>`).join('')}</select></div>
        <div class="field" data-f="address"><label>Delivery address <span>*</span></label><input id="coAddress" value="${esc(coData.address || '')}" placeholder="Street, area, landmark"><small class="field__err">Please enter your address</small></div>
        <div class="field field--full"><label>Delivery note (optional)</label><textarea id="coNote" placeholder="Any special instructions for the rider?">${esc(coData.note || '')}</textarea></div>` : ''}
      </div>
      <div class="co__actions"><button class="btn btn--ghost" data-close>Cancel</button><button class="btn btn--accent btn--lg" data-next>Continue to Payment →</button></div>`;
  } else if (coStep === 2) {
    body = `
      <div class="radio-cards">
        <label class="radio-card ${coData.pay === 'transfer' ? 'on' : ''}" data-pay="transfer">
          <input type="radio" name="pay" ${coData.pay === 'transfer' ? 'checked' : ''}><span class="radio-card__dot"></span><span class="radio-card__ic">🏦</span>
          <span><span class="radio-card__t">Bank Transfer</span><span class="radio-card__d">Pay to our account after order confirmation on WhatsApp</span></span></label>
        <label class="radio-card ${coData.pay === 'delivery' ? 'on' : ''}" data-pay="delivery">
          <input type="radio" name="pay" ${coData.pay === 'delivery' ? 'checked' : ''}><span class="radio-card__dot"></span><span class="radio-card__ic">💵</span>
          <span><span class="radio-card__t">Pay on Delivery</span><span class="radio-card__d">Cash or transfer when you receive your phone (Lagos only)</span></span></label>
        <label class="radio-card ${coData.pay === 'card' ? 'on' : ''}" data-pay="card" style="opacity:.55">
          <input type="radio" name="pay" disabled><span class="radio-card__dot"></span><span class="radio-card__ic">💳</span>
          <span><span class="radio-card__t">Card Payment <span class="badge badge--new" style="margin-left:6px">Coming soon</span></span><span class="radio-card__d">Secure payment with debit card</span></span></label>
      </div>
      ${summaryHtml()}
      <div class="co__actions"><button class="btn btn--ghost" data-back>← Back</button><button class="btn btn--accent btn--lg" data-next>Review Order →</button></div>`;
  } else if (coStep === 3) {
    const t = coTotals();
    body = `
      <div class="review-block"><h4>Deliver to <button data-edit="1">Edit</button></h4>
        <div class="review-line"><span>Name</span><b>${esc(coData.name || '')}</b></div>
        <div class="review-line"><span>Phone</span><b>${esc(coData.phone || '')}</b></div>
        ${coData.email ? `<div class="review-line"><span>Email</span><b>${esc(coData.email)}</b></div>` : ''}
        <div class="review-line"><span>${coData.method === 'pickup' ? 'Pickup' : 'Address'}</span><b style="text-align:right;max-width:60%">${coData.method === 'pickup' ? 'Our Lagos store' : esc((coData.address || '') + ', ' + (coData.state || ''))}</b></div>
        <div class="review-line"><span>Delivery</span><b>${t.d.name} — ${t.ship === 0 ? 'FREE' : naira(t.ship)} · ${t.d.time}</b></div>
      </div>
      <div class="review-block"><h4>Payment <button data-edit="2">Edit</button></h4>
        <div class="review-line"><span>Method</span><b>${coData.pay === 'transfer' ? '🏦 Bank Transfer' : '💵 Pay on Delivery'}</b></div>
      </div>
      ${summaryHtml()}
      <div class="co__actions"><button class="btn btn--ghost" data-back>← Back</button><button class="btn btn--accent btn--lg" data-place>✓ Place Order</button></div>`;
  }

  c.innerHTML = `<h3 class="checkout__title">Secure Checkout</h3>
    <p class="checkout__sub">🔒 Your order is protected. We confirm every order personally.</p>
    ${stepsHtml()}${body}`;

  // bindings
  c.querySelectorAll('[data-method]').forEach(el => el.onclick = () => { grabStep1(); coData.method = el.dataset.method; if (coData.method === 'pickup') coData.state = 'Lagos'; renderCheckout(); });
  const stateSel = c.querySelector('#coState');
  if (stateSel) stateSel.onchange = () => { coData.state = stateSel.value; };
  c.querySelectorAll('[data-pay]').forEach(el => el.onclick = () => { coData.pay = el.dataset.pay; renderCheckout(); });
  c.querySelectorAll('[data-close]').forEach(b => b.onclick = () => closeModal($('#checkoutModal')));
  const back = c.querySelector('[data-back]'); if (back) back.onclick = () => { coStep--; renderCheckout(); };
  const next = c.querySelector('[data-next]'); if (next) next.onclick = () => { if (validateStep()) { coStep++; renderCheckout(); } };
  c.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => { coStep = +b.dataset.edit; renderCheckout(); });
  const place = c.querySelector('[data-place]'); if (place) place.onclick = placeOrder;
}
function grabStep1() {
  const g = id => { const el = $('#' + id); return el ? el.value.trim() : undefined; };
  if ($('#coName') !== null || coStep !== 1) { }
  if ($('#coName')) coData.name = g('coName');
  if ($('#coPhone')) coData.phone = g('coPhone');
  if ($('#coEmail')) coData.email = g('coEmail');
  if ($('#coState')) coData.state = g('coState');
  if ($('#coAddress')) coData.address = g('coAddress');
  if ($('#coNote')) coData.note = g('coNote');
}
function validateStep() {
  if (coStep !== 1) return true;
  grabStep1();
  let ok = true;
  const mark = (f, bad) => { const el = $(`[data-f="${f}"]`); if (el) el.classList.toggle('err', bad); if (bad) ok = false; };
  mark('name', !(coData.name && coData.name.length >= 3));
  const digits = (coData.phone || '').replace(/\D/g, '');
  const validPhone = /^(234|0)\d{10}$/.test(digits);
  mark('phone', !validPhone);
  if (coData.method !== 'pickup') mark('address', !(coData.address && coData.address.length >= 6));
  else mark('address', false);
  if (!ok) toast('Please fix the highlighted fields', 'err');
  return ok;
}
function placeOrder() {
  const t = coTotals();
  const ref = 'AG-' + new Date().toISOString().slice(2, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000);
  const items = store.cart.map(it => {
    const p = prod(it.id), v = variantOf(p, it.storage);
    return { name: p.name, storage: v.label, qty: it.qty, price: v.price, line: v.price * it.qty };
  });
  const order = { ref, items, customer: coData, totals: t, pay: coData.pay, at: new Date().toISOString() };
  const orders = JSON.parse(localStorage.getItem('ag_orders') || '[]');
  orders.unshift(order); localStorage.setItem('ag_orders', JSON.stringify(orders.slice(0, 30)));

  const lines = items.map((i, n) => `${n + 1}. ${i.name} (${i.storage}) × ${i.qty} — ${naira(i.line)}`).join('\n');
  const msg =
`*NEW ORDER — ADE'S GADGET*
Ref: ${ref}

*Items:*
${lines}

Subtotal: ${naira(t.sub)}${t.disc ? `\nDiscount (${store.promo.code}): -${naira(t.disc)}` : ''}
Delivery: ${t.ship === 0 ? 'FREE' : naira(t.ship)}
*TOTAL: ${naira(t.total)}*

*Customer Details*
Name: ${coData.name}
Phone: ${coData.phone}${coData.email ? `\nEmail: ${coData.email}` : ''}
${coData.method === 'pickup' ? 'Pickup: Lagos store' : `Address: ${coData.address}, ${coData.state}`}
Delivery: ${t.d.name} (${t.d.time})
Payment: ${coData.pay === 'transfer' ? 'Bank Transfer' : 'Pay on Delivery'}${coData.note ? `\nNote: ${coData.note}` : ''}

Please confirm availability. Thank you!`;

  coStep = 4; coData._wa = waLink(msg); coData._ref = ref;
  renderCheckout();
  store.cart = []; store.promo = null; save(); renderCart();
}
function renderSuccess(c) {
  c.innerHTML = `<div class="success">
    <div class="success__ring">✅</div>
    <h3>Order placed successfully!</h3>
    <p>Thanks <b>${esc((coData.name || '').split(' ')[0] || 'friend')}</b> — your order is being processed.</p>
    <div class="success__ref">Order ref: ${esc(coData._ref)}</div>
    <a class="btn btn--accent btn--lg btn--block success__wa" href="${coData._wa}" target="_blank" rel="noopener">
      💬 Send this order on WhatsApp</a>
    <a class="btn btn--ghost btn--block" href="tel:+${WHATSAPP}">📞 Call ${PHONE_DISPLAY} to confirm</a>
    <p class="success__note">We'll confirm your order and payment details on WhatsApp within minutes.<br>Bank transfer details: <b>Ade's Gadget — GTBank — 0123456789</b></p>
    <button class="btn btn--dark btn--block" style="margin-top:16px" data-close>Continue shopping</button>
  </div>`;
  c.querySelector('[data-close]').onclick = () => closeModal($('#checkoutModal'));
  toast('Order placed! Complete it on WhatsApp 🎉');
}

/* ================= CATALOGUE RENDER ================= */
function renderChips() {
  var brands = ['All', ...new Set(catalog().map(function (p) { return p.brand; }))];
  $('#brandChips').innerHTML = brands.map(function (b) {
    return '<button class="chip ' + (store.filter === b ? 'on' : '') + '" data-chip="' + esc(b) + '">' + esc(b) + '</button>';
  }).join('');
  $$('#brandChips [data-chip]').forEach(function (el) {
    el.onclick = function () { store.filter = el.dataset.chip; renderChips(); renderProducts(); };
  });
}
function filtered() {
  var list = catalog().filter(function (p) {
    var okBrand = store.filter === 'All' || p.brand === store.filter;
    var q = (store.q || '').toLowerCase();
    var okQ = !q || p.name.toLowerCase().indexOf(q) !== -1 || p.brand.toLowerCase().indexOf(q) !== -1 || p.chip.toLowerCase().indexOf(q) !== -1;
    return okBrand && okQ;
  });
  const s = store.sort;
  if (s === 'low') list.sort((a, b) => lowest(a) - lowest(b));
  else if (s === 'high') list.sort((a, b) => lowest(b) - lowest(a));
  else if (s === 'rating') list.sort((a, b) => b.rating - a.rating || b.reviews - a.reviews);
  else if (s === 'newest') list.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
  else list.sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0) || b.reviews - a.reviews);
  return list;
}
function cardHtml(p) {
  const off = offPct(p);
  const badges = [
    p.isNew ? '<span class="badge badge--new">New</span>' : '',
    p.hot ? '<span class="badge badge--hot">Hot</span>' : '',
    off ? `<span class="badge badge--off">-${off}%</span>` : ''
  ].join('');
  const wished = store.wish.includes(p.id);
  return `<article class="card reveal" data-card="${p.id}">
    <div class="card__media">
      <div class="card__badges">${badges}</div>
      <button class="wish ${wished ? 'on' : ''}" data-wish="${p.id}" aria-label="Save">${wished ? '♥' : '♡'}</button>
      <img src="${p.img}" data-fb="${p.art}" onerror="imgFallback(this)" loading="lazy" alt="${esc(p.name)}">
      <button class="quick" data-open="${p.id}">👁 Quick View</button>
    </div>
    <div class="card__body">
      <span class="card__brand">${esc(p.brand)}</span>
      <h3 class="card__name" data-open="${p.id}">${esc(p.name)}</h3>
      <p class="card__specs">${esc(p.variants[0].label)} · ${esc(p.chip)}</p>
      <div class="card__rating"><span class="stars">${starsHtml(p.rating)}</span> ${p.rating} <span>(${p.reviews})</span></div>
      <div class="card__price">
        <span class="price">${naira(lowest(p))}</span>
        ${off ? `<span class="price--old">${naira(highestOld(p))}</span>` : ''}
      </div>
      <button class="card__add" data-add="${p.id}">
        <svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.6"/><circle cx="18" cy="20" r="1.6"/><path d="M2 3h2.3l2.4 12.2a1.6 1.6 0 0 0 1.6 1.3h8.9a1.6 1.6 0 0 0 1.6-1.3L21 7H5.2"/></svg>
        Add to Cart</button>
    </div></article>`;
}
function renderProducts() {
  var list = filtered();
  var all = catalog();
  $('#productGrid').innerHTML = list.map(cardHtml).join('');
  var empty = $('#emptyState');
  if (!list.length) {
    empty.hidden = false;
    if (!all.length) {
      empty.querySelector('.empty__icon').textContent = '\ud83d\udfed';
      empty.querySelector('h3').textContent = 'Your shop is empty';
      empty.querySelector('p').textContent = 'Add your first phone in the Catalog Manager.';
      var btn = empty.querySelector('button');
      btn.textContent = 'Open Catalog Manager';
      btn.onclick = function () { if (window.Admin) window.Admin.open(); };
    } else {
      empty.querySelector('.empty__icon').textContent = '\U0001f50d';
      empty.querySelector('h3').textContent = 'No phones found';
      empty.querySelector('p').textContent = 'Try a different search or clear your filters.';
      var b2 = empty.querySelector('button');
      b2.textContent = 'Clear all filters';
      b2.onclick = function () {
        store.filter = 'All'; store.q = ''; $('#searchInput').value = ''; $('.search').classList.remove('filled');
        $('#sortSelect').value = 'popular'; store.sort = 'popular'; renderChips(); renderProducts();
      };
    }
  } else {
    empty.hidden = true;
  }
  $('#shopCount').innerHTML = 'Showing <b>' + list.length + '</b> phone' + (list.length === 1 ? '' : 's');
  observeReveals();
}
function renderDeals() {
  var deals = catalog().filter(function (p) { return highestOld(p) > 0; })
    .sort(function (a, b) { return offPct(b) - offPct(a); }).slice(0, 4);
  $('#dealsGrid').innerHTML = deals.map(cardHtml).join('');
}

/* ================= STATIC SECTIONS ================= */
function renderMarquee() {
  const brands = ['Apple', 'Samsung', 'Tecno', 'Infinix', 'Xiaomi', 'Redmi', 'Google Pixel', 'OnePlus', 'realme', 'itel', 'iPhone', 'Galaxy'];
  const set = brands.map(b => `<span class="marquee__item">${b}</span>`).join('');
  $('#marqueeTrack').innerHTML = set + set;   // duplicated for seamless loop
}
function renderTesti() {
  $('#testi').innerHTML = TESTIMONIALS.map((t, i) => `
    <div class="testi__card ${i === 0 ? 'on' : ''}">
      <div class="testi__stars">${'★'.repeat(t.stars)}</div>
      <p class="testi__text">"${t.text}"</p>
      <div class="testi__who"><div class="testi__ava">${t.init}</div>
        <div><div class="testi__name">${t.name}</div><div class="testi__role">${t.role}</div></div></div>
    </div>`).join('');
  $('#testiDots').innerHTML = TESTIMONIALS.map((_, i) => `<button class="testi__dot ${i === 0 ? 'on' : ''}" data-dot="${i}" aria-label="Review ${i + 1}"></button>`).join('');
  let cur = 0;
  const go = n => {
    cur = (n + TESTIMONIALS.length) % TESTIMONIALS.length;
    $$('#testi .testi__card').forEach((el, i) => el.classList.toggle('on', i === cur));
    $$('#testiDots .testi__dot').forEach((el, i) => el.classList.toggle('on', i === cur));
  };
  $$('#testiDots [data-dot]').forEach(el => el.onclick = () => { go(+el.dataset.dot); reset(); });
  let timer = setInterval(() => go(cur + 1), 5500);
  const reset = () => { clearInterval(timer); timer = setInterval(() => go(cur + 1), 5500); };
}
function renderFaq() {
  $('#faqList').innerHTML = FAQS.map((f, i) => `
    <div class="faq__item ${i === 0 ? 'open' : ''}">
      <button class="faq__q">${f.q}<span class="faq__ic">+</span></button>
      <div class="faq__a"><p>${f.a}</p></div>
    </div>`).join('');
  $$('#faqList .faq__item').forEach(item => {
    const q = item.querySelector('.faq__q'), a = item.querySelector('.faq__a');
    q.onclick = () => {
      const open = item.classList.contains('open');
      $$('#faqList .faq__item').forEach(o => { o.classList.remove('open'); o.querySelector('.faq__a').style.maxHeight = null; });
      if (!open) { item.classList.add('open'); a.style.maxHeight = a.scrollHeight + 'px'; }
    };
  });
  const first = $('#faqList .faq__item.open .faq__a');
  if (first) first.style.maxHeight = first.scrollHeight + 'px';
}

/* ================= COUNTDOWN ================= */
function startCountdown() {
  const tick = () => {
    const now = new Date(), end = new Date(now); end.setHours(23, 59, 59, 999);
    let s = Math.max(0, Math.floor((end - now) / 1000));
    $('#cdH').textContent = String(Math.floor(s / 3600)).padStart(2, '0');
    $('#cdM').textContent = String(Math.floor(s % 3600 / 60)).padStart(2, '0');
    $('#cdS').textContent = String(s % 60).padStart(2, '0');
  };
  tick(); setInterval(tick, 1000);
}

/* ================= REVEAL / SCROLL FX ================= */
let io;
function observeReveals() {
  if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } }), { threshold: .12 });
  $$('.reveal:not(.visible)').forEach(el => io.observe(el));
}
function animateStats() {
  $$('.stat strong[data-count]').forEach(el => {
    const target = +el.dataset.count, suffix = el.dataset.suffix || '+';
    let cur = 0; const step = target / 60;
    const t = setInterval(() => {
      cur += step;
      if (cur >= target) { cur = target; clearInterval(t); }
      el.textContent = Math.floor(cur).toLocaleString('en-US') + (cur >= target ? suffix : '');
    }, 18);
  });
}
function initScrollFx() {
  const header = $('#header'), backTop = $('#backTop');
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('scrolled', y > 10);
    backTop.classList.toggle('show', y > 700);
    // active nav link
    const secs = ['home', 'shop', 'deals', 'why', 'faq', 'contact'];
    let active = 'home';
    secs.forEach(id => { const el = document.getElementById(id); if (el && el.getBoundingClientRect().top <= 140) active = id; });
    $$('.nav__link').forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + active));
  };
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  backTop.onclick = () => scrollTo({ top: 0, behavior: 'smooth' });
}

/* ================= WIRING ================= */
function refreshShop() {
  resetCatalogCache();
  try {
    var h = localStorage.getItem('ag_hero');
    var heroImg = document.getElementById('heroImg');
    if (h && heroImg) heroImg.src = h;
  } catch (e) { /* ignore */ }
  renderProducts();
  renderDeals();
  renderChips();
  var phones = catalog();
  store.cart = store.cart.filter(function (it) { return phones.some(function (p) { return p.id === it.id; }); });
  save();
  renderCart();
}
function init() {
  $('#year').textContent = new Date().getFullYear();
  try {
    var _h = localStorage.getItem('ag_hero');
    if (_h) { var _hImg = document.getElementById('heroImg'); if (_hImg) _hImg.src = _h; }
  } catch (e) { /* ignore */ }
  $('#heroImg').dataset.fb = phoneArt('#c98a4b', '#5a3a24', '17 Pro Max');
  $('#heroImg').onerror = function () { imgFallback(this); };

  renderMarquee(); renderChips(); renderDeals(); renderProducts();
  renderTesti(); renderFaq(); renderCart(); startCountdown(); observeReveals(); initScrollFx(); animateStats();

  // delegated clicks across product cards
  document.addEventListener('click', e => {
    const add = e.target.closest('[data-add]');
    if (add) { const p = prod(add.dataset.add); addToCart(p.id, null, 1); return; }
    const open = e.target.closest('[data-open]');
    if (open) { openProduct(open.dataset.open); return; }
    const wish = e.target.closest('[data-wish]');
    if (wish) {
      const id = wish.dataset.wish;
      const i = store.wish.indexOf(id);
      if (i > -1) { store.wish.splice(i, 1); toast('Removed from wishlist', 'info'); }
      else { store.wish.push(id); toast('Saved to wishlist'); }
      save(); renderProducts(); renderDeals(); return;
    }
    const inc = e.target.closest('[data-inc]'); if (inc) { const it = store.cart.find(x => cartLineKey(x) === inc.dataset.inc); setQty(inc.dataset.inc, it.qty + 1); return; }
    const dec = e.target.closest('[data-dec]'); if (dec) { const it = store.cart.find(x => cartLineKey(x) === dec.dataset.dec); setQty(dec.dataset.dec, it.qty - 1); return; }
    const rm = e.target.closest('[data-rm]'); if (rm) { setQty(rm.dataset.rm, 0); toast('Item removed', 'info'); return; }
    // close modals by backdrop / buttons
    if (e.target.classList.contains('modal')) closeModal(e.target);
    if (e.target.closest('[data-close]')) { const m = e.target.closest('.modal'); if (m) closeModal(m); }
  });

  // header controls
  $('#cartToggle').onclick = openDrawer;
  $('#closeCart').onclick = closeDrawer;
  $('#overlay').onclick = closeDrawer;
  $('#keepShopping').onclick = closeDrawer;
  $('#checkoutBtn').onclick = openCheckout;
  $('#adminToggle').onclick = function () { if (window.Admin) window.Admin.open(); };
  $('#adminLink').onclick = function (e) { e.preventDefault(); if (window.Admin) window.Admin.open(); };
  $('#promoBtn').onclick = applyPromo;
  $('#promoInput').addEventListener('keydown', e => { if (e.key === 'Enter') applyPromo(); });

  // search & filter
  const si = $('#searchInput');
  si.addEventListener('input', () => {
    store.q = si.value;
    $('.search').classList.toggle('filled', !!si.value);
    renderProducts();
  });
  $('#searchClear').onclick = () => { si.value = ''; store.q = ''; $('.search').classList.remove('filled'); renderProducts(); };
  $('#searchToggle').onclick = () => { $('#shop').scrollIntoView({ behavior: 'smooth' }); setTimeout(() => si.focus(), 500); };
  $('#sortSelect').onchange = e => { store.sort = e.target.value; renderProducts(); };
  $('#resetFilters').onclick = () => {
    store.filter = 'All'; store.q = ''; si.value = ''; $('.search').classList.remove('filled');
    $('#sortSelect').value = 'popular'; store.sort = 'popular';
    renderChips(); renderProducts();
  };

  // mobile nav
  const nav = $('#nav'), burger = $('#burger');
  burger.onclick = () => { nav.classList.toggle('on'); burger.classList.toggle('open'); syncLock(); };
  nav.addEventListener('click', e => { if (e.target.classList.contains('nav__link')) { nav.classList.remove('on'); burger.classList.remove('open'); syncLock(); } });
  document.addEventListener('click', e => {
    const t = e.target.closest('[data-close-admin]');
    if (t) {
      if (window.Admin && window.Admin._dirty !== false) {
        if (!confirm('Discard unsaved changes?')) return;
      }
      if (window.Admin) window.Admin.close();
    }
  });
  var __agCloseAdmin = function () {
    if (window.Admin && window.Admin._dirty !== false) {
      if (!confirm('Discard unsaved changes?')) return;
    }
    if (window.Admin) window.Admin.close();
  };

  // esc closes everything
  addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      $$('.modal.on').forEach(closeModal);
      closeDrawer();
      nav.classList.remove('on'); burger.classList.remove('open');
      if (window.Admin && window.Admin._dirty !== false) {
        if (!confirm('Discard unsaved changes?')) return;
      }
      if (window.Admin) window.Admin.close();
      syncLock();
    }
  });
  window.refreshShop = refreshShop;
  window.__agCloseAdmin = function () {
    if (window.Admin && window.Admin._dirty !== false) {
      if (!confirm('Discard unsaved changes?')) return;
    }
    if (window.Admin) window.Admin.close();
  };
}
document.addEventListener('DOMContentLoaded', init);
