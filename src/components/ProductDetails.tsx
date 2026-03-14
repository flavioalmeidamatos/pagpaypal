import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../hooks/useCart';
import { formatCurrency } from '../lib/currency';
import { ShoppingBag, X } from 'lucide-react';
import type { Product } from '../types/product';

interface ProductDetailsProps {
    product: Product | null;
    onClose: () => void;
}

export function ProductDetails({ product, onClose }: ProductDetailsProps) {
    const { addItem } = useCart();

    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    initial={{ opacity: 0, y: 100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 100 }}
                    className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center sm:p-0"
                >
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

                    <motion.div
                        layoutId={`product-${product.id}`}
                        className="relative w-full max-w-4xl overflow-hidden rounded-t-[40px] bg-white shadow-2xl sm:rounded-[40px]"
                    >
                        <button
                            onClick={onClose}
                            className="absolute right-4 top-4 z-10 p-2 text-gray-400 hover:text-gray-900 cursor-pointer sm:right-6 sm:top-6"
                        >
                            <X size={24} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="h-[280px] w-full bg-gray-50 sm:h-[400px] md:h-[600px]">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="flex flex-col p-5 sm:p-8 md:p-12">
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-rose-500 sm:text-sm sm:tracking-[0.2em]">
                                    {product.brand}
                                </p>
                                <h2 className="mt-2 text-2xl font-bold text-gray-900 sm:text-3xl md:text-4xl">
                                    {product.name}
                                </h2>
                                <span className="mt-3 inline-block w-fit rounded-full bg-gray-100 px-4 py-1 text-[11px] font-semibold text-gray-600 sm:mt-4 sm:text-xs">
                                    {product.category}
                                </span>

                                <div className="mt-6 flex-grow sm:mt-8">
                                    <h4 className="text-xs font-bold uppercase text-gray-900 sm:text-sm">DescriÃ§Ã£o</h4>
                                    <p className="mt-2 text-base leading-relaxed text-gray-600 sm:text-lg">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="mt-8 flex flex-col gap-4 sm:mt-12 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="text-2xl font-bold text-gray-900 sm:text-3xl">{formatCurrency(product.price)}</div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            addItem(product);
                                            onClose();
                                        }}
                                        className="flex h-fit w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white transition-all hover:bg-gray-800 cursor-pointer whitespace-nowrap sm:w-auto sm:px-5"
                                    >
                                        <ShoppingBag size={18} />
                                        <span>Adicionar ao Carrinho</span>
                                    </motion.button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
