import { motion } from 'framer-motion';
import { formatCurrency } from '../lib/currency';
import type { Product } from '../types/product';

interface ProductCardProps {
    product: Product;
    onClick: () => void;
    isSelected?: boolean;
}

export function ProductCard({ product, onClick, isSelected = false }: ProductCardProps) {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={`relative flex flex-col min-w-[200px] sm:min-w-[280px] cursor-pointer rounded-[24px] sm:rounded-3xl bg-white p-3 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${isSelected ? 'ring-2 ring-rose-500 shadow-lg sm:shadow-xl sm:scale-[1.03]' : ''}`}
        >
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
            </div>
            <div className="mt-3 sm:mt-4">
                <p className="text-xs font-bold tracking-widest text-rose-500 uppercase">{product.brand}</p>
                <h3 className="mt-1 text-sm sm:text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                <p className="mt-2 mb-3 text-base font-bold text-gray-900 sm:mb-4 sm:text-xl">{formatCurrency(product.price)}</p>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="mt-auto w-full rounded-xl bg-gray-900 px-4 py-3 sm:py-4 text-sm sm:text-base font-semibold text-white transition-colors hover:bg-gray-800 active:bg-gray-700 cursor-pointer min-h-[44px] sm:min-h-[48px]"
            >
                Selecionar
            </motion.button>
        </motion.div>
    );
}
