import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/currency';
import { PayPalCheckoutButton } from './PayPalCheckoutButton';
import type { Product } from '../types/product';

const paypalScriptOptions = {
    currency: 'BRL',
    intent: 'capture',
    'disable-funding': 'card,credit,paylater,venmo',
    components: 'buttons',
} as const;

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onProductSelect: (product: Product) => void;
}

interface SuccessfulPayment {
    orderId?: string;
    payerEmail?: string;
}

export function CartDrawer({ isOpen, onClose, onProductSelect }: CartDrawerProps) {
    const { items, removeItem, updateQuantity, subtotal, totalItems } = useCart();
    const paypalClientId = (import.meta.env.VITE_PAYPAL_CLIENT_ID || '').trim();
    const [successfulPayment, setSuccessfulPayment] = useState<SuccessfulPayment | null>(null);

    useEffect(() => {
        const html = document.documentElement;

        if (isOpen) {
            html.classList.add('overflow-hidden', 'h-full');
            document.body.classList.add('overflow-hidden', 'h-full', 'fixed', 'w-full');
        } else {
            html.classList.remove('overflow-hidden', 'h-full');
            document.body.classList.remove('overflow-hidden', 'h-full', 'fixed', 'w-full');
        }

        return () => {
            html.classList.remove('overflow-hidden', 'h-full');
            document.body.classList.remove('overflow-hidden', 'h-full', 'fixed', 'w-full');
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setSuccessfulPayment(null);
        }
    }, [isOpen]);

    const handleSuccessModalClose = () => {
        setSuccessfulPayment(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    {/* Overlay Escurecido */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                        onClick={onClose}
                    />

                    {/* Drawer Principal */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="relative h-full w-full max-w-lg bg-white shadow-2xl flex flex-col z-[70]"
                    >
                        {/* Header Fixo - Elevado */}
                        <div className="p-6 flex items-center justify-between border-b bg-white shrink-0 z-10">
                            <div className="flex flex-col">
                                <h2 className="text-xl font-bold flex items-center gap-2 text-gray-900">
                                    <ShoppingBag size={20} className="text-rose-500" />
                                    Sua Sacola
                                </h2>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider ml-7">
                                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} selecionados
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-900 transition-all cursor-pointer"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Área de Conteúdo Rolável */}
                        <div
                            className="flex-grow overflow-y-auto overscroll-contain bg-white"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <div className="p-6 space-y-5">
                                {items.length === 0 ? (
                                    <div className="py-24 flex flex-col items-center justify-center text-gray-300 space-y-4">
                                        <div className="p-6 rounded-full bg-gray-50">
                                            <ShoppingBag size={48} strokeWidth={1} />
                                        </div>
                                        <p className="text-sm font-medium">Sua sacola está vazia</p>
                                        <button
                                            onClick={onClose}
                                            className="text-rose-500 text-xs font-bold hover:underline cursor-pointer"
                                        >
                                            Continuar Comprando
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex gap-4 p-3 rounded-2xl border border-gray-100 hover:border-rose-100 hover:bg-rose-50/20 transition-all group/item cursor-pointer"
                                                onClick={() => {
                                                    onProductSelect(item);
                                                    onClose();
                                                }}
                                            >
                                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex-grow flex flex-col justify-between py-1">
                                                    <div>
                                                        <h4 className="text-xs font-bold text-gray-900 line-clamp-1">{item.name}</h4>
                                                        <p className="text-[10px] text-gray-400 font-medium">{item.brand}</p>
                                                    </div>

                                                    <div className="flex items-center justify-between mt-auto" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2 p-1 bg-gray-50 rounded-lg">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 shadow-sm hover:border-rose-300 transition-colors cursor-pointer"
                                                            >
                                                                <Minus size={10} />
                                                            </button>
                                                            <span className="text-[11px] font-bold w-4 text-center">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="w-6 h-6 flex items-center justify-center rounded bg-white border border-gray-200 shadow-sm hover:border-rose-300 transition-colors cursor-pointer"
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <p className="text-xs font-extrabold text-gray-900">{formatCurrency(item.price)}</p>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="text-[9px] text-gray-400 hover:text-rose-500 font-bold uppercase tracking-tighter"
                                                            >
                                                                Remover
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Seção de Resumo de Checkout */}
                            {items.length > 0 && (
                                <div className="p-6 border-t bg-gray-50/80">
                                    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100 space-y-4 mb-6">
                                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="h-px bg-gray-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-900 uppercase">Total a Pagar</span>
                                            <span className="text-xl font-black text-gray-900">{formatCurrency(subtotal)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-2">
                                        {paypalClientId ? (
                                            <PayPalScriptProvider options={{ clientId: paypalClientId, ...paypalScriptOptions }}>
                                                <div className="min-h-[180px] relative px-1">
                                                    <PayPalCheckoutButton onPaymentSuccess={setSuccessfulPayment} />
                                                </div>
                                            </PayPalScriptProvider>
                                        ) : (
                                            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                                                Defina `VITE_PAYPAL_CLIENT_ID` na Vercel para habilitar o checkout.
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 flex flex-col items-center gap-3">
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 rounded-full">
                                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                            <span className="text-[9px] font-bold text-green-700 uppercase tracking-widest">Conexão Segura Ativa</span>
                                        </div>
                                        <p className="text-[10px] text-gray-400 text-center leading-relaxed max-w-[200px]">
                                            Seus dados estão protegidos por criptografia de ponta-a-ponta via PayPal SSL.
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <AnimatePresence>
                            {successfulPayment && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 z-[80] flex items-center justify-center bg-gray-950/55 p-6 backdrop-blur-[2px]"
                                >
                                    <motion.div
                                        initial={{ opacity: 0, y: 24, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 12, scale: 0.98 }}
                                        transition={{ type: 'spring', stiffness: 220, damping: 22 }}
                                        className="w-full max-w-sm rounded-[32px] bg-white p-7 text-center shadow-2xl"
                                    >
                                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                                            <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                        <h3 className="mt-5 text-2xl font-black text-gray-900">Pagamento aprovado</h3>
                                        <p className="mt-3 text-sm leading-relaxed text-gray-500">
                                            Seu pagamento foi concluído com sucesso. Toque em OK para voltar ao menu principal.
                                        </p>
                                        {successfulPayment.orderId && (
                                            <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-[11px] font-semibold tracking-wide text-gray-500">
                                                Pedido {successfulPayment.orderId}
                                            </p>
                                        )}
                                        {successfulPayment.payerEmail && (
                                            <p className="mt-3 text-xs text-gray-400">
                                                Confirmação vinculada a {successfulPayment.payerEmail}
                                            </p>
                                        )}
                                        <button
                                            onClick={handleSuccessModalClose}
                                            className="mt-6 w-full rounded-full bg-gray-900 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-gray-800"
                                        >
                                            OK
                                        </button>
                                    </motion.div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
