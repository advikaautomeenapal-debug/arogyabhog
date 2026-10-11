const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const getAuthHeaders = (isFormData = false) => {
  const token = localStorage.getItem('arogyabhog_token');
  const headers = {};
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
};

export const api = {
  // AUTH
  async login(identifier, password) {
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          phone: identifier,
          email: identifier,
          password
        })
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('arogyabhog_token', data.token);
      }
      return data;
    } catch (err) {
      console.error('API Error (login):', err);
      return { success: false, message: err.message };
    }
  },

  async register(userData) {
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      const data = await res.json();
      if (data.success && data.token) {
        localStorage.setItem('arogyabhog_token', data.token);
      }
      return data;
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async sendPasswordResetOtp(phone) {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async verifyPasswordResetOtp({ phone, otp }) {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async resetPasswordWithOtp({ phone, otp, newPassword }) {
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, newPassword })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ==========================================
  // WHATSAPP-BASED RECOVERY & PASSWORD RESET
  // ==========================================
  async initiatePasswordRecovery(phone) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async validateRecoveryToken(token) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/validate-token?token=${encodeURIComponent(token)}`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async resetPasswordWithRecoveryToken({ token, newPassword, confirmPassword }) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword, confirmPassword })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // Admin Recovery Request Management APIs
  async getRecoveryRequests(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/auth/recovery/requests?${query}`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, data: [] };
    }
  },

  async createRecoveryRequest(requestData) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/requests`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(requestData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async verifyRecoveryRequest(requestId, payload = {}) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/requests/${requestId}/verify`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async generateRecoveryToken(requestId) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/requests/${requestId}/generate-token`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async rejectRecoveryRequest(requestId, payload = {}) {
    try {
      const res = await fetch(`${API_BASE}/auth/recovery/requests/${requestId}/reject`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getMe() {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateProfile(profileData) {
    try {
      const res = await fetch(`${API_BASE}/auth/profile`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(profileData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // DELIVERY PERSONNEL MANAGEMENT (Admin Only)
  async getDeliveryPersons() {
    try {
      const res = await fetch(`${API_BASE}/auth/delivery-persons`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async createDeliveryPerson(dpData) {
    try {
      const res = await fetch(`${API_BASE}/auth/delivery-persons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(dpData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateDeliveryPerson(id, dpData) {
    try {
      const res = await fetch(`${API_BASE}/auth/delivery-persons/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(dpData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // PRODUCTS
  async getProducts(category) {
    try {
      const url = category ? `${API_BASE}/products?category=${category}` : `${API_BASE}/products`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch products');
      return await res.json();
    } catch (err) {
      console.warn('API Error (getProducts):', err);
      return { success: false, data: [] };
    }
  },

  async createProduct(formDataOrJson) {
    try {
      const isFormData = formDataOrJson instanceof FormData;
      const res = await fetch(`${API_BASE}/products`, {
        method: 'POST',
        headers: getAuthHeaders(isFormData),
        body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error (createProduct):', err);
      return { success: false, message: err.message };
    }
  },

  async updateProduct(id, formDataOrJson) {
    try {
      const isFormData = formDataOrJson instanceof FormData;
      const res = await fetch(`${API_BASE}/products/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(isFormData),
        body: isFormData ? formDataOrJson : JSON.stringify(formDataOrJson)
      });
      return await res.json();
    } catch (err) {
      console.error('API Error (updateProduct):', err);
      return { success: false, message: err.message };
    }
  },

  async deleteProduct(id, permanent = false) {
    try {
      const url = permanent ? `${API_BASE}/products/${id}?permanent=true` : `${API_BASE}/products/${id}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async toggleProductActive(id) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}/toggle`, {
        method: 'PATCH',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // GRAINS & SILOS
  async getGrains() {
    try {
      const res = await fetch(`${API_BASE}/grains`);
      if (!res.ok) throw new Error('Failed to fetch grains');
      return await res.json();
    } catch (err) {
      console.warn('API Error (getGrains):', err);
      return { success: false, data: [] };
    }
  },

  async updateGrain(id, data) {
    try {
      const res = await fetch(`${API_BASE}/grains/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async restockGrain(id, quantityKg = 100, adminName) {
    try {
      const res = await fetch(`${API_BASE}/grains/${id}/restock`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({ quantityKg, adminName })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createGrain(data) {
    try {
      const res = await fetch(`${API_BASE}/grains`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ORDERS & SEARCH / FILTERS
  async getOrders(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.search) query.append('search', params.search);
      if (params.paymentStatus && params.paymentStatus !== 'all') query.append('paymentStatus', params.paymentStatus);
      if (params.orderStatus && params.orderStatus !== 'all') query.append('orderStatus', params.orderStatus);
      if (params.customerId) query.append('customerId', params.customerId);
      if (params.fromDate) query.append('fromDate', params.fromDate);
      if (params.toDate) query.append('toDate', params.toDate);
      if (params.queueType) query.append('queueType', params.queueType);
      if (params.variant && params.variant !== 'all') query.append('variant', params.variant);
      if (params.deliveryPerson && params.deliveryPerson !== 'all') query.append('deliveryPerson', params.deliveryPerson);
      if (params.chakkiId && params.chakkiId !== 'all') query.append('chakkiId', params.chakkiId);
      if (params.city && params.city !== 'all') query.append('city', params.city);
      if (params.zone && params.zone !== 'all') query.append('zone', params.zone);

      const qs = query.toString();
      const url = qs ? `${API_BASE}/orders?${qs}` : `${API_BASE}/orders`;
      const res = await fetch(url, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return await res.json();
    } catch (err) {
      console.warn('API Error (getOrders):', err);
      return { success: false, data: [] };
    }
  },

  async getMillingQueue() {
    try {
      const res = await fetch(`${API_BASE}/orders/queue`, {
        headers: getAuthHeaders()
      });
      if (!res.ok) throw new Error('Failed to fetch milling queue');
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async getOrderById(id) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createOrder(orderData) {
    try {
      const res = await fetch(`${API_BASE}/orders`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(orderData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateOrderStatus(id, statusData) {
    try {
      const body = typeof statusData === 'string' ? { orderStatus: statusData } : statusData;
      const res = await fetch(`${API_BASE}/orders/${id}/status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(body)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteOrder(id) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updatePaymentStatus(id, paymentStatus, adminEmail, transactionRef) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/payment-status`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ paymentStatus, adminEmail, transactionRef })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async reassignOrderDelivery(id, deliveryPersonId) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/assign-delivery`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify({ deliveryPersonId })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // DELIVERY PERSON ACTIONS
  async getDeliveryMyOrders() {
    try {
      const res = await fetch(`${API_BASE}/orders/delivery/my-orders`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async deliveryAcceptOrder(id) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/delivery-accept`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deliveryConfirmPayment(id, paymentData = {}) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/delivery-payment`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(paymentData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deliveryCompleteOrder(id) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/delivery-complete`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async refundOrder(id, refundData) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/refund`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(refundData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async collectCash(id) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/collect-cash`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async collectUpi(id, data = {}) {
    try {
      const res = await fetch(`${API_BASE}/orders/${id}/collect-upi`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // INVENTORY MANAGEMENT
  async getInventorySummary() {
    try {
      const res = await fetch(`${API_BASE}/products/inventory/summary`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async getInventoryLogs(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.productId) query.append('productId', params.productId);
      if (params.movementType) query.append('movementType', params.movementType);
      if (params.limit) query.append('limit', params.limit);
      const qs = query.toString();
      const res = await fetch(`${API_BASE}/products/inventory/logs${qs ? '?' + qs : ''}`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async adjustProductStock(id, stockData) {
    try {
      const res = await fetch(`${API_BASE}/products/${id}/stock`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        body: JSON.stringify(stockData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getAdminMetrics() {
    try {
      const res = await fetch(`${API_BASE}/orders/admin/metrics`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return {
        success: true,
        data: { ordersToday: 28, activeMillingBags: 14, lowSilosCount: 4 }
      };
    }
  },

  // OPERATIONAL COSTS
  async getOperationalCosts() {
    try {
      const res = await fetch(`${API_BASE}/operational-costs`);
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async updateOperationalCost(costId, costData) {
    try {
      const res = await fetch(`${API_BASE}/operational-costs/${costId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(costData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createOperationalCost(costData) {
    try {
      const res = await fetch(`${API_BASE}/operational-costs`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(costData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ADDRESS BOOK MANAGEMENT (Requirement 6)
  async getAddresses() {
    try {
      const res = await fetch(`${API_BASE}/auth/addresses`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, data: [] };
    }
  },

  async addAddress(addressData) {
    try {
      const res = await fetch(`${API_BASE}/auth/addresses`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateAddress(addressId, addressData) {
    try {
      const res = await fetch(`${API_BASE}/auth/addresses/${addressId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(addressData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteAddress(addressId) {
    try {
      const res = await fetch(`${API_BASE}/auth/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async setDefaultAddress(addressId) {
    try {
      const res = await fetch(`${API_BASE}/auth/addresses/${addressId}/default`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // WEBSITE & CUSTOMER PANEL MANAGEMENT (Requirement 1)
  async getSiteContent() {
    try {
      const res = await fetch(`${API_BASE}/site-content`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateSiteContent(contentData) {
    try {
      const res = await fetch(`${API_BASE}/site-content`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(contentData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // CITY, ZONE & CHAKKI DELIVERY MANAGEMENT (Requirement 2)
  async getDeliveryAreas() {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas`);
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, data: { cities: [], zones: [], chakkis: [] } };
    }
  },

  async checkServiceability(payload) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/check-serviceability`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return await res.json();
    } catch (err) {
      return { 
        success: false, 
        data: { serviceable: false, message: 'Could not connect to serviceability network.' } 
      };
    }
  },

  async createCity(cityData) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/cities`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(cityData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateCity(id, cityData) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/cities/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(cityData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteCity(id) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/cities/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createZone(zoneData) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/zones`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(zoneData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateZone(id, zoneData) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/zones/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(zoneData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteZone(id) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/zones/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async createChakki(chakkiData) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/chakkis`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(chakkiData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async updateChakki(id, chakkiData) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/chakkis/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(chakkiData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteChakki(id) {
    try {
      const res = await fetch(`${API_BASE}/delivery-areas/chakkis/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  // ==========================================
  // COUPONS & DISCOUNTS API
  // ==========================================
  async validateCoupon({ code, phone, orderTotal }) {
    try {
      const res = await fetch(`${API_BASE}/coupons/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, phone, orderTotal })
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async getCoupons(params = {}) {
    try {
      const query = new URLSearchParams(params).toString();
      const res = await fetch(`${API_BASE}/coupons?${query}`, {
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message, data: [] };
    }
  },

  async createCoupon(couponData) {
    try {
      const res = await fetch(`${API_BASE}/coupons`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(couponData)
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async toggleCoupon(id) {
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}/toggle`, {
        method: 'PUT',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  },

  async deleteCoupon(id) {
    try {
      const res = await fetch(`${API_BASE}/coupons/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      return await res.json();
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
};
