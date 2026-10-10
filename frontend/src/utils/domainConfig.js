/**
 * Subdomain Separation & Hostname Routing Configuration
 * 
 * Supports 3 isolated interfaces:
 * 1. Customer store: https://domainname.com
 * 2. Admin operations: https://admin.domainname.com
 * 3. Delivery fleet: https://delivery.domainname.com
 * 
 * Also supports:
 * - Localhost subdomains: admin.localhost, delivery.localhost
 * - Query parameter fallback: ?panel=admin, ?panel=delivery, ?panel=customer
 * - Path-based redirects for customer domain: /admin, /delivery
 */

export function getPanelContext() {
  if (typeof window === 'undefined') return 'customer';

  // 1. Check URL query override (?panel=admin | ?panel=delivery | ?panel=customer)
  const params = new URLSearchParams(window.location.search);
  const panelQuery = params.get('panel');
  if (panelQuery === 'admin' || panelQuery === 'delivery' || panelQuery === 'customer') {
    return panelQuery;
  }

  // 2. Check hostname subdomains
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('admin.') || hostname === 'admin.localhost') {
    return 'admin';
  }
  if (hostname.startsWith('delivery.') || hostname === 'delivery.localhost') {
    return 'delivery';
  }

  // 3. Check path if on root domain (/admin, /delivery)
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'admin-path';
  }
  if (pathname === '/delivery' || pathname.startsWith('/delivery/')) {
    return 'delivery-path';
  }

  return 'customer';
}

export function getBaseUrls() {
  const currentOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const currentHost = typeof window !== 'undefined' ? window.location.host : 'localhost:3000';
  const cleanHost = currentHost.replace(/^admin\./, '').replace(/^delivery\./, '');
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'http:';

  const customerBase = import.meta.env.VITE_CUSTOMER_BASE_URL || `${protocol}//${cleanHost}`;
  const adminBase = import.meta.env.VITE_ADMIN_BASE_URL || `${protocol}//admin.${cleanHost}`;
  const deliveryBase = import.meta.env.VITE_DELIVERY_BASE_URL || `${protocol}//delivery.${cleanHost}`;
  const apiBase = import.meta.env.VITE_API_BASE_URL || '/api';

  return {
    customerBase,
    adminBase,
    deliveryBase,
    apiBase,
    currentOrigin
  };
}

export function getPanelUrl(panel) {
  if (typeof window === 'undefined') return '/';

  const hostname = window.location.hostname.toLowerCase();
  const isLocalhost = hostname === 'localhost' || 
                      hostname === '127.0.0.1' || 
                      hostname === '0.0.0.0' || 
                      hostname.startsWith('192.168.') || 
                      hostname.startsWith('10.') || 
                      hostname.startsWith('172.') || 
                      hostname.endsWith('.local') ||
                      !hostname.includes('.');

  // In localhost development, use query parameter switcher so no /etc/hosts changes are strictly mandatory
  if (isLocalhost) {
    const origin = window.location.origin;
    if (panel === 'admin') return `${origin}/?panel=admin`;
    if (panel === 'delivery') return `${origin}/?panel=delivery`;
    return `${origin}/?panel=customer`;
  }

  const { customerBase, adminBase, deliveryBase } = getBaseUrls();
  if (panel === 'admin') return adminBase;
  if (panel === 'delivery') return deliveryBase;
  return customerBase;
}
