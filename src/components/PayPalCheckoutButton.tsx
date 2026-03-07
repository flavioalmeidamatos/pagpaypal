
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
        <div className="w-full space-y-4">
            <PayPalButtons
                style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "pay",
                    height: 50
                }}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={(err) => {
                    console.error('[PayPal UI Error]', err);
                }}
            />
            {/* Opcional: Adicionar Badge de Compra Segura conforme boas práticas */}
            <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                <span className="text-[10px] font-medium tracking-tight uppercase">Ambiente Seguro</span>
                <div className="w-px h-3 bg-gray-300" />
                <img src="https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png" className="h-4" alt="PayPal" />
            </div>
        </div>
    );
};
