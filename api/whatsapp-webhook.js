/**
 * DreamTeQ_360 WhatsApp Business API Inbound Webhook Gateway Controller
 * Purpose: Captures real-time device interaction signals and triggers status updates
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

export default async function handler(req, res) {
    // Handle the initial Webhook verification challenge dispatched by Meta Developer setup screens
    if (req.method === 'GET') {
        // WHATSAPP_VERIFY_TOKEN must be set in Vercel vault — no hardcoded fallback
        const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;
        if (!verifyToken) {
            console.error('[WEBHOOK] WHATSAPP_VERIFY_TOKEN is not configured in environment.');
            return res.status(500).json({ success: false, message: 'Server configuration error.' });
        }

        const mode      = req.query['hub.mode'];
        const token     = req.query['hub.verify_token'];
        const challenge = req.query['hub.challenge'];

        if (mode === 'subscribe' && token === verifyToken) {
            console.log('[WEBHOOK] Meta verification challenge accepted.');
            return res.status(200).send(challenge);
        }
        console.warn('[WEBHOOK] Verification token mismatch — rejecting handshake.');
        return res.status(403).json({ success: false, message: 'Verification validation signature mismatch.' });
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Method disallowed.' });
    }

    try {
        const payload = req.body;

        // Isolate message payload entries inside the inbound Webhook JSON parameters
        if (
            payload.entry &&
            payload.entry[0].changes &&
            payload.entry[0].changes[0].value.messages
        ) {
            const messageObject = payload.entry[0].changes[0].value.messages[0];
            const senderPhone   = messageObject.from;
            const textContent   = messageObject.text ? messageObject.text.body.trim() : '';

            console.log(`[WHATSAPP WEBHOOK RECEIVED] Message from ${senderPhone}: "${textContent}"`);

            if (textContent.toLowerCase() === 'status') {
                // Forward confirmation action downstream to live systems tracking matrix
                console.log('[WEBHOOK] STATUS command received — updating transaction log indicators.');
            }
        }

        return res.status(200).send('EVENT_RECEIVED');
    } catch (err) {
        console.error('[WEBHOOK ERROR]', err.message);
        return res.status(500).json({ success: false, error: err.message });
    }
}

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
