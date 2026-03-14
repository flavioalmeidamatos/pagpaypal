import { useState } from 'react';
import { motion } from 'framer-motion';
import { CartProvider } from './context/CartContext';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { ProductCarousel } from './components/ProductCarousel';
import { ProductDetails } from './components/ProductDetails';
import { CartDrawer } from './components/CartDrawer';
import { products } from './data/products';
import type { Product } from './types/product';

const StoreContent = () => {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Header onCartOpen={() => setIsCartOpen(true)} />

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-8 sm:py-16">
        <div className="mb-10 text-center sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 inline-block rounded-full bg-rose-50 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-rose-500 sm:mb-4 sm:px-4 sm:text-xs sm:tracking-widest"
          >
            ColeÃ§Ã£o Botik & Cica
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl font-black tracking-tight text-gray-900 sm:text-5xl md:text-7xl"
          >
            Produtos em Destaque
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-gray-500 sm:mt-6 sm:max-w-2xl sm:text-xl"
          >
            Descubra o cuidado avanÃ§ado com fÃ³rmulas inovadoras para iluminar, firmar e renovar sua pele todos os dias.
          </motion.p>
        </div>

        <ProductCarousel
          products={products}
          onSelect={setSelectedProduct}
          selectedId={selectedProduct?.id}
        />

        <div className="mt-16 grid grid-cols-1 gap-5 sm:mt-24 md:grid-cols-2 md:gap-8">
          <div className="group relative overflow-hidden rounded-[32px] bg-gray-900 p-6 sm:rounded-[40px] sm:p-12">
            <div className="relative z-10">
              <h3 className="mb-3 text-2xl font-bold text-white sm:mb-4 sm:text-3xl">Nova Linha Retinol</h3>
              <p className="mb-6 max-w-xs text-sm text-gray-400 sm:mb-8 sm:text-base">ReduÃ§Ã£o visÃ­vel de rugas e uniformizaÃ§Ã£o da textura em 2 semanas.</p>
              <button className="rounded-full bg-white px-6 py-2.5 text-sm font-bold text-gray-900 transition-colors hover:bg-gray-100 cursor-pointer sm:px-8 sm:py-3">
                Saiba Mais
              </button>
            </div>
          </div>
          <div className="flex flex-col justify-end rounded-[32px] bg-rose-100 p-6 sm:rounded-[40px] sm:p-12">
            <h3 className="mb-2 text-2xl font-bold text-gray-900 sm:text-3xl">Cuide da sua barreira</h3>
            <p className="mb-6 text-sm text-rose-700/70 sm:mb-8 sm:text-base">Pantenol e Ceramidas para hidrataÃ§Ã£o profunda e reparaÃ§Ã£o imediata.</p>
            <button className="w-fit rounded-full bg-gray-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-gray-800 cursor-pointer sm:px-8 sm:py-3">
              Ver Kit Completo
            </button>
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
        onProductSelect={setSelectedProduct}
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
