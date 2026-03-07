
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { ShoppingBag, X, Plus, Minus } from 'lucide-react';
import { PayPalCheckoutButton } from './PayPalCheckoutButton';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onProductSelect: (product: any) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onProductSelect }) => {
    const { items, removeItem, updateQuantity, subtotal } = useCart();

    // Bloqueio de scroll robusto (Modern Fintech UX)
    React.useEffect(() => {
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
                                    {items.length} {items.length === 1 ? 'item' : 'itens'} selecionados
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
                                                            <p className="text-xs font-extrabold text-gray-900">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                            </p>
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
                                            <span>
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                            </span>
                                        </div>
                                        <div className="h-px bg-gray-50" />
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold text-gray-900 uppercase">Total a Pagar</span>
                                            <span className="text-xl font-black text-gray-900">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Botões PayPal com Espaçamento Ajustado */}
                                    <div className="space-y-6 pt-2">
                                        <PayPalScriptProvider options={{
                                            clientId: (import.meta.env.VITE_PAYPAL_CLIENT_ID || "test").trim(),
                                            currency: "BRL",
                                            intent: "capture",
                                            "enable-funding": "paylater,venmo",
                                            components: "buttons,marks"
                                        }}>
                                            <div className="min-h-[180px] relative px-1">
                                                <PayPalCheckoutButton />
                                            </div>
                                        </PayPalScriptProvider>
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
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
