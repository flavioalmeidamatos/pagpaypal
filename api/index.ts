import { createOrder, captureOrder } from './paypal';

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

    console.log('[API] Action:', action);
    console.log('[API] Environment - ClientID exists:', !!process.env.PAYPAL_CLIENT_ID);
    console.log('[API] Environment - Secret exists:', !!process.env.PAYPAL_CLIENT_SECRET);
    console.log('[API] Environment - API URL:', process.env.PAYPAL_API_URL);

    try {
        if (req.method === 'POST') {
            if (action === 'create') {
                const { cart } = req.body;
                const order = await createOrder(cart);
                return res.status(200).json(order);
            }

            if (action === 'capture') {
                const { orderID } = req.body;
                const capture = await captureOrder(orderID);
                return res.status(200).json(capture);
            }
        }

        return res.status(405).json({ error: 'Method not allowed' });
    } catch (error: any) {
        console.error('PayPal Error:', error.response?.data || error.message);
        return res.status(500).json({ error: error.message });
    }
}
