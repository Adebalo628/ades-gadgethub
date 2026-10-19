'use strict';
const fs = require('fs');
const path = require('path');

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

const PROMOS = {
  ADE10:    { type: 'pct',   value: 10,  cap: 50000, label: '10% off' },
  TECH5:    { type: 'flat',  value: 5000, min: 200000, label: '₦5,000 off' },
  FREESHIP: { type: 'ship',  value: 0,   label: 'Free delivery' }
};

const DEFAULT_HERO = 'img/iphone-17-pro-max.jpg';

const out = {
  v: 2,
  phones: PRODUCTS,
  hero: DEFAULT_HERO,
  promos: PROMOS
};

const outPath = path.join(__dirname, 'catalog-data.json');
fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
console.log('Wrote', outPath, '(', out.phones.length, 'phones )');
