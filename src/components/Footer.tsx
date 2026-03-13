import { Sparkles } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="bg-white border-t py-12">
            <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-gray-900" size={20} />
                    <span className="text-lg font-black tracking-tighter text-gray-900 uppercase">Skincare.co</span>
                </div>
                <p className="text-gray-400 text-sm">© 2026 Skincare Co. Todos os direitos reservados.</p>
                <div className="flex gap-8 text-gray-400 text-sm font-medium">
                    <a href="#" className="hover:text-gray-900 transition-colors">Termos</a>
                    <a href="#" className="hover:text-gray-900 transition-colors">Privacidade</a>
                    <a href="#" className="hover:text-gray-900 transition-colors">Ajuda</a>
                </div>
            </div>
        </footer>
    );
};
