import React, { useState } from 'react';
import axios from 'axios';
import { useCart } from '../hooks/useCart';
import { supabase } from '../lib/supabase';

type PaymentMethod = 'pix' | 'boleto' | null;
type FlowStatus = 'idle' | 'form' | 'loading' | 'qrcode' | 'boleto-link' | 'success' | 'error';

export const PixBoletoCheckout: React.FC = () => {
    const { items } = useCart();
    const [method, setMethod] = useState<PaymentMethod>(null);
    const [status, setStatus] = useState<FlowStatus>('idle');
    const [errorMsg, setErrorMsg] = useState('');

    // Payer form
    const [givenName, setGivenName] = useState('');
    const [surname, setSurname] = useState('');
    const [email, setEmail] = useState('');
    const [cpf, setCpf] = useState('');

    // Pix results
    const [pixQrImage, setPixQrImage] = useState('');
    const [pixCode, setPixCode] = useState('');
    const [copiedPix, setCopiedPix] = useState(false);

    // Boleto results
    const [boletoLink, setBoletoLink] = useState('');

    const formatCpf = (value: string) => {
        const digits = value.replace(/\D/g, '').slice(0, 11);
        if (digits.length <= 3) return digits;
        if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
        if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
        return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
    };

    const isFormValid = givenName.trim() && surname.trim() && email.includes('@') && cpf.replace(/\D/g, '').length === 11;

    const selectMethod = (m: PaymentMethod) => {
        setMethod(m);
        setStatus('form');
        setErrorMsg('');
    };

    const handleSubmit = async () => {
        if (!isFormValid || !method) return;
        setStatus('loading');
        setErrorMsg('');

        const action = method === 'pix' ? 'create-pix' : 'create-boleto';

        try {
            const response = await axios.post(`/api?action=${action}`, {
                cart: items,
                payer: {
                    given_name: givenName.trim(),
                    surname: surname.trim(),
                    email: email.trim(),
                    cpf: cpf.replace(/\D/g, '')
                }
            });

            const order = response.data;
            console.log(`[${method}] Resposta:`, order);

            // Gravar no Supabase
            const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
            await supabase.from('orders').insert([{
                paypal_order_id: order.id,
                status: order.status || 'PENDING',
                amount: total,
                currency: 'BRL',
                customer_email: email.trim()
            }]);

            if (method === 'pix') {
                // Extrair QR code e copia-cola dos links
                const pixLink = order.links?.find((l: any) => l.rel === 'pix_code' || l.rel === 'payer-action');
                const qrImage = order.payment_source?.pix?.pix_image;
                const qrCode = order.payment_source?.pix?.pix_code;

                setPixQrImage(qrImage || '');
                setPixCode(qrCode || pixLink?.href || order.id);
                setStatus('qrcode');
            } else {
                // Extrair link do boleto
                const approveLink = order.links?.find((l: any) => l.rel === 'payer-action' || l.rel === 'approve');
                setBoletoLink(approveLink?.href || '');
                setStatus('boleto-link');
            }
        } catch (error: any) {
            console.error(`[${method}] Erro:`, error.response?.data || error.message);
            const details = error.response?.data?.details;
            let msg = '';
            if (Array.isArray(details) && details.length > 0) {
                msg = `${details[0].issue}: ${details[0].description}`;
            } else {
                msg = error.response?.data?.error || error.message || 'Erro desconhecido.';
            }
            setErrorMsg(msg);
            setStatus('error');
        }
    };

    const copyPixCode = async () => {
        try {
            await navigator.clipboard.writeText(pixCode);
            setCopiedPix(true);
            setTimeout(() => setCopiedPix(false), 2500);
        } catch {
            // fallback
            const ta = document.createElement('textarea');
            ta.value = pixCode;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            setCopiedPix(true);
            setTimeout(() => setCopiedPix(false), 2500);
        }
    };

    const reset = () => {
        setMethod(null);
        setStatus('idle');
        setErrorMsg('');
        setPixQrImage('');
        setPixCode('');
        setBoletoLink('');
    };

    // ─── IDLE: Botões de seleção ───
    if (status === 'idle') {
        return (
            <div className="space-y-3">
                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest text-center">
                    Ou pague com
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button
                        onClick={() => selectMethod('pix')}
                        className="flex items-center justify-center gap-3 py-3 px-4 rounded-xl border border-gray-200 bg-white hover:border-[#32BCAD] hover:bg-[#32BCAD]/5 transition-all cursor-pointer group min-h-[48px]"
                    >
                        <svg viewBox="0 0 512 512" className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none">
                            <path d="M331.6 156.4c-5.4-5.4-14.1-5.4-19.5 0l-71.1 71.1-71.1-71.1c-5.4-5.4-14.1-5.4-19.5 0l-71.1 71.1c-5.4 5.4-5.4 14.1 0 19.5l71.1 71.1-71.1 71.1c-5.4 5.4-5.4 14.1 0 19.5l71.1 71.1c5.4 5.4 14.1 5.4 19.5 0l71.1-71.1 71.1 71.1c5.4 5.4 14.1 5.4 19.5 0l71.1-71.1c5.4-5.4 5.4-14.1 0-19.5l-71.1-71.1 71.1-71.1c5.4-5.4 5.4-14.1 0-19.5l-71.1-71.1z" fill="#32BCAD" />
                            <path d="M256 0L103.3 152.7 0 256l103.3 103.3L256 512l152.7-152.7L512 256 408.7 152.7 256 0zm197.4 256L256 453.4 58.6 256 256 58.6 453.4 256z" fill="#32BCAD" />
                        </svg>
                        <span className="text-sm font-bold text-gray-800">Pix</span>
                    </button>
                    <button
                        onClick={() => selectMethod('boleto')}
                        className="flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl border-2 border-gray-100 bg-white hover:border-orange-400 hover:bg-orange-50/50 transition-all cursor-pointer group min-h-[52px]"
                    >
                        <svg viewBox="0 0 24 24" className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <line x1="6" y1="8" x2="6" y2="16" />
                            <line x1="8" y1="8" x2="8" y2="16" />
                            <line x1="11" y1="8" x2="11" y2="16" />
                            <line x1="13" y1="8" x2="13" y2="16" />
                            <line x1="15" y1="8" x2="15" y2="16" />
                            <line x1="18" y1="8" x2="18" y2="16" />
                        </svg>
                        <span className="text-sm font-bold text-gray-700">Boleto</span>
                    </button>
                </div>
            </div>
        );
    }

    // ─── FORM: Coleta de dados do pagador ───
    if (status === 'form') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        {method === 'pix' ? (
                            <span className="w-2 h-2 rounded-full bg-teal-500" />
                        ) : (
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                        )}
                        Pagar com {method === 'pix' ? 'Pix' : 'Boleto'}
                    </h3>
                    <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">
                        ← Voltar
                    </button>
                </div>

                <p className="text-xs text-gray-400">
                    Informe seus dados. O CPF é obrigatório conforme regulamentação do Banco Central.
                </p>

                <div className="grid grid-cols-2 gap-3">
                    <input
                        type="text"
                        placeholder="Nome"
                        value={givenName}
                        onChange={(e) => setGivenName(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none transition-colors"
                    />
                    <input
                        type="text"
                        placeholder="Sobrenome"
                        value={surname}
                        onChange={(e) => setSurname(e.target.value)}
                        className="px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none transition-colors"
                    />
                </div>

                <input
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none transition-colors"
                />

                <input
                    type="text"
                    placeholder="CPF (000.000.000-00)"
                    value={cpf}
                    onChange={(e) => setCpf(formatCpf(e.target.value))}
                    maxLength={14}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:border-gray-400 focus:outline-none transition-colors font-mono"
                />

                <button
                    onClick={handleSubmit}
                    disabled={!isFormValid}
                    className={`w-full py-3.5 rounded-xl text-sm font-bold transition-all cursor-pointer min-h-[48px] ${isFormValid
                        ? method === 'pix'
                            ? 'bg-teal-600 text-white hover:bg-teal-700 active:bg-teal-800'
                            : 'bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                >
                    {method === 'pix' ? 'Gerar QR Code Pix' : 'Gerar Boleto'}
                </button>
            </div>
        );
    }

    // ─── LOADING ───
    if (status === 'loading') {
        return (
            <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 border-3 border-gray-200 border-t-gray-800 rounded-full animate-spin" />
                <p className="text-sm text-gray-500 font-medium">
                    Gerando {method === 'pix' ? 'QR Code Pix' : 'Boleto'}...
                </p>
            </div>
        );
    }

    // ─── PIX QR CODE ───
    if (status === 'qrcode') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-teal-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                        Pix Gerado
                    </h3>
                    <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">
                        ← Voltar
                    </button>
                </div>

                {pixQrImage && (
                    <div className="flex justify-center">
                        <div className="p-4 bg-white border-2 border-teal-100 rounded-2xl">
                            <img src={pixQrImage} alt="QR Code Pix" className="w-48 h-48" />
                        </div>
                    </div>
                )}

                <div className="space-y-2">
                    <p className="text-xs text-gray-500 font-medium text-center">Código Copia e Cola:</p>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={pixCode}
                            readOnly
                            className="flex-1 px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-200 text-xs font-mono truncate"
                        />
                        <button
                            onClick={copyPixCode}
                            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-w-[80px] ${copiedPix
                                ? 'bg-teal-100 text-teal-700'
                                : 'bg-teal-600 text-white hover:bg-teal-700'
                                }`}
                        >
                            {copiedPix ? '✓ Copiado' : 'Copiar'}
                        </button>
                    </div>
                </div>

                <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl">
                    <p className="text-xs text-teal-700 leading-relaxed text-center">
                        Abra o app do seu banco, escaneie o QR Code ou cole o código Pix para efetuar o pagamento.
                    </p>
                </div>
            </div>
        );
    }

    // ─── BOLETO LINK ───
    if (status === 'boleto-link') {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-orange-700 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                        Boleto Gerado
                    </h3>
                    <button onClick={reset} className="text-xs text-gray-400 hover:text-gray-700 cursor-pointer">
                        ← Voltar
                    </button>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-center space-y-3">
                    <div className="w-14 h-14 mx-auto bg-orange-100 rounded-full flex items-center justify-center">
                        <svg viewBox="0 0 24 24" className="w-7 h-7 text-orange-600" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="4" width="20" height="16" rx="2" />
                            <line x1="6" y1="8" x2="6" y2="16" />
                            <line x1="8" y1="8" x2="8" y2="16" />
                            <line x1="11" y1="8" x2="11" y2="16" />
                            <line x1="13" y1="8" x2="13" y2="16" />
                            <line x1="15" y1="8" x2="15" y2="16" />
                            <line x1="18" y1="8" x2="18" y2="16" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-orange-800">Seu boleto está pronto!</p>
                    <p className="text-xs text-orange-600 leading-relaxed">
                        Clique no botão abaixo para visualizar e imprimir ou copiar o código de barras.
                    </p>
                </div>

                {boletoLink ? (
                    <a
                        href={boletoLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full py-3.5 rounded-xl bg-orange-600 text-white text-center text-sm font-bold hover:bg-orange-700 transition-all cursor-pointer min-h-[48px] leading-[48px]"
                    >
                        Abrir Boleto →
                    </a>
                ) : (
                    <p className="text-xs text-gray-400 text-center">
                        O link do boleto será enviado para seu e-mail.
                    </p>
                )}

                <p className="text-[10px] text-gray-400 text-center">
                    O boleto pode levar até 3 dias úteis para compensar. Após o pagamento, você receberá a confirmação por e-mail.
                </p>
            </div>
        );
    }

    // ─── SUCCESS ───
    if (status === 'success') {
        return (
            <div className="flex flex-col items-center gap-3 py-6 text-center">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                    <svg className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <p className="text-sm font-bold text-green-700">Pagamento registrado!</p>
            </div>
        );
    }

    // ─── ERROR ───
    if (status === 'error') {
        return (
            <div className="space-y-3">
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium leading-relaxed">
                    ⚠️ {errorMsg || 'Erro ao processar pagamento.'}
                </div>
                <button
                    onClick={reset}
                    className="w-full py-3 rounded-xl border-2 border-gray-200 text-sm font-bold text-gray-700 hover:border-gray-400 transition-all cursor-pointer"
                >
                    Tentar novamente
                </button>
            </div>
        );
    }

    return null;
};
