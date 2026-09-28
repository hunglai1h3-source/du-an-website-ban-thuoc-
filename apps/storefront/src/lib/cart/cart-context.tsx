"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Product } from "@/types";
import { CartItem, CartContextType } from "@/types/cart";
import { PRODUCTS_DATA } from "@/data/products";

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = "h4care_cart_session";
const FREE_SHIPPING_THRESHOLD = 300000; // 300.000đ Freeship chuẩn nhà thuốc
const STANDARD_SHIPPING_FEE = 25000;

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [lastAddedItem, setLastAddedItem] = useState<CartItem | null>(null);
  const [showToast, setShowToast] = useState(false);

  // Load from localStorage on mount (with realistic fallback)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setItems(parsed);
          setIsLoaded(true);
          return;
        }
      }
      
      // Default demo mock items if completely empty
      const sample1 = PRODUCTS_DATA.find((p) => p.slug === "panadol-extra-do");
      const sample2 = PRODUCTS_DATA.find((p) => p.slug === "berberin-50mg");
      const initialDemoItems: CartItem[] = [];
      if (sample1) {
        initialDemoItems.push({
          product: sample1,
          quantity: 2,
          addedAt: new Date().toISOString(),
        });
      }
      if (sample2) {
        initialDemoItems.push({
          product: sample2,
          quantity: 1,
          addedAt: new Date().toISOString(),
        });
      }
      setItems(initialDemoItems);
    } catch {
      // Fallback
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage whenever items change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      } catch {
        // Handle storage quota issues
      }
    }
  }, [items, isLoaded]);

  // Toast auto-hide
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showToast) {
      timer = setTimeout(() => {
        setShowToast(false);
      }, 3500);
    }
    return () => clearTimeout(timer);
  }, [showToast]);

  const addToCart = useCallback((product: Product, quantity: number = 1) => {
    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((item) => item.product.id === product.id);
      let updated: CartItem[];

      if (existingIndex > -1) {
        updated = [...prevItems];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
        };
      } else {
        const newItem: CartItem = {
          product,
          quantity,
          addedAt: new Date().toISOString(),
        };
        updated = [newItem, ...prevItems];
      }

      const added = { product, quantity, addedAt: new Date().toISOString() };
      setLastAddedItem(added);
      setShowToast(true);

      return updated;
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.product.id !== productId));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const closeToast = useCallback(() => {
    setShowToast(false);
  }, []);

  // Totals calculations
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const totalPrice = items.reduce((sum, item) => {
    const price = item.product.salePrice || item.product.price;
    return sum + price * item.quantity;
  }, 0);

  const shippingFee = totalPrice >= FREE_SHIPPING_THRESHOLD || totalItems === 0 ? 0 : STANDARD_SHIPPING_FEE;
  const discountAmount = 0;
  const finalTotal = totalPrice + shippingFee - discountAmount;
  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totalPrice);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        shippingFee,
        discountAmount,
        finalTotal,
        freeShippingThreshold: FREE_SHIPPING_THRESHOLD,
        freeShippingRemaining,
        lastAddedItem,
        showToast,
        closeToast,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
