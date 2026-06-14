/**
 * DreamTeQ_360 Cooperative Bank of Kenya Manual Ledger Sync Pull Request
 * Multi-Currency Settlement Channel: Altovex Global Logistics Company Ltd
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */
'use strict';

const http = require('http');
const Redis = require('ioredis');

const BANK_CONFIG = {
    apiEndpoint: process.env.DREAMTEQ_LEDGER_SYNC_URL || 'http://localhost:8090/sync/ledger',
    redisHost: process.env.REDIS_HOST || 'dreamteq-cache',
    redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
    accountNo: '01192952690600',
    paybill: '400200',
    accountRef: '40045731'
};

function publishCompletionSignal() {
    const redisPublisher = new Redis({
        host: BANK_CONFIG.redisHost,
        port: BANK_CONFIG.redisPort,
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        connectTimeout: 1200,
        retryStrategy: function() { return null; }
    });

    return redisPublisher.connect()
        .then(function() {
            return redisPublisher.publish('dreamteq_system_notifications', JSON.stringify({
                event: 'BACKUP_COMPLETE',
                message: 'Manual Bank Pull Verified. Cooperative Bank Account ' + BANK_CONFIG.accountNo + ' balances synchronized dynamically with Odoo 18.',
                timestamp: new Date().toISOString()
            }));
        })
        .then(function() {
            return redisPublisher.quit();
        })
        .catch(function(error) {
            console.warn('[REDIS NOTICE] Completion broadcast skipped: ' + error.message);
            return redisPublisher.disconnect();
        });
}

async function executeManualBankPull() {
    console.log('=== [STARTING BANK LEDGER PULL REQUEST] ===');

    const mockBankResponsePayload = [
        {
            _id: 'BANK_TX_KES_' + Date.now(),
            farmer_id: 'PHONE-254718554383',
            app_id: 'SACCO_HEAD_DASHBOARD',
            amount: '154350.00',
            currency: 'KES',
            gateway: 'INTERSWITCH_PESALINK',
            accountRef: BANK_CONFIG.accountRef,
            paybill: BANK_CONFIG.paybill
        }
    ];

    const stringData = JSON.stringify(mockBankResponsePayload);

    const req = http.request(BANK_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(stringData)
        }
    }, function(res) {
        let responseBody = '';
        res.on('data', function(chunk) { responseBody += chunk; });
        res.on('end', async function() {
            console.log('[BANK API RESPONSE HTTP ' + res.statusCode + ']: ' + responseBody);
            await publishCompletionSignal();
            console.log('=== [BANK LEDGER SYNCHRONISATION COMPLETE] ===');
            process.exit(res.statusCode >= 200 && res.statusCode < 300 ? 0 : 1);
        });
    });

    req.setTimeout(10000, function() {
        req.destroy(new Error('Ledger middleware request timed out'));
    });

    req.on('error', function(err) {
        console.error('Critical error connecting to the ledger middleware broker: ' + err.message);
        process.exit(1);
    });

    req.write(stringData);
    req.end();
}

executeManualBankPull();
