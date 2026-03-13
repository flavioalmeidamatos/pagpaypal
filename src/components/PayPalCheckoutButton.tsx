import axios, { AxiosError } from 'axios';
import { PayPalButtons } from "@paypal/react-paypal-js";
import { useState } from 'react';
import { useCart } from '../hooks/useCart';

type PaymentStatus = 'idle' | 'processing' | 'error';

interface CreateOrderResponse {
    id: string;
}

interface CaptureResponse {
    id?: string;
    status?: string;
    persistenceWarning?: string;
    payer?: {
        email_address?: string;
    };
}

interface ApprovalData {
    orderID: string;
}

interface ApiErrorDetail {
    issue?: string;
    description?: string;
}

interface ApiErrorResponse {
    error?: string;
    message?: string;
    details?: ApiErrorDetail[];
}

interface PayPalCheckoutButtonProps {
    onPaymentSuccess: (details: { orderId?: string; payerEmail?: string }) => void;
}

function getApiErrorMessage(error: AxiosError<ApiErrorResponse>) {
    const paypalDetails = error.response?.data?.details;

    if (Array.isArray(paypalDetails) && paypalDetails.length > 0) {
        return `${paypalDetails[0].issue}: ${paypalDetails[0].description}`;
    }

    return (
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Erro desconhecido ao processar pagamento.'
    );
}

export function PayPalCheckoutButton({ onPaymentSuccess }: PayPalCheckoutButtonProps) {
    const { items, clearCart } = useCart();
    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string>('');

    const createOrder = async () => {
        try {
            const response = await axios.post<CreateOrderResponse>('/api?action=create', {
                cart: items
            });
            return response.data.id;
        } catch (error: unknown) {
            const apiError = error as AxiosError<ApiErrorResponse>;
            console.error('[PayPal] Erro ao criar ordem:', apiError.response?.data || apiError.message);
            setStatus('error');
            setErrorMessage(getApiErrorMessage(apiError));
            throw error;
        }
    };

    const onApprove = async (data: ApprovalData) => {
        setStatus('processing');
        setErrorMessage('');
        try {
            console.log('[PayPal] Capturando ordem:', data.orderID);
            const response = await axios.post<CaptureResponse>('/api?action=capture', {
                orderID: data.orderID,
                cart: items
            });

            console.log('[PayPal] Resposta da captura:', response.data);
            const captureStatus = response.data?.status;

            if (captureStatus === 'COMPLETED') {
                if (response.data.persistenceWarning) {
                    console.warn('[PayPal] Pagamento confirmado com alerta de persistência:', response.data.persistenceWarning);
                }

                setStatus('idle');
                setErrorMessage('');
                clearCart();
                onPaymentSuccess({
                    orderId: response.data?.id,
                    payerEmail: response.data?.payer?.email_address
                });
            } else {
                console.warn('[PayPal] Status inesperado:', captureStatus);
                setStatus('error');
                setErrorMessage(`Pagamento com status inesperado: ${captureStatus}. Verifique sua conta PayPal.`);
            }
        } catch (error: unknown) {
            const apiError = error as AxiosError<ApiErrorResponse>;
            console.error('[PayPal] Falha na captura:', apiError);
            setStatus('error');
            setErrorMessage(getApiErrorMessage(apiError));
        }
    };

    const onError = (err: unknown) => {
        console.error('[PayPal SDK] Erro:', err);
        setStatus('error');
        setErrorMessage((currentMessage) => currentMessage || 'Ocorreu um erro com o PayPal. Tente novamente.');
    };

    return (
        <div className="w-full space-y-3">
            {/* Mensagem de erro visível */}
            {status === 'error' && errorMessage && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium leading-relaxed">
                    {errorMessage}
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
                disabled={status === 'processing' || items.length === 0}
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
}
