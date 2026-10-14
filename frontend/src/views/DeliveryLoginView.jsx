import React, { useState } from 'react';
import { Truck, Lock, Phone, ArrowRight, ArrowLeft, AlertCircle, ShieldCheck, Store, Shield, Download } from 'lucide-react';
import { api } from '../services/api';
import { getPanelUrl } from '../utils/domainConfig';

export function DeliveryLoginView({ onLoginSuccess, isStandalone = false, onPromptInstall = null }) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsLoading(true);

    try {
      const res = await api.login(identifier.trim(), password);
      if (res.success && res.user) {
        if (res.user.role !== 'delivery' && res.user.role !== 'admin') {
          setErrorMessage('Access Denied: This portal requires Delivery Partner credentials.');
          return;
        }
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
      } else {
        setErrorMessage(res.message || 'Invalid delivery partner credentials.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Authentication failed. Please check network connection.');
    } finally {
      setIsLoading(false);
    }
  };

  const customerStoreUrl = getPanelUrl('customer');
  const adminPortalUrl = getPanelUrl('admin');

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
          {!isStandalone && onPromptInstall && (
            <button
              onClick={onPromptInstall}
              title="Install Arogya Bhog Delivery Fleet App on this device"
              aria-label="Install Arogya Bhog App"
              className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-gradient-to-r from-amber-400 via-[#C9A227] to-amber-500 hover:brightness-105 active:scale-95 text-gray-950 text-[10px] sm:text-xs font-black uppercase tracking-wider transition-all shadow-md border border-amber-300/60 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install App</span>
            </button>
          )}
          <a
            href={customerStoreUrl}
            className="hidden sm:flex items-center space-x-1.5 text-gray-400 hover:text-[#C9A227] transition-colors"
          >
            <Store className="w-3.5 h-3.5" />
            <span>Customer Store</span>
          </a>
          <div className="px-2.5 py-1 rounded-full bg-sky-950/60 border border-sky-400/40 text-sky-300 text-[10px] font-bold uppercase tracking-wider flex items-center space-x-1">
            <Truck className="w-3 h-3 text-sky-400" />
            <span>Fleet Dispatch Portal</span>
          </div>
        </div>
      </div>

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-8">
        <div className="rounded-2xl bg-[#181818] border-2 border-sky-500/80 p-6 sm:p-8 shadow-2xl relative overflow-hidden space-y-6">
          
          <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/5 rounded-full blur-3xl pointer-events-none" />

          {/* Heading */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-[#15232d] border border-sky-400/60 mx-auto flex items-center justify-center text-sky-400 shadow-md">
              <Truck className="w-9 h-9" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
              Delivery Partner Portal
            </h1>
            <p className="text-xs text-[#99907c] max-w-xs mx-auto">
              Fresh Doorstep Delivery, Live Route Dispatch & Doorstep Payment Collection
            </p>
          </div>

          {/* Portal Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-[#121212] border border-[#2e2a20]">
            <a
              href={adminPortalUrl}
              className="py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-400 hover:text-[#C9A227] flex items-center justify-center space-x-1.5 transition-colors"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Admin Console</span>
            </a>
            <button
              type="button"
              className="py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider bg-sky-500 text-white shadow-sm flex items-center justify-center space-x-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Fleet</span>
            </button>
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
              <label className="text-[11px] uppercase font-bold tracking-wider text-sky-400 block mb-1.5">
                Delivery Email / Mobile Number
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Enter delivery email or mobile"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#121212] border border-[#2e2a20] text-sm text-white placeholder-gray-600 outline-none focus:border-sky-400 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] uppercase font-bold tracking-wider text-sky-400 block mb-1.5">
                Partner Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter partner password"
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl bg-[#121212] border border-[#2e2a20] text-sm text-white placeholder-gray-600 outline-none focus:border-sky-400 transition-all font-sans"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-2 transition-all shadow-lg shadow-sky-600/20 disabled:opacity-50"
            >
              <span>{isLoading ? 'Verifying Dispatch Profile...' : 'Sign In to Delivery Fleet'}</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </button>
          </form>

          {/* Subdomain Notice */}
          <div className="pt-4 border-t border-[#2e2a20] space-y-2 text-center text-xs text-gray-500">
            <p className="text-[11px] text-[#99907c]">
              Delivery partner accounts are provisioned exclusively by the Chakki Administrator.
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
                href={adminPortalUrl} 
                className="text-[#C9A227] hover:underline flex items-center space-x-1"
              >
                <Shield className="w-3 h-3" />
                <span>Admin Operations</span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="max-w-5xl mx-auto w-full text-center py-2 text-xs text-gray-600 border-t border-[#2e2a20]/60">
        <p>© 2026 Arogyabhog Artisanal Ayurveda • Fleet Dispatch • Sector 54 Gurugram</p>
      </div>

    </div>
  );
}
