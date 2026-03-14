import { ShoppingBag, Sparkles } from 'lucide-react';
import { useCart } from '../hooks/useCart';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
    onCartOpen: () => void;
}

export const Header = ({ onCartOpen }: HeaderProps) => {
    const { totalItems } = useCart();

    return (
        <header className="sticky top-0 z-40 w-full border-b border-gray-100 bg-white/70 backdrop-blur-xl">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:h-20 sm:px-8">
                <div className="group flex cursor-pointer items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-900 transition-transform group-hover:rotate-12 sm:h-10 sm:w-10">
                        <Sparkles className="text-white" size={18} />
                    </div>
                    <span className="text-base font-black tracking-tighter text-gray-900 sm:text-xl">SKINCARE.CO - versão: PayPal</span>
                </div>

                <button
                    onClick={onCartOpen}
                    className="group relative rounded-full bg-gray-50 p-2.5 transition-colors hover:bg-gray-100 cursor-pointer sm:p-3"
                    aria-label={`Abrir sacola${totalItems > 0 ? ` com ${totalItems} itens` : ''}`}
                >
                    <ShoppingBag size={22} className="text-gray-900 sm:h-6 sm:w-6" />
                    <AnimatePresence>
                        {totalItems > 0 && (
                            <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 text-[10px] font-bold text-white sm:h-6 sm:w-6"
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
