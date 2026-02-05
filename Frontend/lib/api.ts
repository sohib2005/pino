const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export type ImageViewType = 'AVANT' | 'DOS' | 'COTE';

export interface Personalization {
  id: string;
  viewType: ImageViewType;
  designJson?: any;
  previewUrl: string;
  printUrl: string;
  createdAt?: string;
  updatedAt?: string;
}

// Simplified T-Shirt schema (no variants, no categories)
export interface Product {
  id: number;
  name: string;
  description?: string;
  color: string;
  size: 'XS' | 'S' | 'M' | 'L' | 'XL' | 'XXL';
  sku: string;
  price: string | number;
  stock: number;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  code?: string;
  categoryId?: number;
  variants?: Array<{
    id: number;
    sku: string;
    stock: number;
    size: {
      name: string;
    };
  }>;
  images?: Array<{
    id: number;
    imageUrl: string;
    viewType: ImageViewType;
    order: number;
  }>;
}

// Keep legacy interfaces for backward compatibility
export interface AttributeValue {
  id: number;
  attributeId: number;
  value: string;
  attribute: {
    id: number;
    name: string;
  };
}

export interface VariantAttribute {
  variantId: number;
  attributeValueId: number;
  attributeValue: AttributeValue;
}

export interface ProductImage {
  id: number;
  productId: number;
  variantId?: number;
  imageUrl: string;
  position: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attributes: VariantAttribute[];
  images: ProductImage[];
}

export interface Category {
  id: number;
  name: string;
  slug: string;
  _count?: {
    products: number;
  };
}

