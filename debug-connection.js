const https = require('https');

const urls = [
    'https://script.google.com/macros/s/AKfycbyoDC3b5-JPnokadEBPGTSg8dI4tv8tEZRr2GzZOBHlH3izvh_o7_TmgrNmOd9vQ1-hCw/exec',
    'https://script.google.com/macros/s/AKfycbzx_Z99DgJXFZIbD-dZ_7WBtBWdEM7DXQX2DTTZhPwA6dDnhilHVqHNTkQNUh4p-RTAKA/exec',
    'https://script.google.com/macros/s/AKfycbz7qelRUGkT5sDp5kxQYv8ZrIYsSYj-gEh3sQEPPFkYhdRjAN3KKcFumPPi7uzveU0e_g/exec'
];

async function testUrl(url) {
    console.log(`\nTesting URL: ${url}`);
    const testUrl = `${url}?entity=consumos&action=getAll`;

    return new Promise((resolve) => {
        https.get(testUrl, (res) => {
            console.log(`Status: ${res.statusCode}`);
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                console.log(`Redirecting to: ${res.headers.location}`);
                // Follow redirect
                https.get(res.headers.location, (res2) => {
                    let data = '';
                    res2.on('data', (chunk) => data += chunk);
                    res2.on('end', () => {
                        try {
                            const json = JSON.parse(data);
                            console.log(`Success: ${json.success}`);
                            if (json.message) console.log(`Message: ${json.message}`);
                            resolve(json.success);
                        } catch (e) {
                            console.log('Failed to parse response as JSON');
                            resolve(false);
                        }
                    });
                });
            } else {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        console.log(`Success: ${json.success}`);
                        resolve(json.success);
                    } catch (e) {
                        console.log('Failed to parse response as JSON');
                        resolve(false);
                    }
                });
            }
        }).on('error', (err) => {
            console.error(`Error: ${err.message}`);
            resolve(false);
        });
    });
}

async function run() {
    for (const url of urls) {
        await testUrl(url);
    }
}

run();
