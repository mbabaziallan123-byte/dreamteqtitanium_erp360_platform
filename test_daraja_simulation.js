/**
 * DreamTeQ_360 Cross-Border Multi-Currency Daraja & Stripe Simulation Harness
 * Operational Profile: Headless Mock Data Packet Generator
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const http = require('http');

const mockTransactionsArray = [
    {
        _id: 'TX_STRIPE_EUR_8831',
        farmer_id: 'FARMER-MEMBER-492',
        app_id: 'TRADE_FINANCE_DASHBOARD',
        amount: '250.00',
        currency: 'EUR',
        gateway: 'STRIPE'
    },
    {
        _id: 'TX_WECHAT_CNY_0042',
        farmer_id: 'FARMER-MEMBER-102',
        app_id: 'MARKET_LINKAGE_CONTRACT_FARMING',
        amount: '1500.00',
        currency: 'CNY',
        gateway: 'WECHAT_ALIPAY'
    },
    {
        _id: 'TX_AFRIPESA_USD_9912',
        farmer_id: 'FARMER-MEMBER-311',
        app_id: 'CROP_LIVESTOCK_INSURANCE_DASHBOARD',
        amount: '75.50',
        currency: 'USD',
        gateway: 'AFRIPESA'
    }
];

function runMockSimulation() {
    console.log('=== INITIALISING GLOBAL PAYMENT STREAM SIMULATION MATRICES ===');

    const payloadString = JSON.stringify(mockTransactionsArray);

    const req = http.request({
        hostname: 'localhost',
        port: 8090,
        path: '/sync/ledger',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payloadString)
        }
    }, (res) => {
        let responseBuffer = '';
        res.on('data', chunk => responseBuffer += chunk);
        res.on('end', () => {
            console.log(`[GATEWAY RESPONSE HTTP ${res.statusCode}]:`, responseBuffer);
            if (res.statusCode >= 200 && res.statusCode < 300) {
                console.log('=== PAYMENT SIMULATION CYCLE CONCLUDED SUCCESSFULLY ===');
            } else {
                console.log('=== PAYMENT SIMULATION CYCLE REACHED BROKER BUT UPSTREAM LEDGER REJECTED ===');
                process.exitCode = 1;
            }
        });
    });

    req.on('error', (err) => {
        console.error(`[CRITICAL SIMULATION ERROR] Pipeline connection dropped: ${err.message}`);
        process.exitCode = 1;
    });

    req.write(payloadString);
    req.end();
}

runMockSimulation();
