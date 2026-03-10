import axios from 'axios';

async function test() {
    const auth = Buffer.from(process.env.PAYPAL_CLIENT_ID + ':' + process.env.PAYPAL_CLIENT_SECRET).toString('base64');
    let tokenData;
    try {
        const res = await axios.post(
            process.env.PAYPAL_API_URL + '/v1/oauth2/token',
            'grant_type=client_credentials',
            { headers: { Authorization: 'Basic ' + auth, 'Content-Type': 'application/x-www-form-urlencoded' } }
        );
        tokenData = res.data;
    } catch (err) {
        console.error('TOKEN ERROR', err);
        return;
    }

    const payload = {
        intent: 'CAPTURE',
        purchase_units: [{ amount: { currency_code: 'BRL', value: '10.00' } }],
        payment_source: {
            boletobancario: {
                name: "Jane Doe",
                email: "jane@example.com",
                tax_info: { tax_id: "12345678909", tax_id_type: "BR_CPF" },
                country_code: "BR",
                currency_code: "BRL",
                phone: {
                    country_code: "55",
                    national_number: "11999999999"
                },
                billing_address: {
                    address_line_1: "Rua Exemplo",
                    admin_area_2: "Sao Paulo",
                    admin_area_1: "SP",
                    postal_code: "01000000"
                }
            }
        }
    };

    try {
        console.log("Testing full boletobancario payload WITHOUT country_code in billing_address...");
        const res = await axios.post(
            process.env.PAYPAL_API_URL + '/v2/checkout/orders',
            payload,
            {
                headers: {
                    'Authorization': 'Bearer ' + tokenData.access_token,
                    'Content-Type': 'application/json',
                    'PayPal-Request-Id': Date.now().toString()
                }
            }
        );
        console.log('SUCCESS:', JSON.stringify(res.data, null, 2));
        return;
    } catch (err) {
        if (err.response) {
            console.error('ERROR DETAILS:', err.response.data.details);
        } else {
            console.error('ERROR:', err.message);
        }
    }
}
test();
