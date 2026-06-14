/**
 * DreamTeQ 360 — Supabase Sync Endpoint
 * Route: POST /api/sync
 *
 * Receives encrypted telemetry packets from the browser (PouchDB → postMessage
 * pipeline) and routes them to the correct Supabase relational table.
 * All writes are idempotent (upsert on packet_id).
 *
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
'use strict';

const https  = require('https');
const url    = require('url');
const crypto = require('crypto');

// ── Configuration ────────────────────────────────────────────────────────────
const SUPABASE_URL       = process.env.SUPABASE_URL       || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const API_SECRET         = process.env.DREAMTEQ_API_SECRET  || '';
const MAX_BODY_BYTES      = 65536; // 64 KB

// Channel → Supabase table routing
const CHANNEL_TABLE_MAP = {
    'SMM':      'telemetry_events',
    'LLMM':     'telemetry_events',
    'LLEO':     'telemetry_events',
    'SEO':      'telemetry_events',
    'soil':     'soil_readings',
    'lms':      'lms_progress',
    'miniapp':  'miniapp_usage',
    'DEFAULT':  'telemetry_events'
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function resolveTable(channel) {
    if (!channel) return CHANNEL_TABLE_MAP.DEFAULT;
    const key = String(channel).toUpperCase();
    for (const [k, v] of Object.entries(CHANNEL_TABLE_MAP)) {
        if (key.includes(k.toUpperCase())) return v;
    }
    return CHANNEL_TABLE_MAP.DEFAULT;
}

function readBody(req, callback) {
    let buf = Buffer.alloc(0);
    req.on('data', function(chunk) {
        buf = Buffer.concat([buf, chunk]);
        if (buf.length > MAX_BODY_BYTES) {
            req.destroy(new Error('Body too large'));
        }
    });
    req.on('end', function() {
        try { callback(null, JSON.parse(buf.toString('utf8'))); }
        catch (_) { callback(new Error('Invalid JSON'), null); }
    });
    req.on('error', function(e) { callback(e, null); });
}

function supabaseUpsert(table, rows, callback) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
        return callback(new Error('Supabase not configured'));
    }
    const body = Buffer.from(JSON.stringify(rows), 'utf8');
    const parsedUrl = url.parse(SUPABASE_URL + '/rest/v1/' + table);
    const options = {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.path,
        method:   'POST',
        headers: {
            'apikey':          SUPABASE_SERVICE_KEY,
            'Authorization':   'Bearer ' + SUPABASE_SERVICE_KEY,
            'Content-Type':    'application/json',
            'Content-Length':  body.length,
            'Prefer':          'resolution=merge-duplicates,return=minimal'
        }
    };

    const req = https.request(options, function(res) {
        let resBody = '';
        res.on('data', function(c) { resBody += c; });
        res.on('end', function() {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                callback(null);
            } else {
                callback(new Error('Supabase upsert failed: ' + res.statusCode + ' ' + resBody.substring(0, 200)));
            }
        });
    });

    req.on('error', callback);
    req.setTimeout(12000, function() { req.destroy(new Error('Supabase timeout')); });
    req.write(body);
    req.end();
}

// ── Packet normaliser ────────────────────────────────────────────────────────
function normalisePacket(raw) {
    // Accept both direct packets and PouchDB-wrapped envelopes
    const pkt = (raw.payload && typeof raw.payload === 'object') ? raw.payload : raw;
    return {
        packet_id:    pkt.packetId  || pkt._id      || crypto.randomUUID(),
        app_id:       pkt.appId     || pkt.app_id   || 'UNKNOWN',
        channel:      pkt.channel   || raw.channel  || 'DEFAULT',
        received_at:  pkt.receivedAt || pkt.ts      || new Date().toISOString(),
        payload:      JSON.stringify(pkt),
        source:       pkt.source    || 'browser',
        platform:     'DreamTeQ_360'
    };
}

// ── Validate incoming packet array ───────────────────────────────────────────
function validatePackets(packets) {
    if (!Array.isArray(packets)) return false;
    if (packets.length === 0 || packets.length > 500) return false;
    for (const p of packets) {
        if (typeof p !== 'object' || p === null) return false;
    }
    return true;
}

// ── Main handler ─────────────────────────────────────────────────────────────
module.exports = function syncHandler(req, res) {
    res.setHeader('Access-Control-Allow-Origin',  'http://localhost:8080');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-DreamTeQ-Key');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // API key check
    const providedKey = req.headers['x-dreamteq-key'] || '';
    if (API_SECRET && !crypto.timingSafeEqual(
        Buffer.from(providedKey.padEnd(64, '\0')),
        Buffer.from(API_SECRET.padEnd(64, '\0'))
    )) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    readBody(req, function(err, body) {
        if (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }

        // Accept { packets: [...] } or [...] directly
        const raw = Array.isArray(body) ? body : (Array.isArray(body.packets) ? body.packets : null);
        if (!validatePackets(raw)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Expected { packets: [...] } with 1-500 items.' }));
            return;
        }

        // Group by target table
        const groups = {};
        for (const item of raw) {
            const norm  = normalisePacket(item);
            const table = resolveTable(norm.channel);
            if (!groups[table]) groups[table] = [];
            groups[table].push(norm);
        }

        const tables  = Object.keys(groups);
        let   pending = tables.length;
        const errors  = [];
        const results = {};

        if (pending === 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, synced: 0, tables: {} }));
            return;
        }

        tables.forEach(function(table) {
            const rows = groups[table];
            supabaseUpsert(table, rows, function(upsertErr) {
                if (upsertErr) {
                    console.error('[SYNC] Upsert error for', table + ':', upsertErr.message);
                    errors.push({ table, error: upsertErr.message });
                    results[table] = { ok: false, count: rows.length };
                } else {
                    console.log('[SYNC] Upserted', rows.length, 'row(s) to', table);
                    results[table] = { ok: true, count: rows.length };
                }
                pending--;
                if (pending === 0) {
                    const totalSynced = Object.values(results).reduce(function(sum, r) { return sum + (r.ok ? r.count : 0); }, 0);
                    const status = errors.length === 0 ? 200 : 207;
                    res.writeHead(status, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        ok:     errors.length === 0,
                        synced: totalSynced,
                        tables: results,
                        errors: errors.length ? errors : undefined
                    }));
                }
            });
        });
    });
};

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site
 * Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
