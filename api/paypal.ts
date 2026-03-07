import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const PAYPAL_CLIENT_ID = (process.env.PAYPAL_CLIENT_ID || '').trim();
const PAYPAL_CLIENT_SECRET = (process.env.PAYPAL_CLIENT_SECRET || '').trim();
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

/** 
 * Tipagem para erros amigáveis ao Antigravity 
 */
interface PayPalError extends Error {
  context?: any;
  status?: number;
}

/**
 * Gera um token de acesso OAuth 2.0 do PayPal
 */
export async function generateAccessToken() {
  if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET) {
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
 * Cria uma ordem no PayPal (Advanced Checkout ready)
 */
export async function createOrder(cartItems: any[]) {
  const accessToken = await generateAccessToken();
  const url = `${PAYPAL_API_URL}/v2/checkout/orders`;

  const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2);

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
        items: cartItems.map(item => ({
          name: item.name,
          unit_amount: {
            currency_code: "BRL",
            value: item.price.toFixed(2)
          },
          quantity: item.quantity.toString()
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
export async function captureOrder(orderID: string) {
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
