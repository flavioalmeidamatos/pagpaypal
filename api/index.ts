import axios, { AxiosError } from 'axios';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { CartItem } from '../src/types/product';

const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
const PAYPAL_API_URL = (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').trim();
const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();

interface ApiRequest {
    method?: string;
    query: {
        action?: string;
        orderID?: string;
    };
    body: {
        cart?: CartItem[];
        orderID?: string;
    };
}

interface ApiResponse {
    setHeader: (name: string, value: string) => void;
    status: (code: number) => {
        json: (body: unknown) => void;
        end: () => void;
    };
}

interface PayPalApiErrorResponse {
    message?: string;
    details?: unknown;
}

interface CaptureOrderResponse {
    id?: string;
    status?: string;
    purchase_units?: Array<{
        amount?: {
            value?: string;
            currency_code?: string;
        };
    }>;
    payer?: {
        email_address?: string;
    };
}

function getAxiosError(error: unknown) {
    return error as AxiosError<PayPalApiErrorResponse>;
}

function getSupabaseAdminClient(): SupabaseClient | null {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
        return null;
    }

    return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false
        }
    });
}

async function generateAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error('[API Error] Missing PayPal Credentials:', {
            hasId: !!PAYPAL_CLIENT_ID,
            hasSecret: !!PAYPAL_CLIENT_SECRET
        });
        throw new Error('MISSING_API_CREDENTIALS');
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString('base64');

    try {
        const response = await axios({
            url: `${PAYPAL_API_URL}/v1/oauth2/token`,
            method: 'post',
            data: 'grant_type=client_credentials',
            headers: {
                Authorization: `Basic ${auth}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        return response.data.access_token;
    } catch (error: unknown) {
        const apiError = getAxiosError(error);
        console.error('[PayPal SDK] Token Generation Failed:', apiError.response?.data || apiError.message);
        throw error;
    }
}

async function createOrder(cartItems: CartItem[]) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders`;
    const total = cartItems
        .reduce((sum: number, item) => sum + item.price * (item.quantity || 1), 0)
        .toFixed(2);

    const payload = {
        intent: 'CAPTURE',
        purchase_units: [
            {
                amount: {
                    currency_code: 'BRL',
                    value: total,
                    breakdown: {
                        item_total: {
                            currency_code: 'BRL',
                            value: total
                        }
                    }
                },
                items: cartItems.map((item) => ({
                    name: item.name,
                    unit_amount: {
                        currency_code: 'BRL',
                        value: item.price.toFixed(2)
                    },
                    quantity: (item.quantity || 1).toString()
                }))
            }
        ],
        application_context: {
            user_action: 'PAY_NOW',
            shipping_preference: 'NO_SHIPPING'
        }
    };

    const response = await axios({
        url,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        },
        data: JSON.stringify(payload)
    });

    return response.data;
}

async function captureOrder(orderID: string) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;

    try {
        const response = await axios({
            url,
            method: 'post',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        return response.data as CaptureOrderResponse;
    } catch (error: unknown) {
        const apiError = getAxiosError(error);
        console.error('[PayPal SDK] Capture Failed:', {
            status: apiError.response?.status,
            data: apiError.response?.data,
            message: apiError.message
        });
        throw error;
    }
}

async function getOrderStatus(orderID: string) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}`;

    const response = await axios({
        url,
        method: 'get',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        }
    });

    return response.data;
}

async function persistOrder(capture: CaptureOrderResponse, cartItems: CartItem[]) {
    const supabase = getSupabaseAdminClient();

    if (!supabase) {
        console.warn('[Supabase] SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY ausentes. Pedido não persistido.');
        return;
    }

    const amount = Number(capture.purchase_units?.[0]?.amount?.value || 0);
    const currency = capture.purchase_units?.[0]?.amount?.currency_code || 'BRL';

    const { data: pedido, error: pedidoError } = await supabase
        .from('pedidos')
        .insert([
            {
                paypal_order_id: capture.id,
                status: capture.status || 'COMPLETED',
                valor_total: amount,
                moeda: currency,
                email_cliente: capture.payer?.email_address || 'guest@example.com'
            }
        ])
        .select('id')
        .single();

    if (pedidoError) {
        console.error('[Supabase] Erro ao gravar pedido:', pedidoError);
        throw new Error(`SUPABASE_PEDIDO_FAILED: ${pedidoError.message}`);
    }

    if (!pedido || !cartItems.length) {
        return;
    }

    const itens = cartItems.map((item) => ({
        pedido_id: pedido.id,
        produto_id: item.id,
        nome_produto: item.name,
        marca_produto: item.brand,
        categoria_produto: item.category,
        descricao_produto: item.description,
        imagem_produto: item.image,
        quantidade: item.quantity || 1,
        valor_unitario: item.price,
        valor_total_item: item.price * (item.quantity || 1)
    }));

    const { error: itensError } = await supabase
        .from('pedido_itens')
        .insert(itens);

    if (itensError) {
        console.error('[Supabase] Erro ao gravar itens do pedido:', itensError);
        throw new Error(`SUPABASE_ITENS_FAILED: ${itensError.message}`);
    }
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action } = req.query;

    try {
        if (req.method === 'POST') {
            if (action === 'create') {
                const { cart } = req.body;
                if (!cart || !Array.isArray(cart)) {
                    return res.status(400).json({ error: 'Cart is required and must be an array' });
                }

                const order = await createOrder(cart);
                return res.status(200).json(order);
            }

            if (action === 'capture') {
                const { orderID, cart } = req.body;
                if (!orderID) {
                    return res.status(400).json({ error: 'orderID is required' });
                }

                const capture = await captureOrder(orderID);
                if (capture.status === 'COMPLETED') {
                    await persistOrder(capture, Array.isArray(cart) ? cart : []);
                }

                return res.status(200).json(capture);
            }
        }

        if (req.method === 'GET' && action === 'status') {
            const { orderID } = req.query;
            if (!orderID) {
                return res.status(400).json({ error: 'orderID is required' });
            }

            const orderStatus = await getOrderStatus(orderID);
            return res.status(200).json(orderStatus);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: unknown) {
        const apiError = getAxiosError(error);
        const status = apiError.response?.status || 500;

        console.error('[API Runtime Error]:', {
            status: apiError.response?.status,
            message: apiError.message,
            paypalData: apiError.response?.data
        });

        return res.status(status).json({
            error: apiError.message,
            details: apiError.response?.data
        });
    }
}
