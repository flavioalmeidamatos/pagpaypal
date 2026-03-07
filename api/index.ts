import axios from 'axios';

// Variáveis de ambiente (sanitizadas)
const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
const PAYPAL_API_URL = (process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com').trim();

/**
 * Gera um token de acesso OAuth 2.0 do PayPal
 */
async function generateAccessToken() {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
        console.error('[API Error] Missing PayPal Credentials:', {
            hasId: !!PAYPAL_CLIENT_ID,
            hasSecret: !!PAYPAL_CLIENT_SECRET
        });
        throw new Error("MISSING_API_CREDENTIALS");
    }

    const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_CLIENT_SECRET}`).toString("base64");

    try {
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
    } catch (error: any) {
        console.error('[PayPal SDK] Token Generation Failed:', error.response?.data || error.message);
        throw error;
    }
}

/**
 * Cria uma ordem no PayPal
 */
async function createOrder(cartItems: any[]) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders`;

    const total = cartItems.reduce((sum: number, item: any) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2);

    const payload = {
        intent: "CAPTURE",
        purchase_units: [
            {
                amount: {
                    currency_code: "BRL",
                    value: total,
                    breakdown: {
                        item_total: {
                            currency_code: "BRL",
                            value: total
                        }
                    }
                },
                items: cartItems.map((item: any) => ({
                    name: item.name,
                    unit_amount: {
                        currency_code: "BRL",
                        value: item.price.toFixed(2)
                    },
                    quantity: (item.quantity || 1).toString()
                }))
            },
        ],
        application_context: {
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING"
        }
    };

    const response = await axios({
        url,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
        data: JSON.stringify(payload),
    });

    return response.data;
}

/**
 * Captura o pagamento de uma ordem aprovada
 */
async function captureOrder(orderID: string) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;

    const response = await axios({
        url,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    return response.data;
}

/**
 * Handler principal Vercel
 */
export default async function handler(req: any, res: any) {
    // CORS configuration
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

    console.log('[API Request] Action:', action);

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
                const { orderID } = req.body;
                if (!orderID) {
                    return res.status(400).json({ error: 'orderID is required' });
                }
                const capture = await captureOrder(orderID);
                return res.status(200).json(capture);
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('[API Runtime Error]:', {
            message: error.message,
            stack: error.stack,
            paypalData: error.response?.data
        });
        return res.status(500).json({
            error: error.message,
            details: error.response?.data
        });
    }
}
