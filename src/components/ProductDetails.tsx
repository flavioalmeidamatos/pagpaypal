import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Product } from '../types/product';
import { useCart } from '../hooks/useCart';
import { ShoppingBag, X } from 'lucide-react';

interface ProductDetailsProps {
    product: Product | null;
    onClose: () => void;
}

export const ProductDetails: React.FC<ProductDetailsProps> = ({ product, onClose }) => {
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
                            className="absolute right-6 top-6 z-10 p-2 text-gray-400 hover:text-gray-900 cursor-pointer"
                        >
                            <X size={24} />
                        </button>

                        <div className="grid grid-cols-1 md:grid-cols-2">
                            <div className="h-[400px] w-full bg-gray-50 md:h-[600px]">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="h-full w-full object-cover"
                                />
                            </div>

                            <div className="flex flex-col p-8 md:p-12">
                                <p className="text-sm font-bold tracking-[0.2em] text-rose-500 uppercase">
                                    {product.brand}
                                </p>
                                <h2 className="mt-2 text-3xl font-bold text-gray-900 md:text-4xl">
                                    {product.name}
                                </h2>
                                <span className="mt-4 inline-block rounded-full bg-gray-100 px-4 py-1 text-xs font-semibold text-gray-600 w-fit">
                                    {product.category}
                                </span>

                                <div className="mt-8 flex-grow">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase">Descrição</h4>
                                    <p className="mt-2 text-lg leading-relaxed text-gray-600">
                                        {product.description}
                                    </p>
                                </div>

                                <div className="mt-12 flex items-center justify-between">
                                    <div className="text-3xl font-bold text-gray-900">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                                    </div>
                                    <motion.button
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => {
                                            addItem(product);
                                            onClose();
                                        }}
                                        className="flex items-center gap-3 rounded-2xl bg-gray-900 px-8 py-4 text-white shadow-xl shadow-gray-200 transition-all hover:bg-gray-800 cursor-pointer"
                                    >
                                        <ShoppingBag size={20} />
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
};
