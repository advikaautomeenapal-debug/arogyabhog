/**
 * Arogya Bhog 16-Nutrient Calculation Engine
 * Calculates nutritional values:
 * 1. Per 100 g
 * 2. Per Serving (configurable, default 50 g flour = ~2 phulkas)
 * 3. Total in ordered quantity (batchSizeKg * quantity * 1000 grams)
 * 
 * Accurately preserves null/unmeasured nutrients as null/em-dash ('—'), never fabricating zeros.
 */

export const NUTRIENT_DEFINITIONS = [
  { key: 'energyKcal', label: 'Energy', unit: 'kcal' },
  { key: 'proteinG', label: 'Protein', unit: 'g' },
  { key: 'carbsG', label: 'Carbohydrates', unit: 'g' },
  { key: 'sugarsG', label: 'Total Sugars', unit: 'g' },
  { key: 'addedSugarsG', label: 'Added Sugars', unit: 'g' },
  { key: 'fatG', label: 'Total Fat', unit: 'g' },
  { key: 'saturatedFatG', label: 'Saturated Fat', unit: 'g' },
  { key: 'transFatG', label: 'Trans Fat', unit: 'g' },
  { key: 'fibreG', label: 'Dietary Fibre', unit: 'g' },
  { key: 'sodiumMg', label: 'Sodium', unit: 'mg' },
  { key: 'zincMg', label: 'Zinc', unit: 'mg' },
  { key: 'magnesiumMg', label: 'Magnesium', unit: 'mg' },
  { key: 'phosphorusMg', label: 'Phosphorus', unit: 'mg' },
  { key: 'ironMg', label: 'Iron', unit: 'mg' },
  { key: 'calciumMg', label: 'Calcium', unit: 'mg' },
  { key: 'potassiumMg', label: 'Potassium', unit: 'mg' }
];

import { resolveGrainDoc } from './grainResolver';

/**
 * Calculates 16-nutrient breakdown for any grain breakdown formula
 */
export function calculateProductNutrition(grainBreakdown, batchSizeKg = 5, quantity = 1, grainsMaster = [], servingSizeG = 50) {
  const grainMap = {};
  if (Array.isArray(grainsMaster)) {
    grainsMaster.forEach(g => {
      grainMap[g.name] = g;
      if (g.ingredientId) grainMap[g.ingredientId] = g;
      if (g._id) grainMap[g._id.toString()] = g;
    });
  }

  const totalGrams = (Number(batchSizeKg) || 5) * (Number(quantity) || 1) * 1000;
  const per100g = {};
  const perServing = {};
  const perOrderedQuantity = {};

  for (const nutrient of NUTRIENT_DEFINITIONS) {
    const k = nutrient.key;
    let sum = 0;
    let hasKnown = false;

    if (Array.isArray(grainBreakdown) && grainBreakdown.length > 0) {
      for (const g of grainBreakdown) {
        const grainDoc = grainMap[g.name] || 
          (g.grainId && grainMap[g.grainId.toString()]) ||
          resolveGrainDoc(g.name || g.grainId, grainsMaster);
        
        const pct = Number(g.percentage) || 0;
        if (grainDoc && grainDoc.nutrition && grainDoc.nutrition[k] != null) {
          sum += (pct / 100) * Number(grainDoc.nutrition[k]);
          hasKnown = true;
        }
      }
    }

    if (hasKnown) {
      const val100 = Number(sum.toFixed(1));
      per100g[k] = val100;
      perServing[k] = Number(((val100 * servingSizeG) / 100).toFixed(1));
      perOrderedQuantity[k] = Number(((val100 * totalGrams) / 100).toFixed(1));
    } else {
      per100g[k] = null;
      perServing[k] = null;
      perOrderedQuantity[k] = null;
    }
  }

  return {
    per100g,
    perServing: { ...perServing, servingSizeG },
    perOrderedQuantity: { ...perOrderedQuantity, totalGrams }
  };
}

/**
 * Honest value formatter:
 * Returns formatted number with unit or '—' if missing/unverified.
 */
export function formatNutrientValue(value, unit = '') {
  if (value === null || value === undefined || value === '') {
    return '—';
  }
  const num = Number(value);
  if (isNaN(num)) return '—';
  return unit ? `${num} ${unit}` : `${num}`;
}