// Products API
export const productsApi = {
  getAll: async (categoryId?: number, includeInactive: boolean = false, trash: boolean = false): Promise<Product[]> => {
    let url = `${API_BASE_URL}/products?`;
    const params = [];
    if (categoryId) params.push(`categoryId=${categoryId}`);
    if (includeInactive) params.push('includeInactive=true');
    if (trash) params.push('trash=true');
    url += params.join('&');
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    return response.json();
  },

  getById: async (id: number): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  getBySlug: async (slug: string): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/slug/${slug}`);
    if (!response.ok) throw new Error('Failed to fetch product');
    return response.json();
  },

  create: async (data: any): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create product' }));
      throw new Error(errorData.message || 'Failed to create product');
    }
    return response.json();
  },

  update: async (id: number, data: any): Promise<Product> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update product' }));
      throw new Error(errorData.message || 'Failed to update product');
    }
    return response.json();
  },

  delete: async (id: number, adminId?: string): Promise<{ action: 'deleted' | 'moved_to_trash'; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adminId }),
    });
    
    const data = await response.json().catch(() => ({ action: 'error', message: 'Invalid response' }));
    
    if (!response.ok) {
      console.error('Delete API error:', response.status, data);
      throw new Error(data?.message || 'Failed to delete product');
    }
    
    console.log('Delete API success:', data);
    return data;
  },

  // Trash/Deletion history
  getTrash: async (): Promise<any[]> => {
    const response = await fetch(`${API_BASE_URL}/products/trash/list`);
    if (!response.ok) throw new Error('Failed to fetch trash');
    return response.json();
  },

  restore: async (id: number): Promise<{ action: string; message: string }> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}/restore`, {
      method: 'POST',
    });
    
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to restore product');
    }
    
    return data;
  },

  permanentDelete: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}/permanent`, {
      method: 'DELETE',
    });
    
    const data = await response.json().catch(() => null);
    
    // Don't throw on 409 - it's a valid response with blocking info
    if (!response.ok && response.status !== 409) {
      throw new Error(data?.message || 'Failed to delete permanently');
    }
    
    return data;
  },

  permanentDeleteWithOrders: async (id: number): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/products/${id}/permanent-with-orders`, {
      method: 'DELETE',
    });
    
    const data = await response.json().catch(() => null);
    
    if (!response.ok) {
      throw new Error(data?.message || 'Failed to delete product with orders');
    }
    
    return data;
  },

  updateVariantStock: async (variantId: number, data: { quantity: number; reason?: string }): Promise<any> => {
    const response = await fetch(`${API_BASE_URL}/products/variant/${variantId}/stock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to update stock');
    return response.json();
  },
};

// Categories API - Deprecated (no categories in t-shirt schema)
export const categoriesApi = {
  getAll: async (): Promise<Category[]> => {
    // Return empty array since we don't have categories anymore
    return Promise.resolve([]);
  },

  getById: async (id: number): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/products/categories/${id}`);
    if (!response.ok) throw new Error('Failed to fetch category');
    return response.json();
  },

  create: async (data: { name: string; slug: string }): Promise<Category> => {
    const response = await fetch(`${API_BASE_URL}/products/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Failed to create category');
    return response.json();
  },

  delete: async (id: number): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/products/categories/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete category');
  },
};

// Attributes API
export const attributesApi = {
  getAll: async () => {
    const response = await fetch(`${API_BASE_URL}/products/attributes/all`);
    if (!response.ok) throw new Error('Failed to fetch attributes');
    return response.json();
  },
};

// Cart & Orders Types
export interface CartItem {
  id: number;
  cartId: string;
  variantId: number;
  quantity: number;
  personalizationId?: string | null;
  personalization?: Personalization | null;
  variant?: {
    id: number;
    sku: string;
    stock: number;
    product: {
      id: number;
      name: string;
      code: string;
      price: number;
      imageUrl?: string;
      color: string;
      images?: Array<{
        id: number;
        imageUrl: string;
        viewType: ImageViewType | string;
        order: number;
      }>;
    };
    size: {
      name: string;
    };
  };
}

export interface Cart {
  id: string | number;
  userId?: string;
  clientId?: number;
  items: CartItem[];
  createdAt?: string;
  updatedAt?: string;
}

export interface OrderItem {
  id: number;
  orderId: string;
  variantId: number;
  quantity: number;
  unitPrice: string | number;
  totalPrice: string | number;
  personalizationId?: string | null;
  personalization?: Personalization | null;
  variant?: {
    id: number;
    sku: string;
    stock: number;
    product: {
      id: number;
      name: string;
      color: string;
      price: string | number;
      images?: Array<{
        id: number;
        imageUrl: string;
        viewType: ImageViewType | string;
      }>;
    };
    size: {
      id: number;
      name: string;
    };
  };
  tshirt?: Product; // Legacy - for backward compatibility
}

// Uploads API
export const uploadsApi = {
  uploadPersonalized: async (file: File): Promise<{ url: string; path?: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/uploads/personalized`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Upload failed' }));
      throw new Error(error.message || 'Upload failed');
    }
    return response.json();
  },
};

