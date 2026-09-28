import { Product } from "./index";

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: string;
}

export interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  shippingFee: number;
  discountAmount: number;
  finalTotal: number;
  freeShippingThreshold: number;
  freeShippingRemaining: number;
  lastAddedItem: CartItem | null;
  showToast: boolean;
  closeToast: () => void;
}
