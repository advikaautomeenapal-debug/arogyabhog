/**
 * Arogya Bhog Master Grain Resolver & Alias Normalizer
 * Seamlessly resolves any grain name, alias, transliteration, or clinical label
 * to the exact canonical Grain model in the catalog.
 */

export const GRAIN_ALIASES = {
  // Flax seeds / Alsi / Omega-3
  'flaxseeds': 'Flax Seeds (Alsi)',
  'flax seeds': 'Flax Seeds (Alsi)',
  'flaxseed': 'Flax Seeds (Alsi)',
  'flax': 'Flax Seeds (Alsi)',
  'alsi': 'Flax Seeds (Alsi)',
  'flaxseeds (alsi / omega-3)': 'Flax Seeds (Alsi)',
  'flax seeds (alsi)': 'Flax Seeds (Alsi)',
  'flaxseed (alsi)': 'Flax Seeds (Alsi)',
  'omega-3': 'Flax Seeds (Alsi)',
  'omega 3': 'Flax Seeds (Alsi)',
  'alsi / omega-3': 'Flax Seeds (Alsi)',
  'cold-roasted golden flax': 'Flax Seeds (Alsi)',

  // Wheat variants
  'sharbati wheat': 'Sharbati Wheat',
  'whole sharbati wheat': 'Sharbati Wheat',
  'sharbati gehu': 'Sharbati Wheat',
  'whole wheat': 'Sharbati Wheat',
  'gehu': 'Sharbati Wheat',
  'wheat': 'Sharbati Wheat',
  'sharbati': 'Sharbati Wheat',
  'kathi wheat': 'Kathi Wheat',
  'kathi gehu': 'Kathi Wheat',
  'durum': 'Kathi Wheat',
  'khapli wheat': 'Khapli Wheat (Emmer)',
  'khapli': 'Khapli Wheat (Emmer)',
  'emmer': 'Khapli Wheat (Emmer)',
  'khapli wheat (emmer)': 'Khapli Wheat (Emmer)',
  'black wheat': 'Black Wheat',
  'kala gehu': 'Black Wheat',

  // Barley / Jau
  'barley': 'Barley (Jau)',
  'jau': 'Barley (Jau)',
  'jau (barley grains)': 'Barley (Jau)',
  'barley grains': 'Barley (Jau)',
  'barley (jau)': 'Barley (Jau)',

  // Chana / Bengal Gram
  'bengal gram': 'Bengal Gram (Chana)',
  'chana': 'Bengal Gram (Chana)',
  'desi chana': 'Bengal Gram (Chana)',
  'roasted desi chana': 'Bengal Gram (Chana)',
  'roasted chana': 'Bengal Gram (Chana)',
  'kala chana': 'Bengal Gram (Chana)',
  'bengal gram (chana)': 'Bengal Gram (Chana)',

  // Soybean
  'soybean': 'Soybean',
  'defatted soybean': 'Soybean',
  'soya': 'Soybean',
  'soy': 'Soybean',

  // Sorghum / Jowar
  'sorghum': 'Sorghum (Jowar)',
  'jowar': 'Sorghum (Jowar)',
  'jowar (sorghum)': 'Sorghum (Jowar)',
  'sorghum (jowar)': 'Sorghum (Jowar)',

  // Pearl Millet / Bajra
  'pearl millet': 'Pearl Millet (Bajra)',
  'bajra': 'Pearl Millet (Bajra)',
  'bajra (pearl millet)': 'Pearl Millet (Bajra)',
  'pearl millet (bajra)': 'Pearl Millet (Bajra)',

  // Finger Millet / Ragi
  'finger millet': 'Finger Millet (Ragi)',
  'ragi': 'Finger Millet (Ragi)',
  'ragi (finger millet)': 'Finger Millet (Ragi)',
  'finger millet (ragi)': 'Finger Millet (Ragi)',

  // Corn / Makka
  'corn': 'Corn (Makka)',
  'makka': 'Corn (Makka)',
  'makka (corn)': 'Corn (Makka)',
  'corn (makka)': 'Corn (Makka)',
  'maize': 'Corn (Makka)',

  // Oats
  'oats': 'Oats',
  'rolled oats': 'Oats',

  // Quinoa
  'quinoa': 'Quinoa',

  // Amaranth / Rajgira
  'amaranth': 'Amaranth (Rajgira)',
  'rajgira': 'Amaranth (Rajgira)',
  'amaranth (rajgira)': 'Amaranth (Rajgira)',
  'kodo millet': 'Amaranth (Rajgira)',

  // Chia Seeds
  'chia seeds': 'Chia Seeds',
  'chia': 'Chia Seeds',
  'pumpkin seeds': 'Chia Seeds',

  // White Sesame / Til
  'white sesame seeds': 'White Sesame Seeds (Safed Til)',
  'safed til': 'White Sesame Seeds (Safed Til)',
  'sesame seeds': 'White Sesame Seeds (Safed Til)',
  'til': 'White Sesame Seeds (Safed Til)',
  'white sesame seeds (safed til)': 'White Sesame Seeds (Safed Til)',

  // Fenugreek / Methi
  'fenugreek seeds': 'Fenugreek Seeds (Methi Dana)',
  'methi dana': 'Fenugreek Seeds (Methi Dana)',
  'methi': 'Fenugreek Seeds (Methi Dana)',
  'fenugreek seeds (methi dana)': 'Fenugreek Seeds (Methi Dana)'
};

