import { motion } from 'framer-motion';
import type { Product } from '../types/product';

interface ProductCardProps {
    product: Product;
    onClick: () => void;
    isSelected?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, isSelected }) => {
    return (
        <motion.div
            layout
            onClick={onClick}
            className={`relative flex flex-col min-w-[280px] cursor-pointer rounded-3xl bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-xl ${isSelected ? 'ring-2 ring-rose-500 shadow-xl scale-105' : ''
                }`}
            animate={{ scale: isSelected ? 1.05 : 1 }}
        >
            <div className="aspect-square w-full overflow-hidden rounded-2xl bg-gray-50">
                <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                />
            </div>
            <div className="mt-4">
                <p className="text-xs font-bold tracking-widest text-rose-500 uppercase">{product.brand}</p>
                <h3 className="mt-1 text-lg font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
                <p className="mt-2 text-xl font-bold text-gray-900 mb-4">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(product.price)}
                </p>
            </div>
            <motion.button
                whileTap={{ scale: 0.95 }}
                className="mt-auto w-full rounded-xl bg-gray-900 py-3 px-4 text-sm font-medium text-white transition-colors hover:bg-gray-800 cursor-pointer"
            >
                Selecionar
            </motion.button>
        </motion.div>
    );
};
