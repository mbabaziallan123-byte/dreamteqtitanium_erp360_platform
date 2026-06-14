/**
 * DreamTeQ_360 WebSocket Realtime Event Node Server
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
'use strict';

const http      = require('http');
const WebSocket = require('ws');
const Redis     = require('ioredis');
const { dispatchPipelineExceptionAlert } = require('./pipeline_exception_notifier');

const WS_PORT   = parseInt(process.env.WS_PORT   || '8085', 10);
const REDIS_HOST = process.env.REDIS_HOST || 'dreamteq-cache';
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);

// ── HTTP health-check server ──────────────────────────────────────────────────
const server = http.createServer(function(req, res) {
    res.writeHead(200, { 'Content-Type': 'text/plain', 'X-Service': 'DreamTeQ-WS-Broker' });
    res.end('DreamTeQ Realtime Event Broker Node Active\n');
});

// ── WebSocket server (attached to HTTP server via upgrade) ────────────────────
const wss = new WebSocket.Server({ noServer: true });

// ── Redis subscriber ──────────────────────────────────────────────────────────
const redisSubscriber = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    retryStrategy: function(times) {
        var delay = Math.min(times * 500, 5000);
        console.log('[REDIS] Retry #' + times + ' in ' + delay + 'ms');
        return delay;
    }
});

// ── Optional metrics publisher ────────────────────────────────────────────────
const redisPublisher = new Redis({
    host: REDIS_HOST,
    port: REDIS_PORT,
    maxRetriesPerRequest: null,
    retryStrategy: function(times) { return Math.min(times * 500, 5000); }
});

redisSubscriber.on('connect', function() {
    console.log('[REDIS] Subscriber connected to ' + REDIS_HOST + ':' + REDIS_PORT);
});
redisSubscriber.on('error', function(e) {
    console.error('[REDIS ERROR] ' + e.message);
});

// Subscribe to all DreamTeQ event channels
const CHANNELS = [
    'dreamteq_system_notifications',
    'dreamteq:broadcast',
    'dreamteq:odoo',
    'dreamteq:frappe',
    'dreamteq:metrics'
];

redisSubscriber.subscribe.apply(redisSubscriber, CHANNELS.concat([function(err, count) {
    if (err) {
        console.error('[REDIS ERROR] Channel mount skipped:', err.message);
    } else {
        console.log('[REDIS SUB] Active subscriber listening on ' + count + ' target event stream(s):', CHANNELS.join(', '));
    }
}]));

function interceptAndEvaluateAgentTelemetry(channel, rawStringData) {
    try {
        var telemetryPacket = JSON.parse(rawStringData);
        var statusColor = String(telemetryPacket.status_color || telemetryPacket.statusColor || '').toLowerCase();
        var eventName = String(telemetryPacket.event || '');
        var messageText = String(telemetryPacket.message || telemetryPacket.error || '');
        var isMaroonState = eventName === 'AGENT_STATE_SHIFT' && statusColor === 'maroon';
        var isSyncTimeout = /database synchronization timeout|sync timeout|db lock timeout|database lock timeout/i.test(messageText);

        if (!isMaroonState && !isSyncTimeout) {
            return;
        }

        var agentId = telemetryPacket.agent_id || telemetryPacket.agentId || 'unknown_agent';
        var componentId = 'AMANDA_AGENT_OVERRUN_' + String(agentId).toUpperCase().replace(/[^A-Z0-9_]/g, '_');
        console.log('[ALERT MATRIX INTERCEPT] Critical agent telemetry caught for node: ' + agentId + ' on channel: ' + channel);

        var exceptionContextDump = {
            message: messageText || ('Multi-agent processing execution timeout drop encountered on cluster: ' + agentId),
            stack: [
                'Agent Rating Vector: ' + (statusColor ? statusColor.toUpperCase() : 'TIMEOUT_ANOMALY'),
                'Context Channel Allocation: ' + (telemetryPacket.channel || channel || 'Ecosystem Core'),
                'Associated ERP Module Identity: ' + (telemetryPacket.module_id || telemetryPacket.moduleId || 'Unknown'),
                'System Latency Metrics Overrun: ' + (telemetryPacket.latency_ms || telemetryPacket.latencyMs || 'Timeout') + ' ms',
                'Raw Event Name: ' + (eventName || 'UNSPECIFIED_EVENT')
            ].join('\n'),
            telemetryPacket: telemetryPacket
        };

        dispatchPipelineExceptionAlert(componentId, exceptionContextDump).catch(function(error) {
            console.error('[ALERT MATRIX FAULT] Failed to dispatch agent notification email:', error.message);
        });
    } catch (err) {
        console.error('[ALERT MATRIX FAULT] Failed to parse agent notification telemetry:', err.message);
    }
}

// ── WebSocket connection handler ──────────────────────────────────────────────
const clients = new Set();

wss.on('connection', function(ws, req) {
    var ip = ((req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown')).split(',')[0].trim();
    console.log('[SOCKET CONNECT] UI dashboard node bound into event matrix. IP:', ip, '| Total:', clients.size + 1);
    clients.add(ws);
    ws.isAlive = true;

    ws.send(JSON.stringify({
        type:     'DREAMTEQ_HELLO',
        event:    'CONNECTION_ACK',
        message:  'Connected to Amanda Realtime Swarm Relays.',
        channels: CHANNELS,
        ts:       Date.now()
    }));

    ws.on('pong', function() { ws.isAlive = true; });

    ws.on('close', function(code) {
        clients.delete(ws);
        console.log('[SOCKET DISCONNECT] IP:', ip, '| Code:', code, '| Remaining:', clients.size);
    });

    ws.on('error', function(e) {
        console.error('[SOCKET ERROR] IP:', ip, '|', e.message);
        clients.delete(ws);
    });
});

// ── Redis → WebSocket fan-out ─────────────────────────────────────────────────
redisSubscriber.on('message', function(channel, message) {
    var envelope;
    interceptAndEvaluateAgentTelemetry(channel, message);

    try {
        // Re-wrap legacy plain-string messages into standard envelope
        var parsed = JSON.parse(message);
        envelope = JSON.stringify({
            channel:    channel,
            receivedAt: Date.now(),
            data:       parsed
        });
    } catch (_) {
        envelope = JSON.stringify({
            channel:    channel,
            receivedAt: Date.now(),
            data:       { raw: message }
        });
    }

    var delivered = 0;
    clients.forEach(function(client) {
        if (client.readyState === WebSocket.OPEN) {
            try { client.send(envelope); delivered++; } catch (e) {}
        }
    });

    if (delivered > 0) {
        console.log('[FANOUT] ' + channel + ' -> ' + delivered + ' client(s)');
    }

    // Republish BACKUP_COMPLETE events to the notifications channel for legacy clients
    try {
        var sig = JSON.parse(message);
        if (sig.event === 'BACKUP_COMPLETE') {
            redisPublisher.publish('dreamteq_system_notifications', message).catch(function() {});
        }
    } catch (_) {}
});

// ── HTTP → WebSocket upgrade ──────────────────────────────────────────────────
server.on('upgrade', function(request, socket, head) {
    wss.handleUpgrade(request, socket, head, function(ws) {
        wss.emit('connection', ws, request);
    });
});

// ── Heartbeat ping (30s) ──────────────────────────────────────────────────────
var heartbeatInterval = setInterval(function() {
    clients.forEach(function(ws) {
        if (!ws.isAlive) {
            console.log('[HEARTBEAT] Stale client terminated.');
            clients.delete(ws);
            ws.terminate();
            return;
        }
        ws.isAlive = false;
        ws.ping();
    });
}, 30000);

// ── Metrics publish (60s) ─────────────────────────────────────────────────────
var metricsInterval = setInterval(function() {
    var payload = JSON.stringify({
        type:           'SERVER_METRICS',
        ts:             Date.now(),
        connectedClients: clients.size,
        uptimeSeconds:  Math.round(process.uptime())
    });
    redisPublisher.publish('dreamteq:metrics', payload).catch(function(e) {
        console.error('[METRICS] Publish error:', e.message);
    });
}, 60000);

// ── Graceful shutdown ─────────────────────────────────────────────────────────
function shutdown(signal) {
    console.log('[SHUTDOWN] ' + signal + ' received — graceful shutdown initiated.');
    clearInterval(heartbeatInterval);
    clearInterval(metricsInterval);

    var closeMsg = JSON.stringify({ type: 'SERVER_SHUTDOWN', ts: Date.now() });
    clients.forEach(function(ws) {
        try { ws.send(closeMsg); } catch (_) {}
        ws.close(1001, 'Server shutting down');
    });

    server.close(function() {
        console.log('[SHUTDOWN] HTTP/WS server closed.');
        Promise.all([
            redisSubscriber.quit().catch(function() {}),
            redisPublisher.quit().catch(function() {})
        ]).then(function() {
            console.log('[SHUTDOWN] Redis connections closed. Exiting cleanly.');
            process.exit(0);
        });
    });

    setTimeout(function() {
        console.error('[SHUTDOWN] Forced exit after timeout.');
        process.exit(1);
    }, 10000);
}

process.on('SIGTERM', function() { shutdown('SIGTERM'); });
process.on('SIGINT',  function() { shutdown('SIGINT'); });

// ── Start server ──────────────────────────────────────────────────────────────
server.listen(WS_PORT, '0.0.0.0', function() {
    console.log('[SERVER] Gateway online on port ' + WS_PORT + '. Operational signature active.');
    console.log('[SERVER] Redis target: ' + REDIS_HOST + ':' + REDIS_PORT);
    console.log('[SERVER] DreamTeQ_360 Amanda Realtime Swarm Relays initialised.');
});

/*
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 * Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com
 * Monetized via AI-Driven SMM, LLMM, SEO, and LLEO Optimizations.
 */
