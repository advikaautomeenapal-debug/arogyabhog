import React from 'react';
import { ShieldCheck, Truck, ArrowRight, ArrowLeft, ExternalLink, Lock } from 'lucide-react';
import { getPanelUrl } from '../utils/domainConfig';

export function SubdomainRedirectView({ targetPanel = 'admin', onReturnToStore }) {
  const isAdmin = targetPanel === 'admin' || targetPanel === 'admin-path';
  const targetUrl = getPanelUrl(isAdmin ? 'admin' : 'delivery');
  const storeUrl = getPanelUrl('customer');

  const title = isAdmin ? 'Chakki Administrator Console' : 'Delivery Fleet Portal';
  const subtitle = isAdmin 
    ? 'For security and role isolation, administrative milling management, inventory control, and operational pricing are strictly hosted on the dedicated administrative subdomain.'
    : 'For dispatch coordination, delivery drivers and dispatchers access their assignment board on the dedicated delivery subdomain.';

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F3] flex flex-col justify-between p-4 md:p-8 font-serif selection:bg-[#C9A227] selection:text-[#111111]">
      
      {/* Top Brand Bar */}
      <div className="max-w-4xl mx-auto w-full flex items-center justify-between py-2 border-b border-[#2e2a20]">
        <div className="flex items-center space-x-3">
          <img 
            src="/arogyaBhog_logo.png" 
            alt="Arogyabhog Emblem" 
            className="w-10 h-10 object-contain"
          />
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
        </div>

        <button
          onClick={onReturnToStore}
          className="text-xs text-[#C9A227] hover:underline flex items-center space-x-1"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Return to Store</span>
        </button>
      </div>

      {/* Main Alert Card */}
      <div className="max-w-md w-full mx-auto my-12">
        <div className="rounded-2xl bg-[#181818] border-2 border-[#C9A227] p-6 sm:p-8 shadow-2xl text-center space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-[#22201b] border border-[#C9A227] mx-auto flex items-center justify-center text-[#C9A227] shadow-lg">
            {isAdmin ? <Lock className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
          </div>

          <div className="space-y-2">
            <span className="text-[10px] uppercase font-bold tracking-caps px-3 py-1 rounded-full bg-[#201c13] text-[#C9A227] border border-[#C9A227]/40">
              SUBDOMAIN ACCESS CONTROL
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-white pt-1">
              {title}
            </h1>
            <p className="text-xs text-[#99907c] leading-relaxed">
              {subtitle}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-[#121212] border border-[#2e2a20] text-left text-xs space-y-1 font-sans">
            <span className="text-[10px] uppercase font-bold text-gray-500 block">Dedicated Subdomain Destination:</span>
            <code className="text-[#C9A227] font-mono font-bold break-all block text-xs">
              {targetUrl}
            </code>
          </div>

          <div className="space-y-3 pt-2">
            <a
              href={targetUrl}
              className="w-full py-3.5 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-[#111111] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-md"
            >
              <span>Launch {isAdmin ? 'Admin Console' : 'Delivery Portal'}</span>
              <ExternalLink className="w-4 h-4 stroke-[2.5]" />
            </a>

            <button
              onClick={onReturnToStore}
              className="w-full py-2.5 px-4 rounded-xl border border-gray-700 hover:border-[#C9A227] text-gray-400 hover:text-white text-xs font-bold uppercase tracking-wider transition-all"
            >
              Back to Customer Shopping
            </button>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-4xl mx-auto w-full text-center py-2 text-xs text-gray-600 border-t border-[#2e2a20]/60">
        <p>© 2026 Arogyabhog Artisanal Ayurveda • Secure Subdomain Architecture</p>
      </div>

    </div>
  );
}
