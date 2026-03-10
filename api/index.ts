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
 * Cria uma ordem padrão no PayPal (botões PayPal)
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
 * Cria uma ordem Pix via PayPal REST API v2
 * Retorna QR Code e código Copia-e-Cola
 */
async function createPixOrder(cartItems: any[], payer: any, baseUrl: string) {
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
            }
        ],
        payment_source: {
            pix: {
                name: `${payer.given_name || 'Cliente'} ${payer.surname || 'PayPal'}`.trim(),
                email: payer.email || "cliente@email.com",
                tax_info: {
                    tax_id: payer.cpf.replace(/\D/g, ''),
                    tax_id_type: "BR_CPF"
                },
                country_code: "BR",
                currency_code: "BRL",
                phone: {
                    country_code: "55",
                    national_number: "11999999999"
                }
            }
        }
    };

    console.log('[Pix] Criando ordem Pix com payload:', JSON.stringify(payload, null, 2));

    const response = await axios({
        url,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': Date.now().toString(),
        },
        data: JSON.stringify(payload),
    });

    console.log('[Pix] Resposta do PayPal:', JSON.stringify(response.data, null, 2));
    return response.data;
}

/**
 * Cria uma ordem Boleto Bancário via PayPal REST API v2
 */
async function createBoletoOrder(cartItems: any[], payer: any, baseUrl: string) {
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
            }
        ],
        payment_source: {
            boletobancario: {
                name: `${payer.given_name || 'Cliente'} ${payer.surname || 'PayPal'}`.trim(),
                email: payer.email || "cliente@email.com",
                tax_info: {
                    tax_id: payer.cpf.replace(/\D/g, ''),
                    tax_id_type: "BR_CPF"
                },
                country_code: "BR",
                currency_code: "BRL",
                phone: {
                    country_code: "55",
                    national_number: "11999999999"
                },
                billing_address: {
                    address_line_1: "Endereço não informado",
                    admin_area_2: "São Paulo",
                    admin_area_1: "SP",
                    postal_code: "01000000"
                }
            }
        }
    };

    console.log('[Boleto] Criando ordem Boleto com payload:', JSON.stringify(payload, null, 2));

    const response = await axios({
        url,
        method: 'post',
        headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'PayPal-Request-Id': Date.now().toString(),
        },
        data: JSON.stringify(payload),
    });

    console.log('[Boleto] Resposta do PayPal:', JSON.stringify(response.data, null, 2));
    return response.data;
}

/**
 * Captura o pagamento de uma ordem aprovada
 */
async function captureOrder(orderID: string) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}/capture`;

    console.log('[PayPal] Enviando requisição de captura:', url);

    try {
        const response = await axios({
            url,
            method: 'post',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
        console.log('[PayPal] Resposta de captura recebida:', response.status);
        return response.data;
    } catch (error: any) {
        console.error('[PayPal SDK] Capture Failed:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        throw error;
    }
}

/**
 * Consulta status de uma ordem
 */
async function getOrderStatus(orderID: string) {
    const accessToken = await generateAccessToken();
    const url = `${PAYPAL_API_URL}/v2/checkout/orders/${orderID}`;

    const response = await axios({
        url,
        method: 'get',
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

    // Detectar base URL para redirects
    const protocol = req.headers['x-forwarded-proto'] || 'https';
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
    const baseUrl = `${protocol}://${host}`;

    try {
        if (req.method === 'POST') {
            // PayPal Buttons (checkout padrão)
            if (action === 'create') {
                const { cart } = req.body;
                if (!cart || !Array.isArray(cart)) {
                    return res.status(400).json({ error: 'Cart is required and must be an array' });
                }
                const order = await createOrder(cart);
                return res.status(200).json(order);
            }

            // Criar ordem Pix
            if (action === 'create-pix') {
                const { cart, payer } = req.body;
                if (!cart || !Array.isArray(cart)) {
                    return res.status(400).json({ error: 'Cart is required and must be an array' });
                }
                if (!payer?.cpf) {
                    return res.status(400).json({ error: 'CPF do pagador é obrigatório para Pix' });
                }
                const order = await createPixOrder(cart, payer, baseUrl);
                return res.status(200).json(order);
            }

            // Criar ordem Boleto
            if (action === 'create-boleto') {
                const { cart, payer } = req.body;
                if (!cart || !Array.isArray(cart)) {
                    return res.status(400).json({ error: 'Cart is required and must be an array' });
                }
                if (!payer?.cpf) {
                    return res.status(400).json({ error: 'CPF do pagador é obrigatório para Boleto' });
                }
                const order = await createBoletoOrder(cart, payer, baseUrl);
                return res.status(200).json(order);
            }

            // Capturar pagamento
            if (action === 'capture') {
                const { orderID } = req.body;
                if (!orderID) {
                    return res.status(400).json({ error: 'orderID is required' });
                }
                const capture = await captureOrder(orderID);
                return res.status(200).json(capture);
            }
        }

        // Consultar status de uma ordem (GET)
        if (req.method === 'GET' && action === 'status') {
            const { orderID } = req.query;
            if (!orderID) {
                return res.status(400).json({ error: 'orderID is required' });
            }
            const orderStatus = await getOrderStatus(orderID as string);
            return res.status(200).json(orderStatus);
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('[API Runtime Error]:', {
            status: error.response?.status,
            message: error.message,
            paypalData: error.response?.data
        });

        // Retorna o status real do PayPal se disponível, senão 500
        const status = error.response?.status || 500;
        return res.status(status).json({
            error: error.message,
            details: error.response?.data
        });
    }
}
