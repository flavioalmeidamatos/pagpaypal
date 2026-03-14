import { Sparkles } from 'lucide-react';

export const Footer = () => {
    return (
        <footer className="border-t bg-white py-12">
            <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-center sm:px-8 md:flex-row md:text-left">
                <div className="flex items-center gap-2">
                    <Sparkles className="text-gray-900" size={20} />
                    <span className="text-lg font-black tracking-tighter text-gray-900 uppercase">Skincare.co</span>
                </div>
                <p className="text-sm text-gray-400">Â© 2026 Skincare Co. Todos os direitos reservados.</p>
            </div>
        </footer>
    );
};
