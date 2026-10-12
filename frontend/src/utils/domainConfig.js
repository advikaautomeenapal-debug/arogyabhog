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

  // 1. Check URL query override (?panel=admin | ?panel=delivery | ?panel=delivery-partner | ?panel=dp | ?panel=customer)
  const params = new URLSearchParams(window.location.search);
  const panelQuery = params.get('panel');
  if (panelQuery === 'admin') return 'admin';
  if (
    panelQuery === 'delivery' || 
    panelQuery === 'delivery-partner' || 
    panelQuery === 'deliverypartner' ||
    panelQuery === 'dp'
  ) {
    return 'delivery';
  }
  if (panelQuery === 'customer') {
    return 'customer';
  }

  // 2. Check URL hash (#admin | #/admin | #dp | #/dp | #delivery | #/delivery | #delivery-partner | #/delivery-partner)
  const hash = (window.location.hash || '').toLowerCase();
  if (hash === '#admin' || hash.startsWith('#admin/') || hash === '#/admin' || hash.startsWith('#/admin/')) {
    return 'admin';
  }
  if (
    hash === '#dp' || hash.startsWith('#dp/') ||
    hash === '#/dp' || hash.startsWith('#/dp/') ||
    hash === '#delivery' || hash.startsWith('#delivery/') ||
    hash === '#/delivery' || hash.startsWith('#/delivery/') ||
    hash === '#delivery-partner' || hash.startsWith('#delivery-partner/') ||
    hash === '#/delivery-partner' || hash.startsWith('#/delivery-partner/') ||
    hash === '#deliverypartner' || hash.startsWith('#deliverypartner/')
  ) {
    return 'delivery';
  }

  // 3. Check hostname subdomains (admin.* | delivery.*)
  const hostname = window.location.hostname.toLowerCase();
  if (hostname.startsWith('admin.') || hostname === 'admin.localhost') {
    return 'admin';
  }
  if (hostname.startsWith('delivery.') || hostname === 'delivery.localhost') {
    return 'delivery';
  }

  // 4. Check pathname (/admin | /dp | /delivery-partner | /delivery)
  const pathname = window.location.pathname.toLowerCase();
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return 'admin';
  }
  if (
    pathname === '/dp' || pathname.startsWith('/dp/') ||
    pathname === '/delivery' || pathname.startsWith('/delivery/') ||
    pathname === '/delivery-partner' || pathname.startsWith('/delivery-partner/') ||
    pathname === '/deliverypartner' || pathname.startsWith('/deliverypartner/')
  ) {
    return 'delivery';
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
  const isSubdomain = hostname.startsWith('admin.') || hostname.startsWith('delivery.');

  // If already on a dedicated subdomain, keep subdomain URL structure
  if (isSubdomain) {
    const { customerBase, adminBase, deliveryBase } = getBaseUrls();
    if (panel === 'admin') return adminBase;
    if (panel === 'delivery') return deliveryBase;
    return customerBase;
  }

  // Default clean path routes on standard domain / localhost / Netlify
  const origin = window.location.origin;
  if (panel === 'admin') return `${origin}/admin`;
  if (panel === 'delivery') return `${origin}/dp`;
  return `${origin}/`;
}
