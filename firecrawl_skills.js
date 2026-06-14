/**
 * DreamTeQ_360 Firecrawl AI Agent Live Web Skills Integration Module
 * Purpose: Connects Amanda Swarm to the live web for KYC, price discovery,
 *          market research, and corporate compliance profiling.
 * Architecture: MCP-compatible skill node consumed by multi-agent workflow streams.
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 *
 * Required environment variable (set in Vercel vault & local .env):
 *   FIRECRAWL_API_KEY — obtain at https://firecrawl.dev/
 */

'use strict';

const https = require('https');

// ── Firecrawl API configuration ───────────────────────────────────────────────
// API key is read from environment only — never hardcoded in source.
// v2 is the current production API version per official Firecrawl integration docs.
const FIRECRAWL_HOST    = 'api.firecrawl.dev';
const FIRECRAWL_BASE    = '/v2';
const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || '';

// ── Internal helper: make a signed HTTPS request to Firecrawl ────────────────
function firecrawlRequest(path, bodyObject) {
    return new Promise((resolve, reject) => {
        if (!FIRECRAWL_API_KEY) {
            return reject(new Error('FIRECRAWL_API_KEY is not set in environment.'));
        }

        const payloadData = JSON.stringify(bodyObject);

        const options = {
            hostname: FIRECRAWL_HOST,
            path:     `${FIRECRAWL_BASE}${path}`,
            method: 'POST',
            headers: {
                'Authorization':  `Bearer ${FIRECRAWL_API_KEY}`,
                'Content-Type':   'application/json',
                'Content-Length': Buffer.byteLength(payloadData)
            }
        };

        const req = https.request(options, (res) => {
            let chunkBuffer = '';
            res.on('data', (c) => { chunkBuffer += c; });
            res.on('end', () => {
                try {
                    resolve(JSON.parse(chunkBuffer));
                } catch (_) {
                    reject(new Error('Firecrawl returned non-JSON response stream.'));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(payloadData);
        req.end();
    });
}

// ── Skill module ──────────────────────────────────────────────────────────────
const FirecrawlAgentSkills = {

    /**
     * Scrape a single URL and return clean Markdown for AI consumption.
     * Strips navigation bars, footers, ads — returns only main content.
     *
     * @param {string} targetUrl - Web page address to analyze
     * @returns {Promise<string>} - Clean Markdown string
     */
    async scrapeCleanWebContext(targetUrl) {
        console.log(`[FIRECRAWL SKILL] Initiating clean web scrape on: ${targetUrl}`);

        const result = await firecrawlRequest('/scrape', {
            url:             targetUrl,
            formats:         ['markdown'],
            onlyMainContent: true
        });

        if (result.success && result.data && result.data.markdown) {
            return result.data.markdown;
        }
        // v2 may nest markdown inside data.content on some endpoint variants
        if (result.success && result.data && result.data.content) {
            return result.data.content;
        }
        throw new Error(result.error || 'Firecrawl /scrape returned no usable content.');
    },

    /**
     * Search the live web and return structured result objects.
     * Ideal for real-time commodity price discovery, KYC lookups,
     * and agricultural corridor market intelligence.
     *
     * @param {string} query - Natural language search query
     * @param {number} [limit=3] - Maximum number of result documents to return
     * @returns {Promise<Array>} - Array of structured search result objects
     */
    async searchLiveMarketIntelligence(query, limit = 3) {
        console.log(`[FIRECRAWL SKILL] Dispatching live web intelligence search: "${query}"`);

        const result = await firecrawlRequest('/search', {
            query,
            limit,
            scrapeOptions: {
                formats:         ['json'],
                onlyMainContent: true
            }
        });

        // v2 /search nests results under data.web
        return (result.data && result.data.web) ? result.data.web : (result.data || []);
    },

    /**
     * Deep-crawl a domain and build a full content corpus.
     * Useful for building sector reports and regulatory compliance dossiers.
     *
     * @param {string} startUrl - Root URL to crawl from
     * @param {number} [pageLimit=10] - Maximum pages to crawl
     * @returns {Promise<object>} - Raw Firecrawl crawl response
     */
    async crawlDomainCorpus(startUrl, pageLimit = 10) {
        console.log(`[FIRECRAWL SKILL] Initiating domain corpus crawl on: ${startUrl} (limit: ${pageLimit} pages)`);

        const result = await firecrawlRequest('/crawl', {
            url:   startUrl,
            limit: pageLimit,
            scrapeOptions: {
                formats:         ['markdown'],
                onlyMainContent: true
            }
        });

        if (!result.success) {
            throw new Error(result.error || 'Firecrawl /crawl operation failed.');
        }
        return result;
    }
};

module.exports = FirecrawlAgentSkills;

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
