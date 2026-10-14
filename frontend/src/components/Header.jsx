import React from 'react';
import { ShoppingBag, Bot, User, LogOut, Sun, Moon, Sparkles, Truck, ExternalLink, BookOpen, Download, Smartphone, Bell } from 'lucide-react';
import { getPanelUrl } from '../utils/domainConfig';

export function Header({ 
  cart, 
  user,
  onOpenCart, 
  onNavigate, 
  currentTab,
  onOpenAuth,
  onLogout,
  theme,
  onToggleTheme,
  isInstallable,
  isStandalone,
  isInstalled,
  onPromptInstall,
  unreadNotificationsCount = 0,
  onOpenNotifications
}) {
  const totalBags = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWeight = cart.reduce((acc, item) => acc + (item.batchSizeKg * item.quantity), 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.totalItemPrice, 0);
  const isAdmin = user && user.role === 'admin';
  const isDelivery = user && user.role === 'delivery';

  return (
    <header className="sticky top-0 z-40 bg-[#111111] border-b border-[#2E2A20] px-3 sm:px-4 py-2 sm:py-3 shadow-md">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
        
        {/* Official Brand Heraldry: AB Emblem & Arogyabhog Wordmark */}
        <div 
          onClick={() => onNavigate('flourStudio')} 
          className="flex items-center space-x-2 sm:space-x-2.5 md:space-x-3 cursor-pointer group min-w-0"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 md:w-11 md:h-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-[#C9A227]/40 bg-[#1B1B1C] shadow-sm group-hover:border-[#C9A227] transition-all">
            <img 
              src="/arogyaBhog_logo.png" 
              alt="Arogya Bhog Emblem" 
              className="w-6 h-6 sm:w-7 sm:h-7 md:w-9 md:h-9 object-contain"
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <div className="flex items-center space-x-1 sm:space-x-1.5">
              <h2 
                className="text-xl sm:text-2xl md:text-4xl font-normal italic text-[#D4AF70] m-0 leading-none whitespace-nowrap select-none"
                style={{
                  fontFamily: "'Brush Script MT', 'Segoe Script', cursive",
                  textShadow: '1px 1px 2px #5C4525'
                }}
              >
                Arogya Bhog
              </h2>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            </div>
          </div>
        </div>

        {/* Navigation Links for Desktop, Theme Switcher & Cart */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 md:space-x-4 flex-shrink-0">
          
          {/* USER NAVIGATION (ALWAYS ACTIVE ON STOREFRONT) */}
          <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-caps font-semibold mr-2">
            <button 
              onClick={() => onNavigate('flourStudio')}
              className={`transition-colors py-1 ${currentTab === 'flourStudio' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-300 hover:text-[#C9A227]'}`}
            >
              Flour Studio
            </button>

            <button 
              onClick={() => onNavigate('ayurvedicAI')}
              className={`transition-colors py-1 flex items-center space-x-1.5 ${currentTab === 'ayurvedicAI' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-300 hover:text-[#C9A227]'}`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ayurvedic AI</span>
            </button>

            <button 
              onClick={() => onNavigate('blog')}
              className={`transition-colors py-1 flex items-center space-x-1.5 ${currentTab === 'blog' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-300 hover:text-[#C9A227]'}`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Food Knowledge</span>
            </button>

            <button 
              onClick={() => onNavigate('orders')}
              className={`transition-colors py-1 ${currentTab === 'orders' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-300 hover:text-[#C9A227]'}`}
            >
              My Orders
            </button>
          </div>

          {/* PORTAL JUMP PILL FOR LOGGED-IN OPERATORS */}
          {isAdmin && (
            <a 
              href={getPanelUrl('admin')}
              className="hidden md:flex items-center space-x-1.5 text-xs text-[#C9A227] border border-[#C9A227]/40 px-2.5 py-1 rounded-xl hover:bg-[#C9A227]/10 transition-colors font-bold uppercase tracking-wider mr-2"
            >
              <span>Admin Console</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {isDelivery && (
            <a 
              href={getPanelUrl('delivery')}
              className="hidden md:flex items-center space-x-1.5 text-xs text-sky-400 border border-sky-500/40 px-2.5 py-1 rounded-xl hover:bg-sky-500/10 transition-colors font-bold uppercase tracking-wider mr-2"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Fleet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {/* THEME TOGGLE BUTTON (Sun/Moon) - Affects Body Surfaces Only */}
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-1.5 sm:p-2 rounded-xl border border-[#2E2A20] bg-[#1A1A1A] hover:border-[#C9A227] text-white transition-all flex items-center justify-center flex-shrink-0"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#C9A227] transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-gray-200 hover:text-[#C9A227] transition-transform" />
            )}
          </button>

          {/* IN-APP NOTIFICATION BELL */}
          <button
            onClick={onOpenNotifications}
            aria-label={`In-App Notifications (${unreadNotificationsCount || 0} unread)`}
            title="In-App Notifications & Order Alerts"
            className="relative p-1.5 sm:p-2 rounded-xl border border-[#2E2A20] bg-[#1A1A1A] hover:border-[#C9A227] text-white transition-all flex items-center justify-center flex-shrink-0 cursor-pointer"
          >
            <Bell className={`w-4 h-4 ${(unreadNotificationsCount || 0) > 0 ? 'text-[#C9A227]' : 'text-gray-300'}`} />
            {(unreadNotificationsCount || 0) > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white text-[10px] font-extrabold px-1 min-w-[17px] h-[17px] flex items-center justify-center rounded-full leading-none shadow-md ring-2 ring-[#111111] animate-pulse">
                {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
              </span>
            )}
          </button>

          {/* INSTALL AROGYA BHOG APP (Prominently visible on mobile size and desktop web browsers) */}
          {!isStandalone && (
            <button
              onClick={onPromptInstall}
              title="Install Arogya Bhog App on this device"
              aria-label="Install Arogya Bhog App"
              className="flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-[#C9A227] to-amber-500 hover:brightness-105 active:scale-95 text-gray-950 text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all flex-shrink-0 cursor-pointer shadow-md border border-amber-300/60"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Install App</span>
            </button>
          )}

          {/* Cart Status Pill with Prominent Red Badge (Desktop only) */}
          {!isAdmin && !isDelivery && (
            <button
              onClick={onOpenCart}
              aria-label={`Open Cart (${totalBags} items)`}
              className="hidden md:flex items-center space-x-2.5 px-3 py-1.5 rounded-xl border border-[#2E2A20] bg-[#1A1A1A] hover:border-[#C9A227] transition-all group flex-shrink-0"
            >
              <div className="relative flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#C9A227] group-hover:scale-105 transition-transform" />
                {totalBags > 0 && (
                  <span className="absolute -top-2 -right-2.5 bg-red-600 text-white text-[11px] font-extrabold px-1.5 min-w-[20px] h-5 flex items-center justify-center rounded-full leading-none shadow-md ring-2 ring-[#111111]">
                    {totalBags}
                  </span>
                )}
              </div>
              
              <div className="text-left font-sans leading-none pl-1 hidden sm:block">
                <span className="text-[10px] text-gray-400 block uppercase font-medium">
                  {totalWeight > 0 ? `${totalWeight} kg` : '0 kg'}
                </span>
                <span className="text-xs font-bold text-white">
                  ₹{totalPrice}
                </span>
              </div>
            </button>
          )}

          {/* User Profile / Auth Button */}
          {user ? (
            <div className="flex items-center space-x-1.5 sm:space-x-2 pl-0.5 sm:pl-1 flex-shrink-0">
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#2E2A20] hover:border-[#C9A227] transition-all bg-[#1A1A1A]"
                title="Account Profile & Saved Addresses"
              >
                <div className="w-5 h-5 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227]">
                  <User className="w-3 h-3" />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-white block leading-none">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase font-mono font-semibold text-emerald-400">
                    Customer
                  </span>
                </div>
              </button>
              {(isAdmin || isDelivery) && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl border border-[#2E2A20] hover:border-rose-400 text-gray-400 hover:text-rose-400 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3 py-1.5 sm:px-4 sm:py-1.5 rounded-xl border border-[#C9A227] bg-[#C9A227] hover:bg-[#B58F1E] text-black text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex-shrink-0"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
