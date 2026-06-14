#!/usr/bin/env node
'use strict';

/**
 * DreamTeQ_360 Ollama Bridge and Local Dialect Normalisation Engine
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */

const http = require('http');

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const PORT = parseInt(process.env.OLLAMA_BRIDGE_PORT || '3456', 10);

const DIALECT_RULES = [
    {
        keyword: 'fertilizer',
        match: /\b(mbolea|fertili[sz]er|farm input|inputi)\b/i,
        render: 'fertilizer procurement request for farm input routing'
    },
    {
        keyword: 'dairy revenue liquidation',
        match: /(maziwa|dairy).*(pesa|ledger|haijaingia|revenue|payment|malipo)|(pesa|ledger|revenue|payment|malipo).*(maziwa|dairy)/i,
        render: 'dairy revenue liquidation ledger follow-up transaction'
    },
    {
        keyword: 'crop rotation',
        match: /\b(mzunguko|rotation|msimu|seasonal cycle|hama mzunguko)\b/i,
        render: 'crop rotation seasonal planning instruction'
    },
    {
        keyword: 'farm plot',
        match: /\b(shamba|farm plot|ploti|acre|eka)\b/i,
        render: 'farm plot field activity reference'
    },
    {
        keyword: 'dairy',
        match: /\b(maziwa|dairy)\b/i,
        render: 'dairy production handling packet'
    }
];

function fallbackDialectNormalisation(phrase) {
    const input = String(phrase || '').trim();
    const matchedRules = DIALECT_RULES.filter(function(rule) { return rule.match.test(input); });

    if (matchedRules.length === 0) {
        return 'general agricultural operations packet: ' + input;
    }

    return matchedRules.map(function(rule) { return rule.render; }).join(' | ');
}

async function callOllamaForDialectNormalisation(phrase) {
    if (typeof fetch !== 'function') {
        throw new Error('fetch unavailable in current Node runtime');
    }

    const controller = new AbortController();
    const timeout = setTimeout(function() { controller.abort(); }, 1500);

    try {
        const response = await fetch(OLLAMA_URL + '/api/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
                model: process.env.OLLAMA_DIALECT_MODEL || 'deepseek-r1:1.5b',
                prompt: 'Normalize this East African agricultural phrase into concise English transaction nouns only: ' + phrase,
                stream: false,
                options: { temperature: 0.1, top_p: 0.7, max_tokens: 80 }
            })
        });

        const data = await response.json();
        if (typeof data.response !== 'string' || data.response.trim() === '') {
            throw new Error(data.error || 'empty Ollama dialect response');
        }
        return data.response.trim();
    } finally {
        clearTimeout(timeout);
    }
}

async function normalizeLocalDialectSpeech(phrase) {
    const localResult = fallbackDialectNormalisation(phrase);

    if (process.env.DREAMTEQ_USE_OLLAMA_DIALECT === '1') {
        try {
            const ollamaResult = await callOllamaForDialectNormalisation(phrase);
            return localResult + ' | ollama semantic refinement: ' + ollamaResult;
        } catch (error) {
            return localResult + ' | safe fallback engaged: ' + error.message;
        }
    }

    return localResult + ' | safe fallback engine active';
}

function resolveOllamaModel(model) {
    if (model === 'code') return 'qwen2.5-coder:7b';
    if (model === 'fast') return 'deepseek-r1:1.5b';
    if (model === 'reasoning') return 'deepseek-r1:7b';
    return 'deepseek-r1:7b';
}

function createServer() {
    return http.createServer(async function(req, res) {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

        if (req.method === 'OPTIONS') {
            res.writeHead(200);
            res.end();
            return;
        }

        if (req.method === 'GET' && req.url === '/health') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', ollama: 'optional', dialectFallback: true }));
            return;
        }

        if (req.method === 'POST' && req.url === '/dialect') {
            let body = '';
            req.on('data', function(chunk) { body += chunk; });
            req.on('end', async function() {
                try {
                    const parsed = JSON.parse(body || '{}');
                    const normalized = await normalizeLocalDialectSpeech(parsed.phrase || parsed.prompt || '');
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ normalized, provider: 'dreamteq-dialect-fallback' }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
            return;
        }

        if (req.method === 'POST' && req.url === '/chat') {
            let body = '';
            req.on('data', function(chunk) { body += chunk; });
            req.on('end', async function() {
                try {
                    const parsed = JSON.parse(body || '{}');
                    const ollamaModel = resolveOllamaModel(parsed.model);
                    const lastMessage = (parsed.messages && parsed.messages[parsed.messages.length - 1] && parsed.messages[parsed.messages.length - 1].content) || parsed.prompt || '';
                    const ollamaResponse = await fetch(OLLAMA_URL + '/api/generate', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            model: ollamaModel,
                            prompt: lastMessage,
                            stream: false,
                            options: { temperature: 0.7, top_p: 0.9, max_tokens: 4096 }
                        })
                    });
                    const data = await ollamaResponse.json();

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        response: typeof data.response === 'string' ? data.response : undefined,
                        error: typeof data.error === 'string' ? data.error : undefined,
                        model: ollamaModel,
                        provider: 'ollama'
                    }));
                } catch (error) {
                    res.writeHead(500, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: error.message }));
                }
            });
            return;
        }

        res.writeHead(404);
        res.end('Not found');
    });
}

if (require.main === module) {
    const server = createServer();
    server.listen(PORT, function() {
        console.log('Ollama Bridge running on http://localhost:' + PORT);
        console.log('Dialect endpoint available at http://localhost:' + PORT + '/dialect');
        console.log('Models available: deepseek-r1:7b, qwen2.5-coder:7b, deepseek-r1:1.5b');
    });

    process.on('SIGINT', function() {
        console.log('\nOllama Bridge shutting down...');
        server.close();
        process.exit(0);
    });
}

module.exports = {
    normalizeLocalDialectSpeech,
    fallbackDialectNormalisation,
    createServer
};
