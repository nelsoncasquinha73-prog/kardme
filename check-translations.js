const pt=require('./locales/pt.json');
const ptbr=require('./locales/pt-br.json');
const es=require('./locales/es.json');
const it=require('./locales/it.json');
const fr=require('./locales/fr.json');
const de=require('./locales/de.json');
const ar=require('./locales/ar.json');

const flat=(o,p='')=>Object.entries(o).flatMap(([k,v])=>v&&typeof v==='object'?flat(v,p?p+'.'+k:k):[(p?p+'.'+k:k)]);
const keysPT = new Set(flat(pt));

const langs = {
  'pt-br': ptbr,
  es,
  it,
  fr,
  de,
  ar,
};

Object.entries(langs).forEach(([code, dict]) => {
  const keys = new Set(flat(dict));
  const missing = [...keysPT].filter(k => !keys.has(k));
  console.log(`\n=== ${code.toUpperCase()} MISSING: ${missing.length} ===`);
  missing.slice(0,80).forEach(k => console.log(k));
});
