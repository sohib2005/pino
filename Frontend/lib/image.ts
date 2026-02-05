const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const resolveImageUrl = (imageUrl?: string | null): string | undefined => {
  if (!imageUrl) return undefined;
  const trimmed = imageUrl.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http')) return trimmed;
  if (trimmed.startsWith('/')) return `${API_BASE_URL}${trimmed}`;
  if (trimmed.startsWith('uploads/')) return `${API_BASE_URL}/${trimmed}`;
  if (trimmed.startsWith('products/') || trimmed.startsWith('carousel/')) {
    return `${API_BASE_URL}/uploads/${trimmed}`;
  }
  if (trimmed.includes('/')) return `${API_BASE_URL}/uploads/${trimmed}`;
  return `${API_BASE_URL}/uploads/${trimmed}`;
};

export const resolveProductImageUrl = (product?: {
  imageUrl?: string | null;
  images?: Array<{ imageUrl: string }>;
}): string | undefined => {
  if (!product) return undefined;
  const rawUrl = product.images?.[0]?.imageUrl || product.imageUrl || undefined;
  if (!rawUrl) return undefined;
  const trimmed = rawUrl.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith('http') || trimmed.startsWith('/') || trimmed.startsWith('uploads/') || trimmed.includes('/')) {
    return resolveImageUrl(trimmed);
  }
  return `${API_BASE_URL}/uploads/products/${trimmed}`;
};
