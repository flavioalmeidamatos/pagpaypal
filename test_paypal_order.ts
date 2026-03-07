
import { createOrder } from './api/paypal';

const mockCart = [
    { id: '1', name: 'Sérum Botik Retinol Pure', price: 164.90, quantity: 1, brand: 'Botik' },
    { id: '2', name: 'Creme Firmador Cica', price: 89.00, quantity: 2, brand: 'Cica' }
];

async function testPayPalOrder() {
    console.log('🚀 Iniciando teste de criação de ordem PayPal...');

    try {
        const order = await createOrder(mockCart);
        console.log('✅ Ordem criada com sucesso!');
        console.log('🆔 Order ID:', order.id);
        console.log('🔗 Link para aprovação:', order.links.find((l: any) => l.rel === 'approve')?.href);
        console.log('\nDados da Ordem:', JSON.stringify(order, null, 2));
    } catch (error: any) {
        console.error('❌ Erro ao criar ordem:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Dados:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error(error.message);
        }
        console.log('\n💡 Verifique se suas credenciais no arquivo .env estão corretas.');
    }
}

testPayPalOrder();
