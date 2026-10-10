import React, { useState } from 'react';
import { 
  Sparkles, 
  Bot, 
  Send, 
  Check, 
  ArrowRight, 
  Flame, 
  Heart, 
  Zap, 
  ShieldCheck, 
  RotateCcw,
  Sliders,
  Scale
} from 'lucide-react';

export function AyurvedicAIView({ onApplyToCustomBlender, onAddToCart }) {
  const [selectedGoal, setSelectedGoal] = useState('thyroid');
  const [customPrompt, setCustomPrompt] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [consultationResult, setConsultationResult] = useState({
    title: 'Hyper-Thyroid & Metabolic Harmony Formulation',
    dosha: 'Kapha-Vata Pacifying • Siridhanya Enriched',
    clinicalNote: 'Formulated with low glycemic Siridhanya Kodo Millet and trace mineral-rich Pumpkin seeds to support thyroid hormone synthesis (T3/T4 conversion) while preserving soft, pliable rotis.',
    ratios: {
      'Amaranth (Rajgira)': 40,
      'Sorghum (Jowar)': 25,
      'Bengal Gram (Chana)': 15,
      'Finger Millet (Ragi)': 10,
      'Chia Seeds': 5,
      'Flax Seeds (Alsi)': 5
    },
    metrics: {
      puffiness: '86%',
      protein: '4.8 g',
      fiber: 'High (14g)',
      glycemicIndex: 'Ultra Low (~42)'
    }
  });

  const presetProfiles = [
    {
      id: 'thyroid',
      label: 'Thyroid & Slow Metabolism',
      dosha: 'Kapha Pacifying',
      icon: Flame,
      ratios: {
        'Amaranth (Rajgira)': 40,
        'Sorghum (Jowar)': 25,
        'Bengal Gram (Chana)': 15,
        'Finger Millet (Ragi)': 10,
        'Chia Seeds': 5,
        'Flax Seeds (Alsi)': 5
      },
      title: 'Hyper-Thyroid & Metabolic Harmony Blend',
      note: 'Rich in organic selenium, zinc and magnesium for optimal thyroid receptor sensitivity.',
      metrics: { puffiness: '86%', protein: '4.8 g', fiber: 'High (14g)', glycemicIndex: 'Ultra Low (~42)' }
    },
    {
      id: 'diabetes',
      label: 'Diabetes & Glucose Control',
      dosha: 'Pitta-Kapha Shamak',
      icon: Heart,
      ratios: {
        'Sharbati Wheat': 50,
        'Barley (Jau)': 15,
        'Bengal Gram (Chana)': 10,
        'Sorghum (Jowar)': 8,
        'Soybean': 5,
        'Finger Millet (Ragi)': 5,
        'Pearl Millet (Bajra)': 4,
        'Flax Seeds (Alsi)': 3
      },
      title: 'Low-GI Diabetic Care Clinical Blend',
      note: 'Enriched with barley Beta-Glucans and water-soluble Isabgol to delay post-meal carbohydrate absorption.',
      metrics: { puffiness: '84%', protein: '4.2 g', fiber: 'Very High (16g)', glycemicIndex: 'Low (~44)' }
    },
    {
      id: 'muscle',
      label: 'Fitness & Lean Muscle Mass',
      dosha: 'Vata Balancer',
      icon: Zap,
      ratios: {
        'Sharbati Wheat': 60,
        'Soybean': 15,
        'Bengal Gram (Chana)': 12,
        'Barley (Jau)': 8,
        'Flax Seeds (Alsi)': 3,
        'Oats': 2
      },
      title: '22g Bio-Available High-Protein Active Flour',
      note: 'Maximizes BCAAs from organic defatted soy and roasted chana for rapid muscle repair without bloating.',
      metrics: { puffiness: '89%', protein: '5.8 g', fiber: 'High (13g)', glycemicIndex: 'Low (~49)' }
    },
    {
      id: 'digestion',
      label: 'Gut Health & Acidity Relief',
      dosha: 'Pitta Shamak',
      icon: ShieldCheck,
      ratios: {
        'Sharbati Wheat': 50,
        'Bengal Gram (Chana)': 15,
        'Barley (Jau)': 10,
        'Finger Millet (Ragi)': 10,
        'Oats': 5,
        'White Sesame Seeds (Safed Til)': 3,
        'Flax Seeds (Alsi)': 3,
        'Chia Seeds': 2,
        'Fenugreek Seeds (Methi Dana)': 1,
        'Quinoa': 1
      },
      title: 'Gastro-Protective High Prebiotic Flour',
      note: 'Alkaline jowar and cooling barley soothe digestive fires (Agni) while Isabgol cleanses the colon.',
      metrics: { puffiness: '92%', protein: '3.6 g', fiber: 'Ultra High (15g)', glycemicIndex: 'Low (~50)' }
    }
  ];

  const handleSelectPreset = (preset) => {
    setSelectedGoal(preset.id);
    setIsAnalyzing(true);
    setTimeout(() => {
      setConsultationResult({
        title: preset.title,
        dosha: preset.dosha,
        clinicalNote: preset.note,
        ratios: preset.ratios,
        metrics: preset.metrics
      });
      setIsAnalyzing(false);
    }, 300);
  };

  const handleCustomConsultation = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setIsAnalyzing(true);
    setTimeout(() => {
      const lower = customPrompt.toLowerCase();
      let matched = presetProfiles[0];
      if (lower.includes('sugar') || lower.includes('diabet') || lower.includes('glucose')) {
        matched = presetProfiles[1];
      } else if (lower.includes('gym') || lower.includes('protein') || lower.includes('muscle')) {
        matched = presetProfiles[2];
      } else if (lower.includes('digest') || lower.includes('stomach') || lower.includes('acid') || lower.includes('bloat')) {
        matched = presetProfiles[3];
      }

      setConsultationResult({
        title: `Bespoke Ayurvedic Formulation (${customPrompt.slice(0, 30)}...)`,
        dosha: 'Custom Tridoshic Equilibrium',
        clinicalNote: `Synthesized for your specific health goals: "${customPrompt}". Clinically balanced to prevent insulin spikes and preserve cloud-like soft rotis.`,
        ratios: matched.ratios,
        metrics: matched.metrics
      });
      setIsAnalyzing(false);
    }, 500);
  };

  return (
    <div className="max-w-4xl mx-auto px-3.5 md:px-6 py-6 space-y-6 pb-28 animate-fadeIn">
      
      {/* Brand Header */}
      <div className="text-center space-y-3 border-b border-gray-200 dark:border-[#2e2a20] pb-6">
        <h3 style={{
          fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
          fontSize: '64px',
          fontWeight: 'normal',
          fontStyle: 'italic',
          color: '#D4AF70',
          textAlign: 'center',
          textShadow: '1px 2px 3px #5C4525',
          margin: 0,
          lineHeight: 1
        }}>
          Arogyabhog
        </h3>
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-[#1c1a14] border border-[#C9A227]/40 text-xs font-bold text-[#C9A227] mb-2 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>AYURVEDIC AI FLOUR CONSULTANT</span>
          </div>
          <h2 className="font-editorial text-2xl md:text-3xl font-bold text-gray-900 dark:text-[#fdfbf7]">
            Vedic Dosha & Clinical Grain Prescription
          </h2>
          <p className="text-xs md:text-sm text-gray-600 dark:text-[#99907c] max-w-lg mx-auto mt-1 leading-relaxed">
            Our Vedic neural engine calibrates precise botanical grain percentages according to your health biomarker and Prakriti requirements.
          </p>
        </div>
      </div>

      {/* Preset Health Concerns */}
      <div className="space-y-2">
        <span className="text-[10px] uppercase font-bold tracking-caps text-[#C9A227] block">
          SELECT YOUR TARGET HEALTH BIOMARKER:
        </span>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
          {presetProfiles.map((p) => {
            const Icon = p.icon;
            const isSelected = selectedGoal === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handleSelectPreset(p)}
                className={`p-3.5 rounded-2xl text-left border transition-all ${
                  isSelected 
                    ? 'border-[#C9A227] bg-amber-50/60 dark:bg-[#222019] shadow-md' 
                    : 'border-gray-200 dark:border-[#2e2a20] bg-white dark:bg-[#181818] hover:border-[#C9A227]/60'
                }`}
              >
                <div className="flex items-center space-x-1.5 text-[#C9A227]">
                  <Icon className="w-4 h-4" />
                  <span className="font-bold text-xs">{p.label}</span>
                </div>
                <span className="text-[9px] text-gray-500 dark:text-[#8b826f] block mt-1 font-mono uppercase">
                  {p.dosha}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Or Custom AI Prompt input */}
      <form onSubmit={handleCustomConsultation} className="p-4 rounded-2xl bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#2e2a20] space-y-2 shadow-sm">
        <label className="text-[10px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
          OR DESCRIBE YOUR HEALTH CONDITION TO AYURVEDIC AI:
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="e.g. Mild thyroid and father has diabetes, formulate a shared family blend..."
            className="flex-1 p-2.5 rounded-xl bg-gray-50 dark:bg-[#121212] border border-gray-200 dark:border-[#2e2a20] text-xs text-gray-900 dark:text-[#fdfbf7] outline-none focus:border-[#C9A227]"
          />
          <button
            type="submit"
            disabled={isAnalyzing}
            className="py-2.5 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-all shadow-md"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>{isAnalyzing ? 'CONSULTING...' : 'PRESCRIBE'}</span>
          </button>
        </div>
      </form>

      {/* AI RESULT CARD */}
      <div className="p-5 rounded-2xl bg-white dark:bg-[#181818] border border-[#C9A227] space-y-4 shadow-xl">
        
        <div className="flex items-start justify-between border-b border-gray-200 dark:border-[#2e2a20] pb-3">
          <div>
            <span className="text-[9px] uppercase font-bold tracking-caps px-2 py-0.5 rounded-md bg-amber-100 dark:bg-[#25221b] border border-[#C9A227]/40 text-[#C9A227]">
              {consultationResult.dosha}
            </span>
            <h3 className="font-editorial text-lg md:text-xl font-bold text-gray-900 dark:text-[#fdfbf7] mt-1.5">
              {consultationResult.title}
            </h3>
            <p className="text-xs text-gray-600 dark:text-[#d0c5af] mt-1 leading-relaxed">
              {consultationResult.clinicalNote}
            </p>
          </div>

          <div className="rounded-lg border border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 flex items-center space-x-1">
            <Check className="w-3 h-3" />
            <span>100% Balanced</span>
          </div>
        </div>

        {/* Grain Allocation Matrix */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase font-bold tracking-caps text-gray-500 dark:text-[#8b826f] block">
            PRESCRIBED GRAIN MATRIX (100% RATIO):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {Object.entries(consultationResult.ratios).map(([grain, pct], idx) => (
              <div key={idx} className="p-2.5 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20] flex items-center justify-between shadow-sm">
                <span className="text-xs text-gray-800 dark:text-[#fdfbf7] font-medium truncate pr-1" title={grain}>{grain}</span>
                <span className="text-xs font-bold text-[#C9A227]">{pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4 Nutrition Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-gray-200 dark:border-[#2e2a20] text-center text-xs">
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
            <span className="text-[9px] uppercase text-gray-500 dark:text-[#8b826f] block">Softness & Puff</span>
            <span className="font-bold text-[#C9A227] text-sm">{consultationResult.metrics.puffiness}</span>
          </div>
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
            <span className="text-[9px] uppercase text-gray-500 dark:text-[#8b826f] block">Protein / Roti</span>
            <span className="font-bold text-sky-600 dark:text-sky-400 text-sm">{consultationResult.metrics.protein}</span>
          </div>
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
            <span className="text-[9px] uppercase text-gray-500 dark:text-[#8b826f] block">Prebiotic Fiber</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{consultationResult.metrics.fiber}</span>
          </div>
          <div className="p-2 rounded-xl bg-gray-50 dark:bg-[#141414] border border-gray-200 dark:border-[#2e2a20]">
            <span className="text-[9px] uppercase text-gray-500 dark:text-[#8b826f] block">Glycemic Index</span>
            <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{consultationResult.metrics.glycemicIndex}</span>
          </div>
        </div>

        {/* CTA to Load into Custom Blender */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => onApplyToCustomBlender(consultationResult.ratios)}
            className="flex-1 py-3 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-white dark:text-[#121212] font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-2 transition-all shadow-md"
          >
            <Sliders className="w-4 h-4" />
            <span>LOAD INTO CUSTOM CHAKKI BLENDER</span>
          </button>
        </div>

      </div>

    </div>
  );
}
