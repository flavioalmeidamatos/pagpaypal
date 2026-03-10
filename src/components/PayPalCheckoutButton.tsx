
import React, { useState } from 'react';
import { PayPalButtons } from "@paypal/react-paypal-js";
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';

type PaymentStatus = 'idle' | 'processing' | 'success' | 'error';

export const PayPalCheckoutButton: React.FC = () => {
    const { items, clearCart } = useCart();
    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const createOrder = async () => {
        try {
            const response = await axios.post('/api?action=create', {
                cart: items
            });
            return response.data.id;
        } catch (error: any) {
            console.error('[PayPal] Erro ao criar ordem:', error.response?.data || error.message);
            setStatus('error');
            setErrorMessage('Não foi possível iniciar o pagamento. Tente novamente.');
            throw error;
        }
    };

    const onApprove = async (data: any) => {
        setStatus('processing');
        setErrorMessage('');
        try {
            console.log('[PayPal] Capturando ordem:', data.orderID);
            const response = await axios.post('/api?action=capture', {
                orderID: data.orderID
            });

            console.log('[PayPal] Resposta da captura:', response.data);
            const captureStatus = response.data?.status;

            if (captureStatus === 'COMPLETED') {
                // Gravar pedido no Supabase
                const orderData = {
                    paypal_order_id: data.orderID,
                    status: 'COMPLETED',
                    amount: items.reduce((acc, item) => acc + item.price * item.quantity, 0),
                    currency: 'BRL',
                    customer_email: response.data.payer?.email_address || 'guest@example.com'
                };

                const { error: dbError } = await supabase
                    .from('orders')
                    .insert([orderData]);

                if (dbError) {
                    console.error('[Supabase] Erro ao gravar pedido:', dbError);
                } else {
                    console.log('[Supabase] Pedido gravado com sucesso!');
                }

                setStatus('success');
                clearCart();
            } else {
                console.warn('[PayPal] Status inesperado:', captureStatus);
                setStatus('error');
                setErrorMessage(`Pagamento com status inesperado: ${captureStatus}. Verifique sua conta PayPal.`);
            }
        } catch (error: any) {
            console.error('[PayPal] Falha na captura:', error);

            // Extrair mensagem de erro detalhada do PayPal
            const paypalDetails = error.response?.data?.details;
            let msg = '';

            if (Array.isArray(paypalDetails) && paypalDetails.length > 0) {
                msg = `${paypalDetails[0].issue}: ${paypalDetails[0].description}`;
            } else if (error.response?.data?.message) {
                msg = error.response.data.message;
            } else {
                msg = error.message || 'Erro desconhecido ao processar pagamento.';
            }

            setStatus('error');
            setErrorMessage(msg);

            // Relançar para o PayPal SDK saber que falhou (evita spinner infinito)
            throw error;
        }
    };

    const onError = (err: any) => {
        console.error('[PayPal SDK] Erro:', err);
        setStatus('error');
        setErrorMessage('Ocorreu um erro com o PayPal. Tente novamente.');
    };

    // Tela de sucesso
    if (status === 'success') {
        return (
            <div className="w-full">
                <div className="flex flex-col items-center gap-3 py-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                        <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-green-700">Pagamento realizado com sucesso!</p>
                    <p className="text-xs text-gray-400">Seu pedido foi registrado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full space-y-3">
            {/* Mensagem de erro visível */}
            {status === 'error' && errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium leading-relaxed">
                    ⚠️ {errorMessage}
                    <button
                        onClick={() => { setStatus('idle'); setErrorMessage(''); }}
                        className="block mt-1 text-red-500 underline cursor-pointer"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Indicador de processamento */}
            {status === 'processing' && (
                <div className="flex items-center gap-2 text-xs text-gray-500 py-2 justify-center">
                    <div className="w-3.5 h-3.5 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                    Processando seu pagamento...
                </div>
            )}

            <PayPalButtons
                style={{
                    layout: "vertical",
                    color: "gold",
                    shape: "rect",
                    label: "pay",
                    height: 50
                }}
                disabled={status === 'processing'}
                createOrder={createOrder}
                onApprove={onApprove}
                onError={onError}
            />

            {/* Badge de segurança */}
            <div className="flex items-center justify-center gap-2 opacity-50 grayscale hover:grayscale-0 transition-all cursor-default">
                <span className="text-[10px] font-medium tracking-tight uppercase">Ambiente Seguro</span>
                <div className="w-px h-3 bg-gray-300" />
                <img src="https://www.paypalobjects.com/webstatic/mktg/logo-center/PP_Acceptance_Marks_for_LogoCenter_266x142.png" className="h-4" alt="PayPal" />
            </div>
        </div>
    );
};
