import React from 'react';
import { ShoppingBag, Bot, User, LogOut, Sun, Moon, Sparkles, Truck, ExternalLink } from 'lucide-react';
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
  onToggleTheme
}) {
  const totalBags = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalWeight = cart.reduce((acc, item) => acc + (item.batchSizeKg * item.quantity), 0);
  const totalPrice = cart.reduce((acc, item) => acc + item.totalItemPrice, 0);
  const isAdmin = user && user.role === 'admin';
  const isDelivery = user && user.role === 'delivery';

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border-b border-gray-200 dark:border-[#2E2A20] px-4 py-3 transition-colors">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Official Brand Heraldry: AB Emblem & Arogyabhog Wordmark */}
        <div 
          onClick={() => onNavigate('flourStudio')} 
          className="flex items-center space-x-2.5 md:space-x-3 cursor-pointer group"
        >
          <div className="w-10 h-10 md:w-11 md:h-11 flex-shrink-0 flex items-center justify-center rounded-xl border border-[#C9A227]/40 bg-amber-50/60 dark:bg-[#1B1B1C] shadow-sm group-hover:border-[#C9A227] transition-all">
            <img 
              src="/arogyaBhog_logo.png" 
              alt="Arogyabhog Emblem" 
              className="w-8 h-8 md:w-9 md:h-9 object-contain"
            />
          </div>

          <div className="flex flex-col justify-center">
            <div className="flex items-center space-x-1.5">
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
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
          </div>
        </div>

        {/* Navigation Links for Desktop */}
        <div className="flex items-center space-x-2 md:space-x-4">
          
          {/* USER NAVIGATION (ALWAYS ACTIVE ON STOREFRONT) */}
          <div className="hidden md:flex items-center space-x-6 text-xs uppercase tracking-caps font-semibold mr-2">
            <button 
              onClick={() => onNavigate('flourStudio')}
              className={`transition-colors py-1 ${currentTab === 'flourStudio' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-600 dark:text-[#99907C] hover:text-[#C9A227]'}`}
            >
              Flour Studio
            </button>

            <button 
              onClick={() => onNavigate('ayurvedicAI')}
              className={`transition-colors py-1 flex items-center space-x-1.5 ${currentTab === 'ayurvedicAI' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-600 dark:text-[#99907C] hover:text-[#C9A227]'}`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ayurvedic AI</span>
            </button>

            <button 
              onClick={() => onNavigate('orders')}
              className={`transition-colors py-1 ${currentTab === 'orders' ? 'text-[#C9A227] border-b-2 border-[#C9A227]' : 'text-gray-600 dark:text-[#99907C] hover:text-[#C9A227]'}`}
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
              className="hidden md:flex items-center space-x-1.5 text-xs text-sky-500 border border-sky-500/40 px-2.5 py-1 rounded-xl hover:bg-sky-500/10 transition-colors font-bold uppercase tracking-wider mr-2"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Delivery Fleet</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}

          {!user && (
            <a 
              href={getPanelUrl('delivery')}
              className="hidden lg:flex items-center space-x-1.5 text-xs text-sky-600 dark:text-sky-400 border border-sky-500/30 px-2.5 py-1 rounded-xl hover:bg-sky-500/10 transition-colors font-medium tracking-wider uppercase mr-2"
              title="Delivery Fleet Dispatch Portal"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Fleet Portal</span>
            </a>
          )}

          {/* THEME TOGGLE BUTTON (Sun/Moon) */}
          <button
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            className="p-2 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#1A1A1A] text-gray-700 dark:text-[#C9A227] hover:border-[#C9A227] transition-all"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#C9A227] transition-transform hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-gray-700 hover:text-[#C9A227] transition-transform" />
            )}
          </button>

          {/* Cart Status Pill (For customers only) */}
          {!isAdmin && !isDelivery && (
            <button
              onClick={onOpenCart}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-xl border border-gray-200 dark:border-[#2E2A20] bg-gray-50 dark:bg-[#1A1A1A] hover:border-[#C9A227] transition-all group"
            >
              <div className="relative">
                <ShoppingBag className="w-4 h-4 text-[#C9A227] group-hover:scale-110 transition-transform" />
                {totalBags > 0 && (
                  <span className="absolute -top-1.5 -right-2 bg-[#C9A227] text-white text-[9px] font-bold px-1 min-w-[14px] rounded-full text-center">
                    {totalBags}
                  </span>
                )}
              </div>
              
              <div className="text-left font-sans leading-none pl-1 hidden sm:block">
                <span className="text-[10px] text-gray-500 dark:text-[#99907C] block uppercase font-medium">
                  {totalWeight > 0 ? `${totalWeight} kg` : '0 kg'}
                </span>
                <span className="text-xs font-semibold text-gray-900 dark:text-[#F5F5F3]">
                  ₹{totalPrice}
                </span>
              </div>
            </button>
          )}

          {/* User Profile / Auth Button (Customer logout button removed per Requirement 7) */}
          {user ? (
            <div className="flex items-center space-x-2 pl-1">
              <button
                onClick={onOpenAuth}
                className="flex items-center space-x-1.5 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200 dark:border-[#2E2A20] hover:border-[#C9A227] transition-all bg-gray-50 dark:bg-[#1A1A1A]"
                title="Account Profile & Saved Addresses"
              >
                <div className="w-5 h-5 rounded-full bg-[#C9A227]/20 border border-[#C9A227]/40 flex items-center justify-center text-[#C9A227]">
                  <User className="w-3 h-3" />
                </div>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-gray-900 dark:text-[#F5F5F3] block leading-none">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[9px] uppercase font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                    Customer
                  </span>
                </div>
              </button>
              {(isAdmin || isDelivery) && (
                <button
                  onClick={onLogout}
                  title="Sign Out"
                  className="p-1.5 rounded-xl border border-gray-200 dark:border-[#2E2A20] hover:border-rose-400 text-gray-400 hover:text-rose-500 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="px-3.5 py-1.5 rounded-xl border border-[#C9A227] bg-[#C9A227]/10 hover:bg-[#C9A227] hover:text-white text-[#C9A227] text-xs font-bold uppercase tracking-wider transition-all"
            >
              Sign In
            </button>
          )}

        </div>

      </div>
    </header>
  );
}
