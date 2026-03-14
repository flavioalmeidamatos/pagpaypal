import { PayPalScriptProvider } from '@paypal/react-paypal-js';
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

    const handleDrawerClose = () => {
        setSuccessfulPayment(null);
        onClose();
    };

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

    const handleSuccessModalClose = () => {
        setSuccessfulPayment(null);
        onClose();
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] flex justify-end">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-[2px]"
                        onClick={handleDrawerClose}
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
                        className="relative z-[70] flex h-full w-full max-w-lg flex-col bg-white shadow-2xl"
                    >
                        <div className="z-10 flex shrink-0 items-center justify-between border-b bg-white p-6">
                            <div className="flex flex-col">
                                <h2 className="flex items-center gap-2 text-xl font-bold text-gray-900">
                                    <ShoppingBag size={20} className="text-rose-500" />
                                    Sua Sacola
                                </h2>
                                <p className="ml-7 text-[11px] font-medium uppercase tracking-wider text-gray-400">
                                    {totalItems} {totalItems === 1 ? 'item' : 'itens'} selecionados
                                </p>
                            </div>
                            <button
                                onClick={handleDrawerClose}
                                className="rounded-full p-2 text-gray-400 transition-all hover:bg-gray-100 hover:text-gray-900 cursor-pointer"
                                aria-label="Fechar"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div
                            className="flex-grow overflow-y-auto overscroll-contain bg-white"
                            style={{ WebkitOverflowScrolling: 'touch' }}
                        >
                            <div className="space-y-5 p-6">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center space-y-4 py-24 text-gray-300">
                                        <div className="rounded-full bg-gray-50 p-6">
                                            <ShoppingBag size={48} strokeWidth={1} />
                                        </div>
                                        <p className="text-sm font-medium">Sua sacola está vazia</p>
                                        <button
                                            onClick={handleDrawerClose}
                                            className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
                                        >
                                            Continuar Comprando
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {items.map((item) => (
                                            <div
                                                key={item.id}
                                                className="group/item flex cursor-pointer gap-4 rounded-2xl border border-gray-100 p-3 transition-all hover:border-rose-100 hover:bg-rose-50/20"
                                                onClick={() => {
                                                    onProductSelect(item);
                                                    handleDrawerClose();
                                                }}
                                            >
                                                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50">
                                                    <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                </div>
                                                <div className="flex flex-grow flex-col justify-between py-1">
                                                    <div>
                                                        <h4 className="line-clamp-1 text-xs font-bold text-gray-900">{item.name}</h4>
                                                        <p className="text-[10px] font-medium text-gray-400">{item.brand}</p>
                                                    </div>

                                                    <div className="mt-auto flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                                                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-1">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white shadow-sm transition-colors hover:border-rose-300 cursor-pointer"
                                                            >
                                                                <Minus size={10} />
                                                            </button>
                                                            <span className="w-4 text-center text-[11px] font-bold">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="flex h-6 w-6 items-center justify-center rounded border border-gray-200 bg-white shadow-sm transition-colors hover:border-rose-300 cursor-pointer"
                                                            >
                                                                <Plus size={10} />
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col items-end">
                                                            <p className="text-xs font-extrabold text-gray-900">{formatCurrency(item.price)}</p>
                                                            <button
                                                                onClick={() => removeItem(item.id)}
                                                                className="text-[9px] font-bold uppercase tracking-tighter text-gray-400 hover:text-rose-500"
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

                            {items.length > 0 && (
                                <div className="border-t bg-gray-50/80 p-6">
                                    <div className="mb-6 space-y-4 rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                                        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
                                            <span>Subtotal</span>
                                            <span>{formatCurrency(subtotal)}</span>
                                        </div>
                                        <div className="h-px bg-gray-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold uppercase text-gray-900">Total a Pagar</span>
                                            <span className="text-xl font-black text-gray-900">{formatCurrency(subtotal)}</span>
                                        </div>
                                    </div>

                                    <div className="space-y-6 pt-2">
                                        {paypalClientId ? (
                                            <PayPalScriptProvider options={{ clientId: paypalClientId, ...paypalScriptOptions }}>
                                                <div className="relative min-h-[180px] px-1">
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
                                        <div className="flex items-center gap-2 rounded-full bg-green-50 px-3 py-1.5">
                                            <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
                                            <span className="text-[9px] font-bold uppercase tracking-widest text-green-700">Conexão Segura Ativa</span>
                                        </div>
                                        <p className="max-w-[200px] text-center text-[10px] leading-relaxed text-gray-400">
                                            Seus dados estão protegidos por criptografia de ponta a ponta via PayPal SSL.
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
