/**
 * DreamTeQ 360 — Secure Supabase Fetch Endpoint
 * Route: GET/POST /api/security-fetch
 *
 * Validates API key, rate-limits per IP, and proxies authenticated
 * read queries to Supabase. Returns sanitised JSON.
 *
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
'use strict';

const https   = require('https');
const url     = require('url');
const crypto  = require('crypto');

// ── Configuration (inject via environment) ───────────────────────────────────
const SUPABASE_URL      = process.env.SUPABASE_URL      || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const API_SECRET        = process.env.DREAMTEQ_API_SECRET || '';

// Allowed Supabase table names (whitelist — prevent table injection)
const ALLOWED_TABLES = new Set([
    'telemetry_events',
    'miniapp_usage',
    'lms_progress',
    'monetization_counters',
    'farmer_profiles',
    'soil_readings',
    'crop_recommendations'
]);

// Simple in-process rate limiter: max 60 req / minute per IP
const rateLimitMap = new Map();
const RATE_LIMIT   = 60;
const RATE_WINDOW  = 60 * 1000; // 1 minute

function checkRateLimit(ip) {
    const now = Date.now();
    let record = rateLimitMap.get(ip);
    if (!record || now - record.windowStart > RATE_WINDOW) {
        record = { windowStart: now, count: 0 };
        rateLimitMap.set(ip, record);
    }
    record.count++;
    return record.count <= RATE_LIMIT;
}

// Purge stale rate-limit records every 5 minutes
setInterval(function() {
    const now = Date.now();
    rateLimitMap.forEach(function(v, k) {
        if (now - v.windowStart > RATE_WINDOW * 2) rateLimitMap.delete(k);
    });
}, 5 * 60 * 1000);

// ── Input validation helpers ─────────────────────────────────────────────────
function isValidTableName(name) {
    return typeof name === 'string' && ALLOWED_TABLES.has(name);
}

function isPositiveInt(val, max) {
    const n = parseInt(val, 10);
    return !isNaN(n) && n > 0 && n <= (max || 1000);
}

function sanitiseOrder(order) {
    // Only allow "column.asc" or "column.desc" — no injection
    if (typeof order !== 'string') return null;
    if (/^[a-zA-Z_][a-zA-Z0-9_]*\.(asc|desc)$/.test(order)) return order;
    return null;
}

// ── Supabase REST proxy ──────────────────────────────────────────────────────
function supabaseFetch(table, params, callback) {
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        return callback(new Error('Supabase not configured'), null);
    }

    const queryParams = new URLSearchParams();
    if (params.select) queryParams.set('select', params.select);
    if (params.limit)  queryParams.set('limit',  String(params.limit));
    if (params.offset) queryParams.set('offset', String(params.offset));
    if (params.order)  queryParams.set('order',  params.order);

    const endpoint = SUPABASE_URL + '/rest/v1/' + table + '?' + queryParams.toString();
    const parsedUrl = url.parse(endpoint);

    const options = {
        hostname: parsedUrl.hostname,
        path:     parsedUrl.path,
        method:   'GET',
        headers: {
            'apikey':        SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type':  'application/json',
            'Accept':        'application/json',
            'Prefer':        'count=exact'
        }
    };

    const req = https.request(options, function(res) {
        let body = '';
        res.on('data', function(chunk) { body += chunk; });
        res.on('end', function() {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                try {
                    callback(null, JSON.parse(body));
                } catch (e) {
                    callback(new Error('Invalid JSON from Supabase'), null);
                }
            } else {
                callback(new Error('Supabase returned status ' + res.statusCode + ': ' + body.substring(0, 200)), null);
            }
        });
    });

    req.on('error', function(e) { callback(e, null); });
    req.setTimeout(10000, function() { req.destroy(new Error('Supabase request timed out')); });
    req.end();
}

// ── Request body reader ───────────────────────────────────────────────────────
function readBody(req, callback) {
    let body = '';
    req.on('data', function(chunk) {
        body += chunk.toString();
        if (body.length > 8192) { req.destroy(); callback(new Error('Request body too large'), null); }
    });
    req.on('end', function() {
        try { callback(null, body ? JSON.parse(body) : {}); }
        catch (_) { callback(new Error('Invalid JSON body'), null); }
    });
    req.on('error', function(e) { callback(e, null); });
}

// ── Main handler ─────────────────────────────────────────────────────────────
module.exports = function securityFetchHandler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin',  'http://localhost:8080');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-DreamTeQ-Key');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');

    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }
    if (req.method !== 'GET' && req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Method not allowed' }));
        return;
    }

    // API key validation
    const providedKey = req.headers['x-dreamteq-key'] || '';
    if (API_SECRET && !crypto.timingSafeEqual(
        Buffer.from(providedKey.padEnd(64, '\0')),
        Buffer.from(API_SECRET.padEnd(64, '\0'))
    )) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return;
    }

    // Rate limit
    const clientIP = (req.headers['x-forwarded-for'] || req.socket.remoteAddress || '0.0.0.0').split(',')[0].trim();
    if (!checkRateLimit(clientIP)) {
        res.writeHead(429, { 'Content-Type': 'application/json', 'Retry-After': '60' });
        res.end(JSON.stringify({ error: 'Rate limit exceeded. Max 60 req/min.' }));
        return;
    }

    readBody(req, function(err, body) {
        if (err) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: err.message }));
            return;
        }

        // Parse params from query string or body
        const parsedUrl = url.parse(req.url, true);
        const q = Object.assign({}, parsedUrl.query, body);

        const table = q.table;
        if (!isValidTableName(table)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Invalid or missing table name.' }));
            return;
        }

        const limit  = isPositiveInt(q.limit,  500) ? parseInt(q.limit,  10) : 50;
        const offset = isPositiveInt(q.offset, 100000) ? parseInt(q.offset, 10) : 0;
        const select = (typeof q.select === 'string' && /^[a-zA-Z0-9_,*\s()]+$/.test(q.select)) ? q.select : '*';
        const order  = sanitiseOrder(q.order);

        supabaseFetch(table, { select, limit, offset, order }, function(fetchErr, data) {
            if (fetchErr) {
                console.error('[SECURITY-FETCH] Supabase error:', fetchErr.message);
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Upstream fetch failed.' }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true, table, count: Array.isArray(data) ? data.length : 0, data }));
        });
    });
};

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site
 * Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
