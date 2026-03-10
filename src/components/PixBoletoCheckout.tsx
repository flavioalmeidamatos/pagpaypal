import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';
import { QrCode, FileText, Copy, Check } from 'lucide-react';

type Method = 'pix' | 'boleto';
type Step = 'form' | 'qrcode' | 'boleto_redirect' | 'success' | 'error';

interface PayerForm {
    given_name: string;
    surname: string;
    email: string;
    cpf: string;
}

// Formata CPF: 000.000.000-00
function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

interface PixResult {
    orderId: string;
    pixCode: string;
    pixImageUrl: string;
    expiresAt: string;
}

interface BoletoResult {
    orderId: string;
    boletoUrl: string;
}

export const PixBoletoCheckout: React.FC = () => {
    const { items, clearCart } = useCart();
    const [method, setMethod] = useState<Method>('pix');
    const [step, setStep] = useState<Step>('form');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [copied, setCopied] = useState(false);
    const [pixResult, setPixResult] = useState<PixResult | null>(null);
    const [boletoResult, setBoletoResult] = useState<BoletoResult | null>(null);

    const [payer, setPayer] = useState<PayerForm>({
        given_name: '',
        surname: '',
        email: '',
        cpf: ''
    });

    const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const totalFormatted = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(total);

    const handleChange = (field: keyof PayerForm, value: string) => {
        setPayer(prev => ({
            ...prev,
            [field]: field === 'cpf' ? formatCPF(value) : value
        }));
    };

    const extractPixData = (order: any): PixResult | null => {
        try {
            // Pix Scan Code — segundo a API do PayPal
            const links = order?.links || [];
            const pixLink = links.find((l: any) => l.rel === 'pix_scan_code');
            const pixCode = order?.payment_source?.pix?.pix_code
                || order?.purchase_units?.[0]?.payments?.captures?.[0]?.supplementary_data?.related_ids?.pix_scan_code
                || pixLink?.href
                || null;

            const pixImageUrl = order?.payment_source?.pix?.pix_image
                || order?.links?.find((l: any) => l.rel === 'pix_image_url')?.href
                || null;

            if (!pixCode && !pixImageUrl) return null;

            return {
                orderId: order.id,
                pixCode: pixCode || '',
                pixImageUrl: pixImageUrl || '',
                expiresAt: order?.payment_source?.pix?.expires_at || ''
            };
        } catch {
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const cpfClean = payer.cpf.replace(/\D/g, '');
        if (cpfClean.length !== 11) {
            setError('CPF inválido. Digite os 11 dígitos.');
            setLoading(false);
            return;
        }

        try {
            const action = method === 'pix' ? 'pix' : 'boleto';
            const response = await axios.post(`/api?action=${action}`, {
                cart: items,
                payer: {
                    given_name: payer.given_name.trim(),
                    surname: payer.surname.trim(),
                    email: payer.email.trim(),
                    cpf: cpfClean
                }
            });

            const order = response.data;
            console.log(`[${method.toUpperCase()}] Ordem criada:`, order);

            // Salvar no Supabase
            await supabase.from('orders').insert([{
                paypal_order_id: order.id,
                status: order.status || 'PENDING',
                amount: total,
                currency: 'BRL',
                customer_email: payer.email
            }]);

            if (method === 'pix') {
                const pix = extractPixData(order);
                if (pix && (pix.pixCode || pix.pixImageUrl)) {
                    setPixResult(pix);
                    setStep('qrcode');
                } else {
                    // Sandbox pode não retornar QR Code completo — mostrar ordem criada
                    setPixResult({
                        orderId: order.id,
                        pixCode: order.id, // Fallback: exibir o Order ID como referência
                        pixImageUrl: '',
                        expiresAt: ''
                    });
                    setStep('qrcode');
                }
            } else {
                const boletoLink = order?.links?.find((l: any) => l.rel === 'approve' || l.rel === 'boleto');
                setBoletoResult({
                    orderId: order.id,
                    boletoUrl: boletoLink?.href || ''
                });
                setStep('boleto_redirect');
            }

        } catch (err: any) {
            console.error(`[${method}] Erro:`, err.response?.data || err.message);
            const details = err.response?.data?.details;
            let msg = '';
            if (Array.isArray(details) && details.length > 0) {
                msg = `${details[0].issue}: ${details[0].description}`;
            } else {
                msg = err.response?.data?.message || err.response?.data?.error || err.message;
            }
            setError(msg || 'Erro ao processar pagamento. Tente novamente.');
            setStep('error');
        } finally {
            setLoading(false);
        }
    };

    const copyPixCode = async () => {
        if (!pixResult?.pixCode) return;
        await navigator.clipboard.writeText(pixResult.pixCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
    };

    const handleMarkPaid = () => {
        setStep('success');
        clearCart();
    };

    const reset = () => {
        setStep('form');
        setError('');
        setPixResult(null);
        setBoletoResult(null);
    };

    // ─── Tela de Sucesso ───────────────────────────────────────────────
    if (step === 'success') {
        return (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-green-700">Pedido registrado com sucesso!</p>
                <p className="text-xs text-gray-400">Assim que o pagamento for confirmado, você receberá um e-mail.</p>
            </div>
        );
    }

    // ─── QR Code Pix ──────────────────────────────────────────────────
    if (step === 'qrcode' && pixResult) {
        return (
            <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-2xl p-4 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-green-700 font-bold text-sm">
                        <QrCode size={18} />
                        <span>Pague via Pix</span>
                    </div>

                    {pixResult.pixImageUrl ? (
                        <img src={pixResult.pixImageUrl} alt="QR Code Pix" className="w-48 h-48 mx-auto rounded-xl border border-green-200 bg-white p-2" />
                    ) : (
                        <div className="w-48 h-48 mx-auto rounded-xl border-2 border-dashed border-green-300 bg-white flex flex-col items-center justify-center gap-2 text-green-600">
                            <QrCode size={48} strokeWidth={1} />
                            <p className="text-[10px] font-medium text-center px-4">QR Code gerado no app do seu banco</p>
                        </div>
                    )}

                    <p className="text-xs text-green-700 font-semibold">{totalFormatted}</p>
                </div>

                {/* Copia e Cola */}
                {pixResult.pixCode && (
                    <div className="space-y-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Código Pix (Copia e Cola)</p>
                        <div className="flex gap-2">
                            <div className="flex-1 p-3 bg-gray-50 rounded-xl text-[11px] text-gray-600 font-mono break-all border border-gray-200 max-h-20 overflow-y-auto">
                                {pixResult.pixCode}
                            </div>
                            <button
                                onClick={copyPixCode}
                                className="p-3 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-colors cursor-pointer flex-shrink-0"
                                title="Copiar código"
                            >
                                {copied ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        {copied && <p className="text-[11px] text-green-600 font-medium">✓ Copiado!</p>}
                    </div>
                )}

                <p className="text-[11px] text-gray-400 text-center">
                    Abra o app do seu banco, acesse a área Pix e escaneie o QR Code ou cole o código acima.
                </p>

                <div className="flex gap-2">
                    <button
                        onClick={handleMarkPaid}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        Já paguei ✓
                    </button>
                    <button
                        onClick={reset}
                        className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    // ─── Boleto Gerado ────────────────────────────────────────────────
    if (step === 'boleto_redirect' && boletoResult) {
        return (
            <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-blue-700 font-bold text-sm">
                        <FileText size={18} />
                        <span>Boleto Gerado!</span>
                    </div>
                    <p className="text-xs text-blue-600">Pedido: <span className="font-mono font-bold">{boletoResult.orderId}</span></p>
                    <p className="text-xs text-blue-600 font-semibold">{totalFormatted}</p>
                    <p className="text-[11px] text-blue-500">O boleto vence em 3 dias úteis. Pague em qualquer banco ou lotérica.</p>
                </div>

                {boletoResult.boletoUrl && (
                    <a
                        href={boletoResult.boletoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        <FileText size={16} />
                        Visualizar / Imprimir Boleto
                    </a>
                )}

                <div className="flex gap-2">
                    <button
                        onClick={handleMarkPaid}
                        className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                    >
                        Confirmar pedido ✓
                    </button>
                    <button
                        onClick={reset}
                        className="py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-colors cursor-pointer"
                    >
                        Voltar
                    </button>
                </div>
            </div>
        );
    }

    // ─── Tela de Erro ─────────────────────────────────────────────────
    if (step === 'error') {
        return (
            <div className="space-y-3">
                <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-medium leading-relaxed">
                    ⚠️ {error}
                </div>
                <button
                    onClick={reset}
                    className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white text-sm font-bold rounded-xl transition-colors cursor-pointer"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    // ─── Formulário ───────────────────────────────────────────────────
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seletor de método */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-2xl">
                {(['pix', 'boleto'] as Method[]).map(m => (
                    <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer ${method === m ? 'bg-white shadow-sm text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        {m === 'pix' ? <QrCode size={15} /> : <FileText size={15} />}
                        {m === 'pix' ? 'Pix' : 'Boleto'}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                <motion.div
                    key={method}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.18 }}
                    className="space-y-3"
                >
                    <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
                        {method === 'pix'
                            ? '🟢 Pagamento instantâneo. Você receberá um QR Code para pagar pelo seu app bancário.'
                            : '🔵 Boleto gerado na hora. Prazo de 3 dias úteis para pagamento.'}
                    </p>

                    {/* Nome */}
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Nome</label>
                            <input
                                required
                                type="text"
                                value={payer.given_name}
                                onChange={e => handleChange('given_name', e.target.value)}
                                placeholder="João"
                                className="mt-1 w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:bg-white transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Sobrenome</label>
                            <input
                                required
                                type="text"
                                value={payer.surname}
                                onChange={e => handleChange('surname', e.target.value)}
                                placeholder="Silva"
                                className="mt-1 w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:bg-white transition-all"
                            />
                        </div>
                    </div>

                    {/* E-mail */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">E-mail</label>
                        <input
                            required
                            type="email"
                            value={payer.email}
                            onChange={e => handleChange('email', e.target.value)}
                            placeholder="joao@email.com"
                            className="mt-1 w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:bg-white transition-all"
                        />
                    </div>

                    {/* CPF */}
                    <div>
                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                            CPF <span className="text-gray-400 normal-case">(obrigatório pelo Banco Central)</span>
                        </label>
                        <input
                            required
                            type="text"
                            inputMode="numeric"
                            value={payer.cpf}
                            onChange={e => handleChange('cpf', e.target.value)}
                            placeholder="000.000.000-00"
                            className="mt-1 w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-gray-400 focus:bg-white transition-all font-mono"
                        />
                    </div>
                </motion.div>
            </AnimatePresence>

            {/* Botão de submit */}
            <motion.button
                type="submit"
                disabled={loading}
                whileTap={{ scale: 0.98 }}
                className={`w-full py-4 rounded-xl text-white text-sm font-bold transition-all cursor-pointer min-h-[50px] ${method === 'pix'
                    ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                    : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                    } ${loading ? 'opacity-70 pointer-events-none' : ''}`}
            >
                {loading ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        Gerando {method === 'pix' ? 'Pix...' : 'Boleto...'}
                    </span>
                ) : method === 'pix' ? (
                    <span className="flex items-center justify-center gap-2">
                        <QrCode size={16} />
                        Gerar QR Code Pix — {totalFormatted}
                    </span>
                ) : (
                    <span className="flex items-center justify-center gap-2">
                        <FileText size={16} />
                        Gerar Boleto — {totalFormatted}
                    </span>
                )}
            </motion.button>
        </form>
    );
};
