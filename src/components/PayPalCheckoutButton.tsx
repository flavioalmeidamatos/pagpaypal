
import React from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';

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
            console.log('[PayPal] Iniciando captura da ordem:', data.orderID);
            const response = await axios.post('/api?action=capture', {
                orderID: data.orderID
            });

            console.log('[PayPal] Resposta do backend (capture):', response.data);

            if (response.data.status === 'COMPLETED') {
                // Registrar no Supabase para persistência (Modernização Fintech)
                const orderData = {
                    paypal_order_id: data.orderID,
                    status: 'COMPLETED',
                    amount: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
                    currency: 'BRL',
                    customer_email: response.data.payer?.email_address || 'guest@example.com'
                };

                try {
                    const { error: dbError } = await supabase
                        .from('orders')
                        .insert([orderData]);

                    if (dbError) {
                        console.error('[Supabase Error]', dbError);
                    }
                } catch (dbEx) {
                    console.error('[Supabase Exception]', dbEx);
                }

                alert('Pagamento Realizado com Sucesso e Registrado!');
                clearCart();
            } else {
                console.warn('[PayPal] Ordem aprovada mas status não é COMPLETED:', response.data.status);
                alert(`O pagamento foi autorizado mas está com status: ${response.data.status}. Verifique sua conta PayPal.`);
            }
        } catch (error: any) {
            console.error('Error capturing order:', error);
            const errorMsg = error.response?.data?.details?.message || error.message || 'Erro desconhecido';
            alert(`Erro ao processar pagamento: ${errorMsg}\nPor favor, tente novamente.`);
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
