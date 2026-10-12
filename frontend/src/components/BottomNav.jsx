import React from 'react';
import { Home, SlidersHorizontal, Clock, ShoppingBag, Truck } from 'lucide-react';

export function BottomNav({ currentTab, onSelectTab, user, cart = [], onOpenCart, onOpenAuth }) {
  // REQUIREMENT 9: Do not render menu bar on checkout view so Place Order CTA is never hidden
  if (currentTab === 'checkout') {
    return null;
  }

  const totalBags = (cart || []).reduce((acc, item) => acc + (item.quantity || 1), 0);
  const isAdmin = user && user.role === 'admin';
  const isDelivery = user && user.role === 'delivery';

  const userTabs = [
    { id: 'flourStudio', label: 'Home', icon: Home },
    { id: 'customBlend', label: 'Custom Blend', icon: SlidersHorizontal },
    { id: 'orders', label: 'Orders', icon: Clock },
    { 
      id: 'cart', 
      label: 'Cart', 
      icon: ShoppingBag, 
      count: totalBags,
      action: () => onOpenCart() 
    }
  ];

  const adminTabs = [
    { id: 'admin', label: 'Admin Floor', icon: SlidersHorizontal }
  ];

  const deliveryTabs = [
    { id: 'delivery', label: 'Dispatch Orders', icon: Truck }
  ];

  const activeList = isAdmin ? adminTabs : isDelivery ? deliveryTabs : userTabs;

  return (
    <nav 
      aria-label="Mobile Navigation"
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#111111]/95 backdrop-blur-md border-t border-gray-200 dark:border-[#2E2A20] px-2 py-1.5 md:hidden transition-colors shadow-lg"
    >
      <div className={`grid ${isAdmin || isDelivery ? 'grid-cols-1' : 'grid-cols-4'} max-w-md mx-auto`}>
        {activeList.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.action) {
                  tab.action();
                } else {
                  onSelectTab(tab.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 transition-all relative ${
                isActive ? 'text-[#C9A227]' : 'text-gray-500 dark:text-[#99907C] hover:text-[#C9A227]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.2]' : 'stroke-[1.6]'}`} />
                {typeof tab.count === 'number' && tab.count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 bg-red-600 text-white text-[10px] font-extrabold px-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full leading-none shadow-md ring-2 ring-white dark:ring-[#111111]">
                    {tab.count}
                  </span>
                )}
                {tab.badge && (
                  <span className="absolute -top-0.5 -right-1 w-2 h-2 rounded-full bg-[#C9A227] animate-pulse"></span>
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-wider uppercase font-medium ${
                isActive ? 'font-bold text-[#C9A227]' : ''
              }`}>
                {tab.label}
              </span>
              {isActive && (
                <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-[#C9A227] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
