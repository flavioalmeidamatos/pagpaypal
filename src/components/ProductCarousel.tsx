import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Product } from '../types/product';
import { ProductCard } from './ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ProductCarouselProps {
    products: Product[];
    onSelect: (product: Product) => void;
    selectedId?: string;
}

export const ProductCarousel: React.FC<ProductCarouselProps> = ({ products, onSelect, selectedId }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(true);

    const checkScroll = () => {
        const el = containerRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 10);
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
    };

    useEffect(() => {
        const el = containerRef.current;
        if (!el) return;
        checkScroll();
        el.addEventListener('scroll', checkScroll, { passive: true });
        window.addEventListener('resize', checkScroll);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            window.removeEventListener('resize', checkScroll);
        };
    }, [products]);

    const scroll = (direction: 'left' | 'right') => {
        if (containerRef.current) {
            const cardWidth = containerRef.current.querySelector('div')?.clientWidth || 280;
            const scrollAmount = cardWidth + 32; // card + gap
            const { scrollLeft } = containerRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - scrollAmount : scrollLeft + scrollAmount;
            containerRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative">
            {/* Gradiente esquerdo — indica mais conteúdo */}
            <div
                className={`absolute left-0 top-0 h-full w-16 sm:w-24 bg-gradient-to-r from-gray-50 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollLeft ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Gradiente direito — indica mais conteúdo */}
            <div
                className={`absolute right-0 top-0 h-full w-16 sm:w-24 bg-gradient-to-l from-gray-50 to-transparent z-10 pointer-events-none transition-opacity duration-300 ${canScrollRight ? 'opacity-100' : 'opacity-0'}`}
            />

            {/* Seta esquerda — sempre visível no mobile quando há conteúdo */}
            <motion.button
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: canScrollLeft ? 1 : 0, x: canScrollLeft ? 0 : -4 }}
                transition={{ duration: 0.2 }}
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                aria-label="Anterior"
                className="absolute left-1 sm:left-2 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white hover:shadow-xl active:scale-95 transition-all cursor-pointer border border-gray-100 disabled:pointer-events-none"
            >
                <ChevronLeft size={20} className="text-gray-800 sm:w-6 sm:h-6" />
            </motion.button>

            {/* Lista de produtos */}
            <motion.div
                ref={containerRef}
                className="flex gap-6 sm:gap-8 overflow-x-auto px-10 sm:px-16 py-8 sm:py-12 no-scrollbar cursor-grab active:cursor-grabbing scroll-smooth"
            >
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={() => onSelect(product)}
                        isSelected={selectedId === product.id}
                    />
                ))}
            </motion.div>

            {/* Seta direita — sempre visível no mobile quando há conteúdo */}
            <motion.button
                initial={{ opacity: 0, x: 4 }}
                animate={{ opacity: canScrollRight ? 1 : 0, x: canScrollRight ? 0 : 4 }}
                transition={{ duration: 0.2 }}
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                aria-label="Próximo"
                className="absolute right-1 sm:right-2 top-1/2 -translate-y-1/2 z-20 p-2 sm:p-3 bg-white/90 backdrop-blur-md rounded-full shadow-lg hover:bg-white hover:shadow-xl active:scale-95 transition-all cursor-pointer border border-gray-100 disabled:pointer-events-none"
            >
                <ChevronRight size={20} className="text-gray-800 sm:w-6 sm:h-6" />
            </motion.button>
        </div>
    );
};