// Personalizations API
export const personalizationsApi = {
  create: async (data: {
    viewType?: ImageViewType;
    designJson?: any;
    previewUrl: string;
    printUrl: string;
  }): Promise<Personalization> => {
    const response = await fetch(`${API_BASE_URL}/personalizations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to create personalization' }));
      throw new Error(error.message || 'Failed to create personalization');
    }
    return response.json();
  },
};

export interface Order {
  id: string;
  userId: string;
  orderNumber: string;
  status: 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' | 'ANNULE';
  totalAmount: string | number;
  address: string;
  phoneNumber: string;
  notes?: string;
  items: OrderItem[];
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Cart API
export const cartApi = {
  get: async (): Promise<Cart> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    
    // For guests, use localStorage cart
    if (!client?.id) {
      const guestCart = localStorage.getItem('guestCart');
      return guestCart ? JSON.parse(guestCart) : { id: 0, clientId: 0, items: [] };
    }
    
    const headers: Record<string, string> = {
      'x-user-id': client.id
    };
    
    const response = await fetch(`${API_BASE_URL}/cart`, {
      headers,
    });
    
    // Return empty cart if fetch fails (e.g., 404, 401)
    if (!response.ok) {
      return { id: 0, clientId: 0, items: [] };
    }
    
    return response.json();
  },

  add: async (variantId: number, quantity: number = 1, personalizationId?: string): Promise<CartItem> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    
    // For guests, add to localStorage
    if (!client?.id) {
      const guestCart = localStorage.getItem('guestCart');
      const cart: Cart = guestCart ? JSON.parse(guestCart) : { id: 0, clientId: 0, items: [] };
      
      // Fetch variant details
      const variantResponse = await fetch(`${API_BASE_URL}/products/variant/${variantId}`);
      if (!variantResponse.ok) throw new Error('Variant not found');
      const variant = await variantResponse.json();
      
      // Check if item exists
      const existingIndex = personalizationId
        ? cart.items.findIndex((item) => item.personalizationId === personalizationId)
        : cart.items.findIndex((item) => item.variantId === variantId && !item.personalizationId);

      if (existingIndex >= 0) {
        cart.items[existingIndex].quantity += quantity;
      } else {
        const newItem: CartItem = {
          id: Date.now(),
          cartId: 'guest',
          variantId,
          quantity,
          personalizationId: personalizationId ?? null,
          variant,
        };
        cart.items.push(newItem);
      }
      
      localStorage.setItem('guestCart', JSON.stringify(cart));
      
      // Dispatch cart update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      return cart.items[existingIndex >= 0 ? existingIndex : cart.items.length - 1];
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (client?.id) {
      headers['x-user-id'] = client.id;
    }
    
    const response = await fetch(`${API_BASE_URL}/cart/add`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ variantId, quantity, personalizationId }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to add to cart');
    }
    const result = await response.json();
    
    // Dispatch cart update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
    
    return result;
  },

  update: async (itemId: number, quantity: number): Promise<CartItem> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    
    // For guests, update localStorage
    if (!client?.id) {
      const guestCart = localStorage.getItem('guestCart');
      if (!guestCart) throw new Error('Cart not found');
      
      const cart: Cart = JSON.parse(guestCart);
      const itemIndex = cart.items.findIndex(item => item.id === itemId);
      if (itemIndex < 0) throw new Error('Item not found');
      
      cart.items[itemIndex].quantity = quantity;
      localStorage.setItem('guestCart', JSON.stringify(cart));
      
      // Dispatch cart update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
      
      return cart.items[itemIndex];
    }
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (client?.id) {
      headers['x-user-id'] = client.id;
    }
    
    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ quantity }),
    });
    if (!response.ok) throw new Error('Failed to update cart item');
    const result = await response.json();
    
    // Dispatch cart update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
    
    return result;
  },

  remove: async (itemId: number): Promise<void> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    
    // For guests, remove from localStorage
    if (!client?.id) {
      const guestCart = localStorage.getItem('guestCart');
      if (!guestCart) throw new Error('Cart not found');
      
      const cart: Cart = JSON.parse(guestCart);
      cart.items = cart.items.filter(item => item.id !== itemId);
      localStorage.setItem('guestCart', JSON.stringify(cart));
      
      // Dispatch cart update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
      return;
    }
    
    const headers: Record<string, string> = {};
    if (client?.id) {
      headers['x-user-id'] = client.id;
    }
    
    const response = await fetch(`${API_BASE_URL}/cart/items/${itemId}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to remove from cart');
    
    // Dispatch cart update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
  },

  clear: async (): Promise<void> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    
    // For guests, clear localStorage
    if (!client?.id) {
      localStorage.removeItem('guestCart');
      
      // Dispatch cart update event
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('cartUpdated'));
      }
      return;
    }
    
    const headers: Record<string, string> = {};
    if (client?.id) {
      headers['x-user-id'] = client.id;
    }
    
    const response = await fetch(`${API_BASE_URL}/cart/clear`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) throw new Error('Failed to clear cart');
    
    // Dispatch cart update event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('cartUpdated'));
    }
  },
};

