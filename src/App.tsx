import { useState } from 'react';
import { CartProvider } from './context/CartContext';
import { products } from './data/products';
import { ProductCarousel } from './components/ProductCarousel';
import { ProductDetails } from './components/ProductDetails';
import { CartDrawer } from './components/CartDrawer';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import type { Product } from './types/product';
import { motion } from 'framer-motion';

const StoreContent = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header onCartOpen={() => setIsCartOpen(true)} />

      <main className="max-w-7xl mx-auto py-16 px-8">
        <div className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block px-4 py-1 rounded-full bg-rose-50 text-rose-500 text-xs font-bold uppercase tracking-widest mb-4"
          >
            Coleção Botik & Cica
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-black text-gray-900 tracking-tight"
          >
            Produtos em Destaque
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed"
          >
            Descubra o cuidado avançado com fórmulas inovadoras para iluminar, firmar e renovar sua pele todos os dias.
          </motion.p>
        </div>

        <ProductCarousel
          products={products}
          onSelect={setSelectedProduct}
          selectedId={selectedProduct?.id}
        />

        <div className="mt-32 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-900 rounded-[40px] p-12 overflow-hidden relative group">
            <div className="relative z-10">
              <h3 className="text-3xl font-bold text-white mb-4">Nova Linha Retinol</h3>
              <p className="text-gray-400 mb-8 max-w-xs">Redução visível de rugas e uniformização da textura em 2 semanas.</p>
              <button className="px-8 py-3 bg-white text-gray-900 rounded-full font-bold hover:bg-gray-100 transition-colors cursor-pointer">Saiba Mais</button>
            </div>
          </div>
          <div className="bg-rose-100 rounded-[40px] p-12 flex flex-col justify-end">
            <h3 className="text-3xl font-bold text-gray-900 mb-2">Cuide da sua barreira</h3>
            <p className="text-rose-700/70 mb-8">Pantenol e Ceramidas para hidratação profunda e reparação imediata.</p>
            <button className="px-8 py-3 bg-gray-900 text-white rounded-full font-bold hover:bg-gray-800 transition-colors w-fit cursor-pointer">Ver Kit Completo</button>
          </div>
        </div>
      </main>

      <Footer />

      <ProductDetails
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <CartProvider>
      <StoreContent />
    </CartProvider>
  );
}
