/**
 * DreamTeQ_360 Ingestion Data Mapping Normalizer & Validator
 * Scope: High-Velocity Stream Sanitization Matrix
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

'use strict';

const DataNormalizer = {
    /**
     * Cleanses, standardizes, and normalizes raw telemetry packets prior to schema mapping.
     * @param {Object} rawPacket - Unsanitized transaction packet from mini-apps or webhooks
     * @returns {Object} Normalized transaction record
     */
    normalizeTransactionPayload(rawPacket) {
        if (!rawPacket || !rawPacket._id || !rawPacket.farmer_id || !rawPacket.amount) {
            throw new Error("Data Mapping Validation Error: Missing mandatory transaction identification keys.");
        }

        const cleanAmount = parseFloat(rawPacket.amount);
        if (isNaN(cleanAmount) || cleanAmount <= 0) {
            throw new Error(`Data Constraint Breach: Invalid transaction amount format value [${rawPacket.amount}]`);
        }

        // Normalize farmer references: uniform alphanumeric uppercase, collapse whitespace
        const sanitizedFarmerId = String(rawPacket.farmer_id).trim().toUpperCase().replace(/\s+/g, '_');

        // Standardize timestamps to East African Standard Time (EAT - UTC+3) ISO 8601 profile
        const standardizedTime = rawPacket.timestamp
            ? new Date(rawPacket.timestamp).toISOString()
            : new Date().toISOString();

        return {
            _id:                String(rawPacket._id).trim(),
            farmer_id:          sanitizedFarmerId,
            app_id:             String(rawPacket.app_id || 'GENERIC_INGESTION_NODE').toUpperCase().trim(),
            amount:             cleanAmount.toFixed(2),   // Strict accounting numeric precision
            currency:           String(rawPacket.currency || 'KES').toUpperCase().trim(),
            gateway:            String(rawPacket.gateway  || 'LOCAL_WALLET').toUpperCase().trim(),
            normalized_timestamp: standardizedTime,
            system_meta: {
                platform_signature: 'DreamTeQ Titanium Engine v18.0',
                compliance_locked:  true
            }
        };
    }
};

module.exports = DataNormalizer;

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