// Orders API
export const ordersApi = {
  create: async (data: {
    address: string;
    phoneNumber: string;
    notes?: string;
  }): Promise<Order> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    const userId = client?.id || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    
    const response = await fetch(`${API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': userId,
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create order');
    }
    return response.json();
  },

  getAll: async (): Promise<Order[]> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    const userId = client?.id || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    
    const response = await fetch(`${API_BASE_URL}/orders`, {
      headers: {
        'x-user-id': userId,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch orders');
    return response.json();
  },

  getAllAdmin: async (): Promise<Order[]> => {
    const response = await fetch(`${API_BASE_URL}/orders/all`);
    if (!response.ok) throw new Error('Failed to fetch all orders');
    return response.json();
  },

  getById: async (id: string): Promise<Order> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    const userId = client?.id || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    
    const response = await fetch(`${API_BASE_URL}/orders/${id}`, {
      headers: {
        'x-user-id': userId,
      },
    });
    if (!response.ok) throw new Error('Failed to fetch order');
    return response.json();
  },

  updateStatus: async (
    id: string,
    status: 'EN_ATTENTE' | 'EN_COURS' | 'LIVRE' | 'ANNULE',
  ): Promise<Order> => {
    const response = await fetch(`${API_BASE_URL}/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Failed to update order status');
    return response.json();
  },

  cancel: async (id: string): Promise<Order> => {
    const clientData = localStorage.getItem('client') || sessionStorage.getItem('client');
    const client = clientData ? JSON.parse(clientData) : null;
    const userId = client?.id || '024ec841-36c9-4a6c-8173-c1c423e2095b';
    
    const response = await fetch(`${API_BASE_URL}/orders/${id}/cancel`, {
      method: 'PUT',
      headers: {
        'x-user-id': userId,
      },
    });
    if (!response.ok) throw new Error('Failed to cancel order');
    return response.json();
  },
};

// Clients API
export interface Client {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber: string;
  address?: string;
  role: 'ADMIN' | 'CLIENT';
  createdAt: string;
}

export const clientsApi = {
  getAll: async (): Promise<Client[]> => {
    const response = await fetch(`${API_BASE_URL}/client`);
    if (!response.ok) throw new Error('Failed to fetch clients');
    const data = await response.json();
    return data.clients;
  },
};

// Album Templates API
export interface AlbumTemplate {
  id: number;
  name: string;
  imageUrl: string;
  tags?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const templatesApi = {
  getActive: async (): Promise<AlbumTemplate[]> => {
    const response = await fetch(`${API_BASE_URL}/templates`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  getAllAdmin: async (): Promise<AlbumTemplate[]> => {
    const response = await fetch(`${API_BASE_URL}/templates/admin`);
    if (!response.ok) throw new Error('Failed to fetch templates');
    return response.json();
  },

  create: async (data: { name: string; imageUrl: string; tags?: string; isActive?: boolean }): Promise<AlbumTemplate> => {
    const response = await fetch(`${API_BASE_URL}/templates/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to create template' }));
      throw new Error(errorData.message || 'Failed to create template');
    }
    return response.json();
  },

  update: async (id: number, data: Partial<{ name: string; imageUrl: string; tags?: string; isActive: boolean }>): Promise<AlbumTemplate> => {
    const response = await fetch(`${API_BASE_URL}/templates/admin/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to update template' }));
      throw new Error(errorData.message || 'Failed to update template');
    }
    return response.json();
  },

  delete: async (id: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/templates/admin/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete template');
    return response.json();
  },

  upload: async (file: File): Promise<{ imageUrl: string; imagePath: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/templates/admin/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: 'Failed to upload template' }));
      throw new Error(errorData.message || 'Failed to upload template');
    }
    return response.json();
  },
};
