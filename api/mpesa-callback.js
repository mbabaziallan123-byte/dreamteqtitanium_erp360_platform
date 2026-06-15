/**
 * DreamTeQ_360 C2B Mobile Money Callback Ingestion Controller
 * Compliance Matrix: Safaricom M-Pesa Daraja API OpenAPI Structural Spec
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */
'use strict';

// Ledger sync URL — configurable via env so it works across Docker, Vercel, and local.
const LEDGER_SYNC_URL = process.env.DREAMTEQ_LEDGER_SYNC_URL || 'http://localhost:8090/sync/ledger';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ success: false, message: 'Invalid callback execution request method.' });
    }

    try {
        const callbackPayload = req.body && req.body.Body && req.body.Body.stkCallback;
        if (!callbackPayload) {
            throw new Error('Missing stkCallback payload body.');
        }

        if (callbackPayload.ResultCode !== 0) {
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Transaction failure logged internally.' });
        }

        const metadataItems = callbackPayload.CallbackMetadata && callbackPayload.CallbackMetadata.Item;
        if (!Array.isArray(metadataItems)) {
            throw new Error('Missing callback metadata item array.');
        }

        const getMetadataValue = (name) => {
            const item = metadataItems.find(entry => entry.Name === name);
            if (!item || item.Value === undefined || item.Value === null) {
                throw new Error(`Missing M-Pesa metadata value: ${name}`);
            }
            return item.Value;
        };

        const amountPaid = getMetadataValue('Amount');
        const transactionRef = getMetadataValue('MpesaReceiptNumber');
        const phoneReference = getMetadataValue('PhoneNumber');

        const ledgerSyncPacket = [{
            _id: transactionRef,
            farmer_id: `PHONE-${phoneReference}`,
            app_id: 'MOBILE_MONEY_GATEWAY_C2B',
            amount: amountPaid
        }];

        const response = await fetch(LEDGER_SYNC_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(ledgerSyncPacket)
        });

        const syncStatus = await response.json();

        if (syncStatus.success) {
            return res.status(200).json({ ResultCode: 0, ResultDesc: 'Ledger transaction updated successfully.' });
        }

        throw new Error('Local Odoo JSON-RPC routing failure execution.');
    } catch (err) {
        return res.status(500).json({ ResultCode: 1, ResultDesc: `Callback process exception: ${err.message}` });
    }
}
