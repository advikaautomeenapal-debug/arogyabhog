import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { BottomNav } from './components/BottomNav';
import { CartModal } from './components/CartModal';
import { AuthModal } from './components/AuthModal';
import { FlourStudioView } from './views/FlourStudioView';
import { AyurvedicAIView } from './views/AyurvedicAIView';
import { CheckoutView } from './views/CheckoutView';
import { OrdersView } from './views/OrdersView';
import { AdminView } from './views/AdminView';
import { DeliveryView } from './views/DeliveryView';
import { AdminLoginView } from './views/AdminLoginView';
import { DeliveryLoginView } from './views/DeliveryLoginView';
import { ProductDetailView } from './views/ProductDetailView';
import { ResetPasswordView } from './views/ResetPasswordView';
import { WhatsAppButton } from './components/WhatsAppButton';
import { ErrorBoundary } from './components/ErrorBoundary';
import { getPanelContext, getPanelUrl } from './utils/domainConfig';
import { api } from './services/api';

export function App() {
  // Theme State: Default to 'light' as strictly required
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('arogyabhog_theme') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('arogyabhog_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Hostname, Path & Route Context ('customer' | 'admin' | 'delivery')
  const [panelContext, setPanelContext] = useState(() => getPanelContext());

  // Current logged in user profile (persisted in localStorage)
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('arogyabhog_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const isAdmin = user && user.role === 'admin';
  const isDelivery = user && user.role === 'delivery';

  // Customer storefront navigation tab
  const [currentTab, setCurrentTab] = useState('flourStudio');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Helper to extract product slug from URL hash (e.g. #product/sugar-care-atta)
  const parseProductSlugFromHash = () => {
    if (typeof window === 'undefined') return null;
    const hash = window.location.hash || '';
    const match = hash.match(/^#product\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  const [selectedProductSlug, setSelectedProductSlug] = useState(() => parseProductSlugFromHash());
  const [isResetRoute, setIsResetRoute] = useState(() => {
    return typeof window !== 'undefined' && window.location.hash.startsWith('#reset-password');
  });

  // Listen to browser location and hash changes (direct URLs, back/forward button, reset password links)
  useEffect(() => {
    const handleLocationChange = () => {
      setPanelContext(getPanelContext());
      const slug = parseProductSlugFromHash();
      setSelectedProductSlug(slug);
      if (slug) {
        setCurrentTab('flourStudio');
      }
      setIsResetRoute(window.location.hash.startsWith('#reset-password'));
    };
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  const handleOpenProductDetail = (slug) => {
    setSelectedProductSlug(slug);
    setCurrentTab('flourStudio');
    if (slug) {
      window.location.hash = `product/${slug}`;
    } else {
      if (window.location.hash.startsWith('#product/')) {
        window.history.pushState(null, '', window.location.pathname + window.location.search);
      }
    }
  };

  const handleBackFromProductDetail = () => {
    setSelectedProductSlug(null);
    if (window.location.hash.startsWith('#product/')) {
      window.history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  // Data states
  const [products, setProducts] = useState([]);
  const [grains, setGrains] = useState([]);
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // State to pass ratios from Ayurvedic AI to Custom Blender
  const [blenderInitialRatios, setBlenderInitialRatios] = useState(null);

  // Operational costs rates (OP-001, OP-002, OP-003)
  const [operationalCosts, setOperationalCosts] = useState([]);

  // Website & Customer Panel Configuration (Requirement 1)
  const [siteContent, setSiteContent] = useState(null);

  // Cart: starts completely empty by default per Master Specification
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = localStorage.getItem('arogyabhog_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      return [];
    }
  });

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('arogyabhog_cart', JSON.stringify(cart));
    } catch (e) {
      console.error('Failed to sync cart to localStorage:', e);
    }
  }, [cart]);

  // Session persistence: automatically restore and verify authenticated session on reload
  useEffect(() => {
    const restoreSession = async () => {
      const token = localStorage.getItem('arogyabhog_token');
      if (token) {
        try {
          const res = await api.getMe();
          const userData = res?.user || res?.data;
          if (res?.success && userData) {
            setUser(userData);
            localStorage.setItem('arogyabhog_user', JSON.stringify(userData));
          }
        } catch (err) {
          console.warn('Customer session restore failed:', err);
        }
      }
    };
    restoreSession();
  }, []);

  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Load backend data
  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      const [prodRes, grainRes, orderRes, opRes, siteRes] = await Promise.all([
        api.getProducts(),
        api.getGrains(),
        api.getOrders(),
        api.getOperationalCosts(),
        api.getSiteContent()
      ]);

      if (prodRes.success && prodRes.data.length > 0) {
        setProducts(prodRes.data);
      }
      if (grainRes.success && grainRes.data.length > 0) {
        setGrains(grainRes.data);
      }
      if (orderRes.success && orderRes.data.length > 0) {
        setOrders(orderRes.data);
      }
      if (opRes.success && opRes.data.length > 0) {
        setOperationalCosts(opRes.data);
      }
      if (siteRes?.success && siteRes.data) {
        setSiteContent(siteRes.data);
      }
    } catch (e) {
      console.warn('Initial data load error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Auth handlers
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
    localStorage.setItem('arogyabhog_user', JSON.stringify(loggedInUser));
    if (loggedInUser.role === 'admin') {
      showToast(`Welcome Administrator (${loggedInUser.name})!`);
      if (panelContext !== 'admin') {
        window.location.href = getPanelUrl('admin');
      }
    } else if (loggedInUser.role === 'delivery') {
      showToast(`Welcome Delivery Partner (${loggedInUser.name})!`);
      if (panelContext !== 'delivery') {
        window.location.href = getPanelUrl('delivery');
      }
    } else {
      showToast(`Welcome back, ${loggedInUser.name}!`);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('arogyabhog_user');
    localStorage.removeItem('arogyabhog_token');
    setCurrentTab('flourStudio');
    showToast('Signed out successfully.');
  };

  // Cart actions
  const handleAddToCart = (newItem) => {
    setCart(prev => {
      const existingIdx = prev.findIndex(item => 
        item.name === newItem.name && 
        item.batchSizeKg === newItem.batchSizeKg &&
        item.fineness === newItem.fineness
      );

      if (existingIdx >= 0) {
        const updated = [...prev];
        updated[existingIdx].quantity += newItem.quantity;
        updated[existingIdx].totalItemPrice += newItem.totalItemPrice;
        return updated;
      }
      return [...prev, newItem];
    });

    showToast(`Added ${newItem.name} (${newItem.batchSizeKg} kg) to Chakki Bag!`);
  };

  const handleUpdateQuantity = (idx, newQty) => {
    if (newQty <= 0) {
      handleRemoveItem(idx);
      return;
    }
    setCart(prev => {
      const updated = [...prev];
      const item = updated[idx];
      const unitPrice = item.totalItemPrice / item.quantity;
      item.quantity = newQty;
      item.totalItemPrice = Math.round(unitPrice * newQty);
      return updated;
    });
  };

  const handleRemoveItem = (idx) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const handleOrderSuccess = (newOrder) => {
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    localStorage.removeItem('arogyabhog_cart');
    showToast(`Your order is placed! You will get your order status on your My Order page.`);
  };

  // Ayurvedic AI -> Custom Blender transition
  const handleApplyToCustomBlender = (ratios) => {
    setBlenderInitialRatios(ratios);
    setCurrentTab('flourStudio');
    showToast('Prescribed Ayurvedic grain ratios loaded into Custom Blender!');
  };

  // =========================================================================
  // ROUTING CONDITION 1: DEDICATED ADMIN PANEL (/admin | #admin | ?panel=admin | admin.*)
  // =========================================================================
  if (panelContext === 'admin') {
    if (isAdmin) {
      return (
        <AdminView
          products={products}
          grains={grains}
          operationalCosts={operationalCosts}
          siteContent={siteContent}
          user={user}
          onReloadData={loadInitialData}
          onLogout={handleLogout}
        />
      );
    }
    return <AdminLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // =========================================================================
  // ROUTING CONDITION 2: DEDICATED DELIVERY FLEET (/dp | /delivery-partner | /delivery | #dp | ?panel=dp | delivery.*)
  // =========================================================================
  if (panelContext === 'delivery') {
    if (isDelivery || isAdmin) {
      return (
        <DeliveryView
          user={user}
          onLogout={handleLogout}
        />
      );
    }
    return <DeliveryLoginView onLoginSuccess={handleLoginSuccess} />;
  }

  // =========================================================================
  // SUBDOMAIN ROUTING CONDITION: WHATSAPP PASSWORD RECOVERY (#reset-password)
  // =========================================================================
  if (isResetRoute) {
    return (
      <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#111111] text-gray-900 dark:text-[#F5F5F3]">
        <ResetPasswordView
          onOpenLogin={() => {
            window.location.hash = '';
            setIsResetRoute(false);
            setIsAuthOpen(true);
          }}
          onBackToStore={() => {
            window.location.hash = '';
            setIsResetRoute(false);
            setCurrentTab('flourStudio');
          }}
        />
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
          user={user}
          onUpdateUser={setUser}
        />
      </div>
    );
  }

  // =========================================================================
  // SUBDOMAIN ROUTING CONDITION 4: PURE CUSTOMER STOREFRONT (domain.com / ?panel=customer)
  // Strictly isolated: NO Admin console or Delivery console rendered here!
  // =========================================================================
  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#111111] text-gray-900 dark:text-[#F5F5F3] flex flex-col font-serif transition-colors duration-200 selection:bg-[#C9A227] selection:text-white">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-[#C9A227] text-white dark:text-[#111111] font-bold text-xs uppercase tracking-wider shadow-2xl border border-white/20 animate-bounce font-sans">
          {toastMessage}
        </div>
      )}

      {/* Global Luxury Header with Theme Toggle (No Customer Logout button per Requirement 7) */}
      <Header
        cart={cart}
        user={user}
        onOpenCart={() => setIsCartOpen(true)}
        onNavigate={(tab) => {
          setCurrentTab(tab);
          setSelectedProductSlug(null);
          if (window.location.hash.startsWith('#product/')) {
            window.history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
        currentTab={currentTab}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />

      {/* Main Content Area - Strictly Customer Tabs */}
      <main className="flex-1">
        {currentTab === 'flourStudio' && (
          selectedProductSlug ? (
            <ProductDetailView
              slug={selectedProductSlug}
              products={products}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
              onBackToStudio={handleBackFromProductDetail}
              onSelectProduct={(slug) => handleOpenProductDetail(slug)}
              onOpenCustomBlender={() => {
                handleBackFromProductDetail();
              }}
            />
          ) : (
            <FlourStudioView
              products={products}
              grains={grains}
              siteContent={siteContent}
              onAddToCart={handleAddToCart}
              onOpenCart={() => setIsCartOpen(true)}
              onOpenProductDetail={handleOpenProductDetail}
              cart={cart}
              initialRatios={blenderInitialRatios}
            />
          )
        )}

        {currentTab === 'ayurvedicAI' && (
          <AyurvedicAIView
            onApplyToCustomBlender={handleApplyToCustomBlender}
            onAddToCart={handleAddToCart}
          />
        )}

        {currentTab === 'checkout' && (
          <ErrorBoundary onReset={() => setCurrentTab('flourStudio')}>
            <CheckoutView
              cart={cart}
              user={user}
              siteContent={siteContent}
              operationalCosts={operationalCosts}
              onBackToStudio={() => setCurrentTab('flourStudio')}
              onOrderSuccess={handleOrderSuccess}
              onNavigateToOrders={() => setCurrentTab('orders')}
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          </ErrorBoundary>
        )}

        {currentTab === 'orders' && (
          <OrdersView
            orders={orders}
            onNavigateToStudio={() => setCurrentTab('flourStudio')}
          />
        )}

        {currentTab === 'delivery' && (isDelivery || isAdmin) && (
          <DeliveryView
            user={user}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* Cart Drawer Modal */}
      <CartModal
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onProceedToCheckout={() => {
          setIsCartOpen(false);
          setCurrentTab('checkout');
        }}
        onStartShopping={() => {
          setIsCartOpen(false);
          setCurrentTab('flourStudio');
        }}
      />

      {/* Authentication & Profile Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        user={user}
        onUpdateUser={setUser}
      />

      {/* Floating Customer WhatsApp Support Button */}
      <WhatsAppButton />

      {/* Bottom Sticky Navigation with Cart */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          setSelectedProductSlug(null);
          if (window.location.hash.startsWith('#product/')) {
            window.history.pushState(null, '', window.location.pathname + window.location.search);
          }
        }}
        user={user}
        cart={cart}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAuth={() => setIsAuthOpen(true)}
      />

    </div>
  );
}

export default App;
