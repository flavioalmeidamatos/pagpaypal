import { useContext } from 'react';
import { CartContext } from '../context/CartContext';

export const useCart = () => {
    const cartContext = useContext(CartContext);

    if (!cartContext) {
        throw new Error('useCart must be used within a CartProvider');
    }

    return cartContext;
};
