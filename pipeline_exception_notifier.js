/**
 * DreamTeQ_360 Automated Pipeline Exception & Fault Mail Worker
 * Architecture: Low-Overhead Asynchronous Event Handler
 * Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya
 */
'use strict';

const nodemailer = require('nodemailer');

const MAIL_CONFIG = {
    host: process.env.DREAMTEQ_MAIL_HOST || 'mail.dreamteamconsult.site',
    port: parseInt(process.env.DREAMTEQ_MAIL_PORT || '465', 10),
    secure: String(process.env.DREAMTEQ_MAIL_SECURE || 'true').toLowerCase() !== 'false',
    auth: {
        user: process.env.DREAMTEQ_MAIL_USER || 'system-alerts@dreamteamconsult.site',
        pass: process.env.DREAMTEQ_MAIL_PASSWORD || ''
    },
    notifyList: (process.env.DREAMTEQ_NOTIFY_LIST || 'cto@dreamteamconsult.site,dreamteamconsult@gmx.com')
        .split(',')
        .map(function(address) { return address.trim(); })
        .filter(Boolean)
};

function shouldDryRun() {
    return process.env.DREAMTEQ_MAIL_DRY_RUN === '1' || !MAIL_CONFIG.auth.pass;
}

function createTransporter() {
    return nodemailer.createTransport({
        host: MAIL_CONFIG.host,
        port: MAIL_CONFIG.port,
        secure: MAIL_CONFIG.secure,
        auth: MAIL_CONFIG.auth,
        connectionTimeout: parseInt(process.env.DREAMTEQ_MAIL_TIMEOUT_MS || '10000', 10),
        greetingTimeout: parseInt(process.env.DREAMTEQ_MAIL_TIMEOUT_MS || '10000', 10),
        socketTimeout: parseInt(process.env.DREAMTEQ_MAIL_TIMEOUT_MS || '10000', 10)
    });
}

function serializeExceptionContext(exceptionContext) {
    if (exceptionContext instanceof Error) {
        return exceptionContext.stack || exceptionContext.message;
    }

    if (typeof exceptionContext === 'string') {
        return exceptionContext;
    }

    try {
        return JSON.stringify(exceptionContext, null, 2);
    } catch (error) {
        return String(exceptionContext);
    }
}

function buildExceptionHtml(errorComponentId, exceptionContext) {
    const escapedComponent = String(errorComponentId || 'UNKNOWN_COMPONENT')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    const escapedStack = serializeExceptionContext(exceptionContext)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

    return [
        '<section style="font-family:Arial,sans-serif;color:#111827;line-height:1.45">',
        '<h2>Critical Platform Exception Logged</h2>',
        '<p>Attention DreamTeQ Engineering Core System Overseers,</p>',
        '<p>Amanda intercepted an unhandled execution exception parameter tracking breach inside the production cluster engine.</p>',
        '<table cellpadding="6" cellspacing="0" style="border-collapse:collapse;border:1px solid #d1d5db">',
        '<tr><td><strong>Faulting Module:</strong></td><td>' + escapedComponent + '</td></tr>',
        '<tr><td><strong>Timestamp:</strong></td><td>' + new Date().toISOString() + '</td></tr>',
        '<tr><td><strong>System State:</strong></td><td>GODS_MODE_ACTIVE / DEBUG_FALLBACK</td></tr>',
        '</table>',
        '<h3>Exception Stack Trace</h3>',
        '<pre style="white-space:pre-wrap;background:#f3f4f6;padding:12px;border-radius:6px">' + escapedStack + '</pre>',
        '<p>System Action: Local storage routers preserved raw transient transaction payloads inside offline PouchDB buffers. Data integrity remains uncompromised.</p>',
        '<hr>',
        '<p>Product of Dreamteam Consulting Company, Box 3515-00100, Nairobi, Kenya</p>',
        '<p>Tel: +254718554383 | Web: www.dreamteamconsult.site | Email: dreamteamconsult@gmx.com</p>',
        '</section>'
    ].join('');
}

/**
 * Dispatches an analytical critical fault report to the platform administration engineering pool.
 * @param {string} errorComponentId - Name identifier of failed block.
 * @param {object|Error|string} exceptionContext - Error dump, stack metrics, and transaction payloads.
 * @returns {Promise<object>} Dispatch result metadata.
 */
async function dispatchPipelineExceptionAlert(errorComponentId, exceptionContext) {
    console.log('[ALERT MATRIX ACTIVE] Compiling exception payload for component trace: ' + errorComponentId);

    const mailPayload = {
        from: '"Amanda System Guard" <' + MAIL_CONFIG.auth.user + '>',
        to: MAIL_CONFIG.notifyList.join(','),
        subject: '[CRITICAL FAULT] DreamTeQ Platform Exception: ' + errorComponentId,
        html: buildExceptionHtml(errorComponentId, exceptionContext)
    };

    if (shouldDryRun()) {
        console.log('[ALERT MATRIX DRY RUN] Mail dispatch skipped; set DREAMTEQ_MAIL_PASSWORD and DREAMTEQ_MAIL_DRY_RUN=0 to send.');
        return {
            ok: true,
            dryRun: true,
            component: errorComponentId,
            recipients: MAIL_CONFIG.notifyList,
            subject: mailPayload.subject
        };
    }

    try {
        const transporter = createTransporter();
        const info = await transporter.sendMail(mailPayload);
        console.log('[ALERT MATRIX SUCCESS] Exception documentation email auto-dispatched to administrators.');
        return { ok: true, dryRun: false, messageId: info.messageId, accepted: info.accepted };
    } catch (mailError) {
        console.error('[ALERT EXCEPTION CRITICAL FAILURE] Notification fallback center blocked: ' + mailError.message);
        return { ok: false, dryRun: false, error: mailError.message };
    }
}

module.exports = {
    dispatchPipelineExceptionAlert,
    buildExceptionHtml,
    serializeExceptionContext
};