/**
 * Resolves a query string (name, ID, or alias) to the matching Grain document in grainsList
 */
export function resolveGrainDoc(query, grainsList = []) {
  if (!query || !Array.isArray(grainsList) || grainsList.length === 0) return null;

  // 1. Direct ID / Code Match
  const directId = grainsList.find(g => 
    (g._id && g._id.toString() === String(query)) ||
    (g.id && String(g.id) === String(query)) ||
    (g.ingredientId && g.ingredientId.toLowerCase() === String(query).toLowerCase()) ||
    (g.code && g.code.toLowerCase() === String(query).toLowerCase())
  );
  if (directId) return directId;

  const rawName = String(query).trim();
  const lowerName = rawName.toLowerCase();

  // 2. Exact Name Match (case-insensitive)
  const exact = grainsList.find(g => g.name && g.name.toLowerCase() === lowerName);
  if (exact) return exact;

  // 3. Clean string match (strip punctuation, parentheses, slashes)
  const cleanStr = (s) => (s || '').replace(/[\(\)\/\-_,]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
  const cleanQuery = cleanStr(rawName);
  const cleanMatch = grainsList.find(g => g.name && cleanStr(g.name) === cleanQuery);
  if (cleanMatch) return cleanMatch;

  // 4. Check known alias dictionary
  const aliasTarget = GRAIN_ALIASES[lowerName] || GRAIN_ALIASES[cleanQuery];
  if (aliasTarget) {
    const aliasMatch = grainsList.find(g => g.name && g.name.toLowerCase() === aliasTarget.toLowerCase());
    if (aliasMatch) return aliasMatch;
  }

  // 5. Special keyword stems
  if (cleanQuery.includes('flax') || cleanQuery.includes('alsi')) {
    const flax = grainsList.find(g => g.name && (g.name.toLowerCase().includes('flax') || g.name.toLowerCase().includes('alsi')));
    if (flax) return flax;
  }
  if (cleanQuery.includes('sharbati') || (cleanQuery.includes('wheat') && !cleanQuery.includes('black') && !cleanQuery.includes('kathi') && !cleanQuery.includes('khapli'))) {
    const sharbati = grainsList.find(g => g.name && g.name.toLowerCase().includes('sharbati'));
    if (sharbati) return sharbati;
  }
  if (cleanQuery.includes('chana') || cleanQuery.includes('bengal gram')) {
    const chana = grainsList.find(g => g.name && (g.name.toLowerCase().includes('chana') || g.name.toLowerCase().includes('bengal gram')));
    if (chana) return chana;
  }
  if (cleanQuery.includes('jau') || cleanQuery.includes('barley')) {
    const jau = grainsList.find(g => g.name && (g.name.toLowerCase().includes('jau') || g.name.toLowerCase().includes('barley')));
    if (jau) return jau;
  }
  if (cleanQuery.includes('soy') || cleanQuery.includes('soya')) {
    const soy = grainsList.find(g => g.name && g.name.toLowerCase().includes('soy'));
    if (soy) return soy;
  }
  if (cleanQuery.includes('jowar') || cleanQuery.includes('sorghum')) {
    const jowar = grainsList.find(g => g.name && (g.name.toLowerCase().includes('jowar') || g.name.toLowerCase().includes('sorghum')));
    if (jowar) return jowar;
  }
  if (cleanQuery.includes('bajra') || cleanQuery.includes('pearl millet')) {
    const bajra = grainsList.find(g => g.name && (g.name.toLowerCase().includes('bajra') || g.name.toLowerCase().includes('pearl millet')));
    if (bajra) return bajra;
  }
  if (cleanQuery.includes('ragi') || cleanQuery.includes('finger millet')) {
    const ragi = grainsList.find(g => g.name && (g.name.toLowerCase().includes('ragi') || g.name.toLowerCase().includes('finger millet')));
    if (ragi) return ragi;
  }
  if (cleanQuery.includes('makka') || cleanQuery.includes('corn') || cleanQuery.includes('maize')) {
    const makka = grainsList.find(g => g.name && (g.name.toLowerCase().includes('makka') || g.name.toLowerCase().includes('corn')));
    if (makka) return makka;
  }
  if (cleanQuery.includes('chia')) {
    const chia = grainsList.find(g => g.name && g.name.toLowerCase().includes('chia'));
    if (chia) return chia;
  }
  if (cleanQuery.includes('til') || cleanQuery.includes('sesame')) {
    const til = grainsList.find(g => g.name && (g.name.toLowerCase().includes('til') || g.name.toLowerCase().includes('sesame')));
    if (til) return til;
  }
  if (cleanQuery.includes('methi') || cleanQuery.includes('fenugreek')) {
    const methi = grainsList.find(g => g.name && (g.name.toLowerCase().includes('methi') || g.name.toLowerCase().includes('fenugreek')));
    if (methi) return methi;
  }
  if (cleanQuery.includes('rajgira') || cleanQuery.includes('amaranth')) {
    const rajgira = grainsList.find(g => g.name && (g.name.toLowerCase().includes('rajgira') || g.name.toLowerCase().includes('amaranth')));
    if (rajgira) return rajgira;
  }
  if (cleanQuery.includes('oat')) {
    const oat = grainsList.find(g => g.name && g.name.toLowerCase().includes('oat'));
    if (oat) return oat;
  }
  if (cleanQuery.includes('quinoa')) {
    const quinoa = grainsList.find(g => g.name && g.name.toLowerCase().includes('quinoa'));
    if (quinoa) return quinoa;
  }
  if (cleanQuery.includes('emmer') || cleanQuery.includes('khapli')) {
    const khapli = grainsList.find(g => g.name && (g.name.toLowerCase().includes('khapli') || g.name.toLowerCase().includes('emmer')));
    if (khapli) return khapli;
  }
  if (cleanQuery.includes('kathi')) {
    const kathi = grainsList.find(g => g.name && g.name.toLowerCase().includes('kathi'));
    if (kathi) return kathi;
  }
  if (cleanQuery.includes('black wheat')) {
    const black = grainsList.find(g => g.name && g.name.toLowerCase().includes('black wheat'));
    if (black) return black;
  }

  // 6. Substring match
  const subMatch = grainsList.find(g => 
    g.name && (cleanQuery.includes(cleanStr(g.name)) || cleanStr(g.name).includes(cleanQuery))
  );
  if (subMatch) return subMatch;

  return null;
}

/**
 * Returns the canonical grain name for any alias or variant name
 */
export function canonicalGrainName(query, grainsList = []) {
  const doc = resolveGrainDoc(query, grainsList);
  return doc ? doc.name : query;
}

/**
 * Normalizes an ingredients map (e.g. { 'Flaxseeds (Alsi / Omega-3)': 1, 'Whole Sharbati Wheat': 75 })
 * so all keys become the canonical Grain.name present in grainsList
 */
export function normalizeIngredientsMap(inputMap, grainsList = []) {
  const normalized = {};
  if (!inputMap || typeof inputMap !== 'object') return normalized;

  Object.entries(inputMap).forEach(([name, wtOrPct]) => {
    const val = Number(wtOrPct) || 0;
    if (val > 0) {
      const canonical = canonicalGrainName(name, grainsList);
      normalized[canonical] = Number(((normalized[canonical] || 0) + val).toFixed(2));
    }
  });

  return normalized;
}
