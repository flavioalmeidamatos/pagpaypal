import { createContext, useCallback, useMemo, useState, type ReactNode } from 'react';
import { getCartItemCount, getCartSubtotal } from '../lib/cart';
import type { CartItem, Product } from '../types/product';

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product) => void;
    removeItem: (productId: string) => void;
    updateQuantity: (productId: string, quantity: number) => void;
    clearCart: () => void;
    subtotal: number;
    totalItems: number;
}

// eslint-disable-next-line react-refresh/only-export-components
export const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
    children: ReactNode;
}

export function CartProvider({ children }: CartProviderProps) {
    const [items, setItems] = useState<CartItem[]>([]);

    const addItem = useCallback((product: Product) => {
        setItems((currentItems) => {
            const existingItem = currentItems.find((item) => item.id === product.id);

            if (!existingItem) {
                return [...currentItems, { ...product, quantity: 1 }];
            }

            return currentItems.map((item) =>
                item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            );
        });
    }, []);

    const removeItem = useCallback((productId: string) => {
        setItems((prev) => prev.filter((item) => item.id !== productId));
    }, []);

    const updateQuantity = useCallback((productId: string, quantity: number) => {
        if (quantity <= 0) {
            removeItem(productId);
            return;
        }
        setItems((currentItems) =>
            currentItems.map((item) => (item.id === productId ? { ...item, quantity } : item))
        );
    }, [removeItem]);

    const clearCart = useCallback(() => setItems([]), []);

    const subtotal = useMemo(() => getCartSubtotal(items), [items]);
    const totalItems = useMemo(() => getCartItemCount(items), [items]);
    const value = useMemo(
        () => ({
            items,
            addItem,
            removeItem,
            updateQuantity,
            clearCart,
            subtotal,
            totalItems,
        }),
        [items, addItem, removeItem, updateQuantity, clearCart, subtotal, totalItems]
    );

    return (
        <CartContext.Provider value={value}>{children}</CartContext.Provider>
    );
}
