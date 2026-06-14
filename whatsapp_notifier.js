/**
 * DreamTeQ_360 Automated WhatsApp Business Notification Engine
 * Core Functionality: Real-Time Operational Alerts Relay
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const https = require('https');

// All secrets read from environment only — never hardcode in source.
const WHATSAPP_CONFIG = {
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',     // Set in env/Vercel vault
    accessToken:   process.env.WHATSAPP_ACCESS_TOKEN   || '',     // Set in env/Vercel vault
    recipientPhone: '254718554383'                                  // Primary CTO routing target
};

/**
 * Transmits system metrics alerts to target WhatsApp business accounts.
 * @param {string} templateName   - Meta-approved message template identifier
 * @param {Array}  parameterArray - Text variables mapping to template placeholders
 */
function sendWhatsAppAlert(templateName, parameterArray) {
    if (!WHATSAPP_CONFIG.phoneNumberId || !WHATSAPP_CONFIG.accessToken) {
        console.error('[WHATSAPP NOTIFIER] ABORT: WHATSAPP_PHONE_NUMBER_ID and WHATSAPP_ACCESS_TOKEN must be set in environment.');
        return;
    }

    console.log(`[WHATSAPP AGGREGATOR] Preparing notification stream for template: ${templateName}`);

    const payload = JSON.stringify({
        messaging_product: 'whatsapp',
        to: WHATSAPP_CONFIG.recipientPhone,
        type: 'template',
        template: {
            name: templateName,
            language: { code: 'en_US' },
            components: [
                {
                    type: 'body',
                    parameters: parameterArray.map(val => ({ type: 'text', text: String(val) }))
                }
            ]
        }
    });

    const requestOptions = {
        hostname: 'graph.facebook.com',           // Correct Meta Graph API endpoint
        port: 443,
        path: `/v17.0/${WHATSAPP_CONFIG.phoneNumberId}/messages`,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${WHATSAPP_CONFIG.accessToken}`,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
        }
    };

    const req = https.request(requestOptions, (res) => {
        let responseBuffer = '';
        res.on('data', chunk => responseBuffer += chunk);
        res.on('end', () => {
            console.log(`[WHATSAPP API RESPONSE HTTP ${res.statusCode}]:`, responseBuffer);
        });
    });

    req.on('error', (e) => {
        console.error(`[WHATSAPP CRITICAL FAULT] Messaging broker transit failure: ${e.message}`);
    });

    req.setTimeout(10000, () => {
        console.error('[WHATSAPP CRITICAL FAULT] Request timed out after 10 seconds.');
        req.destroy();
    });

    req.write(payload);
    req.end();
}

/**
 * Convenience wrapper: broadcast backup success event to CTO WhatsApp.
 * @param {string} fileName - Snapshot filename
 * @param {string} sizeKB   - File size in kilobytes (string)
 */
function broadcastBackupSuccessToWhatsApp(fileName, sizeKB) {
    const timestampStr = new Date().toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' });
    sendWhatsAppAlert('dreamteq_backup_alert', [fileName, sizeKB, timestampStr]);
}

module.exports = { sendWhatsAppAlert, broadcastBackupSuccessToWhatsApp };

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
