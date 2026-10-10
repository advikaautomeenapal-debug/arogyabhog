import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, ArrowRight, ArrowLeft, AlertCircle, KeyRound, Truck, Store } from 'lucide-react';
import { api } from '../services/api';
import { getPanelUrl } from '../utils/domainConfig';

export function AdminLoginView({ onLoginSuccess }) {
  const [email, setEmail] = useState('admin.meena@arogyabhog.com');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.login(email.trim(), password);
      if (res.success && res.user) {
        if (res.user.role === 'delivery') {
          // Delivery Person logged in on Admin portal -> seamlessly route to Delivery Fleet
          if (onLoginSuccess) {
            onLoginSuccess(res.user);
          }
          window.location.href = getPanelUrl('delivery');
          return;
        }
        if (res.user.role !== 'admin') {
          setErrorMessage('Access Denied: This portal requires Chakki Administrator credentials.');
          return;
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Invalid administrator email or password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const customerStoreUrl = getPanelUrl('customer');
  const deliveryFleetUrl = getPanelUrl('delivery');

  return (
    <div className="min-h-screen bg-[#111111] text-[#F5F5F3] flex flex-col justify-between p-4 md:p-8 font-serif selection:bg-[#C9A227] selection:text-[#111111]">
      
      {/* Top Brand Bar */}
      <div className="max-w-5xl mx-auto w-full flex items-center justify-between py-2 border-b border-[#2e2a20]">
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

        <div className="flex items-center space-x-3 text-xs">
          <a
            href={customerStoreUrl}
            className="hidden sm:flex items-center space-x-1.5 text-gray-400 hover:text-[#C9A227] transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Customer Store</span>
          </a>
          <div className="px-2.5 py-1 rounded-full bg-[#1b1915] border border-[#C9A227]/40 text-[#C9A227] text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-[#C9A227]" />
            <span>Chakki Operations Admin</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="rounded-2xl bg-[#181818] border-2 border-[#C9A227] p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          {/* Subtle gold radial background */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#C9A227]/5 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#22201b] border border-[#C9A227] mx-auto flex items-center justify-center text-[#C9A227] shadow-md">
              <img 
                src="/arogyaBhog_logo.png" 
                alt="Arogyabhog" 
                className="w-11 h-11 object-contain"
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Administrator Portal
            </h1>
            <p className="text-xs text-[#99907c] max-w-xs mx-auto">
              Secure Operations, Live Milling Queue, Grain Pricing & Fleet Governance
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121212] border border-[#2e2a20]">
            <button
              type="button"
              className="py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-[#C9A227] text-[#111111] shadow-sm flex items-center justify-center space-x-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </button>
            <a
              href={deliveryFleetUrl}
              className="py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-sky-400 flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Fleet</span>
            </a>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-500/60 text-rose-200 text-xs flex items-start space-x-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[11px] uppercase font-bold tracking-wider text-[#C9A227] block mb-1.5">
                Admin Email ID
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin.meena@arogyabhog.com"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#121212] border border-[#2e2a20] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A227] transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold tracking-wider text-[#C9A227] block mb-1.5">
                Security Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#121212] border border-[#2e2a20] text-sm text-white placeholder-gray-600 outline-none focus:border-[#C9A227] transition-all font-sans"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-[#C9A227] hover:bg-[#b8911f] text-[#111111] font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-[#C9A227]/20 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Credentials...' : 'Authenticate & Enter Admin Console'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Subdomain Notice */}
          <div className="pt-4 border-t border-[#2e2a20] space-y-2 text-center text-xs text-gray-500">
            <p className="text-[11px] text-[#99907c]">
              This console operates on an isolated administrator subdomain under SSL/TLS with multi-factor audit logging.
            </p>
            <div className="flex items-center justify-center space-x-4 pt-1">
              <a 
                href={customerStoreUrl} 
                className="text-[#C9A227] hover:underline flex items-center space-x-1"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Customer Website</span>
              </a>
              <span>•</span>
              <a 
                href={deliveryFleetUrl} 
                className="text-sky-400 hover:underline flex items-center space-x-1"
              >
                <Truck className="w-3 h-3" />
                <span>Delivery Fleet Portal</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center py-2 text-xs text-gray-600 border-t border-[#2e2a20]/60">
        <p>© 2026 Arogyabhog Artisanal Ayurveda • Unit #4 Gurugram • Strict Administrative Access</p>
      </div>

    </div>
  );
}
