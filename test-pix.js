const dotenv = require('dotenv');
const fetch = require('node-fetch'); // If not available in Node 22 natively, we can use global fetch

// Load .env
dotenv.config();

const key = process.env.VITE_SUPABASE_ANON_KEY;
const url = (process.env.VITE_SUPABASE_URL || '') + '/functions/v1/pagarme-checkout';

async function testPix() {
    try {
        console.log('Fetching:', url);
        const res = await globalThis.fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + key
            },
            body: JSON.stringify({
                amount: 1000,
                description: 'Test Pix',
                payment_method: 'pix',
                customer: {
                    name: 'Joao Silva',
                    email: 'joao@example.com',
                    document: '12345678909',
                    phones: {
                        mobile_phone: {
                            country_code: '55',
                            area_code: '11',
                            number: '999999999'
                        }
                    }
                }
            })
        });

        console.log('Status:', res.status);
        const text = await res.text();
        console.log('Response:', text);
    } catch (e) {
        console.error('Error:', e);
    }
}

testPix();
