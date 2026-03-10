import axios from 'axios';

// Variáveis de ambiente (sanitizadas)
const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
const PAYPAL_API_URL = (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').trim();
const APP_URL = (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : process.env.APP_URL || 'https://pagpaypal.vercel.app').trim();

/**
 * Gera um token de acesso OAuth 2.0 do PayPal
 */
async function generateAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        throw new Error("MISSING_API_CREDENTIALS");
    }
    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");
    const response = await axios({
        url: `${PAYPAL_API_URL}/v1/oauth2/token`,
        method: 'post',
        data: "grant_type=client_credentials",
        headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
    });
    return response.data.access_token;
}

/**
 * Calcula o total do carrinho
 */
function calcTotal(cartItems: any[]): string {
    return cartItems.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2);
}

/**
 * Cria uma ordem PayPal (botão PayPal padrão)
 */
async function createOrder(cartItems: any[]) {
    const accessToken = await generateAccessToken();
    const total = calcTotal(cartItems);

    const payload = {
        intent: "CAPTURE",
        purchase_units: [{
            amount: {
                currency_code: "BRL",
                value: total,
                breakdown: { item_total: { currency_code: "BRL", value: total } }
            },
            items: cartItems.map((item: any) => ({
                name: item.name,
                unit_amount: { currency_code: "BRL", value: item.price.toFixed(2) },
                quantity: (item.quantity || 1).toString()
            }))
        }],
        application_context: {
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING"
        }
    };

    const response = await axios({
        url: `${PAYPAL_API_URL}/v2/checkout/orders`,
        method: 'post',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        data: JSON.stringify(payload),
    });
    return response.data;
}

/**
 * Cria uma ordem via PIX (Scan Code — QR Code + Copia e Cola)
 */
async function createPixOrder(cartItems: any[], payer: { given_name: string; surname: string; email: string; cpf: string }) {
    const accessToken = await generateAccessToken();
    const total = calcTotal(cartItems);

    const payload = {
        intent: "CAPTURE",
        purchase_units: [{
            amount: { currency_code: "BRL", value: total }
        }],
        payment_source: {
            pix: {
                name: {
                    given_name: payer.given_name,
                    surname: payer.surname
                },
                email_address: payer.email,
                tax_info: {
                    tax_id: payer.cpf.replace(/\D/g, ''),
                    tax_id_type: "BR_CPF"
                },
                experience_context: {
                    return_url: `${APP_URL}?payment=success`,
                    cancel_url: `${APP_URL}?payment=cancelled`,
                    brand_name: "Skincare Shop",
                    locale: "pt-BR",
                    user_action: "PAY_NOW"
                }
            }
        }
    };

    console.log('[PayPal Pix] Criando ordem Pix:', { total, payer: payer.email });

    const response = await axios({
        url: `${PAYPAL_API_URL}/v2/checkout/orders`,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `pix-${Date.now()}`
        },
        data: JSON.stringify(payload),
    });

    console.log('[PayPal Pix] Resposta:', response.data?.status, response.data?.id);
    return response.data;
}

/**
 * Cria uma ordem via Boleto Bancário
 */
async function createBoletoOrder(cartItems: any[], payer: { given_name: string; surname: string; email: string; cpf: string }) {
    const accessToken = await generateAccessToken();
    const total = calcTotal(cartItems);

    const payload = {
        intent: "CAPTURE",
        purchase_units: [{
            amount: { currency_code: "BRL", value: total }
        }],
        payment_source: {
            boleto_bancario: {
                name: {
                    given_name: payer.given_name,
                    surname: payer.surname
                },
                email_address: payer.email,
                tax_info: {
                    tax_id: payer.cpf.replace(/\D/g, ''),
                    tax_id_type: "BR_CPF"
                },
                experience_context: {
                    return_url: `${APP_URL}?payment=success`,
                    cancel_url: `${APP_URL}?payment=cancelled`,
                    locale: "pt-BR"
                }
            }
        }
    };

    console.log('[PayPal Boleto] Criando ordem Boleto:', { total, payer: payer.email });

    const response = await axios({
        url: `${PAYPAL_API_URL}/v2/checkout/orders`,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': `boleto-${Date.now()}`
        },
        data: JSON.stringify(payload),
    });

    console.log('[PayPal Boleto] Resposta:', response.data?.status, response.data?.id);
    return response.data;
}

/**
 * Captura o pagamento de uma ordem aprovada
 */
async function captureOrder(orderID: string) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;

    console.log('[PayPal] Capturando ordem:', orderID);

    const response = await axios({
        url,
        method: 'post',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    });

    console.log('[PayPal] Captura concluída:', response.data?.status);
    return response.data;
}

/**
 * Handler principal Vercel
 */
export default async function handler(req: any, res: any) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { action } = req.query;
    console.log('[API Request] Action:', action, '| Method:', req.method);

    try {
        if (req.method === 'POST') {

            // --- PayPal Button (padrão) ---
            if (action === 'create') {
                const { cart } = req.body;
                if (!cart || !Array.isArray(cart)) return res.status(400).json({ error: 'Cart is required' });
                const order = await createOrder(cart);
                return res.status(200).json(order);
            }

            // --- Capture (PayPal Button) ---
            if (action === 'capture') {
                const { orderID } = req.body;
                if (!orderID) return res.status(400).json({ error: 'orderID is required' });
                const capture = await captureOrder(orderID);
                return res.status(200).json(capture);
            }

            // --- Pix ---
            if (action === 'pix') {
                const { cart, payer } = req.body;
                if (!cart || !Array.isArray(cart)) return res.status(400).json({ error: 'Cart is required' });
                if (!payer?.cpf || !payer?.given_name || !payer?.surname || !payer?.email) {
                    return res.status(400).json({ error: 'Payer name, email and CPF are required for Pix' });
                }
                const order = await createPixOrder(cart, payer);
                return res.status(200).json(order);
            }

            // --- Boleto ---
            if (action === 'boleto') {
                const { cart, payer } = req.body;
                if (!cart || !Array.isArray(cart)) return res.status(400).json({ error: 'Cart is required' });
                if (!payer?.cpf || !payer?.given_name || !payer?.surname || !payer?.email) {
                    return res.status(400).json({ error: 'Payer name, email and CPF are required for Boleto' });
                }
                const order = await createBoletoOrder(cart, payer);
                return res.status(200).json(order);
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('[API Runtime Error]:', {
            action,
            message: error.message,
            paypalData: error.response?.data
        });
        return res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
}
