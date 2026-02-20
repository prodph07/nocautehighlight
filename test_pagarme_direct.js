import 'dotenv/config';

const sk = process.env.PAGARME_SECRET_KEY;

if (!sk) {
    console.error('Missing PAGARME_SECRET_KEY in .env.local');
    process.exit(1);
}

const url = 'https://api.pagar.me/core/v5/orders';
const auth = 'Basic ' + Buffer.from(sk + ':').toString('base64');

async function testApi() {
    const payload = {
        items: [{ amount: 1000, description: "Test Pix Local", quantity: 1, code: "video_access" }],
        customer: {
            name: "Joao Silva",
            email: "joao@example.com",
            document: "12345678909",
            type: "individual",
            phones: {
                mobile_phone: { country_code: "55", area_code: "11", number: "999999999" }
            }
        },
        payments: [{
            payment_method: "pix",
            pix: { expires_in: 3600 }
        }]
    };

    console.log('Sending request to', url, 'with key starts with', sk.substring(0, 5));
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': auth
        },
        body: JSON.stringify(payload)
    });

    console.log('Status HTTP:', res.status);
    const data = await res.json();
    console.log('Response Object:', JSON.stringify(data, null, 2));
}

testApi();
