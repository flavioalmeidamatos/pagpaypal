
import React from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';
import { useCart } from '../hooks/useCart';

export const PayPalCheckoutButton: React.FC = () => {
    const { items, clearCart } = useCart();

    const createOrder = async () => {
        try {
            const response = await axios.post('/api?action=create', {
                cart: items
            });
            return response.data.id;
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    };

    const onApprove = async (data: any) => {
        try {
            const response = await axios.post('/api?action=capture', {
                orderID: data.orderID
            });

            if (response.data.status === 'COMPLETED') {
                alert('Pagamento Realizado com Sucesso!');
                clearCart();
            }
        } catch (error) {
            console.error('Error capturing order:', error);
            alert('Erro ao processar pagamento. Por favor, tente novamente.');
        }
    };

    return (
        <PayPalButtons
            style={{
                layout: "vertical",
                color: "blue",
                shape: "pill",
                label: "checkout",
                height: 55
            }}
            createOrder={createOrder}
            onApprove={onApprove}
        />
    );
};
