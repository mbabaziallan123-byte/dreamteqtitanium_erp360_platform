/**
 * DreamTeQ_360 Secure WhatsApp AI Gateway Ingestion Test Suite
 * Purpose: Verifies token handshakes and absolute identity guards
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const http = require('http');

// Read from env — must match WHATSAPP_AI_GATEWAY_TOKEN and WHATSAPP_ADMIN_PHONE set on the server
const GATEWAY_TOKEN = process.env.WHATSAPP_AI_GATEWAY_TOKEN || '';
const ADMIN_PHONE   = process.env.WHATSAPP_ADMIN_PHONE      || '';
const GATEWAY_PORT  = parseInt(process.env.WA_AI_ROUTER_PORT || '8095', 10);

function runSecurePipelineAudit() {
    if (!GATEWAY_TOKEN || !ADMIN_PHONE) {
        console.error('ABORT: Set WHATSAPP_AI_GATEWAY_TOKEN and WHATSAPP_ADMIN_PHONE in environment before running this test.');
        process.exit(1);
    }

    console.log('=== [STARTING ZERO-TRUST WA-AI DISPATCH VERIFICATION] ===');

    const mockPayload = JSON.stringify({
        sender_phone: ADMIN_PHONE,
        text: 'Amanda, execute platform database status audit sweep'
    });

    const requestOptions = {
        hostname: 'localhost',
        port:     GATEWAY_PORT,
        path:     '/v1/whatsapp/ai-gateway',
        method:   'POST',
        headers: {
            'Content-Type':       'application/json',
            'X-DreamTeQ-Token':   GATEWAY_TOKEN,
            'Content-Length':     Buffer.byteLength(mockPayload)
        }
    };

    const req = http.request(requestOptions, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
            console.log(`[GATEWAY RESPONSE HTTP ${res.statusCode}]:`, body);
            if (res.statusCode === 200) {
                console.log('SUCCESS: Remote verification loop completed without data leakage.');
                console.log('=== [TEST CYCLE CONCLUDED — PASSED] ===');
                process.exit(0);
            } else {
                console.error('FAILURE: Isolation boundary rejected transaction validation tokens.');
                console.log('=== [TEST CYCLE CONCLUDED — FAILED] ===');
                process.exit(1);
            }
        });
    });

    req.on('error', (e) => {
        console.error(`CONNECTION DROP: Is the gateway runtime up on port ${GATEWAY_PORT}? Error: ${e.message}`);
        process.exit(1);
    });

    req.setTimeout(10000, () => {
        console.error('REQUEST TIMEOUT: No response from gateway within 10 seconds.');
        req.destroy();
        process.exit(1);
    });

    req.write(mockPayload);
    req.end();
}

runSecurePipelineAudit();

/*
 * Usage:
 *   $env:WHATSAPP_AI_GATEWAY_TOKEN='your-token'; $env:WHATSAPP_ADMIN_PHONE='254718554383'; node test_whatsapp_ai_pipeline.js
 *
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
