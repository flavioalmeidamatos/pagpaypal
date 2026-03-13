import { ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    onCartOpen: () => void;
}

export const Header = ({ onCartOpen }: HeaderProps) => {
    const { totalItems } = useCart();

    return (
        <header className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100">
            <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between">
                <div className="flex items-center gap-2 cursor-pointer group">
                    <div className="h-10 w-10 bg-gray-900 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
                        <Sparkles className="text-white" size={20} />
                    </div>
                    <span className="text-xl font-black tracking-tighter text-gray-900">SKINCARE.CO</span>
                </div>

                <button
                    onClick={onCartOpen}
                    className="relative p-3 rounded-full bg-gray-50 hover:bg-gray-100 transition-colors group cursor-pointer"
                    aria-label={`Abrir sacola${totalItems > 0 ? ` com ${totalItems} itens` : ''}`}
                >
                    <ShoppingBag size={24} className="text-gray-900" />
                    <AnimatePresence>
                        {totalItems > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -top-1 -right-1 h-6 w-6 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white"
                            >
                                {totalItems}
                            </motion.span>
                        )}
                    </AnimatePresence>
                </button>
            </div>
        </header>
    );
};
