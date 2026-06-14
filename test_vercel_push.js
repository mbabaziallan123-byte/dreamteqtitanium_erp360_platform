/**
 * DreamTeQ_360 Vercel Production Gateway Live Connectivity Tester
 * Purpose: Verification of serverless proxy routing and environment keys
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const https = require('https');

// Override via VERCEL_HOST env var once Vercel project relinking is confirmed.
const VERCEL_HOST = process.env.VERCEL_HOST || 'project-jx0pu.vercel.app'; // Production Alias Domain Target
const MOCK_DATA_STREAM = [
    {
        _id: "CLOUD_INGEST_TEST_" + Date.now(),
        nitrogen: "45.20",
        phosphorus: "22.10",
        potassium: "118.90",
        timestamp: new Date().toISOString()
    }
];

function triggerVercelGatewayPush() {
    console.log("=== [STARTING LIVE VERCEL EDGE CONNECTIVITY PROBE] ===");
    console.log("[TARGET HOST]:", VERCEL_HOST);

    const requestPayload = JSON.stringify({
        app_id: "SoilHealth_AI",
        data_packet: JSON.stringify(MOCK_DATA_STREAM)
    });

    const requestOptions = {
        hostname: VERCEL_HOST,
        port: 443,
        path: '/api/sync',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestPayload)
        }
    };

    const req = https.request(requestOptions, (res) => {
        let resultDataBuffer = '';
        res.on('data', chunk => resultDataBuffer += chunk);
        res.on('end', () => {
            console.log(`[VERCEL CLOUD RESPONSE HTTP ${res.statusCode}]:`, resultDataBuffer);
            try {
                const parsed = JSON.parse(resultDataBuffer);
                if (parsed.success) {
                    console.log("SUCCESS: Vercel Serverless Function decrypted and synced variables to Supabase successfully.");
                } else {
                    console.warn("WARNING: Gateway accepted connection but backend processing returned failure state.");
                    if (parsed.error) console.warn("[REMOTE ERROR]:", parsed.error);
                }
            } catch (err) {
                console.error("PARSE ERROR: Invalid response format returned from edge server routing node:", err.message);
            }
            console.log("=== [VERCEL EDGE PROBE CYCLE COMPLETE] ===");
            process.exit(0);
        });
    });

    req.on('error', (errorInstance) => {
        console.error(`CRITICAL GATEWAY TIMEOUT: Endpoint unreachable. Error: ${errorInstance.message}`);
        process.exit(1);
    });

    req.setTimeout(15000, () => {
        console.error("REQUEST TIMEOUT: No response from Vercel edge within 15 seconds.");
        req.destroy();
        process.exit(1);
    });

    req.write(requestPayload);
    req.end();
}

triggerVercelGatewayPush();

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
