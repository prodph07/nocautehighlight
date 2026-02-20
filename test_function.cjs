
const https = require('https');

const data = JSON.stringify({
    test: true
});

const options = {
    hostname: 'curdgqqmaqrkomllrpmr.supabase.co',
    port: 443,
    path: '/functions/v1/pagarme-checkout',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1cmRncXFtYXFya29tbGxycG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE0NjIxODIsImV4cCI6MjA4NzAzODE4Mn0.8lg6AzyC_dGKWhN6Lh9itpxQX3JcOBPjGOdRg7BLa7A',
        'Content-Length': data.length
    }
};

const req = https.request(options, (res) => {
    console.log(`STATUS: ${res.statusCode}`);
    console.log(`HEADERS: ${JSON.stringify(res.headers)}`);

    let body = '';
    res.on('data', (d) => {
        body += d;
    });

    res.on('end', () => {
        console.log('BODY:', body);
    });
});

req.on('error', (e) => {
    console.error(`problem with request: ${e.message}`);
});

req.write(data);
req.end();
