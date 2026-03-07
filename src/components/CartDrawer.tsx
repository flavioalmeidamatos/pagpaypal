
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { ShoppingBag, X, Plus, Minus, Trash2 } from 'lucide-react';
import { PayPalCheckoutButton } from './PayPalCheckoutButton';

interface CartDrawerProps {
    isOpen: boolean;
    onClose: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose }) => {
    const { items, removeItem, updateQuantity, subtotal } = useCart();

    const initialOptions = {
        "client-id": "test", // This will be passed via Env at runtime or hardcoded for sandbox
        currency: "BRL",
        intent: "capture",
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[60] overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl overflow-hidden flex flex-col"
                    >
                        <div className="p-6 flex items-center justify-between border-b">
                            <h2 className="text-2xl font-bold flex items-center gap-3">
                                <ShoppingBag className="text-rose-500" />
                                Seu Carrinho
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-gray-900 transition-colors cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-grow overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-4">
                                    <ShoppingBag size={64} strokeWidth={1} />
                                    <p>Seu carrinho está vazio</p>
                                </div>
                            ) : (
                                items.map((item) => (
                                    <div key={item.id} className="flex gap-4">
                                        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-2xl bg-gray-50">
                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                        </div>
                                        <div className="flex-grow">
                                            <h4 className="text-sm font-semibold text-gray-900 line-clamp-1">{item.name}</h4>
                                            <p className="text-xs text-gray-500">{item.brand}</p>
                                            <div className="mt-2 flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                                    >
                                                        <Minus size={14} />
                                                    </button>
                                                    <span className="text-sm font-medium w-4 text-center">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                        className="p-1 rounded-md bg-gray-100 hover:bg-gray-200 cursor-pointer"
                                                    >
                                                        <Plus size={14} />
                                                    </button>
                                                </div>
                                                <p className="font-bold">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(item.price)}
                                                </p>
                                                <button
                                                    onClick={() => removeItem(item.id)}
                                                    className="p-2 text-red-400 hover:text-red-600 transition-colors cursor-pointer"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="p-8 border-t bg-gray-50 space-y-4">
                            <div className="flex items-center justify-between text-lg">
                                <span className="text-gray-600">Subtotal</span>
                                <span className="font-semibold">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-2xl font-bold">
                                <span>Total</span>
                                <span>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(subtotal)}
                                </span>
                            </div>

                            {items.length > 0 && (
                                <PayPalScriptProvider options={{
                                    "client-id": import.meta.env.VITE_PAYPAL_CLIENT_ID || "test",
                                    currency: "BRL",
                                    intent: "capture"
                                }}>
                                    <div className="mt-4">
                                        <PayPalCheckoutButton />
                                    </div>
                                </PayPalScriptProvider>
                            )}

                            <p className="text-center text-xs text-gray-400">
                                Pagamento seguro via PayPal
                            </p>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
