import React from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Sliders, 
  ArrowRight, 
  Heart, 
  Flame, 
  Zap, 
  Award,
  Layers,
  Clock,
  Compass
} from 'lucide-react';

export function HomeView({ onExploreStudio, onSelectDoctorBlend }) {
  return (
    <div className="space-y-10 pb-28">
      
      {/* ========================================================
          HERO SECTION: HAUTE ARTISANAL LUXURY
          ======================================================== */}
      <section className="relative overflow-hidden border-b border-[#2e2a20] bg-gradient-to-b from-[#181818] via-[#131313] to-[#0e0e0e] py-12 md:py-16 px-4">
        
        {/* Subtle radial gold backlight */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#d4af37]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center space-y-5 relative z-10">
          
          {/* Emblem & Tagline */}
          <div className="inline-flex items-center space-x-2 border border-[#d4af37]/50 bg-[#1c1a14] px-3.5 py-1 text-xs">
            <span className="w-2 h-2 rounded-full bg-[#f2ca50] animate-pulse"></span>
            <span className="font-editorial italic text-[#f2ca50] text-sm">रोटी में स्वाद, स्वास्थ्य के साथ</span>
          </div>

          <h1 className="font-editorial text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#fdfbf7] tracking-tight leading-tight max-w-2xl mx-auto">
            Slow Stone Cold-Ground <br />
            <span className="text-[#f2ca50] italic font-normal">Ayurvedic Multigrain Atta</span>
          </h1>

          <p className="font-sans text-xs sm:text-sm text-[#d0c5af] max-w-xl mx-auto leading-relaxed">
            Freshly milled to order on low-temperature stone chakkis. Zero preservatives, zero stale supermarket warehousing. Customize your exact grain ratio or choose doctor-calibrated blends.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <button
              onClick={() => onExploreStudio('doctorBlends')}
              className="w-full sm:w-auto py-3.5 px-6 bg-[#d4af37] hover:bg-[#f2ca50] text-[#121212] font-sans font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-2 transition-all shadow-[0_0_25px_rgba(212,175,55,0.25)]"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>DOCTOR BLENDS (5 RECIPES)</span>
            </button>

            <button
              onClick={() => onExploreStudio('customBlender')}
              className="w-full sm:w-auto py-3.5 px-6 border border-[#d4af37]/70 hover:border-[#f2ca50] bg-[#1a1a1a] hover:bg-[#252219] text-[#f2ca50] font-sans font-bold text-xs uppercase tracking-caps flex items-center justify-center space-x-2 transition-all"
            >
              <Sliders className="w-4 h-4" />
              <span>CUSTOM CHAKKI BLENDER</span>
            </button>
          </div>

          {/* Chakki Status Badges */}
          <div className="grid grid-cols-3 gap-2 max-w-lg mx-auto pt-4 border-t border-[#2e2a20] text-center text-[10px] md:text-xs text-[#99907c]">
            <div className="p-2 bg-[#161616] border border-[#2e2a20]">
              <span className="text-[#f2ca50] font-bold block">280 RPM</span>
              <span>Cold-Stone Grinding</span>
            </div>
            <div className="p-2 bg-[#161616] border border-[#2e2a20]">
              <span className="text-emerald-400 font-bold block">100% Heirloom</span>
              <span>MP Sharbati Sehore</span>
            </div>
            <div className="p-2 bg-[#161616] border border-[#2e2a20]">
              <span className="text-[#64b5f6] font-bold block">Milled on Order</span>
              <span>Delivered in 2 Hours</span>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          SIGNATURE BLENDS PREVIEW SECTION
          ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 space-y-6">
        
        <div className="flex items-end justify-between border-b border-[#2e2a20] pb-3">
          <div>
            <span className="text-[10px] uppercase font-bold tracking-caps text-[#c5a059] block">
              VEDIC NUTRITIONAL RIGOR
            </span>
            <h2 className="font-editorial text-xl md:text-2xl font-bold text-[#fdfbf7]">
              Doctor-Crafted Signature Blends
            </h2>
          </div>

          <button
            onClick={() => onExploreStudio('doctorBlends')}
            className="text-xs text-[#f2ca50] hover:underline flex items-center space-x-1 uppercase font-bold tracking-wider"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Card 1 */}
          <div 
            onClick={() => onSelectDoctorBlend('Everyday Soft Multigrain Atta')}
            className="p-4 sm:p-5 bg-[#181818] border-2 border-[#2e2a20] hover:border-[#d4af37] transition-all cursor-pointer space-y-3 group rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] sm:text-xs uppercase font-black tracking-caps px-2.5 py-1 border border-[#d4af37]/60 text-[#f2ca50] bg-[#d4af37]/10 rounded-lg">
                SOFT & PUFFY ROTIS
              </span>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-[#99907c] block">Price:</span>
                <span className="font-sans font-black text-lg text-[#fdfbf7]">₹68/kg</span>
              </div>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-black text-[#fdfbf7] group-hover:text-[#f2ca50] transition-colors leading-snug">
              Everyday Soft Multigrain Atta
            </h3>
            <div className="pt-0.5">
              <span className="text-[11px] uppercase font-black tracking-wider text-[#d4af37] block">
                Exact Grain Composition:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#EDE8DF] leading-relaxed mt-0.5">
                Whole Wheat 75%, Roasted Chana 10%, Jau 5%, Soybean 4%, Jowar 3%, Isabgol 2%, Flaxseed 1%.
              </p>
            </div>
            <span className="text-xs text-[#f2ca50] uppercase font-black flex items-center space-x-1.5 pt-1">
              <span>Formulate This Blend</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 2 */}
          <div 
            onClick={() => onSelectDoctorBlend('High-Protein & Fitness Flour')}
            className="p-4 sm:p-5 bg-[#181818] border-2 border-[#2e2a20] hover:border-[#64b5f6] transition-all cursor-pointer space-y-3 group rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] sm:text-xs uppercase font-black tracking-caps px-2.5 py-1 border border-sky-500/50 text-sky-400 bg-sky-950/20 rounded-lg">
                22G PROTEIN / 100G
              </span>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-[#99907c] block">Price:</span>
                <span className="font-sans font-black text-lg text-[#fdfbf7]">₹82/kg</span>
              </div>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-black text-[#fdfbf7] group-hover:text-sky-400 transition-colors leading-snug">
              High-Protein & Fitness Flour
            </h3>
            <div className="pt-0.5">
              <span className="text-[11px] uppercase font-black tracking-wider text-sky-400 block">
                Exact Grain Composition:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#EDE8DF] leading-relaxed mt-0.5">
                Whole Wheat 60%, Soybean 15%, Roasted Chana 12%, Jau 8%, Flaxseed 3%, Isabgol 2%.
              </p>
            </div>
            <span className="text-xs text-sky-400 uppercase font-black flex items-center space-x-1.5 pt-1">
              <span>Formulate This Blend</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 3 */}
          <div 
            onClick={() => onSelectDoctorBlend('Low-GI Diabetic Care Flour')}
            className="p-4 sm:p-5 bg-[#181818] border-2 border-[#2e2a20] hover:border-emerald-500 transition-all cursor-pointer space-y-3 group rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] sm:text-xs uppercase font-black tracking-caps px-2.5 py-1 border border-emerald-500/50 text-emerald-400 bg-emerald-950/20 rounded-lg">
                LOW GLYCEMIC INDEX
              </span>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-[#99907c] block">Price:</span>
                <span className="font-sans font-black text-lg text-[#fdfbf7]">₹78/kg</span>
              </div>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-black text-[#fdfbf7] group-hover:text-emerald-400 transition-colors leading-snug">
              Low-GI Diabetic Care Flour
            </h3>
            <div className="pt-0.5">
              <span className="text-[11px] uppercase font-black tracking-wider text-emerald-400 block">
                Exact Grain Composition:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#EDE8DF] leading-relaxed mt-0.5">
                Whole Wheat 50%, Jau 20%, Roasted Chana 10%, Jowar 8%, Bajra 5%, Isabgol 4%, Flaxseed 3%.
              </p>
            </div>
            <span className="text-xs text-emerald-400 uppercase font-black flex items-center space-x-1.5 pt-1">
              <span>Formulate This Blend</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

          {/* Card 4 */}
          <div 
            onClick={() => onSelectDoctorBlend('Calcium & Bone-Health Millet Blend')}
            className="p-4 sm:p-5 bg-[#181818] border-2 border-[#2e2a20] hover:border-purple-500 transition-all cursor-pointer space-y-3 group rounded-2xl shadow-sm"
          >
            <div className="flex justify-between items-start gap-2">
              <span className="text-[10px] sm:text-xs uppercase font-black tracking-caps px-2.5 py-1 border border-purple-500/50 text-purple-300 bg-purple-950/20 rounded-lg">
                HIGH CALCIUM & IRON
              </span>
              <div className="text-right">
                <span className="text-[10px] uppercase font-black text-[#99907c] block">Price:</span>
                <span className="font-sans font-black text-lg text-[#fdfbf7]">₹75/kg</span>
              </div>
            </div>
            <h3 className="font-editorial text-lg sm:text-xl font-black text-[#fdfbf7] group-hover:text-purple-300 transition-colors leading-snug">
              Calcium & Bone-Health Millet Blend
            </h3>
            <div className="pt-0.5">
              <span className="text-[11px] uppercase font-black tracking-wider text-purple-300 block">
                Exact Grain Composition:
              </span>
              <p className="text-xs sm:text-sm font-semibold text-[#EDE8DF] leading-relaxed mt-0.5">
                Whole Wheat 65%, Ragi 12%, Jowar 8%, Chana 6%, Bajra 5%, Flaxseed 2%, Isabgol 2%.
              </p>
            </div>
            <span className="text-xs text-purple-300 uppercase font-black flex items-center space-x-1.5 pt-1">
              <span>Formulate This Blend</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </span>
          </div>

        </div>

      </section>

      {/* ========================================================
          THE STONE CHAKKI DIFFERENCE (4-STEP CRAFTSMANSHIP)
          ======================================================== */}
      <section className="max-w-4xl mx-auto px-4 py-6">
        <div className="p-6 bg-[#161616] border border-[#2e2a20] space-y-6">
          <div className="text-center space-y-1">
            <span className="text-[10px] uppercase font-bold tracking-caps text-[#c5a059]">
              ANCIENT WISDOM • CLINICAL PURITY
            </span>
            <h2 className="font-editorial text-xl md:text-2xl font-bold text-[#fdfbf7]">
              Why Arogyabhog Stone Cold-Milling?
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            
            <div className="p-3.5 bg-[#121212] border border-[#2e2a20] space-y-1.5">
              <span className="text-sm font-bold text-[#f2ca50] font-mono">01</span>
              <h4 className="font-bold text-[#fdfbf7]">No High-Heat Burn</h4>
              <p className="text-[11px] text-[#99907c] leading-relaxed">
                Industrial roller mills heat flour excessively, degrading delicate nutrients. Our slow stone chakki milling keeps grains cool and unburnt.
              </p>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#2e2a20] space-y-1.5">
              <span className="text-sm font-bold text-[#f2ca50] font-mono">02</span>
              <h4 className="font-bold text-[#fdfbf7]">100% Germ Intact</h4>
              <p className="text-[11px] text-[#99907c] leading-relaxed">
                Wheat germ oil and bran are retained intact, delivering natural vitamin E, magnesium, and prebiotic fibers.
              </p>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#2e2a20] space-y-1.5">
              <span className="text-sm font-bold text-[#f2ca50] font-mono">03</span>
              <h4 className="font-bold text-[#fdfbf7]">Zero Stale Storage</h4>
              <p className="text-[11px] text-[#99907c] leading-relaxed">
                We never store packaged flour in warehouses. Grains are ground only after your order is confirmed.
              </p>
            </div>

            <div className="p-3.5 bg-[#121212] border border-[#2e2a20] space-y-1.5">
              <span className="text-sm font-bold text-[#f2ca50] font-mono">04</span>
              <h4 className="font-bold text-[#fdfbf7]">Bespoke Ratios</h4>
              <p className="text-[11px] text-[#99907c] leading-relaxed">
                Control the percentage of barley, ragi, chana, flaxseeds or thyroid millets down to single grams.
              </p>
            </div>

          </div>
        </div>
      </section>

    </div>
  );
}
